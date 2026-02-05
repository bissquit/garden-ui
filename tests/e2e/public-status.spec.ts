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

    // Wait for data to load - spinner should disappear
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 10000 });

    // Status banner should show overall system status - use .first() to avoid strict mode violation
    // when multiple elements contain status-related text (header + individual services)
    await expect(
      page.getByText(/operational|degraded|partial|outage|maintenance|all systems/i).first()
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
    await expect(serviceList.or(emptyState)).toBeVisible();
  });

  test('should display active incidents section', async ({ page }) => {
    await page.goto('/');

    // Active incidents section should exist - use .first() to avoid strict mode violation
    // when both heading and list are present
    await expect(
      page.getByText(/active incidents/i)
        .or(page.getByText(/no active incidents/i))
        .or(page.getByTestId('active-incidents-list'))
        .first()
    ).toBeVisible();
  });

  test('should display scheduled maintenance section', async ({ page }) => {
    await page.goto('/');

    // Wait for data to load
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 10000 });

    // Scheduled maintenance section is optional - it only appears if there are scheduled events
    // The page is valid whether or not the section exists
    const maintenanceHeading = page.getByRole('heading', { name: /scheduled maintenance/i });
    const maintenanceCount = await maintenanceHeading.count();

    // If section exists, verify it has proper structure
    if (maintenanceCount > 0) {
      await expect(maintenanceHeading).toBeVisible();
    }
    // If no maintenance events, section won't be rendered - that's valid
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

    await expect(historyList.or(emptyState)).toBeVisible();
  });

  test('should have working refresh button', async ({ page }) => {
    await page.goto('/');

    // Find and click refresh button
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    await expect(refreshButton).toBeVisible();
    await refreshButton.click();

    // Page should still be on status page (refreshed)
    await expect(page).toHaveURL('/');
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

    const serviceCount = await serviceItems.count();
    if (serviceCount > 0) {
      // Each service should show a status
      const firstService = serviceItems.first();
      await expect(firstService).toBeVisible();

      // Status indicator should be present - this is a UI requirement
      await expect(firstService.getByTestId('status-indicator')).toBeVisible();
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
    await expect(themeSwitcher).toBeVisible();
  });
});

test.describe('Public Event Details Page', () => {
  test('should navigate to event details via "View details" link', async ({ page }) => {
    await page.goto('/');

    // Wait for data to load
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 10000 });

    // Find "View details" link - only visible if there are active events
    const viewDetailsLink = page.getByRole('link', { name: /view details/i }).first();

    if (await viewDetailsLink.isVisible()) {
      await viewDetailsLink.click();

      // Should navigate to /events/[id]
      await expect(page).toHaveURL(/\/events\/[a-f0-9-]+/);

      // Event details should be visible
      await expect(page.getByText(/description/i)).toBeVisible();
    }
  });

  test('should display event details page without authentication', async ({ page }) => {
    // First, get an event ID from the status page
    await page.goto('/');
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 10000 });

    const viewDetailsLink = page.getByRole('link', { name: /view details/i }).first();

    if (await viewDetailsLink.isVisible()) {
      const href = await viewDetailsLink.getAttribute('href');
      const eventId = href?.split('/events/')[1];

      if (eventId) {
        // Navigate directly to event page
        await page.goto(`/events/${eventId}`);
        await expect(page).toHaveURL(`/events/${eventId}`);

        // Event card should be visible
        await expect(page.getByText(/description/i)).toBeVisible();

        // Timeline section should be visible
        await expect(page.getByRole('heading', { name: /timeline/i })).toBeVisible();

        // Back button should be visible
        await expect(page.getByRole('link', { name: /back to status/i })).toBeVisible();
      }
    }
  });

  test('should display timeline on event details page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 10000 });

    const viewDetailsLink = page.getByRole('link', { name: /view details/i }).first();

    if (await viewDetailsLink.isVisible()) {
      await viewDetailsLink.click();
      await expect(page).toHaveURL(/\/events\/[a-f0-9-]+/);

      // Timeline heading
      await expect(page.getByRole('heading', { name: /timeline/i })).toBeVisible();

      // Event created block should always be present
      await expect(page.getByText(/event created/i)).toBeVisible();
    }
  });

  test('should navigate back to status page', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 10000 });

    const viewDetailsLink = page.getByRole('link', { name: /view details/i }).first();

    if (await viewDetailsLink.isVisible()) {
      await viewDetailsLink.click();
      await expect(page).toHaveURL(/\/events\/[a-f0-9-]+/);

      // Click back button
      await page.getByRole('link', { name: /back to status/i }).click();
      await expect(page).toHaveURL('/');
    }
  });

  test('should show "Event not found" for invalid ID', async ({ page }) => {
    await page.goto('/events/non-existent-event-id');

    // Should show not found message
    await expect(page.getByText(/event not found/i)).toBeVisible();

    // Back button should still work
    await expect(page.getByRole('link', { name: /back to status/i })).toBeVisible();
  });

  test('should not show Edit button for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 10000 });

    const viewDetailsLink = page.getByRole('link', { name: /view details/i }).first();

    if (await viewDetailsLink.isVisible()) {
      await viewDetailsLink.click();
      await expect(page).toHaveURL(/\/events\/[a-f0-9-]+/);

      // Edit button should NOT be visible for unauthenticated users
      await expect(page.getByRole('link', { name: /edit/i })).not.toBeVisible();
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
