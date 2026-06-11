export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function parseJson(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { success: false, message: 'Invalid JSON response from server.' };
  }
}

export async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const { headers = {}, body, ...rest } = options;
  const finalHeaders = {
    Accept: 'application/json',
    ...headers,
  };
  const init = {
    credentials: 'include',
    ...rest,
    headers: finalHeaders,
  };

  if (body !== undefined && !(body instanceof FormData)) {
    init.body = JSON.stringify(body);
    finalHeaders['Content-Type'] = 'application/json';
  } else if (body instanceof FormData) {
    init.body = body;
  }

  const response = await fetch(url, init);
  const data = await parseJson(response);
  if (!response.ok) {
    const error = new Error(data.message || 'Request failed');
    error.response = response;
    error.data = data;
    throw error;
  }
  return data;
}

export async function apiFetchJson(path, body, options = {}) {
  return apiFetch(path, { method: 'POST', body, ...options });
}
