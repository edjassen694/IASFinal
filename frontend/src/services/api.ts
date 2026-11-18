const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('taskmate_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.message || (data?.errors ? Object.values(data.errors).flat().join(' ') : 'An unexpected error occurred.');
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (body: { name: string; email: string; password: string }) =>
    request<{ user: { id: number; name: string; email: string }; token: string }>('/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    request<{ user: { id: number; name: string; email: string }; token: string }>('/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  logout: () =>
    request<{ message: string }>('/logout', {
      method: 'POST',
    }),

  me: () =>
    request<{ user: { id: number; name: string; email: string } }>('/me', {
      method: 'GET',
    }),

  // Tasks
  getTasks: (params?: { status?: string; search?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.search) searchParams.append('search', params.search);
    const qs = searchParams.toString();
    return request<{ tasks: import('../types').Task[] }>(`/tasks${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    });
  },

  createTask: (body: { title: string; description?: string; status?: string; due_date?: string }) =>
    request<{ message: string; task: import('../types').Task }>('/tasks', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateTask: (id: number, body: Partial<{ title: string; description: string; status: string; due_date: string }>) =>
    request<{ message: string; task: import('../types').Task }>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  deleteTask: (id: number) =>
    request<{ message: string }>(`/tasks/${id}`, {
      method: 'DELETE',
    }),

  // Dashboard Stats
  getDashboardStats: () =>
    request<{
      stats: import('../types').DashboardStats;
      recent_tasks: import('../types').Task[];
    }>('/dashboard/stats', {
      method: 'GET',
    }),

  // AI Assistant
  askAi: (message: string, history?: { role: string; content: string }[]) =>
    request<{ reply: string; configured?: boolean; error?: boolean }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }),
};
