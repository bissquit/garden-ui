import { http, HttpResponse } from 'msw';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Mock data
const mockServices = [
  {
    id: '1',
    name: 'API',
    slug: 'api',
    description: 'Core API service',
    status: 'operational',
    group_id: 'g1',
    order: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Web Application',
    slug: 'web',
    description: 'Main web interface',
    status: 'degraded',
    group_id: 'g1',
    order: 1,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'Database',
    slug: 'database',
    description: 'PostgreSQL database',
    status: 'operational',
    group_id: 'g2',
    order: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '4',
    name: 'CDN',
    slug: 'cdn',
    status: 'operational',
    group_id: null,
    order: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

const mockGroups = [
  {
    id: 'g1',
    name: 'Core Services',
    slug: 'core',
    description: 'Main application services',
    order: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'g2',
    name: 'Infrastructure',
    slug: 'infra',
    description: 'Infrastructure components',
    order: 1,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

const mockActiveEvents = [
  {
    id: 'e1',
    title: 'Web Application Performance Degradation',
    type: 'incident',
    status: 'investigating',
    severity: 'minor',
    description:
      'We are investigating reports of slow response times on the web application.',
    started_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
    resolved_at: null,
    scheduled_start_at: null,
    scheduled_end_at: null,
    notify_subscribers: true,
    template_id: null,
    created_by: '1',
    service_ids: ['2'],
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'e2',
    title: 'Database Maintenance',
    type: 'maintenance',
    status: 'scheduled',
    severity: null,
    description: 'Scheduled database maintenance for performance improvements.',
    started_at: null,
    resolved_at: null,
    scheduled_start_at: new Date(
      Date.now() + 24 * 60 * 60 * 1000
    ).toISOString(), // Tomorrow
    scheduled_end_at: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(), // Tomorrow + 2h
    notify_subscribers: true,
    template_id: null,
    created_by: '1',
    service_ids: ['3'],
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const mockHistoryEvents = [
  {
    id: 'h1',
    title: 'API Outage',
    type: 'incident',
    status: 'resolved',
    severity: 'major',
    description: 'API was unavailable due to a configuration issue.',
    started_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    resolved_at: new Date(
      Date.now() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000
    ).toISOString(),
    scheduled_start_at: null,
    scheduled_end_at: null,
    notify_subscribers: true,
    template_id: null,
    created_by: '1',
    service_ids: ['1'],
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(
      Date.now() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000
    ).toISOString(),
  },
  {
    id: 'h2',
    title: 'CDN Maintenance Completed',
    type: 'maintenance',
    status: 'completed',
    severity: null,
    description: 'Routine CDN configuration update.',
    started_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    resolved_at: new Date(
      Date.now() - 5 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000
    ).toISOString(),
    scheduled_start_at: new Date(
      Date.now() - 5 * 24 * 60 * 60 * 1000
    ).toISOString(),
    scheduled_end_at: new Date(
      Date.now() - 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000
    ).toISOString(),
    notify_subscribers: true,
    template_id: null,
    created_by: '1',
    service_ids: ['4'],
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(
      Date.now() - 5 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000
    ).toISOString(),
  },
];

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
      data: mockServices,
    });
  }),

  // Groups
  http.get(`${API_URL}/api/v1/groups`, () => {
    return HttpResponse.json({
      data: mockGroups,
    });
  }),

  // Public Status (active events)
  http.get(`${API_URL}/api/v1/status`, () => {
    return HttpResponse.json({
      data: {
        events: mockActiveEvents,
      },
    });
  }),

  // Status History
  http.get(`${API_URL}/api/v1/status/history`, () => {
    return HttpResponse.json({
      data: {
        events: mockHistoryEvents,
      },
    });
  }),

  // Health
  http.get(`${API_URL}/healthz`, () => {
    return HttpResponse.text('OK');
  }),
];
