import createClient, { type Middleware } from 'openapi-fetch';
import type { paths } from './types.generated';

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Middleware для добавления auth header
const authMiddleware: Middleware = {
  async onRequest({ request }) {
    const token =
      typeof window !== 'undefined' ? window.__AUTH_TOKEN__ : null;

    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`);
    }
    return request;
  },
};

// Middleware для обработки 401 ответов
const unauthorizedMiddleware: Middleware = {
  async onResponse({ response }) {
    if (response.status === 401) {
      // Dispatch custom event для обработки в React
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }
    return response;
  },
};

// Публичный клиент (без авторизации)
export const publicClient = createClient<paths>({ baseUrl });

// Приватный клиент (с авторизацией)
export const apiClient = createClient<paths>({ baseUrl });
apiClient.use(authMiddleware);
apiClient.use(unauthorizedMiddleware);

// Типы для удобства
export type ApiClient = typeof apiClient;

// Расширяем Window для хранения токена
declare global {
  interface Window {
    __AUTH_TOKEN__?: string;
  }
}
