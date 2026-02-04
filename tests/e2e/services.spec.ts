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

    // Wait for service to appear in table (indicates success)
    await expect(page.getByRole('row').filter({ hasText: serviceName })).toBeVisible({ timeout: 10000 });
  });

  test('should create service with group selection', async ({
    authenticatedPage: page,
  }) => {
    const serviceName = testServiceName();

    await page.getByTestId('create-service-button').click();

    await page.getByLabel(/^name$/i).fill(serviceName);

    // Select first available group (if any)
    const groupCheckbox = page.getByTestId('group-checkbox').first();
    if (await groupCheckbox.isVisible()) {
      await groupCheckbox.check();
    }

    await page.getByRole('button', { name: /create service/i }).click();

    // Wait for service to appear in table (indicates success)
    await expect(page.getByRole('row').filter({ hasText: serviceName })).toBeVisible({ timeout: 10000 });
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
    // Wait for service to appear
    await expect(page.getByRole('row').filter({ hasText: serviceName })).toBeVisible({ timeout: 10000 });

    // Find and click edit button for this service
    const row = page.getByRole('row').filter({ hasText: serviceName });
    await row.getByTestId('edit-button').click();

    // Dialog should show "Edit Service"
    await expect(page.getByRole('heading', { name: /edit service/i })).toBeVisible();

    // Update name
    const updatedName = `${serviceName} Updated`;
    await page.getByLabel(/^name$/i).fill(updatedName);

    await page.getByRole('button', { name: /update service/i }).click();

    // Wait for updated name to appear in table
    await expect(page.getByRole('row').filter({ hasText: updatedName })).toBeVisible({ timeout: 10000 });
  });

  test('should archive service', async ({ authenticatedPage: page }) => {
    // Create a service first
    const serviceName = testServiceName();
    await page.getByTestId('create-service-button').click();
    await page.getByLabel(/^name$/i).fill(serviceName);
    await page.getByRole('button', { name: /create service/i }).click();
    // Wait for service to appear
    await expect(page.getByRole('row').filter({ hasText: serviceName })).toBeVisible({ timeout: 10000 });

    // Find and click delete button
    const row = page.getByRole('row').filter({ hasText: serviceName });
    await row.getByTestId('delete-button').click();

    // Confirmation dialog should appear
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await expect(page.getByText(/are you sure/i)).toBeVisible();

    // Confirm deletion
    await page.getByTestId('confirm-delete-button').click();

    // Wait for alertdialog to close
    await expect(page.getByRole('alertdialog')).not.toBeVisible({ timeout: 10000 });

    // Service should no longer be visible in active table (archived is hidden by default)
    await expect(page.getByRole('row').filter({ hasText: serviceName })).not.toBeVisible();
  });

  test('should toggle show archived and see archived services', async ({
    authenticatedPage: page,
  }) => {
    // Create and archive a service
    const serviceName = testServiceName();
    await page.getByTestId('create-service-button').click();
    await page.getByLabel(/^name$/i).fill(serviceName);
    await page.getByRole('button', { name: /create service/i }).click();
    // Wait for service to appear
    await expect(page.getByRole('row').filter({ hasText: serviceName })).toBeVisible({ timeout: 10000 });

    // Archive it
    const row = page.getByRole('row').filter({ hasText: serviceName });
    await row.getByTestId('delete-button').click();
    await page.getByTestId('confirm-delete-button').click();
    // Wait for confirmation dialog to close
    await expect(page.getByRole('alertdialog')).not.toBeVisible({ timeout: 10000 });

    // Enable "Show archived" toggle
    await page.getByTestId('show-archived-toggle').click();

    // Service should be visible with "Archived" badge - check within the specific row
    const serviceRow = page.getByRole('row').filter({ hasText: serviceName });
    await expect(serviceRow).toBeVisible();
    await expect(serviceRow.getByText('Archived', { exact: true })).toBeVisible();
  });

  test('should restore archived service', async ({ authenticatedPage: page }) => {
    // Create and archive a service
    const serviceName = testServiceName();
    await page.getByTestId('create-service-button').click();
    await page.getByLabel(/^name$/i).fill(serviceName);
    await page.getByRole('button', { name: /create service/i }).click();
    // Wait for service to appear
    await expect(page.getByRole('row').filter({ hasText: serviceName })).toBeVisible({ timeout: 10000 });

    // Archive it
    let row = page.getByRole('row').filter({ hasText: serviceName });
    await row.getByTestId('delete-button').click();
    await page.getByTestId('confirm-delete-button').click();
    // Wait for confirmation dialog to close
    await expect(page.getByRole('alertdialog')).not.toBeVisible({ timeout: 10000 });

    // Enable "Show archived"
    await page.getByTestId('show-archived-toggle').click();

    // Click restore button
    row = page.getByRole('row').filter({ hasText: serviceName });
    await row.getByTestId('restore-button').click();

    // Wait a bit for restore to complete
    await page.waitForTimeout(500);

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
    // Wait for service to appear
    await expect(page.getByRole('row').filter({ hasText: serviceName })).toBeVisible({ timeout: 10000 });

    // Click delete
    const row = page.getByRole('row').filter({ hasText: serviceName });
    await row.getByTestId('delete-button').click();

    // Cancel
    await page.getByRole('button', { name: /cancel/i }).click();

    // Service should still be visible
    await expect(page.getByRole('row').filter({ hasText: serviceName })).toBeVisible();
  });

  test('should create service with tags', async ({ authenticatedPage: page }) => {
    const serviceName = testServiceName();

    await page.getByTestId('create-service-button').click();

    // Fill basic info
    await page.getByLabel(/^name$/i).fill(serviceName);

    // Add a tag
    await page.getByTestId('tag-key-input').fill('environment');
    await page.getByTestId('tag-value-input').fill('production');
    await page.getByTestId('add-tag-button').click();

    // Verify tag appears in form
    await expect(page.getByText('environment')).toBeVisible();
    await expect(page.getByText(': production')).toBeVisible();

    // Submit
    await page.getByRole('button', { name: /create service/i }).click();

    // Wait for service to appear in table
    await expect(page.getByRole('row').filter({ hasText: serviceName })).toBeVisible({ timeout: 10000 });
  });

  test('should edit service tags', async ({ authenticatedPage: page }) => {
    // Create a service first
    const serviceName = testServiceName();
    await page.getByTestId('create-service-button').click();
    await page.getByLabel(/^name$/i).fill(serviceName);
    await page.getByRole('button', { name: /create service/i }).click();
    await expect(page.getByRole('row').filter({ hasText: serviceName })).toBeVisible({ timeout: 10000 });

    // Open edit dialog
    const row = page.getByRole('row').filter({ hasText: serviceName });
    await row.getByTestId('edit-button').click();

    // Wait for dialog
    await expect(page.getByRole('heading', { name: /edit service/i })).toBeVisible();

    // Add a tag
    await page.getByTestId('tag-key-input').fill('version');
    await page.getByTestId('tag-value-input').fill('1.0.0');
    await page.getByTestId('add-tag-button').click();

    // Verify tag appears
    await expect(page.getByText('version')).toBeVisible();

    // Save
    await page.getByRole('button', { name: /update service/i }).click();

    // Wait for dialog to close
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
  });
});
