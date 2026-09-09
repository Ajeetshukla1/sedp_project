const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

export async function http<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      credentials: 'include',
      headers:
        options.body instanceof FormData
          ? options.headers
          : { 'Content-Type': 'application/json', ...options.headers },
    });
  } catch {
    throw new Error('Unable to reach the API. Start the development server and try again.');
  }

  if (!response.ok) {
    const responseText = await response.text();
    let message: string | undefined;
    try {
      message = (JSON.parse(responseText) as { message?: string }).message;
    } catch {
      message = responseText.trim() || undefined;
    }
    throw new Error(message ?? `Request failed (${response.status})`);
  }
  return (await response.json().catch(() => undefined)) as T;
}
