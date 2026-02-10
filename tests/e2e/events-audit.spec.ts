/**
 * Audit and Logging E2E Tests
 *
 * Group H: Service status logs and event service changes
 */

import { test, expect, uniqueSlug } from './fixtures';

test.describe('Audit and Logging', () => {
  /**
   * H1: Status log on event creation
   *
   * Action:
   * Create incident with api-gateway
   *
   * Expected Result:
   * GET /services/api-gateway/status-log contains:
   * - source_type = "event"
   * - event_id = <incident id>
   * - old_status = "operational"
   * - new_status = <status from affected_services>
   */
  test.describe('H1: Status log on event creation', () => {
    test('creates status log entry with event source', async ({ api }) => {
      // Setup
      const svc1 = await api.createService({ name: uniqueSlug('api-gateway') });

      // Action: Create incident
      const { id: eventId } = await api.createEvent({
        title: 'Test incident',
        type: 'incident',
        status: 'investigating',
        severity: 'major',
        description: 'Test',
        affected_services: [{ service_id: svc1.id, status: 'partial_outage' }],
      });

      // Assertions
      const logResult = await api.getServiceStatusLog(svc1.slug);
      expect(logResult.status).toBe(200);

      const eventEntry = logResult.entries?.find(
        e => e.source_type === 'event' && e.event_id === eventId
      );
      expect(eventEntry).toBeDefined();
      expect(eventEntry?.old_status).toBe('operational');
      expect(eventEntry?.new_status).toBe('partial_outage');
    });
  });

  /**
   * H2: Status log on status update in event
   *
   * Action:
   * Update service status in incident
   *
   * Expected Result:
   * New entry in status-log with status change
   */
  test.describe('H2: Status log on status update in event', () => {
    test('creates log entry for status change', async ({ api }) => {
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

      // Action: Update service status in event
      await api.addEventUpdate(eventId, {
        status: 'identified',
        message: 'Root cause found',
        service_updates: [{ service_id: svc1.id, status: 'degraded' }],
      });

      // Assertions
      const logResult = await api.getServiceStatusLog(svc1.slug);
      expect(logResult.status).toBe(200);

      // Should have entries for both initial and update
      const eventEntries = logResult.entries?.filter(e => e.source_type === 'event');
      expect(eventEntries?.length).toBeGreaterThanOrEqual(2);

      // Find the update entry
      const updateEntry = eventEntries?.find(
        e => e.old_status === 'major_outage' && e.new_status === 'degraded'
      );
      expect(updateEntry).toBeDefined();
    });
  });

  /**
   * H3: Status log on event closure
   *
   * Action:
   * Close incident
   *
   * Expected Result:
   * Entry in status-log:
   * - new_status = "operational"
   * - reason contains information about event closure
   */
  test.describe('H3: Status log on event closure', () => {
    test('creates log entry for closure', async ({ api }) => {
      // Setup
      const svc1 = await api.createService({ name: uniqueSlug('api-gateway') });

      const { id: eventId } = await api.createEvent({
        title: 'Test incident',
        type: 'incident',
        status: 'investigating',
        severity: 'major',
        description: 'Test',
        affected_services: [{ service_id: svc1.id, status: 'degraded' }],
      });

      // Action: Close incident
      await api.addEventUpdate(eventId, {
        status: 'resolved',
        message: 'All fixed',
      });

      // Assertions
      const logResult = await api.getServiceStatusLog(svc1.slug);
      expect(logResult.status).toBe(200);

      // Find the closure entry
      const closureEntry = logResult.entries?.find(
        e => e.new_status === 'operational' && e.source_type === 'event'
      );
      expect(closureEntry).toBeDefined();
    });
  });

  /**
   * H4: Event service changes on service addition
   *
   * Action:
   * Add service to incident through update
   *
   * Expected Result:
   * GET /events/<id>/changes contains:
   * - action = "added"
   * - service_id = <added service>
   * - reason = <specified reason>
   */
  test.describe('H4: Event service changes on service addition', () => {
    test('records added action with reason', async ({ api }) => {
      // Setup
      const svc1 = await api.createService({ name: uniqueSlug('api-gateway') });
      const database = await api.createService({ name: uniqueSlug('database') });

      const { id: eventId } = await api.createEvent({
        title: 'Test incident',
        type: 'incident',
        status: 'investigating',
        severity: 'major',
        description: 'Test',
        affected_services: [{ service_id: svc1.id, status: 'major_outage' }],
      });

      // Action: Add database to event
      await api.addEventUpdate(eventId, {
        status: 'identified',
        message: 'Database also affected',
        add_services: [{ service_id: database.id, status: 'partial_outage' }],
        reason: 'Investigation revealed database impact',
      });

      // Assertions
      const changes = await api.getEventChanges(eventId);
      const addedChange = changes.find(
        c => c.service_id === database.id && c.action === 'added'
      );
      expect(addedChange).toBeDefined();
      expect(addedChange?.reason).toBe('Investigation revealed database impact');
    });
  });

  /**
   * H5: Event service changes on service removal
   *
   * Action:
   * Remove service from incident through update
   *
   * Expected Result:
   * GET /events/<id>/changes contains:
   * - action = "removed"
   * - service_id = <removed service>
   */
  test.describe('H5: Event service changes on service removal', () => {
    test('records removed action', async ({ api }) => {
      // Setup
      const svc1 = await api.createService({ name: uniqueSlug('api-gateway') });
      const svc2 = await api.createService({ name: uniqueSlug('auth-service') });

      const { id: eventId } = await api.createEvent({
        title: 'Test incident',
        type: 'incident',
        status: 'investigating',
        severity: 'major',
        description: 'Test',
        affected_services: [
          { service_id: svc1.id, status: 'major_outage' },
          { service_id: svc2.id, status: 'degraded' },
        ],
      });

      // Action: Remove auth-service
      await api.addEventUpdate(eventId, {
        status: 'monitoring',
        message: 'Auth service not affected',
        remove_service_ids: [svc2.id],
        reason: 'False positive',
      });

      // Assertions
      const changes = await api.getEventChanges(eventId);
      const removedChange = changes.find(
        c => c.service_id === svc2.id && c.action === 'removed'
      );
      expect(removedChange).toBeDefined();
    });
  });
});
