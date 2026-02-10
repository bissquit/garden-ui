/**
 * Service Events Page E2E Tests
 *
 * Group E: Service events listing, filtering, pagination, status history
 */

import { test, expect, uniqueSlug } from './fixtures';

test.describe('Service Events Page', () => {
  /**
   * E1: Get service events
   *
   * Setup:
   * - Service api-gateway
   * - 2 active incidents for this service
   * - 3 resolved incidents for this service
   *
   * Action:
   * GET /services/api-gateway/events (no filters)
   *
   * Expected Result:
   * - total = 5
   * - Returns all 5 events (both active and resolved)
   */
  test.describe('E1: Get service events', () => {
    test('returns all events for service', async ({ api }) => {
      // Setup
      const svc1 = await api.createService({ name: uniqueSlug('api-gateway') });

      // Create 2 active incidents
      const { id: active1 } = await api.createEvent({
        title: 'Active 1',
        type: 'incident',
        status: 'investigating',
        severity: 'minor',
        description: 'Test',
        affected_services: [{ service_id: svc1.id, status: 'degraded' }],
      });

      const { id: active2 } = await api.createEvent({
        title: 'Active 2',
        type: 'incident',
        status: 'identified',
        severity: 'major',
        description: 'Test',
        affected_services: [{ service_id: svc1.id, status: 'partial_outage' }],
      });

      // Create 3 resolved incidents
      for (let i = 0; i < 3; i++) {
        const { id } = await api.createEvent({
          title: `Resolved ${i + 1}`,
          type: 'incident',
          status: 'investigating',
          severity: 'minor',
          description: 'Test',
          affected_services: [{ service_id: svc1.id, status: 'degraded' }],
        });
        await api.addEventUpdate(id, {
          status: 'resolved',
          message: 'Resolved',
        });
      }

      // Action: Get all events
      const result = await api.getServiceEvents(svc1.slug);

      // Assertions
      expect(result.total).toBe(5);
      expect(result.events.length).toBe(5);
    });
  });

  /**
   * E2: Filter - active only
   *
   * Setup:
   * - Service api-gateway
   * - 2 active incidents
   * - 1 resolved incident
   *
   * Action:
   * GET /services/api-gateway/events?status=active
   *
   * Expected Result:
   * - total = 2
   * - Only active events returned (resolved events excluded)
   */
  test.describe('E2: Filter - active only', () => {
    test('returns only active events', async ({ api }) => {
      // Setup
      const svc1 = await api.createService({ name: uniqueSlug('api-gateway') });

      // Create 2 active
      await api.createEvent({
        title: 'Active 1',
        type: 'incident',
        status: 'investigating',
        severity: 'minor',
        description: 'Test',
        affected_services: [{ service_id: svc1.id, status: 'degraded' }],
      });

      await api.createEvent({
        title: 'Active 2',
        type: 'incident',
        status: 'identified',
        severity: 'major',
        description: 'Test',
        affected_services: [{ service_id: svc1.id, status: 'partial_outage' }],
      });

      // Create 1 resolved
      const { id } = await api.createEvent({
        title: 'Resolved 1',
        type: 'incident',
        status: 'investigating',
        severity: 'minor',
        description: 'Test',
        affected_services: [{ service_id: svc1.id, status: 'degraded' }],
      });
      await api.addEventUpdate(id, {
        status: 'resolved',
        message: 'Resolved',
      });

      // Action: Get active only
      const result = await api.getServiceEvents(svc1.slug, { status: 'active' });

      // Assertions
      expect(result.total).toBe(2);
      expect(result.events.length).toBe(2);
    });
  });

  /**
   * E3: Filter - resolved only
   *
   * Setup:
   * - Service api-gateway
   * - 1 active incident
   * - 3 resolved incidents
   *
   * Action:
   * GET /services/api-gateway/events?status=resolved
   *
   * Expected Result:
   * - total = 3
   * - Only resolved events returned (active events excluded)
   */
  test.describe('E3: Filter - resolved only', () => {
    test('returns only resolved events', async ({ api }) => {
      // Setup
      const svc1 = await api.createService({ name: uniqueSlug('api-gateway') });

      // Create 1 active
      await api.createEvent({
        title: 'Active 1',
        type: 'incident',
        status: 'investigating',
        severity: 'minor',
        description: 'Test',
        affected_services: [{ service_id: svc1.id, status: 'degraded' }],
      });

      // Create 3 resolved
      for (let i = 0; i < 3; i++) {
        const { id } = await api.createEvent({
          title: `Resolved ${i + 1}`,
          type: 'incident',
          status: 'investigating',
          severity: 'minor',
          description: 'Test',
          affected_services: [{ service_id: svc1.id, status: 'degraded' }],
        });
        await api.addEventUpdate(id, {
          status: 'resolved',
          message: 'Resolved',
        });
      }

      // Action: Get resolved only
      const result = await api.getServiceEvents(svc1.slug, { status: 'resolved' });

      // Assertions
      expect(result.total).toBe(3);
      expect(result.events.length).toBe(3);
    });
  });

  /**
   * E4: Pagination
   *
   * Setup:
   * - Service api-gateway
   * - 10 resolved events
   *
   * Action:
   * 1. GET /services/api-gateway/events?limit=3&offset=0
   * 2. GET /services/api-gateway/events?limit=3&offset=3
   *
   * Expected Result:
   * 1. First page: 3 events, total = 10
   * 2. Second page: 3 different events, total = 10
   * 3. No overlap between page 1 and page 2 events
   */
  test.describe('E4: Pagination', () => {
    test('pagination works correctly', async ({ api }) => {
      // Setup
      const svc1 = await api.createService({ name: uniqueSlug('api-gateway') });

      // Create 10 resolved events
      for (let i = 0; i < 10; i++) {
        const { id } = await api.createEvent({
          title: `Event ${i + 1}`,
          type: 'incident',
          status: 'investigating',
          severity: 'minor',
          description: 'Test',
          affected_services: [{ service_id: svc1.id, status: 'degraded' }],
        });
        await api.addEventUpdate(id, {
          status: 'resolved',
          message: 'Resolved',
        });
      }

      // Action: Get first page
      const page1 = await api.getServiceEvents(svc1.slug, { limit: 3, offset: 0 });
      expect(page1.events.length).toBe(3);
      expect(page1.total).toBe(10);

      // Action: Get second page
      const page2 = await api.getServiceEvents(svc1.slug, { limit: 3, offset: 3 });
      expect(page2.events.length).toBe(3);
      expect(page2.total).toBe(10);

      // Events should be different
      const page1Ids = new Set(page1.events.map(e => e.id));
      const page2Ids = new Set(page2.events.map(e => e.id));
      const hasOverlap = page1.events.some(e => page2Ids.has(e.id));
      expect(hasOverlap).toBe(false);
    });
  });

  /**
   * E5: Status history (requires operator+)
   *
   * Setup:
   * - Service api-gateway
   * - Manual status change to "degraded"
   * - Create incident (changes to major_outage)
   * - Resolve incident (changes back to operational)
   *
   * Action:
   * GET /services/api-gateway/status-log
   * Authorization: Bearer <admin-token>
   *
   * Expected Result:
   * - HTTP 200
   * - Contains entries with source_type = "manual"
   * - Contains entries with source_type = "event"
   * - Tracks status transitions (old_status → new_status)
   */
  test.describe('E5: Status history (requires operator+)', () => {
    test('returns status change history', async ({ api }) => {
      // Setup
      const svc1 = await api.createService({ name: uniqueSlug('api-gateway') });

      // Create some status changes
      // 1. Manual change
      await api.updateService(svc1.slug, {
        name: svc1.slug,
        slug: svc1.slug,
        status: 'degraded',
        reason: 'Testing',
      });

      // 2. Event change
      const { id: eventId } = await api.createEvent({
        title: 'Test incident',
        type: 'incident',
        status: 'investigating',
        severity: 'major',
        description: 'Test',
        affected_services: [{ service_id: svc1.id, status: 'major_outage' }],
      });

      // 3. Close event
      await api.addEventUpdate(eventId, {
        status: 'resolved',
        message: 'Resolved',
      });

      // Action: Get status log (as admin)
      const result = await api.getServiceStatusLog(svc1.slug);

      // Assertions
      expect(result.status).toBe(200);
      expect(result.entries).toBeDefined();
      expect(result.entries!.length).toBeGreaterThan(0);

      // Check for different source types
      const manualEntries = result.entries!.filter(e => e.source_type === 'manual');
      const eventEntries = result.entries!.filter(e => e.source_type === 'event');

      expect(manualEntries.length).toBeGreaterThan(0);
      expect(eventEntries.length).toBeGreaterThan(0);
    });
  });

  /**
   * E6: Status history requires authorization
   *
   * Action (unauthenticated):
   * GET /services/any-service/status-log
   * (no Authorization header)
   *
   * Expected Result:
   * - HTTP 401 Unauthorized
   *
   * Action (with user token):
   * GET /services/<slug>/status-log
   * Authorization: Bearer <user-token>
   *
   * Expected Result:
   * - HTTP 403 Forbidden (user role insufficient, requires operator+)
   */
  test.describe('E6: Status history requires authorization', () => {
    test('unauthenticated returns 401', async ({ publicApi }) => {
      // Action: Try to get status log without auth
      const result = await publicApi.getServiceStatusLog('any-service');

      expect(result.status).toBe(401);
    });

    test('user role returns 403', async ({ userApi, api }) => {
      // Setup: Create a service first
      const svc = await api.createService({ name: uniqueSlug('test-svc') });

      // Try to access status log as user
      const result = await userApi.getServiceStatusLog(svc.slug);
      expect(result.status).toBe(403);
    });
  });
});
