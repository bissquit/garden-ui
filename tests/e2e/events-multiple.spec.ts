/**
 * Multiple Events E2E Tests
 *
 * Group C: Multiple events on same service - worst-case status calculation
 */

import { test, expect, uniqueSlug } from './fixtures';

test.describe('Multiple Events - Worst Case', () => {
  /**
   * C1: Two incidents on same service - worst-case
   *
   * Setup:
   * - Service api-gateway (operational)
   *
   * Action:
   * 1. Create incident A: api-gateway = degraded
   * 2. Create incident B: api-gateway = major_outage
   *
   * Expected Result:
   * - api-gateway: effective_status = "major_outage" (worst-case)
   */
  test.describe('C1: Two incidents on same service', () => {
    test('effective_status is worst-case', async ({ api }) => {
      // Setup
      const svc1 = await api.createService({ name: uniqueSlug('api-gateway') });

      // Create two incidents with different statuses
      await api.createEvent({
        title: 'Incident A',
        type: 'incident',
        status: 'investigating',
        severity: 'minor',
        description: 'Test A',
        affected_services: [{ service_id: svc1.id, status: 'degraded' }],
      });

      await api.createEvent({
        title: 'Incident B',
        type: 'incident',
        status: 'investigating',
        severity: 'major',
        description: 'Test B',
        affected_services: [{ service_id: svc1.id, status: 'major_outage' }],
      });

      // Assertions
      const apiService = await api.getService(svc1.slug);
      expect(apiService.effective_status).toBe('major_outage'); // worst-case
    });
  });

  /**
   * C2: Close one incident - recalculate worst-case
   *
   * Setup:
   * - Incident A: api-gateway (degraded) — active
   * - Incident B: api-gateway (major_outage) — active
   *
   * Action:
   * Close incident B
   *
   * Expected Result:
   * 1. api-gateway: effective_status = "degraded" (from incident A)
   * 2. has_active_events = true
   *
   * Then close incident A:
   * 1. api-gateway: effective_status = "operational"
   * 2. has_active_events = false
   */
  test.describe('C2: Close one incident - recalculate worst-case', () => {
    test('status recalculated from remaining incidents', async ({ api }) => {
      // Setup
      const svc1 = await api.createService({ name: uniqueSlug('api-gateway') });

      const { id: incidentA } = await api.createEvent({
        title: 'Incident A',
        type: 'incident',
        status: 'investigating',
        severity: 'minor',
        description: 'Test A',
        affected_services: [{ service_id: svc1.id, status: 'degraded' }],
      });

      const { id: incidentB } = await api.createEvent({
        title: 'Incident B',
        type: 'incident',
        status: 'investigating',
        severity: 'major',
        description: 'Test B',
        affected_services: [{ service_id: svc1.id, status: 'major_outage' }],
      });

      // Close incident B (the worse one)
      await api.addEventUpdate(incidentB, {
        status: 'resolved',
        message: 'Resolved',
      });

      // Status recalculated from incident A
      let apiService = await api.getService(svc1.slug);
      expect(apiService.effective_status).toBe('degraded');
      expect(apiService.has_active_events).toBe(true);

      // Close incident A
      await api.addEventUpdate(incidentA, {
        status: 'resolved',
        message: 'Resolved',
      });

      // Now operational
      apiService = await api.getService(svc1.slug);
      expect(apiService.effective_status).toBe('operational');
      expect(apiService.has_active_events).toBe(false);
    });
  });

  /**
   * C3: Status priority order
   *
   * Setup:
   * - Service api-gateway
   *
   * Action:
   * Create incidents with different statuses:
   * 1. Incident: api-gateway = degraded (priority 2)
   * 2. Incident: api-gateway = partial_outage (priority 3)
   * 3. Incident: api-gateway = maintenance (priority 1)
   *
   * Expected Result:
   * - effective_status = "partial_outage" (maximum priority 3)
   *
   * Close incident with partial_outage:
   * - effective_status = "degraded" (next: priority 2)
   *
   * Priority order: major_outage (4) > partial_outage (3) > degraded (2) > maintenance (1) > operational (0)
   */
  test.describe('C3: Status priority order', () => {
    test('partial_outage > degraded > maintenance', async ({ api }) => {
      // Setup
      const svc1 = await api.createService({ name: uniqueSlug('api-gateway') });

      // Create incidents with different priorities
      // Priority: major_outage (4) > partial_outage (3) > degraded (2) > maintenance (1)
      const { id: degradedIncident } = await api.createEvent({
        title: 'Degraded incident',
        type: 'incident',
        status: 'investigating',
        severity: 'minor',
        description: 'Test',
        affected_services: [{ service_id: svc1.id, status: 'degraded' }],
      });

      let apiService = await api.getService(svc1.slug);
      expect(apiService.effective_status).toBe('degraded');

      const { id: partialIncident } = await api.createEvent({
        title: 'Partial outage incident',
        type: 'incident',
        status: 'investigating',
        severity: 'major',
        description: 'Test',
        affected_services: [{ service_id: svc1.id, status: 'partial_outage' }],
      });

      apiService = await api.getService(svc1.slug);
      expect(apiService.effective_status).toBe('partial_outage'); // higher priority

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);

      // Start maintenance (will add as in_progress directly for this test)
      const { id: maintId } = await api.createEvent({
        title: 'Maintenance',
        type: 'maintenance',
        status: 'scheduled',
        description: 'Test',
        scheduled_start_at: tomorrow.toISOString(),
        scheduled_end_at: dayAfter.toISOString(),
        affected_services: [{ service_id: svc1.id, status: 'maintenance' }],
      });

      await api.addEventUpdate(maintId, {
        status: 'in_progress',
        message: 'Started',
      });

      // partial_outage still wins (priority 3 > 1)
      apiService = await api.getService(svc1.slug);
      expect(apiService.effective_status).toBe('partial_outage');

      // Close partial_outage incident
      await api.addEventUpdate(partialIncident, {
        status: 'resolved',
        message: 'Resolved',
      });

      // Now degraded wins (priority 2 > 1)
      apiService = await api.getService(svc1.slug);
      expect(apiService.effective_status).toBe('degraded');

      // Close degraded incident
      await api.addEventUpdate(degradedIncident, {
        status: 'resolved',
        message: 'Resolved',
      });

      // Now maintenance wins
      apiService = await api.getService(svc1.slug);
      expect(apiService.effective_status).toBe('maintenance');

      // Complete maintenance
      await api.addEventUpdate(maintId, {
        status: 'completed',
        message: 'Done',
      });

      // Back to operational
      apiService = await api.getService(svc1.slug);
      expect(apiService.effective_status).toBe('operational');
    });
  });

  /**
   * C4: in_progress maintenance + incident
   *
   * Setup:
   * - Maintenance in_progress: database = maintenance
   * - Incident: database = degraded
   *
   * Expected Result:
   * - database: effective_status = "degraded" (priority 2 > 1)
   */
  test.describe('C4: in_progress maintenance + incident', () => {
    test('incident degraded > maintenance', async ({ api }) => {
      // Setup
      const database = await api.createService({ name: uniqueSlug('database') });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);

      // Create and start maintenance
      const { id: maintId } = await api.createEvent({
        title: 'Maintenance',
        type: 'maintenance',
        status: 'scheduled',
        description: 'Test',
        scheduled_start_at: tomorrow.toISOString(),
        scheduled_end_at: dayAfter.toISOString(),
        affected_services: [{ service_id: database.id, status: 'maintenance' }],
      });

      await api.addEventUpdate(maintId, {
        status: 'in_progress',
        message: 'Started',
      });

      let dbService = await api.getService(database.slug);
      expect(dbService.effective_status).toBe('maintenance');

      // Create incident
      await api.createEvent({
        title: 'Incident',
        type: 'incident',
        status: 'investigating',
        severity: 'minor',
        description: 'Test',
        affected_services: [{ service_id: database.id, status: 'degraded' }],
      });

      // Degraded > maintenance
      dbService = await api.getService(database.slug);
      expect(dbService.effective_status).toBe('degraded');
    });
  });
});
