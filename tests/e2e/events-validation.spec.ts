/**
 * Validation E2E Tests
 *
 * Group J: Input validation for events
 */

import { test, expect, uniqueSlug } from './fixtures';

test.describe('Validation', () => {
  /**
   * J1: Incident without severity
   *
   * Action:
   * POST /events
   * {
   *   "title": "Test incident",
   *   "type": "incident",
   *   "status": "investigating",
   *   "description": "Test"
   *   // severity is missing
   * }
   *
   * Expected Result:
   * - HTTP 400 Bad Request
   * - Error message indicates severity is required for incidents
   */
  test.describe('J1: Incident without severity', () => {
    test('returns 400 Bad Request', async ({ api }) => {
      const { status } = await api.createEvent({
        title: 'Test incident',
        type: 'incident',
        status: 'investigating',
        // severity is missing
        description: 'Test',
      });

      expect(status).toBe(400);
    });
  });

  /**
   * J2: Maintenance with severity
   *
   * Action:
   * POST /events
   * {
   *   "title": "Test maintenance",
   *   "type": "maintenance",
   *   "status": "scheduled",
   *   "severity": "major",  // Should be ignored for maintenance
   *   "description": "Test",
   *   "scheduled_start_at": "...",
   *   "scheduled_end_at": "..."
   * }
   *
   * Expected Result (one of):
   * - HTTP 201 Created (severity is ignored)
   * - HTTP 400 Bad Request (severity rejected for maintenance)
   *
   * Note: Actual behavior depends on backend implementation.
   * Severity field is not applicable to maintenance events.
   */
  test.describe('J2: Maintenance with severity', () => {
    test('severity is ignored for maintenance', async ({ api }) => {
      const svc = await api.createService({ name: uniqueSlug('test-svc') });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);

      // Backend should either ignore severity or return error
      // Testing what actually happens
      const { id: eventId, status } = await api.createEvent({
        title: 'Test maintenance',
        type: 'maintenance',
        status: 'scheduled',
        severity: 'major', // Should be ignored for maintenance
        description: 'Test',
        scheduled_start_at: tomorrow.toISOString(),
        scheduled_end_at: dayAfter.toISOString(),
        affected_services: [{ service_id: svc.id, status: 'maintenance' }],
      });

      // Either created successfully (severity ignored) or error
      // The actual behavior depends on backend implementation
      if (status === 201) {
        // Severity was ignored - that's fine
        const event = await api.getEvent(eventId);
        expect(event).not.toBeNull();
      } else {
        // Backend rejected - also fine
        expect(status).toBe(400);
      }
    });
  });

  /**
   * J3: Non-existent service_id
   *
   * Action:
   * POST /events
   * {
   *   "title": "Test incident",
   *   "type": "incident",
   *   "status": "investigating",
   *   "severity": "major",
   *   "description": "Test",
   *   "affected_services": [
   *     {"service_id": "00000000-0000-0000-0000-000000000000", "status": "degraded"}
   *   ]
   * }
   *
   * Expected Result:
   * - HTTP 400 Bad Request or HTTP 404 Not Found
   * - Error message indicates service does not exist
   */
  test.describe('J3: Non-existent service_id', () => {
    test('returns 400 or 404', async ({ api }) => {
      const fakeServiceId = '00000000-0000-0000-0000-000000000000';

      const { status } = await api.createEvent({
        title: 'Test incident',
        type: 'incident',
        status: 'investigating',
        severity: 'major',
        description: 'Test',
        affected_services: [{ service_id: fakeServiceId, status: 'degraded' }],
      });

      expect([400, 404]).toContain(status);
    });
  });

  /**
   * J4: Invalid service status
   *
   * Setup:
   * - Create service test-svc
   *
   * Action:
   * POST /events
   * {
   *   "title": "Test incident",
   *   "type": "incident",
   *   "status": "investigating",
   *   "severity": "major",
   *   "description": "Test",
   *   "affected_services": [
   *     {"service_id": "<test-svc-id>", "status": "invalid_status"}
   *   ]
   * }
   *
   * Expected Result:
   * - HTTP 400 Bad Request
   * - Error message indicates invalid service status
   * - Valid statuses: operational, maintenance, degraded, partial_outage, major_outage
   */
  test.describe('J4: Invalid service status', () => {
    test('returns 400 Bad Request', async ({ api }) => {
      const svc = await api.createService({ name: uniqueSlug('test-svc') });

      const { status } = await api.createEvent({
        title: 'Test incident',
        type: 'incident',
        status: 'investigating',
        severity: 'major',
        description: 'Test',
        affected_services: [{ service_id: svc.id, status: 'invalid_status' }],
      });

      expect(status).toBe(400);
    });
  });

  /**
   * J5: Invalid event status transition
   *
   * Test A - Incident cannot use maintenance status:
   *
   * Setup:
   * - Active incident (status = "investigating")
   *
   * Action:
   * POST /events/<id>/updates
   * {
   *   "status": "completed",  // This is for maintenance only
   *   "message": "Trying to complete incident"
   * }
   *
   * Expected Result:
   * - HTTP 400 Bad Request
   * - Incident statuses: investigating → identified → monitoring → resolved
   *
   * Test B - Maintenance cannot use incident status:
   *
   * Setup:
   * - Maintenance in progress (status = "in_progress")
   *
   * Action:
   * POST /events/<id>/updates
   * {
   *   "status": "resolved",  // This is for incidents only
   *   "message": "Trying to resolve maintenance"
   * }
   *
   * Expected Result:
   * - HTTP 400 Bad Request
   * - Maintenance statuses: scheduled → in_progress → completed (or cancelled)
   */
  test.describe('J5: Invalid event status transition', () => {
    test('incident cannot transition to completed', async ({ api }) => {
      const svc = await api.createService({ name: uniqueSlug('test-svc') });

      const { id: eventId } = await api.createEvent({
        title: 'Test incident',
        type: 'incident',
        status: 'investigating',
        severity: 'major',
        description: 'Test',
        affected_services: [{ service_id: svc.id, status: 'degraded' }],
      });

      // Try to use maintenance status for incident
      const { status } = await api.addEventUpdate(eventId, {
        status: 'completed', // This is for maintenance only
        message: 'Trying to complete incident',
      });

      expect(status).toBe(400);
    });

    test('maintenance cannot transition to resolved', async ({ api }) => {
      const svc = await api.createService({ name: uniqueSlug('test-svc') });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);

      const { id: eventId } = await api.createEvent({
        title: 'Test maintenance',
        type: 'maintenance',
        status: 'scheduled',
        description: 'Test',
        scheduled_start_at: tomorrow.toISOString(),
        scheduled_end_at: dayAfter.toISOString(),
        affected_services: [{ service_id: svc.id, status: 'maintenance' }],
      });

      // Start maintenance
      await api.addEventUpdate(eventId, {
        status: 'in_progress',
        message: 'Started',
      });

      // Try to use incident status for maintenance
      const { status } = await api.addEventUpdate(eventId, {
        status: 'resolved', // This is for incidents only
        message: 'Trying to resolve maintenance',
      });

      expect(status).toBe(400);
    });
  });

  /**
   * J6: Empty title
   *
   * Action:
   * POST /events
   * {
   *   "title": "",  // Empty title
   *   "type": "incident",
   *   "status": "investigating",
   *   "severity": "major",
   *   "description": "Test"
   * }
   *
   * Expected Result:
   * - HTTP 400 Bad Request
   * - Error message indicates title is required
   */
  test.describe('J6: Empty title', () => {
    test('returns 400 Bad Request', async ({ api }) => {
      const { status } = await api.createEvent({
        title: '', // Empty title
        type: 'incident',
        status: 'investigating',
        severity: 'major',
        description: 'Test',
      });

      expect(status).toBe(400);
    });
  });

  /**
   * J7: Empty update message
   *
   * Setup:
   * - Active incident
   *
   * Action:
   * POST /events/<id>/updates
   * {
   *   "status": "identified",
   *   "message": ""  // Empty message
   * }
   *
   * Expected Result:
   * - HTTP 400 Bad Request
   * - Error message indicates message is required for updates
   */
  test.describe('J7: Empty update message', () => {
    test('returns 400 Bad Request', async ({ api }) => {
      const svc = await api.createService({ name: uniqueSlug('test-svc') });

      const { id: eventId } = await api.createEvent({
        title: 'Test incident',
        type: 'incident',
        status: 'investigating',
        severity: 'major',
        description: 'Test',
        affected_services: [{ service_id: svc.id, status: 'degraded' }],
      });

      const { status } = await api.addEventUpdate(eventId, {
        status: 'identified',
        message: '', // Empty message
      });

      expect(status).toBe(400);
    });
  });
});
