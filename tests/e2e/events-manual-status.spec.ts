/**
 * Manual Status Management E2E Tests
 *
 * Group D: Manual status changes and their interaction with events
 */

import { test, expect, uniqueSlug } from './fixtures';

test.describe('Manual Status Management', () => {
  /**
   * D1: Manual status change without events
   *
   * Setup:
   * - Service api-gateway (operational), no active events
   *
   * Action:
   * PATCH /services/api-gateway
   * {
   *   "name": "API Gateway",
   *   "slug": "api-gateway",
   *   "status": "degraded",
   *   "reason": "Load testing in progress"
   * }
   *
   * Expected Result:
   * 1. stored_status = "degraded"
   * 2. effective_status = "degraded"
   * 3. has_active_events = false
   * 4. GET /services/api-gateway/status-log contains entry:
   *    - source_type = "manual"
   *    - old_status = "operational"
   *    - new_status = "degraded"
   */
  test.describe('D1: Manual status change without events', () => {
    test('manual status is reflected in both stored and effective', async ({ api }) => {
      // Setup
      const svc1 = await api.createService({ name: uniqueSlug('api-gateway') });

      // Action: Manual status change
      const { status } = await api.updateService(svc1.slug, {
        name: svc1.slug, // Name matches slug since we used uniqueSlug for name
        slug: svc1.slug,
        status: 'degraded',
        reason: 'Load testing in progress',
      });

      expect(status).toBe(200);

      // Assertions
      const apiService = await api.getService(svc1.slug);
      expect(apiService.status).toBe('degraded');
      expect(apiService.effective_status).toBe('degraded');
      expect(apiService.has_active_events).toBe(false);

      // Check status log
      const logResult = await api.getServiceStatusLog(svc1.slug);
      expect(logResult.status).toBe(200);
      expect(logResult.entries).toBeDefined();

      const manualEntry = logResult.entries?.find(e => e.source_type === 'manual');
      expect(manualEntry).toBeDefined();
      expect(manualEntry?.old_status).toBe('operational');
      expect(manualEntry?.new_status).toBe('degraded');
    });
  });

  /**
   * D2: Manual change during active incident - no effect on effective
   *
   * Setup:
   * - Active incident: api-gateway = major_outage
   *
   * Action:
   * PATCH /services/api-gateway
   * {
   *   "name": "API Gateway",
   *   "slug": "api-gateway",
   *   "status": "degraded"
   * }
   *
   * Expected Result:
   * 1. stored_status = "degraded"
   * 2. effective_status = "major_outage" (determined by event)
   * 3. has_active_events = true
   */
  test.describe('D2: Manual change during active incident - no effect on effective', () => {
    test('effective_status determined by incident, not manual', async ({ api }) => {
      // Setup
      const svc1 = await api.createService({ name: uniqueSlug('api-gateway') });

      // Create active incident
      await api.createEvent({
        title: 'Active incident',
        type: 'incident',
        status: 'investigating',
        severity: 'major',
        description: 'Test',
        affected_services: [{ service_id: svc1.id, status: 'major_outage' }],
      });

      // Action: Try to manually set to degraded
      const { status } = await api.updateService(svc1.slug, {
        name: svc1.slug,
        slug: svc1.slug,
        status: 'degraded',
      });

      expect(status).toBe(200);

      // Assertions
      const apiService = await api.getService(svc1.slug);
      expect(apiService.status).toBe('degraded'); // stored status changed
      expect(apiService.effective_status).toBe('major_outage'); // effective from incident
      expect(apiService.has_active_events).toBe(true);
    });
  });

  /**
   * D3: Manual status lost when incident closes
   *
   * Setup:
   * 1. Service api-gateway: stored_status = "degraded" (manual)
   * 2. Create incident: api-gateway = major_outage
   *
   * Action:
   * Close incident
   *
   * Expected Result:
   * 1. stored_status = "operational" (reset, NOT degraded)
   * 2. effective_status = "operational"
   *
   * This is expected behavior. If degraded is needed after incident — set manually again.
   */
  test.describe('D3: Manual status lost when incident closes', () => {
    test('closing incident resets stored status to operational', async ({ api }) => {
      // Setup
      const svc1 = await api.createService({ name: uniqueSlug('api-gateway') });

      // Manually set to degraded
      await api.updateService(svc1.slug, {
        name: svc1.slug,
        slug: svc1.slug,
        status: 'degraded',
      });

      let apiService = await api.getService(svc1.slug);
      expect(apiService.status).toBe('degraded');

      // Create incident
      const { id: eventId } = await api.createEvent({
        title: 'Incident',
        type: 'incident',
        status: 'investigating',
        severity: 'major',
        description: 'Test',
        affected_services: [{ service_id: svc1.id, status: 'major_outage' }],
      });

      // Action: Close incident
      await api.addEventUpdate(eventId, {
        status: 'resolved',
        message: 'Resolved',
      });

      // Assertions
      apiService = await api.getService(svc1.slug);
      expect(apiService.status).toBe('operational'); // Reset to operational, NOT degraded
      expect(apiService.effective_status).toBe('operational');
    });
  });
});
