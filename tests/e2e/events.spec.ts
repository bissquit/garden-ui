import { test, expect, uniqueName } from './fixtures';

test.describe('Events Management', () => {
  const testEventTitle = () => uniqueName('E2E Incident');

  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/dashboard/events');
    await expect(page.getByRole('heading', { name: /events/i })).toBeVisible();
  });

  test('should display events page', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: /events/i })).toBeVisible();
    await expect(page.getByText(/view incidents and maintenance/i)).toBeVisible();
    await expect(page.getByTestId('create-event-button')).toBeVisible();
  });

  test('should open create event dialog', async ({ authenticatedPage: page }) => {
    await page.getByTestId('create-event-button').click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /create event/i })).toBeVisible();

    // Form fields
    await expect(page.getByLabel(/title/i)).toBeVisible();
    await expect(page.getByLabel(/type/i)).toBeVisible();
    await expect(page.getByLabel(/status/i)).toBeVisible();
    await expect(page.getByLabel(/description/i)).toBeVisible();
  });

  test('should create incident with basic info', async ({
    authenticatedPage: page,
  }) => {
    const eventTitle = testEventTitle();

    await page.getByTestId('create-event-button').click();

    await page.getByLabel(/title/i).fill(eventTitle);
    // Type defaults to 'incident'
    // Status defaults to 'investigating'

    await page.getByLabel(/description/i).fill('E2E test incident description');

    await page.getByRole('button', { name: /create event/i }).click();

    await expect(page.getByText(/event created/i)).toBeVisible();
    await expect(page.getByText(eventTitle)).toBeVisible();
  });

  test('should create incident with severity', async ({
    authenticatedPage: page,
  }) => {
    const eventTitle = testEventTitle();

    await page.getByTestId('create-event-button').click();

    await page.getByLabel(/title/i).fill(eventTitle);
    await page.getByLabel(/description/i).fill('Incident with severity');

    // Select severity
    await page.getByLabel(/severity/i).click();
    await page.getByRole('option', { name: /major/i }).click();

    await page.getByRole('button', { name: /create event/i }).click();

    await expect(page.getByText(/event created/i)).toBeVisible();
    await expect(page.getByText(eventTitle)).toBeVisible();
  });

  test('should create incident with group selection', async ({
    authenticatedPage: page,
  }) => {
    const eventTitle = testEventTitle();

    await page.getByTestId('create-event-button').click();

    await page.getByLabel(/title/i).fill(eventTitle);
    await page.getByLabel(/description/i).fill('Incident affecting a group');

    // Select first available group
    const groupCheckbox = page.locator('[id^="event-group-"]').first();
    if (await groupCheckbox.isVisible()) {
      await groupCheckbox.check();

      // Preview should show total affected services
      await expect(page.getByText(/total affected:/i)).toBeVisible();
    }

    await page.getByRole('button', { name: /create event/i }).click();

    await expect(page.getByText(/event created/i)).toBeVisible();
  });

  test('should create maintenance event', async ({ authenticatedPage: page }) => {
    const eventTitle = uniqueName('E2E Maintenance');

    await page.getByTestId('create-event-button').click();

    await page.getByLabel(/title/i).fill(eventTitle);

    // Change type to maintenance
    await page.getByLabel(/type/i).click();
    await page.getByRole('option', { name: /maintenance/i }).click();

    await page.getByLabel(/description/i).fill('Scheduled maintenance test');

    // Status should have changed to 'scheduled'
    const statusValue = await page.getByLabel(/status/i).textContent();
    expect(statusValue?.toLowerCase()).toContain('scheduled');

    // Scheduled time fields should be visible for maintenance
    await expect(page.getByLabel(/scheduled start/i)).toBeVisible();
    await expect(page.getByLabel(/scheduled end/i)).toBeVisible();

    await page.getByRole('button', { name: /create event/i }).click();

    await expect(page.getByText(/event created/i)).toBeVisible();
  });

  test('should create maintenance with scheduled times', async ({
    authenticatedPage: page,
  }) => {
    const eventTitle = uniqueName('E2E Scheduled Maintenance');

    await page.getByTestId('create-event-button').click();

    await page.getByLabel(/title/i).fill(eventTitle);

    // Change type to maintenance
    await page.getByLabel(/type/i).click();
    await page.getByRole('option', { name: /maintenance/i }).click();

    await page.getByLabel(/description/i).fill('Scheduled maintenance with times');

    // Set scheduled times
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setMinutes(0, 0, 0);

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    dayAfter.setMinutes(0, 0, 0);

    // Format for datetime-local input: YYYY-MM-DDTHH:MM
    const formatDateTime = (d: Date) => {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    await page.getByLabel(/scheduled start/i).fill(formatDateTime(tomorrow));
    await page.getByLabel(/scheduled end/i).fill(formatDateTime(dayAfter));

    await page.getByRole('button', { name: /create event/i }).click();

    await expect(page.getByText(/event created/i)).toBeVisible();
  });

  test('should show validation error for empty title', async ({
    authenticatedPage: page,
  }) => {
    await page.getByTestId('create-event-button').click();

    await page.getByRole('button', { name: /create event/i }).click();

    await expect(page.getByText(/title.*required/i)).toBeVisible();
  });

  test('should navigate to event details', async ({ authenticatedPage: page }) => {
    // Create an event first
    const eventTitle = testEventTitle();
    await page.getByTestId('create-event-button').click();
    await page.getByLabel(/title/i).fill(eventTitle);
    await page.getByLabel(/description/i).fill('Event for detail view');
    await page.getByRole('button', { name: /create event/i }).click();
    await expect(page.getByText(/event created/i)).toBeVisible();

    // Click on the event row
    await page.getByRole('row').filter({ hasText: eventTitle }).click();

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/dashboard\/events\/[a-f0-9-]+$/);

    // Event details should be visible
    await expect(page.getByText(eventTitle)).toBeVisible();
  });

  test('should display event details page elements', async ({
    authenticatedPage: page,
  }) => {
    // Create an event
    const eventTitle = testEventTitle();
    await page.getByTestId('create-event-button').click();
    await page.getByLabel(/title/i).fill(eventTitle);
    await page.getByLabel(/description/i).fill('Event details test');
    await page.getByRole('button', { name: /create event/i }).click();
    await expect(page.getByText(/event created/i)).toBeVisible();

    // Navigate to details
    await page.getByRole('row').filter({ hasText: eventTitle }).click();

    // Check elements
    await expect(page.getByText(eventTitle)).toBeVisible();
    await expect(page.getByText(/timeline/i)).toBeVisible();
    await expect(page.getByText(/post update/i)).toBeVisible();
  });

  test('should add update to event', async ({ authenticatedPage: page }) => {
    // Create an event
    const eventTitle = testEventTitle();
    await page.getByTestId('create-event-button').click();
    await page.getByLabel(/title/i).fill(eventTitle);
    await page.getByLabel(/description/i).fill('Event for update test');
    await page.getByRole('button', { name: /create event/i }).click();
    await expect(page.getByText(/event created/i)).toBeVisible();

    // Navigate to details
    await page.getByRole('row').filter({ hasText: eventTitle }).click();

    // Post an update
    const updateMessage = 'E2E update message';
    await page.getByLabel(/message/i).fill(updateMessage);
    await page.getByRole('button', { name: /post update/i }).click();

    await expect(page.getByText(/update posted/i)).toBeVisible();

    // Update should appear in timeline
    await expect(page.getByText(updateMessage)).toBeVisible();
  });

  test('should display changes history on event details', async ({
    authenticatedPage: page,
  }) => {
    // Create an event
    const eventTitle = testEventTitle();
    await page.getByTestId('create-event-button').click();
    await page.getByLabel(/title/i).fill(eventTitle);
    await page.getByLabel(/description/i).fill('Event for changes history');
    await page.getByRole('button', { name: /create event/i }).click();
    await expect(page.getByText(/event created/i)).toBeVisible();

    // Navigate to details
    await page.getByRole('row').filter({ hasText: eventTitle }).click();

    // Changes history section should be visible
    await expect(page.getByText(/changes history|change history|audit/i)).toBeVisible();
  });

  test('should filter events by type', async ({ authenticatedPage: page }) => {
    // Check if filter controls exist
    const typeFilter = page.getByTestId('filter-type');
    if (await typeFilter.isVisible()) {
      await typeFilter.click();
      await page.getByRole('option', { name: /incident/i }).click();

      // URL should update with filter
      await expect(page).toHaveURL(/type=incident/);
    }
  });

  test('should filter events by status', async ({ authenticatedPage: page }) => {
    const statusFilter = page.getByTestId('filter-status');
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      await page.getByRole('option', { name: /investigating/i }).click();

      await expect(page).toHaveURL(/status=investigating/);
    }
  });

  test('should navigate back from event details', async ({
    authenticatedPage: page,
  }) => {
    // Create an event
    const eventTitle = testEventTitle();
    await page.getByTestId('create-event-button').click();
    await page.getByLabel(/title/i).fill(eventTitle);
    await page.getByLabel(/description/i).fill('Event for back nav');
    await page.getByRole('button', { name: /create event/i }).click();
    await expect(page.getByText(/event created/i)).toBeVisible();

    // Navigate to details
    await page.getByRole('row').filter({ hasText: eventTitle }).click();

    // Click back button
    await page.getByRole('button', { name: /back/i }).click();

    // Should be back on events list
    await expect(page).toHaveURL('/dashboard/events');
  });
});
