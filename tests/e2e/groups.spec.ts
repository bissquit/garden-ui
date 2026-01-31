import { test, expect, uniqueName } from './fixtures';

test.describe('Groups Management', () => {
  const testGroupName = () => uniqueName('E2E Group');

  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard/groups');
    await expect(page.getByRole('heading', { name: /groups/i })).toBeVisible();
  });

  test('should display groups page', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: /groups/i })).toBeVisible();
    await expect(page.getByText(/manage your service groups/i)).toBeVisible();
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

    await page.getByTestId('create-group-button').click();

    await page.getByLabel(/^name$/i).fill(groupName);
    // Slug auto-generated

    await page.getByRole('button', { name: /create group/i }).click();

    await expect(page.getByText(/group created/i)).toBeVisible();
    await expect(page.getByText(groupName)).toBeVisible();
  });

  test('should create group with description', async ({
    authenticatedPage: page,
  }) => {
    const groupName = testGroupName();
    const description = 'Test group description';

    await page.getByTestId('create-group-button').click();

    await page.getByLabel(/^name$/i).fill(groupName);
    await page.getByLabel(/description/i).fill(description);

    await page.getByRole('button', { name: /create group/i }).click();

    await expect(page.getByText(/group created/i)).toBeVisible();
    await expect(page.getByText(groupName)).toBeVisible();
    await expect(page.getByText(description)).toBeVisible();
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
    await page.getByTestId('create-group-button').click();
    await page.getByLabel(/^name$/i).fill(groupName);
    await page.getByRole('button', { name: /create group/i }).click();
    await expect(page.getByText(/group created/i)).toBeVisible();

    // Find and edit
    const row = page.getByRole('row').filter({ hasText: groupName });
    await row.getByTestId('edit-button').click();

    await expect(page.getByRole('heading', { name: /edit group/i })).toBeVisible();

    const updatedName = `${groupName} Updated`;
    await page.getByLabel(/^name$/i).fill(updatedName);

    await page.getByRole('button', { name: /update group/i }).click();

    await expect(page.getByText(/group updated/i)).toBeVisible();
    await expect(page.getByText(updatedName)).toBeVisible();
  });

  test('should archive group', async ({ authenticatedPage: page }) => {
    const groupName = testGroupName();
    await page.getByTestId('create-group-button').click();
    await page.getByLabel(/^name$/i).fill(groupName);
    await page.getByRole('button', { name: /create group/i }).click();
    await expect(page.getByText(/group created/i)).toBeVisible();

    // Delete
    const row = page.getByRole('row').filter({ hasText: groupName });
    await row.getByTestId('delete-button').click();

    // Confirm
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await page.getByTestId('confirm-delete-button').click();

    await expect(page.getByText(/group archived/i)).toBeVisible();
    await expect(page.getByText(groupName)).not.toBeVisible();
  });

  test('should restore archived group', async ({ authenticatedPage: page }) => {
    const groupName = testGroupName();
    await page.getByTestId('create-group-button').click();
    await page.getByLabel(/^name$/i).fill(groupName);
    await page.getByRole('button', { name: /create group/i }).click();
    await expect(page.getByText(/group created/i)).toBeVisible();

    // Archive
    let row = page.getByRole('row').filter({ hasText: groupName });
    await row.getByTestId('delete-button').click();
    await page.getByTestId('confirm-delete-button').click();
    await expect(page.getByText(/group archived/i)).toBeVisible();

    // Show archived
    await page.getByTestId('show-archived-toggle').click();

    // Restore
    row = page.getByRole('row').filter({ hasText: groupName });
    await row.getByTestId('restore-button').click();

    await expect(page.getByText(/group restored/i)).toBeVisible();

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
    await page.getByTestId('create-group-button').click();
    await page.getByLabel(/^name$/i).fill(groupName);
    await page.getByRole('button', { name: /create group/i }).click();
    await expect(page.getByText(/group created/i)).toBeVisible();

    // Click delete
    const row = page.getByRole('row').filter({ hasText: groupName });
    await row.getByTestId('delete-button').click();

    // Cancel
    await page.getByRole('button', { name: /cancel/i }).click();

    // Group still visible
    await expect(page.getByText(groupName)).toBeVisible();
  });
});
