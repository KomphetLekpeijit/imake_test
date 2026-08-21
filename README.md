# Web-Based Scheduled Task Dispatcher

ระบบตั้งเวลาและสั่งการทำงานอัตโนมัติผ่านเว็บ (Mini Cloud Scheduler)

---

## โปรเจคนี้ทำอะไร

ระบบทำหน้าที่เป็น **"คนยิง request ตามเวลา"** + **"คนเฝ้าดูผลลัพธ์"** + **"คนแจ้งเตือน"**

ผู้ใช้สร้าง Task → ตั้งเวลาด้วย Cron → ระบบยิง HTTP request ไปที่ URL เป้าหมายตามเวลาที่กำหนด → บันทึกผลลัพธ์ (สำเร็จ/ล้มเหลว/หมดเวลา) → แจ้งเตือนผ่าน Discord/Slack/LINE

ตัวอย่างการใช้งานจริง:
- ตรวจสอบอุณหภูมิตู้แช่ทุก 15 นาที
- ดึงรายงานยอดขายทุกวัน 23:00
- Health Check ระบบชำระเงินทุก 5 นาที
- แจ้งเตือนสินค้าใกล้หมดทุกเช้า

---

## Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   Web Dashboard  │────▶│  Scheduler + API     │────▶│  Worker Service │
│   (Next.js)      │     │  (NestJS)            │     │  (Express.js)   │
│   Port 3000      │     │  Port 3001           │     │  Port 3002      │
└─────────────────┘     └──────────────────────┘     └─────────────────┘
                               │                            │
                               ▼                            ▼
                        ┌──────────────┐            ┌──────────────┐
                        │   MySQL      │            │  Discord /   │
                        │   Port 3306  │            │  Slack /     │
                        └──────────────┘            │  LINE        │
                                                    └──────────────┘
```

**Flow สั้น:**
```
Frontend (สร้าง Task) → Backend (บันทึก + ตั้งเวลา) → Scheduler (ยิง request ตาม cron) → Worker (รับ request) → ผลลัพธ์กลับมา → แจ้งเตือนผ่าน Webhook
```

---

## Tech Stack

| Service   | Technology                    | หน้าที่                              |
|-----------|-------------------------------|--------------------------------------|
| Frontend  | Next.js 14, TailwindCSS      | Web Dashboard, CronBuilder UI        |
| Backend   | NestJS, Prisma ORM           | API, Scheduler Engine, Notification  |
| Worker    | Express.js                    | Mock Microservice สำหรับทดสอบ        |
| Database  | MySQL 8.0                     | เก็บ Task + Execution Logs           |
| DevOps    | Docker Compose                | Orchestrate ทุก Service              |

---

## Features

### Core Features
- **Task CRUD** — สร้าง/แก้ไข/ลบ Task ผ่าน Web UI
- **Cron Scheduling** — ตั้งเวลาทำงานด้วย cron expression
- **HTTP Dispatch** — ยิง request ไปที่ URL เป้าหมาย (GET/POST/PUT/PATCH/DELETE)
- **Execution Logging** — บันทึกผลลัพธ์ทุกครั้ง (status, duration, response)

### Bonus 1: Auto Retry + Exponential Backoff
- ลองใหม่ได้สูงสุด 10 ครั้ง
- หน่วงเวลาแบบ exponential: 1s → 2s → 4s → 8s → ...
- ป้องกัน task ล้มเหลวเพราะ API ชั่วคราว

### Bonus 2: SSE Real-time
- Server-Sent Events อัปเดตสถานะทันที
- ไม่ต้อง refresh หน้า
- แสดงสถานะ task แบบ real-time

### Bonus 3: Webhook Notifications
- **Discord** — Rich embed สี + fields
- **Slack** — Attachment สี + fields
- **LINE Messaging API** — Push message ข้อความ
- แจ้งเตือนทั้ง success/failed/timeout

### Bonus 4: CronBuilder UI + Next Run Countdown
- Visual cron builder — เลือก mode (ทุก X นาที/ชั่วโมง/วัน/เดือน/.custom)
- Quick presets — ทุกนาที, ทุก 5 นาที, จันทร์-ศุกร์ 9 น.
- Cron humanization — แสดง "ทุกวันเวลา 09:00 น." แทน "0 9 * * *"
- Next Run Countdown — นับถอยหลังถึง run ถัดไป

### UI/UX
- **Dark/Light Theme** — สลับธีมได้ + จำค่าไว้
- **Thai/English i18n** — รองรับ 2 ภาษา
- **Responsive** — ใช้งานได้ทั้งมือถือและ desktop

---

## Flow การทำงาน (ตั้งแต่ต้นจนจบ)

### Step 1: ผู้ใช้สร้าง Task ใหม่
```
1. เปิดหน้า Create Task
2. กรอกข้อมูล:
   - ชื่องาน: "ตรวจสอบอุณหภูมิตู้แช่"
   - รายละเอียด: "ตรวจสอบทุก 15 นาที ถ้าอุณหภูมิสูงเกิน -18°C ให้แจ้งเตือน"
3. ตั้งเวลาด้วย CronBuilder:
   - เลือก "ทุก X นาที" → ใส่ 15
   - หรือกรอก "*/15 * * * *"
4. กำหนด URL เป้าหมาย:
   - URL: http://iot-sensor:5000/api/temperature/check
   - Method: POST
   - Headers: {"Authorization": "Bearer xxx"}
   - Payload: {"freezer_id": "FR-01", "max_temp": -18}
5. ตั้ง timeout (30 วินาที) + max retries (3 ครั้ง)
6. เลือก webhook notification:
   - Type: LINE Messaging API
   - Channel Access Token: xxx
   - User ID: Uxxxxxxxx
7. กด "บันทึกงาน"
```

### Step 2: ระบบบันทึก Task ลง Database
```
1. Backend รับ request จาก Frontend
2. บันทึกข้อมูล Task ลง MySQL:
   - name, description, cron_expression, target_url
   - http_method, headers, payload
   - timeout_seconds, max_retries
   - webhook_url, webhook_type
   - is_active = true
3. คำนวณ next_run_at จาก cron expression
4. ส่ง response กลับไปที่ Frontend
```

### Step 3: Scheduler รับ Task มาจัดการ
```
1. Scheduler อ่าน task จาก DB ทุก 10 วินาที (sync)
2. ตรวจสอบว่า task ใหม่หรือยัง
3. ถ้าใหม่ → สร้าง cron job ด้วย croner library
4. ตั้งเวลาทำงานตาม cron expression
5. ถ้า task ถูกปิด → หยุด cron job
```

### Step 4: ถึงเวลา Task ทำงาน
```
1. Cron job ทำงานตามเวลาที่กำหนด
2. Scheduler เริ่ม execute task:
   - ตรวจสอบว่า task กำลังทำงานอยู่หรือไม่ (concurrency guard)
   - ถ้ากำลังทำงานอยู่ → skip
   - ถ้าไม่ → เริ่ม execute
3. ยิง HTTP request ไปที่ targetUrl:
   - แนบ headers ที่กำหนด
   - แนบ payload ที่กำหนด
   - จับเวลา response
```

### Step 5: ตัดสินผลลัพธ์
```
ได้ response กลับมา:
├── HTTP 2xx (200, 201, 204) → ✅ success
├── HTTP 4xx/5xx (400, 404, 500) → ❌ failed → ลองใหม่ (retry)
└── ไม่ได้ response ภายใน timeout → ⏰ timeout → ลองใหม่ (retry)

Retry Logic:
- ลองใหม่ตาม maxRetries ที่กำหนด
- หน่วงเวลา exponential: 1s → 2s → 4s → 8s → ...
- ถ้า retry หมดแล้วยังล้มเหลว → ใช้ status สุดท้าย
```

### Step 6: บันทึก Execution Log
```
1. บันทึกผลลัพธ์ลง MySQL:
   - task_id, trigger_type (scheduled/manual)
   - started_at, finished_at
   - duration_ms (เวลาที่ใช้)
   - status (success/failed/timeout/skipped)
   - http_status_code
   - request_payload, response_body
   - retry_count
2. Log ทุกครั้งไม่ว่าจะสำเร็จหรือล้มเหลว
```

### Step 7: แจ้งเตือนผ่าน Webhook
```
1. ตรวจสอบว่า task มี webhookUrl หรือไม่
2. ถ้ามี → ส่ง notification ตาม webhook type:

   Discord:
   - ส่ง rich embed สี (เขียว=success, แดง=failed, เหลือง=timeout)
   - แนบ fields: Task ID, HTTP Status, Response/Error

   Slack:
   - ส่ง attachment สี + fields
   - แสดงชื่องาน, สถานะ, เวลา, duration

   LINE Messaging API:
   - Push message ข้อความ
   - แสดง emoji + ชื่องาน + รายละเอียด

3. Notification ส่งเฉพาะตอนสุดท้าย (หลัง retry หมดแล้ว)
```

### Step 8: ผู้ใช้ดูผลลัพธ์
```
1. Dashboard:
   - ดูสถิติรวม (จำนวน task, อัตราสำเร็จ, จำนวนล้มเหลว)
   - ดูจำนวน task ที่ active

2. Logs:
   - ดู execution log ทั้งหมด
   - กรองตาม task หรือ status
   - กดดูรายละเอียด (request/response payload)

3. Real-time:
   - SSE อัปเดตสถานะทันที
   - ไม่ต้อง refresh หน้า
```

---

## Quick Start

```bash
# Clone โปรเจค
git clone https://github.com/KomphetLekpeijit/imake_test.git
cd imake_test/imake_scheduler

# รันทุก Service ด้วย Docker
docker compose up -d
```

เปิดเบราว์เซอร์:
- Dashboard: http://localhost:3000
- Backend API: http://localhost:3001
- Worker: http://localhost:3002

---

## วิธีใช้งาน

### สร้าง Task ใหม่
1. เปิด http://localhost:3000
2. กด **"สร้างงาน"** หรือไปที่ /tasks/create
3. กรอกข้อมูล:
   - **ชื่องาน**: ชื่อ task
   - **รายละเอียด**: อธิบายงานสั้นๆ
   - **Cron**: ใช้ CronBuilder เลือก mode หรือกรอกเอง
   - **URL เป้าหมาย**: URL ของ API ที่ต้องการเรียก
   - **Method**: GET/POST/PUT/PATCH/DELETE
   - **Headers**: JSON (ถ้าต้องการ authentication)
   - **Payload**: JSON (ข้อมูลที่ต้องการส่ง)
   - **Timeout**: จำนวนวินาทีที่รอ response
   - **Max Retries**: จำนวนครั้งที่ลองใหม่
   - **Webhook**: เลือก Discord/Slack/LINE + ใส่ URL/Token
4. กด **"บันทึกงาน"**

### ทดสอบ Task
1. ไปที่หน้า **"งาน"** (/tasks)
2. กดปุ่ม **"Run"** บน task ที่ต้องการ
3. ดู execution log ที่หน้า **"บันทึกงาน"** (/logs)
4. ดู notification ใน Discord/Slack/LINE

### ดู Execution Logs
1. ไปที่หน้า **"บันทึกงาน"** (/logs)
2. กรองตาม task หรือ status
3. กดดูรายละเอียด (request/response payload)

---

## Development Setup

### 1. MySQL

```bash
docker run -d --name mysql \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=scheduler_db \
  -e MYSQL_USER=scheduler_user \
  -e MYSQL_PASSWORD=scheduler_password \
  -p 3306:3306 mysql:8.0
```

### 2. Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run start:dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Worker

```bash
cd worker
npm install
npm run dev
```

---

## Environment Variables

### Backend (.env)

```
DATABASE_URL=mysql://scheduler_user:scheduler_password@localhost:3306/scheduler_db
WORKER_URL=http://localhost:3002
PORT=3001
```

### Frontend (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## API Endpoints

### Tasks

| Method | Endpoint             | Description     |
|--------|---------------------|-----------------|
| GET    | /api/tasks          | List all tasks  |
| POST   | /api/tasks          | Create task     |
| GET    | /api/tasks/:id      | Get task detail |
| PATCH  | /api/tasks/:id      | Update task     |
| DELETE | /api/tasks/:id      | Delete task     |

### Execution Logs

| Method | Endpoint                   | Description         |
|--------|--------------------------|---------------------|
| GET    | /api/execution-logs      | List logs           |
| GET    | /api/execution-logs/stats | Get statistics     |
| GET    | /api/execution-logs/:id  | Get log detail      |

### Scheduler

| Method | Endpoint                     | Description      |
|--------|-----------------------------|------------------|
| POST   | /api/scheduler/trigger/:id  | Manual trigger   |
| POST   | /api/scheduler/reload/:id   | Reload task      |
| GET    | /api/scheduler/status       | Scheduler status |

### SSE (Real-time)

| Method | Endpoint           | Description       |
|--------|-------------------|-------------------|
| GET    | /api/sse/events   | SSE event stream  |

### Worker (Mock Service)

| Method | Endpoint                            | Description          |
|--------|------------------------------------|----------------------|
| POST   | /api/v1/jobs/quick-task            | Quick task           |
| POST   | /api/v1/jobs/heavy-process         | Heavy process (3-5s) |
| POST   | /api/v1/jobs/unstable-task         | Unstable (50% fail)  |
| POST   | /api/v1/jobs/custom-payload        | Custom payload       |

---

## Database Schema

### tasks

| Column          | Type         | Description                    |
|-----------------|--------------|--------------------------------|
| id              | UUID         | Primary key                    |
| name            | VARCHAR(255) | Task name                      |
| description     | TEXT         | Task description               |
| cron_expression | VARCHAR(100) | Cron expression                |
| target_url      | VARCHAR(500) | Target endpoint URL            |
| http_method     | VARCHAR(10)  | HTTP method (default: POST)    |
| headers         | JSON         | Request headers (optional)     |
| payload         | JSON         | Request payload (optional)     |
| timeout_seconds | INT          | Timeout (default: 30)          |
| max_retries     | INT          | Max retries (default: 3)       |
| webhook_url     | VARCHAR(500) | Webhook URL/Token (optional)   |
| webhook_type    | VARCHAR(20)  | discord/slack/line-messaging   |
| is_active       | BOOLEAN      | Active status (default: true)  |
| next_run_at     | DATETIME     | Next scheduled run             |
| created_at      | DATETIME     | Created timestamp              |
| updated_at      | DATETIME     | Updated timestamp              |

### execution_logs

| Column           | Type         | Description                    |
|------------------|--------------|--------------------------------|
| id               | UUID         | Primary key                    |
| task_id          | UUID         | Foreign key to tasks           |
| trigger_type     | VARCHAR(20)  | "scheduled" or "manual"        |
| started_at       | DATETIME     | Execution start time           |
| finished_at      | DATETIME     | Execution end time             |
| duration_ms      | INT          | Duration in milliseconds       |
| status           | VARCHAR(20)  | success/failed/timeout/skipped |
| retry_count      | INT          | Number of retries (default: 0) |
| http_status_code | INT          | HTTP response code             |
| request_payload  | JSON         | Sent payload                   |
| response_body    | TEXT         | Response body                  |

---

## Example Cron Expressions

| Expression      | Description              |
|----------------|--------------------------|
| `* * * * *`    | Every minute             |
| `*/5 * * * *`  | Every 5 minutes          |
| `*/15 * * * *` | Every 15 minutes         |
| `0 * * * *`    | Every hour               |
| `0 0 * * *`    | Every day at midnight    |
| `0 9 * * *`    | Every day at 9:00 AM     |
| `0 9 * * 1-5`  | Weekdays at 9:00 AM     |
| `0 0 1 * *`    | First day of every month |
| `0 0 1 1 *`    | January 1st at midnight  |

---

## Project Structure

```
imake_scheduler/
├── docker-compose.yml          # Orchestrate all services
├── .env                        # Environment variables
├── backend/                    # NestJS Backend
│   ├── Dockerfile
│   ├── src/
│   │   ├── main.ts            # App bootstrap + CORS
│   │   ├── app.module.ts      # Root module
│   │   ├── tasks/             # Task CRUD (controller, service, DTO)
│   │   ├── execution-logs/    # Log management
│   │   ├── scheduler/         # Core scheduler engine (croner)
│   │   ├── http-client/       # HTTP dispatcher (Axios)
│   │   ├── notification/      # Webhook notifications (Discord/Slack/LINE)
│   │   ├── sse/               # Server-Sent Events
│   │   └── prisma/            # Database service
│   └── prisma/
│       └── schema.prisma      # Database schema
├── frontend/                   # Next.js Dashboard
│   ├── Dockerfile
│   ├── src/
│   │   ├── app/               # Pages (App Router)
│   │   │   ├── dashboard/     # Dashboard page
│   │   │   ├── tasks/         # Task list + create + edit
│   │   │   └── logs/          # Execution logs page
│   │   ├── components/        # React components
│   │   │   ├── TaskForm.tsx   # Create/edit task form
│   │   │   ├── TaskTable.tsx  # Task list table
│   │   │   ├── LogTable.tsx   # Execution log table
│   │   │   ├── CronBuilder.tsx# Visual cron builder
│   │   │   ├── DashboardStats.tsx # Dashboard statistics
│   │   │   └── Navbar.tsx     # Navigation bar
│   │   └── lib/               # Utilities
│   │       ├── api.ts         # API client
│   │       ├── cron-utils.ts  # Cron parsing/generation/humanization
│   │       ├── i18n.ts        # Thai/English translations
│   │       └── theme-context.tsx # Dark/Light theme
│   └── Dockerfile
└── worker/                     # Mock Microservice (Express.js)
    ├── Dockerfile
    └── src/
        └── index.js           # 4 mock endpoints
```

---

## AI Workflow

### ใช้ AI (OpenCode) ช่วยสร้างโปรเจคทั้งหมด

### Flow การทำงาน
```
User requirement → AI วิเคราะห์ → เขียนโค้ด → ผู้ใช้ทดสอบ → AI ทดสอบอีกครั้ง → แก้ไขตาม User requirement (ผมเอง)
```

### สิ่งที่ AI ช่วย
- **Project scaffolding** — สร้างโครงสร้างโปรเจคทั้งหมด (Docker, NestJS, Next.js, Express.js)
- **Backend** — NestJS modules, Prisma schema, API endpoints, Scheduler engine
- **Frontend** — Next.js pages, components, CronBuilder, i18n, Theme
- **Bug fixing** — CronBuilder state sync bug, SSE reconnect loop
- **Feature development** — Auto retry, Webhook notifications, LINE Messaging API

---

## Submission

- Git Repository with meaningful commits
- Docker Compose setup (one command: `docker compose up -d`)
- Live demo with code walkthrough (15-20 min)
