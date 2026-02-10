/**
 * Event Deletion E2E Tests
 *
 * Group G: Deleting events and related data
 */

import { test, expect, uniqueSlug } from './fixtures';

test.describe('Event Deletion', () => {
  /**
   * G1: Cannot delete active event
   *
   * Setup:
   * - Active incident (status = "investigating")
   *
   * Action:
   * DELETE /events/<id>
   * Authorization: Bearer <admin-token>
   *
   * Expected Result:
   * - HTTP 409 Conflict
   * - Message: "cannot delete active event: resolve it first"
   */
  test.describe('G1: Cannot delete active event', () => {
    test('returns 409 Conflict', async ({ api }) => {
      // Setup
      const svc1 = await api.createService({ name: uniqueSlug('api-gateway') });

      const { id: eventId } = await api.createEvent({
        title: 'Active incident',
        type: 'incident',
        status: 'investigating',
        severity: 'major',
        description: 'Test',
        affected_services: [{ service_id: svc1.id, status: 'major_outage' }],
      });

      // Action: Try to delete active event
      const status = await api.deleteEvent(eventId);

      // Assertions
      expect(status).toBe(409);

      // Event still exists
      const event = await api.getEvent(eventId);
      expect(event).not.toBeNull();
    });
  });

  /**
   * G2: Delete resolved event
   *
   * Setup:
   * - Resolved incident (status = "resolved")
   * - Has event_updates
   * - Has records in event_service_changes
   * - Has records in service_status_log
   *
   * Action:
   * DELETE /events/<id>
   * Authorization: Bearer <admin-token>
   *
   * Expected Result:
   * 1. HTTP 204 No Content
   * 2. GET /events/<id> → 404 Not Found
   * 3. event_services deleted
   * 4. event_updates deleted
   * 5. event_service_changes deleted
   * 6. service_status_log entries with this event_id deleted
   */
  test.describe('G2: Delete resolved event', () => {
    test('event and related data deleted', async ({ api }) => {
      // Setup
      const svc1 = await api.createService({ name: uniqueSlug('api-gateway') });

      const { id: eventId } = await api.createEvent({
        title: 'Test incident',
        type: 'incident',
        status: 'investigating',
        severity: 'major',
        description: 'Test',
        affected_services: [{ service_id: svc1.id, status: 'major_outage' }],
      });

      // Add some updates
      await api.addEventUpdate(eventId, {
        status: 'identified',
        message: 'Root cause found',
      });

      // Resolve it
      await api.addEventUpdate(eventId, {
        status: 'resolved',
        message: 'Fixed',
      });

      // Verify event exists
      let event = await api.getEvent(eventId);
      expect(event).not.toBeNull();

      // Action: Delete event
      const status = await api.deleteEvent(eventId);

      // Assertions
      expect(status).toBe(204);

      // Event no longer exists
      event = await api.getEvent(eventId);
      expect(event).toBeNull();
    });
  });

  /**
   * G3: Delete event - service status unchanged
   *
   * Setup:
   * - Service api-gateway: effective_status = operational
   * - Resolved incident where api-gateway was major_outage
   *
   * Action:
   * Delete incident
   *
   * Expected Result:
   * - api-gateway: effective_status = operational (unchanged)
   */
  test.describe('G3: Delete event - service status unchanged', () => {
    test('service remains operational after event deletion', async ({ api }) => {
      // Setup
      const svc1 = await api.createService({ name: uniqueSlug('api-gateway') });

      const { id: eventId } = await api.createEvent({
        title: 'Test incident',
        type: 'incident',
        status: 'investigating',
        severity: 'major',
        description: 'Test',
        affected_services: [{ service_id: svc1.id, status: 'major_outage' }],
      });

      // Resolve it
      await api.addEventUpdate(eventId, {
        status: 'resolved',
        message: 'Fixed',
      });

      // Verify service is operational
      let apiService = await api.getService(svc1.slug);
      expect(apiService.effective_status).toBe('operational');

      // Action: Delete event
      const status = await api.deleteEvent(eventId);
      expect(status).toBe(204);

      // Assertions: Service still operational
      apiService = await api.getService(svc1.slug);
      expect(apiService.effective_status).toBe('operational');
    });
  });

  /**
   * G4: Delete requires admin role
   *
   * Action (with operator token):
   * DELETE /events/<id>
   * Authorization: Bearer <operator-token>
   *
   * Expected Result:
   * - HTTP 403 Forbidden
   */
  test.describe('G4: Delete requires admin role', () => {
    test('operator cannot delete events', async ({ operatorApi, api }) => {
      // Setup as admin
      const svc1 = await api.createService({ name: uniqueSlug('api-gateway') });

      const { id: eventId } = await api.createEvent({
        title: 'Test incident',
        type: 'incident',
        status: 'investigating',
        severity: 'major',
        description: 'Test',
        affected_services: [{ service_id: svc1.id, status: 'major_outage' }],
      });

      // Resolve it
      await api.addEventUpdate(eventId, {
        status: 'resolved',
        message: 'Fixed',
      });

      // Action: Try to delete as operator
      const status = await operatorApi.deleteEvent(eventId);

      // Assertions
      expect(status).toBe(403);

      // Event still exists
      const event = await api.getEvent(eventId);
      expect(event).not.toBeNull();
    });
  });
});
