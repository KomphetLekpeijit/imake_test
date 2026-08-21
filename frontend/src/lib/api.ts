const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  tasks: {
    list: () => fetchAPI('/api/tasks'),
    get: (id: string) => fetchAPI(`/api/tasks/${id}`),
    create: (data: any) =>
      fetchAPI('/api/tasks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      fetchAPI(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) =>
      fetchAPI(`/api/tasks/${id}`, { method: 'DELETE' }),
  },
  logs: {
    list: (params?: { taskId?: string; status?: string }) => {
      const query = new URLSearchParams();
      if (params?.taskId) query.set('taskId', params.taskId);
      if (params?.status) query.set('status', params.status);
      const qs = query.toString();
      return fetchAPI(`/api/execution-logs${qs ? `?${qs}` : ''}`);
    },
    get: (id: string) => fetchAPI(`/api/execution-logs/${id}`),
    stats: () => fetchAPI('/api/execution-logs/stats'),
  },
  scheduler: {
    trigger: (taskId: string) =>
      fetchAPI(`/api/scheduler/trigger/${taskId}`, { method: 'POST' }),
    reload: (taskId: string) =>
      fetchAPI(`/api/scheduler/reload/${taskId}`, { method: 'POST' }),
    status: () => fetchAPI('/api/scheduler/status'),
  },
};
