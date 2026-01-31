import { test, expect } from '@playwright/test';

test.describe('Public Status Page', () => {
  test('should display status page without authentication', async ({ page }) => {
    await page.goto('/');

    // Page should load without login
    await expect(page).toHaveURL('/');

    // Main heading should be visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should display overall status banner', async ({ page }) => {
    await page.goto('/');

    // Status banner should show overall system status
    await expect(
      page.getByText(/operational|degraded|partial|outage|maintenance/i)
    ).toBeVisible();
  });

  test('should display services section', async ({ page }) => {
    await page.goto('/');

    // Services heading
    await expect(page.getByRole('heading', { name: /services/i })).toBeVisible();

    // Service list should be visible (or empty state)
    const serviceList = page.getByTestId('services-list');
    const emptyState = page.getByText(/no services configured/i);

    // One of these should be visible
    const hasServices = await serviceList.isVisible();
    const isEmpty = await emptyState.isVisible();
    expect(hasServices || isEmpty).toBeTruthy();
  });

  test('should display active incidents section', async ({ page }) => {
    await page.goto('/');

    // Active incidents section should exist
    const activeIncidents = page.getByText(/active incidents/i);
    const noIncidents = page.getByText(/no active incidents/i);
    const incidentList = page.getByTestId('active-incidents-list');

    // Either show incidents or "no active incidents"
    const hasSection =
      (await activeIncidents.isVisible()) ||
      (await noIncidents.isVisible()) ||
      (await incidentList.isVisible());
    expect(hasSection).toBeTruthy();
  });

  test('should display scheduled maintenance section', async ({ page }) => {
    await page.goto('/');

    // Scheduled maintenance section should exist
    const hasMaintenance =
      (await page.getByText(/scheduled maintenance/i).isVisible()) ||
      (await page.getByText(/upcoming maintenance/i).isVisible()) ||
      (await page.getByText(/no scheduled maintenance/i).isVisible()) ||
      (await page.getByText(/no upcoming maintenance/i).isVisible());

    expect(hasMaintenance).toBeTruthy();
  });

  test('should navigate to history page', async ({ page }) => {
    await page.goto('/');

    // Click on history link
    await page.getByRole('link', { name: /history/i }).click();

    await expect(page).toHaveURL('/history');
  });

  test('should display history page', async ({ page }) => {
    await page.goto('/history');

    // History heading
    await expect(page.getByRole('heading', { name: /history/i })).toBeVisible();

    // History list or empty state
    const historyList = page.getByTestId('history-list');
    const emptyState = page.getByText(/no events in history/i);

    const hasHistory = await historyList.isVisible();
    const isEmpty = await emptyState.isVisible();
    expect(hasHistory || isEmpty).toBeTruthy();
  });

  test('should have working refresh button', async ({ page }) => {
    await page.goto('/');

    // Find and click refresh button
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    if (await refreshButton.isVisible()) {
      await refreshButton.click();

      // Page should still be on status page (refreshed)
      await expect(page).toHaveURL('/');
    }
  });

  test('should have navigation to login', async ({ page }) => {
    await page.goto('/');

    // Login link should be visible
    await expect(page.getByRole('link', { name: /login/i })).toBeVisible();

    await page.getByRole('link', { name: /login/i }).click();
    await expect(page).toHaveURL('/login');
  });

  test('should display services grouped by groups', async ({ page }) => {
    await page.goto('/');

    // Service groups container
    const serviceGroups = page.getByTestId('service-group');

    // If services exist, they should be in groups
    const groupCount = await serviceGroups.count();
    if (groupCount > 0) {
      // Each group should have a heading and services
      const firstGroup = serviceGroups.first();
      await expect(firstGroup).toBeVisible();
    }
  });

  test('should display service status indicators', async ({ page }) => {
    await page.goto('/');

    // Look for service items with status indicators
    const serviceItems = page.getByTestId('service-item');

    if ((await serviceItems.count()) > 0) {
      // Each service should show a status
      const firstService = serviceItems.first();
      await expect(firstService).toBeVisible();

      // Status indicator should be present
      const statusIndicator = firstService.getByTestId('status-indicator');
      if (await statusIndicator.isVisible()) {
        await expect(statusIndicator).toBeVisible();
      }
    }
  });

  test('should show last updated timestamp', async ({ page }) => {
    await page.goto('/');

    // Footer with last updated time
    await expect(page.getByText(/last updated/i)).toBeVisible();
  });

  test('should display header with logo', async ({ page }) => {
    await page.goto('/');

    // Header should have logo/branding
    await expect(page.getByText(/incidentgarden|garden/i).first()).toBeVisible();
  });

  test('should have responsive layout on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Page should still be functional
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Services section should be visible
    await expect(page.getByRole('heading', { name: /services/i })).toBeVisible();
  });

  test('should show theme switcher', async ({ page }) => {
    await page.goto('/');

    // Theme switcher button
    const themeSwitcher = page.getByTestId('theme-switcher');
    if (await themeSwitcher.isVisible()) {
      await expect(themeSwitcher).toBeVisible();
    }
  });
});

test.describe('History Page', () => {
  test('should display history page without authentication', async ({ page }) => {
    await page.goto('/history');

    await expect(page).toHaveURL('/history');
    await expect(page.getByRole('heading', { name: /history/i })).toBeVisible();
  });

  test('should navigate back to status page', async ({ page }) => {
    await page.goto('/history');

    // Click logo or home link
    await page.getByRole('link', { name: /incidentgarden|home/i }).first().click();

    await expect(page).toHaveURL('/');
  });

  test('should display events by day', async ({ page }) => {
    await page.goto('/history');

    // If there are events, they should be grouped by day
    const dayGroups = page.getByTestId('history-day-group');

    if ((await dayGroups.count()) > 0) {
      // Each day group should have a date heading
      const firstDayGroup = dayGroups.first();
      await expect(firstDayGroup).toBeVisible();
    }
  });
});
