/**
 * Password Flows E2E Tests
 *
 * Tests change password from settings, must_change_password forced flow,
 * forgot password page, and reset password page.
 */

import { test, expect, testAdmin, testUser, loginAs } from './fixtures';

// Generate a unique email for test users created via admin API
function uniqueEmail(): string {
  return `e2e-pwd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;
}

// ── Group A: Change Password (Settings) ─────────────────────────────────

test.describe('Password: Change Password from Settings', () => {
  test.describe.configure({ mode: 'serial' });

  // We use the testUser account for password change testing.
  // Original password is restored after the test via admin reset.
  const originalPassword = testUser.password; // 'user123'
  const temporaryPassword = `newpass-${Date.now()}`;

  test('user can change password from settings', async ({ page }) => {
    // Login as regular user
    await loginAs(page, testUser.email, originalPassword);
    await page.waitForURL('/', { timeout: 10000 });

    // Navigate to settings
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();

    // Find Change Password section
    await expect(page.getByRole('heading', { name: /change password/i })).toBeVisible();

    // Fill current and new password
    await page.getByLabel(/current password/i).fill(originalPassword);
    await page.getByLabel(/new password/i).fill(temporaryPassword);

    // Submit
    await page.getByRole('button', { name: /change password/i }).click();

    // Should show success toast and redirect to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('user can login with new password after change', async ({ page }) => {
    await loginAs(page, testUser.email, temporaryPassword);

    // Should successfully login (user role goes to /)
    await expect(page).toHaveURL('/', { timeout: 10000 });
  });

  test('restore original password via admin reset', async ({ page }) => {
    // Login as admin
    await loginAs(page, testAdmin.email, testAdmin.password);
    await page.waitForURL('/dashboard');

    // Go to users page
    await page.goto('/dashboard/users');
    await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();

    // Find the test user and reset their password
    const row = page.getByRole('row').filter({ hasText: testUser.email });
    await row.getByTestId('reset-password-button').click();

    // Reset password dialog
    await expect(page.getByRole('heading', { name: /reset password/i })).toBeVisible();
    await page.getByTestId('reset-password-input').fill(originalPassword);
    await page.getByTestId('reset-password-submit').click();

    // Verify success
    await expect(page.getByText(/password reset successfully/i).first()).toBeVisible({ timeout: 10000 });

    // Note: The user now has must_change_password=true.
    // To fully restore, user would need to login and change password.
    // For E2E test isolation this is acceptable since must_change_password
    // is tested separately.
  });
});

// ── Group B: must_change_password Flow ──────────────────────────────────

test.describe('Password: must_change_password Flow', () => {
  test.describe.configure({ mode: 'serial' });

  const testEmail = uniqueEmail();
  const tempPassword = 'temppass123';
  const finalPassword = 'finalpass456';

  test('admin creates user with temporary password', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard/users');
    await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();

    // Create user via UI (admin-created users get must_change_password=true)
    await page.getByTestId('create-user-button').click();
    await expect(page.getByRole('heading', { name: /create user/i })).toBeVisible();

    await page.getByTestId('user-email-input').fill(testEmail);
    await page.getByTestId('user-password-input').fill(tempPassword);

    // Role: user
    await page.getByTestId('user-role-select').click();
    await page.getByRole('option', { name: /^User$/i }).click();

    await page.getByTestId('user-form-submit').click();

    // Verify user appears in table
    await expect(page.getByRole('row').filter({ hasText: testEmail })).toBeVisible({ timeout: 10000 });
  });

  test('user with must_change_password is redirected to /change-password', async ({ page }) => {
    await loginAs(page, testEmail, tempPassword);

    // Should be redirected to /change-password (not / or /dashboard)
    await expect(page).toHaveURL('/change-password', { timeout: 10000 });

    // Should show the forced password change alert
    await expect(page.getByText(/password must be changed/i)).toBeVisible();
  });

  test('user can change forced password', async ({ page }) => {
    await loginAs(page, testEmail, tempPassword);
    await expect(page).toHaveURL('/change-password', { timeout: 10000 });

    // Fill change password form
    await page.getByLabel(/current password/i).fill(tempPassword);
    await page.getByLabel(/new password/i).fill(finalPassword);

    await page.getByRole('button', { name: /change password/i }).click();

    // Should redirect to /login after password change
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('user can login with new password after change', async ({ page }) => {
    await loginAs(page, testEmail, finalPassword);

    // Should NOT be redirected to /change-password anymore
    // User role goes to /
    await expect(page).toHaveURL('/', { timeout: 10000 });
  });

  test('cleanup: deactivate test user', async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard/users');
    await expect(page.getByRole('heading', { name: /users/i })).toBeVisible();

    const row = page.getByRole('row').filter({ hasText: testEmail });
    if (await row.isVisible()) {
      await row.getByTestId('toggle-active-button').click();
      await expect(page.getByRole('alertdialog')).toBeVisible();
      await page.getByRole('button', { name: /deactivate/i }).click();
      await expect(page.getByRole('alertdialog')).not.toBeVisible({ timeout: 10000 });
    }
  });
});

// ── Group C: Forgot Password Page ───────────────────────────────────────

test.describe('Password: Forgot Password Page', () => {
  test('forgot password page renders correctly', async ({ page }) => {
    await page.goto('/forgot-password');

    // Heading
    await expect(page.getByRole('heading', { name: /forgot password/i })).toBeVisible();

    // Should show either the email form or the "contact administrator" message
    // depending on whether email is configured
    const emailInput = page.getByLabel(/email/i);
    const contactAdmin = page.getByText(/contact.*administrator/i);

    await expect(emailInput.or(contactAdmin)).toBeVisible({ timeout: 10000 });
  });

  test('forgot password link exists on login page', async ({ page }) => {
    await page.goto('/login');

    // Verify "Forgot password?" link
    const forgotLink = page.getByRole('link', { name: /forgot password/i });
    await expect(forgotLink).toBeVisible();

    // Click it and verify navigation
    await forgotLink.click();
    await expect(page).toHaveURL('/forgot-password');
  });
});

// ── Group D: Reset Password Page ────────────────────────────────────────

test.describe('Password: Reset Password Page', () => {
  test('reset password page shows error without token', async ({ page }) => {
    await page.goto('/reset-password');

    // Heading
    await expect(page.getByRole('heading', { name: /reset password/i })).toBeVisible();

    // Should show error alert about invalid/missing link
    await expect(page.getByText(/invalid reset link/i)).toBeVisible();
  });

  test('reset password page shows error with invalid token', async ({ page }) => {
    await page.goto('/reset-password?token=invalid-token-12345');

    // Heading
    await expect(page.getByRole('heading', { name: /reset password/i })).toBeVisible();

    // The form should be visible (token is present)
    await expect(page.getByLabel(/new password/i)).toBeVisible();
    await expect(page.getByLabel(/confirm password/i)).toBeVisible();

    // Fill and submit with the invalid token
    await page.getByLabel(/new password/i).fill('newpassword123');
    await page.getByLabel(/confirm password/i).fill('newpassword123');

    await page.getByRole('button', { name: /reset password/i }).click();

    // Should show error about invalid/expired token
    await expect(page.getByRole('alert').first()).toBeVisible({ timeout: 10000 });
  });
});
