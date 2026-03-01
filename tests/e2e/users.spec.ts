/**
 * User Management E2E Tests
 *
 * Tests admin-only user management: access control, CRUD, deactivate/reactivate,
 * password reset, and self-protection.
 */

import { test, expect, testAdmin, testOperator } from './fixtures';

// Generate a unique email for each test run to avoid conflicts
function uniqueEmail(): string {
  return `e2e-test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;
}

// Helper to login as a specific user via UI
async function loginAs(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
}

test.describe('User Management', () => {
  // ── Group A: Access Control ──────────────────────────────────────────

  test.describe('A: Access Control', () => {
    test('admin can see Users link in sidebar', async ({ authenticatedPage: page }) => {
      // authenticatedPage logs in as admin
      await page.goto('/dashboard');

      // Sidebar should contain "Users" link
      await expect(page.getByRole('link', { name: /^Users$/i })).toBeVisible();
    });

    test('operator cannot see Users link in sidebar', async ({ page }) => {
      await loginAs(page, testOperator.email, testOperator.password);
      await page.waitForURL('/dashboard');

      // Sidebar should NOT contain "Users" link
      await expect(page.getByRole('link', { name: /^Users$/i })).not.toBeVisible();
    });

    test('operator redirected from /dashboard/users', async ({ page }) => {
      await loginAs(page, testOperator.email, testOperator.password);
      await page.waitForURL('/dashboard');

      // Navigate directly to /dashboard/users
      await page.goto('/dashboard/users');

      // Should be redirected to /dashboard (admin guard)
      await expect(page).toHaveURL('/dashboard');
    });
  });

  // ── Group B: Users List ──────────────────────────────────────────────

  test.describe('B: Users List', () => {
    test('admin can view users list', async ({ authenticatedPage: page }) => {
      await page.goto('/dashboard/users');

      // Page heading
      await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();
      await expect(page.getByText(/manage user accounts/i)).toBeVisible();

      // Table should render with at least one user row
      await expect(page.getByRole('table')).toBeVisible();
      // Admin user should be in the table
      await expect(page.getByRole('row').filter({ hasText: testAdmin.email })).toBeVisible();
    });

    test('admin can filter users by role', async ({ authenticatedPage: page }) => {
      await page.goto('/dashboard/users');
      await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();

      // Click role filter and select "Admin"
      await page.getByTestId('role-filter-select').click();
      await page.getByRole('option', { name: /^Admin$/i }).click();

      // Admin user should still be visible
      await expect(page.getByRole('row').filter({ hasText: testAdmin.email })).toBeVisible();

      // Now filter by "User" role
      await page.getByTestId('role-filter-select').click();
      await page.getByRole('option', { name: /^User$/i }).click();

      // Admin user should NOT be visible when filtering by "User" role
      await expect(page.getByRole('row').filter({ hasText: testAdmin.email })).not.toBeVisible();
    });

    test('current admin user shows "You" label', async ({ authenticatedPage: page }) => {
      await page.goto('/dashboard/users');
      await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();

      // Admin's own row should show "You" instead of action buttons
      const adminRow = page.getByRole('row').filter({ hasText: testAdmin.email });
      await expect(adminRow.getByText('You')).toBeVisible();
    });
  });

  // ── Groups C-H: Serial CRUD + Lifecycle (tests depend on each other) ──

  test.describe('C-H: User CRUD and Lifecycle', () => {
    test.describe.configure({ mode: 'serial' });

    const testEmail = uniqueEmail();
    const testPassword = 'testpass123';
    const newPassword = 'newpass12345';

    test('C: admin can create a new user', async ({ authenticatedPage: page }) => {
      await page.goto('/dashboard/users');
      await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();

      // Click Add User button
      await page.getByTestId('create-user-button').click();

      // Dialog should open
      await expect(page.getByRole('heading', { name: /create user/i })).toBeVisible();

      // Fill form
      await page.getByTestId('user-email-input').fill(testEmail);
      await page.getByTestId('user-password-input').fill(testPassword);

      // Select role: operator
      await page.getByTestId('user-role-select').click();
      await page.getByRole('option', { name: /^Operator$/i }).click();

      // Submit
      await page.getByTestId('user-form-submit').click();

      // Verify user appears in table (dialog closes on success)
      await expect(page.getByRole('row').filter({ hasText: testEmail })).toBeVisible({ timeout: 10000 });
    });

    test('C: shows error for duplicate email', async ({ authenticatedPage: page }) => {
      await page.goto('/dashboard/users');
      await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();

      // Try creating user with the same email
      await page.getByTestId('create-user-button').click();
      await expect(page.getByRole('heading', { name: /create user/i })).toBeVisible();

      await page.getByTestId('user-email-input').fill(testEmail);
      await page.getByTestId('user-password-input').fill(testPassword);

      await page.getByTestId('user-form-submit').click();

      // Should show an error (toast or inline) about duplicate email
      // The toast with "destructive" variant contains the error message
      await expect(page.getByText(/already exists|conflict|duplicate/i).first()).toBeVisible({ timeout: 10000 });
    });

    test('D: admin can edit user role', async ({ authenticatedPage: page }) => {
      await page.goto('/dashboard/users');
      await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();

      // Find the created user row and click edit
      const row = page.getByRole('row').filter({ hasText: testEmail });
      await row.getByTestId('edit-user-button').click();

      // Dialog should show "Edit User"
      await expect(page.getByRole('heading', { name: /edit user/i })).toBeVisible();

      // Change role to admin
      await page.getByTestId('user-role-select').click();
      await page.getByRole('option', { name: /^Admin$/i }).click();

      // Submit
      await page.getByTestId('user-form-submit').click();

      // Verify toast success
      await expect(page.getByText(/user updated/i).first()).toBeVisible({ timeout: 10000 });

      // Verify the role badge updated in the table
      const updatedRow = page.getByRole('row').filter({ hasText: testEmail });
      await expect(updatedRow.getByText('admin')).toBeVisible();
    });

    test('E: admin can deactivate a user', async ({ authenticatedPage: page }) => {
      await page.goto('/dashboard/users');
      await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();

      // Find the test user and click deactivate
      const row = page.getByRole('row').filter({ hasText: testEmail });
      await row.getByTestId('toggle-active-button').click();

      // Confirmation dialog should appear
      await expect(page.getByRole('alertdialog')).toBeVisible();
      await expect(page.getByText(/are you sure you want to deactivate/i)).toBeVisible();

      // Confirm
      await page.getByRole('button', { name: /deactivate/i }).click();

      // Wait for dialog to close
      await expect(page.getByRole('alertdialog')).not.toBeVisible({ timeout: 10000 });

      // Verify "Inactive" badge in the row
      const updatedRow = page.getByRole('row').filter({ hasText: testEmail });
      await expect(updatedRow.getByText('Inactive')).toBeVisible();
    });

    test('E: deactivated user cannot login', async ({ page }) => {
      await loginAs(page, testEmail, testPassword);

      // Should show an error on the login page (user is deactivated)
      await expect(page.getByRole('alert').first()).toBeVisible({ timeout: 10000 });

      // Should still be on login page
      await expect(page).toHaveURL(/\/login/);
    });

    test('E: admin can reactivate a user', async ({ authenticatedPage: page }) => {
      await page.goto('/dashboard/users');
      await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();

      // Find the deactivated user and click reactivate
      const row = page.getByRole('row').filter({ hasText: testEmail });
      await row.getByTestId('toggle-active-button').click();

      // Confirmation dialog
      await expect(page.getByRole('alertdialog')).toBeVisible();
      await expect(page.getByText(/are you sure you want to reactivate/i)).toBeVisible();

      // Confirm
      await page.getByRole('button', { name: /reactivate/i }).click();

      // Wait for dialog to close
      await expect(page.getByRole('alertdialog')).not.toBeVisible({ timeout: 10000 });

      // Verify "Active" badge
      const updatedRow = page.getByRole('row').filter({ hasText: testEmail });
      await expect(updatedRow.getByText('Active')).toBeVisible();
    });

    test('F: admin can reset user password', async ({ authenticatedPage: page }) => {
      await page.goto('/dashboard/users');
      await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();

      // Find the test user and click reset password
      const row = page.getByRole('row').filter({ hasText: testEmail });
      await row.getByTestId('reset-password-button').click();

      // Reset password dialog should appear
      await expect(page.getByRole('heading', { name: /reset password/i })).toBeVisible();
      await expect(page.getByText(testEmail)).toBeVisible();

      // Enter new password
      await page.getByTestId('reset-password-input').fill(newPassword);

      // Submit
      await page.getByTestId('reset-password-submit').click();

      // Verify toast success
      await expect(page.getByText(/password reset successfully/i).first()).toBeVisible({ timeout: 10000 });
    });

    test('F: user must change password after admin reset', async ({ page }) => {
      // Login with the reset password
      await loginAs(page, testEmail, newPassword);

      // User with must_change_password should be redirected to /change-password
      await expect(page).toHaveURL('/change-password', { timeout: 10000 });

      // The change password page should show the forced change alert
      await expect(page.getByText(/password must be changed/i)).toBeVisible();
    });

    test('G: admin cannot see action buttons on own row', async ({ authenticatedPage: page }) => {
      await page.goto('/dashboard/users');
      await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();

      // Admin's own row should show "You" and no action buttons
      const adminRow = page.getByRole('row').filter({ hasText: testAdmin.email });
      await expect(adminRow.getByText('You')).toBeVisible();
      await expect(adminRow.getByTestId('edit-user-button')).not.toBeVisible();
      await expect(adminRow.getByTestId('reset-password-button')).not.toBeVisible();
      await expect(adminRow.getByTestId('toggle-active-button')).not.toBeVisible();
    });

    test('H: cleanup - deactivate test user', async ({ authenticatedPage: page }) => {
      await page.goto('/dashboard/users');
      await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();

      // Find the test user - deactivate it for cleanup
      const row = page.getByRole('row').filter({ hasText: testEmail });
      // Only deactivate if user is active
      const activeStatus = row.getByText('Active');
      if (await activeStatus.isVisible()) {
        await row.getByTestId('toggle-active-button').click();
        await expect(page.getByRole('alertdialog')).toBeVisible();
        await page.getByRole('button', { name: /deactivate/i }).click();
        await expect(page.getByRole('alertdialog')).not.toBeVisible({ timeout: 10000 });
      }
    });
  });
});
