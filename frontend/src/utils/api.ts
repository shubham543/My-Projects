const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export const api = {
  get: async (path: string) => {
    const res = await fetch(`${BASE_URL}/api${path}`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `API error: ${res.status}`);
    }
    return res.json();
  },
  post: async (path: string, data: any) => {
    const res = await fetch(`${BASE_URL}/api${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `API error: ${res.status}`);
    }
    return res.json();
  },
  put: async (path: string, data: any) => {
    const res = await fetch(`${BASE_URL}/api${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `API error: ${res.status}`);
    }
    return res.json();
  },
  delete: async (path: string) => {
    const res = await fetch(`${BASE_URL}/api${path}`, { method: 'DELETE' });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `API error: ${res.status}`);
    }
    return res.json();
  },
};
