import { test as base, type Page } from '@playwright/test';

// Test user credentials
// These users should be created in the backend before running tests
export const testOperator = {
  email: 'operator@test.com',
  password: 'TestPassword123',
};

export const testAdmin = {
  email: 'admin@test.com',
  password: 'AdminPassword123',
};

// Helper to login as admin (required for CRUD operations in backend 1.4.0+)
async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(testAdmin.email);
  await page.getByLabel(/password/i).fill(testAdmin.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('/dashboard');
}

// Extended test with authenticated page fixture (uses admin for CRUD permissions)
export const test = base.extend<{
  authenticatedPage: Page;
}>({
  authenticatedPage: async ({ page }, use) => {
    await loginAsAdmin(page);
    await use(page);
  },
});

export { expect } from '@playwright/test';

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
