export interface CronConfig {
  mode: 'every-minute' | 'every-hour' | 'every-day' | 'every-weekday' | 'every-month' | 'custom';
  interval: number;
  hour: number;
  minute: number;
  dayOfMonth: number;
  month: number;
  dayOfWeek: number;
}

const DEFAULT_CONFIG: CronConfig = {
  mode: 'every-minute',
  interval: 1,
  hour: 0,
  minute: 0,
  dayOfMonth: 1,
  month: 1,
  dayOfWeek: 0,
};

export function parseCronToConfig(expr: string): CronConfig {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    return { ...DEFAULT_CONFIG, mode: 'custom' };
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  if (minute === '*' && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return { ...DEFAULT_CONFIG, mode: 'every-minute', interval: 1 };
  }

  if (minute.startsWith('*/') && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return { ...DEFAULT_CONFIG, mode: 'every-minute', interval: parseInt(minute.slice(2)) || 1 };
  }

  if (!minute.includes('*') && !minute.includes('/') && hour.startsWith('*/') && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return { ...DEFAULT_CONFIG, mode: 'every-hour', interval: parseInt(hour.slice(2)) || 1, minute: parseInt(minute) || 0 };
  }

  if (!minute.includes('*') && !minute.includes('/') && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return { ...DEFAULT_CONFIG, mode: 'every-hour', interval: 1, minute: parseInt(minute) || 0 };
  }

  if (!minute.includes('*') && !hour.includes('*') && !hour.includes('/') && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return { ...DEFAULT_CONFIG, mode: 'every-day', hour: parseInt(hour) || 0, minute: parseInt(minute) || 0 };
  }

  if (!minute.includes('*') && !hour.includes('*') && !hour.includes('/') && dayOfMonth === '*' && month === '*' && dayOfWeek === '1-5') {
    return { ...DEFAULT_CONFIG, mode: 'every-weekday', hour: parseInt(hour) || 0, minute: parseInt(minute) || 0, dayOfWeek: 1 };
  }

  if (!minute.includes('*') && !hour.includes('*') && !hour.includes('/') && dayOfMonth !== '*' && month === '*' && dayOfWeek === '*') {
    return { ...DEFAULT_CONFIG, mode: 'every-month', hour: parseInt(hour) || 0, minute: parseInt(minute) || 0, dayOfMonth: parseInt(dayOfMonth) || 1 };
  }

  return {
    ...DEFAULT_CONFIG,
    mode: 'custom',
    minute: minute === '*' ? 0 : parseInt(minute) || 0,
    hour: hour === '*' ? 0 : parseInt(hour) || 0,
    dayOfMonth: dayOfMonth === '*' ? 1 : parseInt(dayOfMonth) || 1,
    month: month === '*' ? 1 : parseInt(month) || 1,
    dayOfWeek: dayOfWeek === '*' ? 0 : parseInt(dayOfWeek) || 0,
  };
}

export function generateCron(config: CronConfig): string {
  switch (config.mode) {
    case 'every-minute':
      return config.interval <= 1 ? '* * * * *' : `*/${config.interval} * * * *`;
    case 'every-hour':
      return `${config.minute} */${config.interval} * * *`;
    case 'every-day':
      return `${config.minute} ${config.hour} * * *`;
    case 'every-weekday':
      return `${config.minute} ${config.hour} * * 1-5`;
    case 'every-month':
      return `${config.minute} ${config.hour} ${config.dayOfMonth} * *`;
    case 'custom':
      return `${config.minute} ${config.hour} ${config.dayOfMonth} ${config.month} ${config.dayOfWeek}`;
    default:
      return '* * * * *';
  }
}

export function humanizeCron(expr: string): string {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return expr;

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

  if (minute === '*' && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return 'ทุกนาที';
  }

  if (minute.startsWith('*/') && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return `ทุก ${minute.slice(2)} นาที`;
  }

  if (minute !== '*' && !minute.includes('/') && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return `ทุกชั่วโมงตอนนาทีที่ ${minute}`;
  }

  if (minute === '0' && hour.startsWith('*/') && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return `ทุก ${hour.slice(2)} ชั่วโมง`;
  }

  if (minute !== '*' && hour !== '*' && !hour.includes('/') && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return `ทุกวันเวลา ${hour.padStart(2, '0')}:${minute.padStart(2, '0')} น.`;
  }

  if (minute === '0' && hour === '0' && dayOfMonth === '1' && month === '*' && dayOfWeek === '*') {
    return 'วันที่ 1 ทุกเดือน';
  }

  if (minute !== '*' && hour !== '*' && dayOfMonth !== '*' && month === '*' && dayOfWeek === '*') {
    return `วันที่ ${dayOfMonth} ของทุกเดือน เวลา ${hour.padStart(2, '0')}:${minute.padStart(2, '0')} น.`;
  }

  if (dayOfWeek !== '*' && !dayOfWeek.includes('/') && !dayOfWeek.includes('-')) {
    const dayName = days[parseInt(dayOfWeek)] || dayOfWeek;
    if (minute !== '*' && hour !== '*') {
      return `ทุกวัน${dayName} ${hour.padStart(2, '0')}:${minute.padStart(2, '0')} น.`;
    }
  }

  if (dayOfWeek.includes('-') && hour !== '*' && minute !== '*') {
    const [start, end] = dayOfWeek.split('-').map(Number);
    return `${days[start]}-${days[end]} ${hour.padStart(2, '0')}:${minute.padStart(2, '0')} น.`;
  }

  return expr;
}

export function getNextRunCountdown(nextRunAt: string | null): string {
  if (!nextRunAt) return '-';

  const now = new Date();
  const next = new Date(nextRunAt);
  const diff = next.getTime() - now.getTime();

  if (diff <= 0) return 'กำลังรัน...';

  const seconds = Math.floor(diff / 1000) % 60;
  const minutes = Math.floor(diff / 1000 / 60) % 60;
  const hours = Math.floor(diff / 1000 / 60 / 60);

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} ชม.`);
  if (minutes > 0) parts.push(`${minutes} น.`);
  if (seconds > 0 && hours === 0) parts.push(`${seconds} วิ.`);

  return parts.length > 0 ? `อีก ${parts.join(' ')}` : '-';
}
