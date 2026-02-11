import { test as base, type Page, type APIRequestContext, expect as baseExpect } from '@playwright/test';

// Test user credentials (pre-seeded in backend)
export const testOperator = {
  email: 'operator@example.com',
  password: 'admin123',
};

export const testAdmin = {
  email: 'admin@example.com',
  password: 'admin123',
};

export const testUser = {
  email: 'user@example.com',
  password: 'user123',
};

// Helper to login as admin (required for CRUD operations in backend 1.4.0+)
async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(testAdmin.email);
  await page.getByLabel(/password/i).fill(testAdmin.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('/dashboard');
}

// === API Helper Types ===

export interface CreateServiceData {
  name: string;
  slug?: string;
  description?: string;
  group_id?: string;
  group_ids?: string[];
  status?: 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'maintenance';
}

export interface CreateGroupData {
  name: string;
  slug?: string;
  description?: string;
}

export interface CreateEventData {
  title: string;
  type: 'incident' | 'maintenance';
  status: string;
  severity?: 'minor' | 'major' | 'critical';
  description?: string;
  affected_services?: Array<{ service_id: string; status: string }>;
  affected_groups?: Array<{ group_id: string; status: string }>;
  scheduled_start_at?: string;
  scheduled_end_at?: string;
  started_at?: string;
  resolved_at?: string;
}

export interface AddEventUpdateData {
  status: string;
  message: string;
  service_updates?: Array<{ service_id: string; status: string }>;
  add_services?: Array<{ service_id: string; status: string }>;
  add_groups?: Array<{ group_id: string; status: string }>;
  remove_service_ids?: string[];
  reason?: string;
}

export interface ServiceData {
  id: string;
  slug: string;
  name: string;
  status: string;
  effective_status: string;
  has_active_events: boolean;
}

export interface EventData {
  id: string;
  status: string;
  service_ids: string[] | null;
  group_ids: string[] | null;
  resolved_at: string | null;
}

export interface EventServiceChange {
  id: string;
  action: 'added' | 'removed';
  service_id: string | null;
  group_id: string | null;
  reason: string | null;
  created_at: string;
}

export interface StatusLogEntry {
  id: string;
  old_status: string | null;
  new_status: string;
  source_type: 'manual' | 'event' | 'webhook';
  event_id: string | null;
  reason: string | null;
  created_at: string;
}

// === API Helper Class ===

export class ApiHelper {
  private csrfToken: string | null = null;

  constructor(
    private request: APIRequestContext,
    private baseUrl: string
  ) {}

  private getMutationHeaders(): Record<string, string> {
    if (this.csrfToken) {
      return { 'X-CSRF-Token': this.csrfToken };
    }
    return {};
  }

  async login(email: string, password: string): Promise<void> {
    const res = await this.request.post(`${this.baseUrl}/api/v1/auth/login`, {
      data: { email, password },
    });
    if (!res.ok()) {
      throw new Error(`Login failed: ${res.status()} ${await res.text()}`);
    }

    // Extract CSRF token from Set-Cookie header
    const cookies = res.headers()['set-cookie'];
    if (cookies) {
      const csrfMatch = cookies.match(/csrf_token=([^;]+)/);
      if (csrfMatch) {
        this.csrfToken = csrfMatch[1];
      }
    }
  }

  async createService(data: CreateServiceData): Promise<{ id: string; slug: string }> {
    const slug = data.slug ?? data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const res = await this.request.post(`${this.baseUrl}/api/v1/services`, {
      data: { ...data, slug },
      headers: this.getMutationHeaders(),
    });
    if (!res.ok()) {
      throw new Error(`Create service failed: ${res.status()} ${await res.text()}`);
    }
    const body = await res.json();
    return { id: body.data.id, slug: body.data.slug };
  }

  async createGroup(data: CreateGroupData): Promise<{ id: string; slug: string }> {
    const slug = data.slug ?? data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const res = await this.request.post(`${this.baseUrl}/api/v1/groups`, {
      data: { ...data, slug },
      headers: this.getMutationHeaders(),
    });
    if (!res.ok()) {
      throw new Error(`Create group failed: ${res.status()} ${await res.text()}`);
    }
    const body = await res.json();
    return { id: body.data.id, slug: body.data.slug };
  }

  async createEvent(data: CreateEventData): Promise<{ id: string; status: number }> {
    const res = await this.request.post(`${this.baseUrl}/api/v1/events`, {
      data,
      headers: this.getMutationHeaders(),
    });
    const status = res.status();
    if (!res.ok()) {
      return { id: '', status };
    }
    const body = await res.json();
    return { id: body.data.id, status };
  }

  async addEventUpdate(eventId: string, data: AddEventUpdateData): Promise<{ status: number; error?: string }> {
    const res = await this.request.post(`${this.baseUrl}/api/v1/events/${eventId}/updates`, {
      data,
      headers: this.getMutationHeaders(),
    });
    const status = res.status();
    if (!res.ok()) {
      const body = await res.json().catch(() => ({}));
      return { status, error: body?.error?.message };
    }
    return { status };
  }

  async getService(slug: string): Promise<ServiceData> {
    const res = await this.request.get(`${this.baseUrl}/api/v1/services/${slug}`);
    if (!res.ok()) {
      throw new Error(`Get service failed: ${res.status()} ${await res.text()}`);
    }
    const body = await res.json();
    return body.data;
  }

  async getEvent(id: string): Promise<EventData | null> {
    const res = await this.request.get(`${this.baseUrl}/api/v1/events/${id}`);
    if (res.status() === 404) {
      return null;
    }
    if (!res.ok()) {
      throw new Error(`Get event failed: ${res.status()} ${await res.text()}`);
    }
    const body = await res.json();
    return body.data;
  }

  async getEventChanges(eventId: string): Promise<EventServiceChange[]> {
    const res = await this.request.get(`${this.baseUrl}/api/v1/events/${eventId}/changes`);
    if (!res.ok()) {
      throw new Error(`Get event changes failed: ${res.status()} ${await res.text()}`);
    }
    const body = await res.json();
    return body.data ?? [];
  }

  async getServiceStatusLog(slug: string): Promise<{ status: number; entries?: StatusLogEntry[] }> {
    const res = await this.request.get(`${this.baseUrl}/api/v1/services/${slug}/status-log`);
    if (!res.ok()) {
      return { status: res.status() };
    }
    const body = await res.json();
    return { status: res.status(), entries: body.data?.entries ?? [] };
  }

  async getServiceEvents(slug: string, params?: { status?: string; limit?: number; offset?: number }): Promise<{
    events: EventData[];
    total: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.set('status', params.status);
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.offset) queryParams.set('offset', params.offset.toString());

    const url = `${this.baseUrl}/api/v1/services/${slug}/events${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const res = await this.request.get(url);
    if (!res.ok()) {
      throw new Error(`Get service events failed: ${res.status()} ${await res.text()}`);
    }
    const body = await res.json();
    return {
      events: body.data?.events ?? [],
      total: body.data?.total ?? 0,
    };
  }

  async deleteEvent(eventId: string): Promise<number> {
    const res = await this.request.delete(`${this.baseUrl}/api/v1/events/${eventId}`, {
      headers: this.getMutationHeaders(),
    });
    return res.status();
  }

  async updateService(slug: string, data: Partial<CreateServiceData> & { name: string; slug: string; status: string; reason?: string }): Promise<{ status: number }> {
    const res = await this.request.patch(`${this.baseUrl}/api/v1/services/${slug}`, {
      data,
      headers: this.getMutationHeaders(),
    });
    return { status: res.status() };
  }

  async deleteService(slug: string): Promise<void> {
    const res = await this.request.delete(`${this.baseUrl}/api/v1/services/${slug}`, {
      headers: this.getMutationHeaders(),
    });
    // Ignore 404 - service may already be deleted
    if (!res.ok() && res.status() !== 404) {
      throw new Error(`Delete service failed: ${res.status()} ${await res.text()}`);
    }
  }

  async deleteGroup(slug: string): Promise<void> {
    const res = await this.request.delete(`${this.baseUrl}/api/v1/groups/${slug}`, {
      headers: this.getMutationHeaders(),
    });
    if (!res.ok() && res.status() !== 404) {
      throw new Error(`Delete group failed: ${res.status()} ${await res.text()}`);
    }
  }

  // Raw request methods for testing permissions
  async rawPost(path: string, data: unknown): Promise<{ status: number }> {
    const res = await this.request.post(`${this.baseUrl}${path}`, {
      data,
      headers: this.getMutationHeaders(),
    });
    return { status: res.status() };
  }

  async rawGet(path: string): Promise<{ status: number }> {
    const res = await this.request.get(`${this.baseUrl}${path}`);
    return { status: res.status() };
  }

  async rawDelete(path: string): Promise<{ status: number }> {
    const res = await this.request.delete(`${this.baseUrl}${path}`, {
      headers: this.getMutationHeaders(),
    });
    return { status: res.status() };
  }
}

// Extended test fixture
// Each API helper uses its own request context to avoid cookie conflicts
export const test = base.extend<{
  authenticatedPage: Page;
  api: ApiHelper;
  operatorApi: ApiHelper;
  userApi: ApiHelper;
  publicApi: ApiHelper;
}>({
  authenticatedPage: async ({ page }, use) => {
    await loginAsAdmin(page);
    await use(page);
  },
  api: async ({ playwright }, use) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
    const context = await playwright.request.newContext({ baseURL: baseUrl });
    const helper = new ApiHelper(context, baseUrl);
    await helper.login(testAdmin.email, testAdmin.password);
    await use(helper);
    await context.dispose();
  },
  operatorApi: async ({ playwright }, use) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
    const context = await playwright.request.newContext({ baseURL: baseUrl });
    const helper = new ApiHelper(context, baseUrl);
    await helper.login(testOperator.email, testOperator.password);
    await use(helper);
    await context.dispose();
  },
  userApi: async ({ playwright }, use) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
    const context = await playwright.request.newContext({ baseURL: baseUrl });
    const helper = new ApiHelper(context, baseUrl);
    await helper.login(testUser.email, testUser.password);
    await use(helper);
    await context.dispose();
  },
  publicApi: async ({ playwright }, use) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
    const context = await playwright.request.newContext({ baseURL: baseUrl });
    // Public API - no login
    const helper = new ApiHelper(context, baseUrl);
    await use(helper);
    await context.dispose();
  },
});

export { baseExpect as expect };

// Helper functions for common operations
export async function createService(
  page: Page,
  data: {
    name: string;
    slug?: string;
    description?: string;
  }
): Promise<void> {
  await page.getByTestId('create-service-button').click();
  await page.getByLabel(/^name$/i).fill(data.name);
  if (data.slug) {
    await page.getByLabel(/slug/i).fill(data.slug);
  }
  if (data.description) {
    await page.getByLabel(/description/i).fill(data.description);
  }
  await page.getByRole('button', { name: /create service/i }).click();
  // Wait for dialog to close
  await page.waitForSelector('[data-testid="service-form-dialog"]', { state: 'hidden' });
}

export async function createGroup(
  page: Page,
  data: {
    name: string;
    slug?: string;
    description?: string;
  }
): Promise<void> {
  await page.getByTestId('create-group-button').click();
  await page.getByLabel(/^name$/i).fill(data.name);
  if (data.slug) {
    await page.getByLabel(/slug/i).fill(data.slug);
  }
  if (data.description) {
    await page.getByLabel(/description/i).fill(data.description);
  }
  await page.getByRole('button', { name: /create group/i }).click();
  // Wait for dialog to close
  await page.waitForSelector('[data-testid="group-form-dialog"]', { state: 'hidden' });
}

// Generate unique names for test isolation
export function uniqueName(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// Generate unique slug (valid format)
export function uniqueSlug(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`.toLowerCase();
}
