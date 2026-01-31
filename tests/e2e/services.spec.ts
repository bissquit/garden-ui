import { test, expect, uniqueName } from './fixtures';

test.describe('Services Management', () => {
  // Use unique names for test isolation
  const testServiceName = () => uniqueName('E2E Service');

  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard/services');
    // Wait for the page to load
    await expect(page.getByRole('heading', { name: /services/i })).toBeVisible();
  });

  test('should display services page', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: /services/i })).toBeVisible();
    await expect(page.getByText(/manage your services/i)).toBeVisible();
    // Add Service button should be visible
    await expect(page.getByTestId('create-service-button')).toBeVisible();
  });

  test('should open create service dialog', async ({ authenticatedPage: page }) => {
    await page.getByTestId('create-service-button').click();

    // Dialog should be visible
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /create service/i })).toBeVisible();

    // Form fields should be visible
    await expect(page.getByLabel(/^name$/i)).toBeVisible();
    await expect(page.getByLabel(/slug/i)).toBeVisible();
    await expect(page.getByLabel(/description/i)).toBeVisible();
  });

  test('should create service with basic info', async ({ authenticatedPage: page }) => {
    const serviceName = testServiceName();

    await page.getByTestId('create-service-button').click();

    // Fill form
    await page.getByLabel(/^name$/i).fill(serviceName);
    // Slug should be auto-generated

    // Submit
    await page.getByRole('button', { name: /create service/i }).click();

    // Wait for success toast
    await expect(page.getByText(/service created/i)).toBeVisible();

    // Service should appear in table
    await expect(page.getByText(serviceName)).toBeVisible();
  });

  test('should create service with group selection', async ({
    authenticatedPage: page,
  }) => {
    const serviceName = testServiceName();

    await page.getByTestId('create-service-button').click();

    await page.getByLabel(/^name$/i).fill(serviceName);

    // Select first available group (if any)
    const groupCheckbox = page.locator('[id^="group-"]').first();
    if (await groupCheckbox.isVisible()) {
      await groupCheckbox.check();
    }

    await page.getByRole('button', { name: /create service/i }).click();

    await expect(page.getByText(/service created/i)).toBeVisible();
    await expect(page.getByText(serviceName)).toBeVisible();
  });

  test('should show validation error for empty name', async ({
    authenticatedPage: page,
  }) => {
    await page.getByTestId('create-service-button').click();

    // Try to submit without name
    await page.getByRole('button', { name: /create service/i }).click();

    // Validation error should appear
    await expect(page.getByText(/name.*required/i)).toBeVisible();
  });

  test('should edit existing service', async ({ authenticatedPage: page }) => {
    // First create a service
    const serviceName = testServiceName();
    await page.getByTestId('create-service-button').click();
    await page.getByLabel(/^name$/i).fill(serviceName);
    await page.getByRole('button', { name: /create service/i }).click();
    await expect(page.getByText(/service created/i)).toBeVisible();

    // Find and click edit button for this service
    const row = page.getByRole('row').filter({ hasText: serviceName });
    await row.getByTestId('edit-button').click();

    // Dialog should show "Edit Service"
    await expect(page.getByRole('heading', { name: /edit service/i })).toBeVisible();

    // Update name
    const updatedName = `${serviceName} Updated`;
    await page.getByLabel(/^name$/i).fill(updatedName);

    await page.getByRole('button', { name: /update service/i }).click();

    // Success message
    await expect(page.getByText(/service updated/i)).toBeVisible();

    // Updated name should be visible
    await expect(page.getByText(updatedName)).toBeVisible();
  });

  test('should archive service', async ({ authenticatedPage: page }) => {
    // Create a service first
    const serviceName = testServiceName();
    await page.getByTestId('create-service-button').click();
    await page.getByLabel(/^name$/i).fill(serviceName);
    await page.getByRole('button', { name: /create service/i }).click();
    await expect(page.getByText(/service created/i)).toBeVisible();

    // Find and click delete button
    const row = page.getByRole('row').filter({ hasText: serviceName });
    await row.getByTestId('delete-button').click();

    // Confirmation dialog should appear
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await expect(page.getByText(/are you sure/i)).toBeVisible();

    // Confirm deletion
    await page.getByTestId('confirm-delete-button').click();

    // Success message
    await expect(page.getByText(/service archived/i)).toBeVisible();

    // Service should no longer be visible (archived is hidden by default)
    await expect(page.getByText(serviceName)).not.toBeVisible();
  });

  test('should toggle show archived and see archived services', async ({
    authenticatedPage: page,
  }) => {
    // Create and archive a service
    const serviceName = testServiceName();
    await page.getByTestId('create-service-button').click();
    await page.getByLabel(/^name$/i).fill(serviceName);
    await page.getByRole('button', { name: /create service/i }).click();
    await expect(page.getByText(/service created/i)).toBeVisible();

    // Archive it
    const row = page.getByRole('row').filter({ hasText: serviceName });
    await row.getByTestId('delete-button').click();
    await page.getByTestId('confirm-delete-button').click();
    await expect(page.getByText(/service archived/i)).toBeVisible();

    // Enable "Show archived" toggle
    await page.getByTestId('show-archived-toggle').click();

    // Service should be visible with "Archived" badge
    await expect(page.getByText(serviceName)).toBeVisible();
    await expect(page.getByText(/archived/i)).toBeVisible();
  });

  test('should restore archived service', async ({ authenticatedPage: page }) => {
    // Create and archive a service
    const serviceName = testServiceName();
    await page.getByTestId('create-service-button').click();
    await page.getByLabel(/^name$/i).fill(serviceName);
    await page.getByRole('button', { name: /create service/i }).click();
    await expect(page.getByText(/service created/i)).toBeVisible();

    // Archive it
    let row = page.getByRole('row').filter({ hasText: serviceName });
    await row.getByTestId('delete-button').click();
    await page.getByTestId('confirm-delete-button').click();
    await expect(page.getByText(/service archived/i)).toBeVisible();

    // Enable "Show archived"
    await page.getByTestId('show-archived-toggle').click();

    // Click restore button
    row = page.getByRole('row').filter({ hasText: serviceName });
    await row.getByTestId('restore-button').click();

    // Success message
    await expect(page.getByText(/service restored/i)).toBeVisible();

    // Service should no longer have "Archived" badge
    row = page.getByRole('row').filter({ hasText: serviceName });
    await expect(row.getByText(/archived/i)).not.toBeVisible();
  });

  test('should display services with group badges', async ({
    authenticatedPage: page,
  }) => {
    // Just verify the table structure - groups column should exist
    const header = page.getByRole('columnheader', { name: /groups/i });
    await expect(header).toBeVisible();
  });

  test('should cancel delete confirmation', async ({ authenticatedPage: page }) => {
    // Create a service
    const serviceName = testServiceName();
    await page.getByTestId('create-service-button').click();
    await page.getByLabel(/^name$/i).fill(serviceName);
    await page.getByRole('button', { name: /create service/i }).click();
    await expect(page.getByText(/service created/i)).toBeVisible();

    // Click delete
    const row = page.getByRole('row').filter({ hasText: serviceName });
    await row.getByTestId('delete-button').click();

    // Cancel
    await page.getByRole('button', { name: /cancel/i }).click();

    // Service should still be visible
    await expect(page.getByText(serviceName)).toBeVisible();
  });
});
