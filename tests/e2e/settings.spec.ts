/**
 * Settings / Profile E2E Tests
 *
 * Tests profile editing, name display in header, and disabled fields.
 */

import { test, expect, testAdmin } from './fixtures';

test.describe('Settings: Profile Editing', () => {
  test.describe.configure({ mode: 'serial' });

  // Use unique names to verify changes
  const testFirstName = `E2E-${Date.now().toString(36)}`;
  const testLastName = `Tester-${Math.random().toString(36).slice(2, 5)}`;

  test('user can update profile name', async ({ authenticatedPage: page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();

    // Verify profile section
    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible();

    // Verify email field is present and disabled
    const emailField = page.getByLabel(/^email$/i);
    await expect(emailField).toBeVisible();
    await expect(emailField).toBeDisabled();
    await expect(emailField).toHaveValue(testAdmin.email);

    // Verify role field is present and disabled
    const roleField = page.getByLabel(/^role$/i);
    await expect(roleField).toBeVisible();
    await expect(roleField).toBeDisabled();

    // Fill in first name and last name
    await page.getByLabel(/first name/i).fill(testFirstName);
    await page.getByLabel(/last name/i).fill(testLastName);

    // Submit profile
    await page.getByRole('button', { name: /save profile/i }).click();

    // Verify success toast
    await expect(page.getByText(/profile updated/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('profile changes reflected in header', async ({ authenticatedPage: page }) => {
    // Navigate to settings first to ensure we have latest data
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();

    // Open user menu in header
    await page.getByTestId('user-menu').click();

    // The dropdown menu should show the updated name
    const menu = page.getByRole('menu');
    await expect(menu.getByText(`${testFirstName} ${testLastName}`)).toBeVisible();
  });

  test('email and role fields are disabled', async ({ authenticatedPage: page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();

    // Email should be disabled
    const emailField = page.getByLabel(/^email$/i);
    await expect(emailField).toBeDisabled();

    // Role should be disabled
    const roleField = page.getByLabel(/^role$/i);
    await expect(roleField).toBeDisabled();
  });

  test('cleanup: clear profile names', async ({ authenticatedPage: page }) => {
    // Reset the profile name to avoid polluting other test runs
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();

    await page.getByLabel(/first name/i).fill('');
    await page.getByLabel(/last name/i).fill('');

    await page.getByRole('button', { name: /save profile/i }).click();

    await expect(page.getByText(/profile updated/i).first()).toBeVisible({ timeout: 10000 });
  });
});
