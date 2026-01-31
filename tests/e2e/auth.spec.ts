import { test, expect, testOperator } from './fixtures';

test.describe('Authentication', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel(/email/i).fill(testOperator.email);
    await page.getByLabel(/password/i).fill(testOperator.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL('/dashboard');
    // Dashboard header should be visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel(/email/i).fill('wrong@email.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Error message should appear
    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('button', { name: /sign in/i }).click();

    // Validation errors should appear
    await expect(page.getByText(/email.*required|invalid.*email/i)).toBeVisible();
  });

  test('should redirect to login for protected routes when not authenticated', async ({
    page,
  }) => {
    await page.goto('/dashboard');

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login for /dashboard/services when not authenticated', async ({
    page,
  }) => {
    await page.goto('/dashboard/services');

    await expect(page).toHaveURL(/\/login/);
  });

  test('should logout successfully', async ({ authenticatedPage: page }) => {
    // Click user menu (avatar button)
    await page.getByTestId('user-menu').click();

    // Click logout button
    await page.getByTestId('logout-button').click();

    // Should be redirected to login
    await expect(page).toHaveURL('/login');
  });

  test('should show user info in menu when authenticated', async ({
    authenticatedPage: page,
  }) => {
    // Click user menu
    await page.getByTestId('user-menu').click();

    // Email should be visible in dropdown
    await expect(page.getByText(testOperator.email)).toBeVisible();
  });

  test('should navigate to dashboard after login', async ({
    authenticatedPage: page,
  }) => {
    await expect(page).toHaveURL('/dashboard');

    // Dashboard content should be present
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
