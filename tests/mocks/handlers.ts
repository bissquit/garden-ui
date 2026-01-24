import { http, HttpResponse } from 'msw';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const handlers = [
  // Auth
  http.post(`${API_URL}/api/v1/auth/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };

    if (body.email === 'admin@example.com' && body.password === 'admin123') {
      return HttpResponse.json({
        data: {
          user: {
            id: '1',
            email: 'admin@example.com',
            first_name: 'Admin',
            last_name: 'User',
            role: 'admin',
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
          },
          tokens: {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            expires_in: 900,
          },
        },
      });
    }

    return HttpResponse.json(
      { error: { message: 'Invalid credentials' } },
      { status: 401 }
    );
  }),

  http.post(`${API_URL}/api/v1/auth/logout`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // Services
  http.get(`${API_URL}/api/v1/services`, () => {
    return HttpResponse.json({
      data: [
        {
          id: '1',
          name: 'API',
          slug: 'api',
          status: 'operational',
          order: 0,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
        {
          id: '2',
          name: 'Web Application',
          slug: 'web',
          status: 'degraded',
          order: 1,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ],
    });
  }),

  // Health
  http.get(`${API_URL}/healthz`, () => {
    return HttpResponse.text('OK');
  }),
];
