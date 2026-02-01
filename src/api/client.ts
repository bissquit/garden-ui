import createClient, { type Middleware } from 'openapi-fetch';
import type { paths } from './types.generated';

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Helper to get cookie value by name
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

// Middleware для добавления CSRF token к мутирующим запросам
const csrfMiddleware: Middleware = {
  async onRequest({ request }) {
    const method = request.method.toUpperCase();
    // Add CSRF token for state-changing requests
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const csrfToken = getCookie('csrf_token');
      if (csrfToken) {
        request.headers.set('X-CSRF-Token', csrfToken);
      }
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

// Публичный клиент
export const publicClient = createClient<paths>({
  baseUrl,
  credentials: 'include',
});

// Приватный клиент (с обработкой 401)
export const apiClient = createClient<paths>({
  baseUrl,
  credentials: 'include',
});
apiClient.use(csrfMiddleware);
apiClient.use(unauthorizedMiddleware);

// Типы для удобства
export type ApiClient = typeof apiClient;
