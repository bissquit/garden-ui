import { test, expect, uniqueName } from './fixtures';

test.describe('Groups Management', () => {
  const testGroupName = () => uniqueName('E2E Group');
  const testSlug = () => uniqueName('e2e-group').toLowerCase();

  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard/groups');
    await expect(page.getByRole('heading', { name: /groups/i })).toBeVisible();
  });

  test('should display groups page', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: /groups/i })).toBeVisible();
    await expect(page.getByText(/organize services into groups/i)).toBeVisible();
    await expect(page.getByTestId('create-group-button')).toBeVisible();
  });

  test('should open create group dialog', async ({ authenticatedPage: page }) => {
    await page.getByTestId('create-group-button').click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /create group/i })).toBeVisible();

    // Form fields
    await expect(page.getByLabel(/^name$/i)).toBeVisible();
    await expect(page.getByLabel(/slug/i)).toBeVisible();
    await expect(page.getByLabel(/description/i)).toBeVisible();
  });

  test('should create group', async ({ authenticatedPage: page }) => {
    const groupName = testGroupName();
    const slug = testSlug();

    await page.getByTestId('create-group-button').click();

    await page.getByLabel(/^name$/i).fill(groupName);
    await page.getByLabel(/slug/i).fill(slug);

    await page.getByRole('button', { name: /create group/i }).click();

    // Wait for group to appear in table
    await expect(page.getByRole('row').filter({ hasText: groupName })).toBeVisible({ timeout: 10000 });
  });

  test('should create group with description', async ({
    authenticatedPage: page,
  }) => {
    const groupName = testGroupName();
    const slug = testSlug();
    const description = 'Test group description';

    await page.getByTestId('create-group-button').click();

    await page.getByLabel(/^name$/i).fill(groupName);
    await page.getByLabel(/slug/i).fill(slug);
    await page.getByLabel(/description/i).fill(description);

    await page.getByRole('button', { name: /create group/i }).click();

    // Wait for group to appear in table
    const row = page.getByRole('row').filter({ hasText: groupName });
    await expect(row).toBeVisible({ timeout: 10000 });
    // Check description within the row to avoid strict mode violation
    await expect(row.getByText(description)).toBeVisible();
  });

  test('should show validation error for empty name', async ({
    authenticatedPage: page,
  }) => {
    await page.getByTestId('create-group-button').click();

    await page.getByRole('button', { name: /create group/i }).click();

    await expect(page.getByText(/name.*required/i)).toBeVisible();
  });

  test('should edit existing group', async ({ authenticatedPage: page }) => {
    // Create a group first
    const groupName = testGroupName();
    const slug = testSlug();
    await page.getByTestId('create-group-button').click();
    await page.getByLabel(/^name$/i).fill(groupName);
    await page.getByLabel(/slug/i).fill(slug);
    await page.getByRole('button', { name: /create group/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });

    // Find and edit
    const row = page.getByRole('row').filter({ hasText: groupName });
    await row.getByTestId('edit-button').click();

    await expect(page.getByRole('heading', { name: /edit group/i })).toBeVisible();

    const updatedName = `${groupName} Updated`;
    await page.getByLabel(/^name$/i).fill(updatedName);

    await page.getByRole('button', { name: /update group/i }).click();

    // Wait for updated name to appear in table
    await expect(page.getByRole('row').filter({ hasText: updatedName })).toBeVisible({ timeout: 10000 });
  });

  test('should archive group', async ({ authenticatedPage: page }) => {
    const groupName = testGroupName();
    const slug = testSlug();
    await page.getByTestId('create-group-button').click();
    await page.getByLabel(/^name$/i).fill(groupName);
    await page.getByLabel(/slug/i).fill(slug);
    await page.getByRole('button', { name: /create group/i }).click();
    // Wait for group to appear
    await expect(page.getByRole('row').filter({ hasText: groupName })).toBeVisible({ timeout: 10000 });

    // Delete
    const row = page.getByRole('row').filter({ hasText: groupName });
    await row.getByTestId('delete-button').click();

    // Confirm
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await page.getByTestId('confirm-delete-button').click();

    // Wait for confirmation dialog to close
    await expect(page.getByRole('alertdialog')).not.toBeVisible({ timeout: 10000 });
    // Group should no longer be visible in active table
    await expect(page.getByRole('row').filter({ hasText: groupName })).not.toBeVisible();
  });

  test('should restore archived group', async ({ authenticatedPage: page }) => {
    const groupName = testGroupName();
    const slug = testSlug();
    await page.getByTestId('create-group-button').click();
    await page.getByLabel(/^name$/i).fill(groupName);
    await page.getByLabel(/slug/i).fill(slug);
    await page.getByRole('button', { name: /create group/i }).click();
    // Wait for group to appear
    await expect(page.getByRole('row').filter({ hasText: groupName })).toBeVisible({ timeout: 10000 });

    // Archive
    let row = page.getByRole('row').filter({ hasText: groupName });
    await row.getByTestId('delete-button').click();
    await page.getByTestId('confirm-delete-button').click();
    // Wait for confirmation dialog to close
    await expect(page.getByRole('alertdialog')).not.toBeVisible({ timeout: 10000 });

    // Show archived
    await page.getByTestId('show-archived-toggle').click();

    // Restore
    row = page.getByRole('row').filter({ hasText: groupName });
    await row.getByTestId('restore-button').click();

    // Wait a bit for restore to complete
    await page.waitForTimeout(500);

    // No longer archived
    row = page.getByRole('row').filter({ hasText: groupName });
    await expect(row.getByText(/archived/i)).not.toBeVisible();
  });

  test('should display services count column', async ({
    authenticatedPage: page,
  }) => {
    const header = page.getByRole('columnheader', { name: /services/i });
    await expect(header).toBeVisible();
  });

  test('should display order column', async ({ authenticatedPage: page }) => {
    const header = page.getByRole('columnheader', { name: /order/i });
    await expect(header).toBeVisible();
  });

  test('should cancel delete confirmation', async ({
    authenticatedPage: page,
  }) => {
    const groupName = testGroupName();
    const slug = testSlug();
    await page.getByTestId('create-group-button').click();
    await page.getByLabel(/^name$/i).fill(groupName);
    await page.getByLabel(/slug/i).fill(slug);
    await page.getByRole('button', { name: /create group/i }).click();
    // Wait for group to appear
    await expect(page.getByRole('row').filter({ hasText: groupName })).toBeVisible({ timeout: 10000 });

    // Click delete
    const row = page.getByRole('row').filter({ hasText: groupName });
    await row.getByTestId('delete-button').click();

    // Cancel
    await page.getByRole('button', { name: /cancel/i }).click();

    // Group still visible
    await expect(page.getByRole('row').filter({ hasText: groupName })).toBeVisible();
  });
});
