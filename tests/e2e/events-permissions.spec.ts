/**
 * Permissions E2E Tests
 *
 * Group I: Access control for event operations
 */

import { test, expect, uniqueSlug } from './fixtures';

test.describe('Permissions', () => {
  /**
   * I1: Event creation requires operator+
   *
   * Action (unauthenticated):
   * POST /events
   * (no Authorization header)
   * { "title": "Test", "type": "incident", ... }
   *
   * Expected Result:
   * - HTTP 401 Unauthorized
   *
   * Action (with user token):
   * POST /events
   * Authorization: Bearer <user-token>
   * { "title": "Test", "type": "incident", ... }
   *
   * Expected Result:
   * - HTTP 403 Forbidden
   *
   * Action (with operator token):
   * POST /events
   * Authorization: Bearer <operator-token>
   * { "title": "Test", "type": "incident", ... }
   *
   * Expected Result:
   * - HTTP 201 Created
   */
  test.describe('I1: Event creation requires operator+', () => {
    test('unauthenticated returns 401', async ({ publicApi }) => {
      const { status } = await publicApi.rawPost('/api/v1/events', {
        title: 'Test',
        type: 'incident',
        status: 'investigating',
        severity: 'major',
        description: 'Test',
      });

      expect(status).toBe(401);
    });

    test('user role returns 403', async ({ userApi }) => {
      const { status } = await userApi.rawPost('/api/v1/events', {
        title: 'Test',
        type: 'incident',
        status: 'investigating',
        severity: 'major',
        description: 'Test',
      });

      expect(status).toBe(403);
    });

    test('operator can create events', async ({ operatorApi }) => {
      const svc = await operatorApi.createService({ name: uniqueSlug('test-svc') });

      const { status } = await operatorApi.createEvent({
        title: 'Operator created incident',
        type: 'incident',
        status: 'investigating',
        severity: 'minor',
        description: 'Test',
        affected_services: [{ service_id: svc.id, status: 'degraded' }],
      });

      expect(status).toBe(201);
    });
  });

  /**
   * I2: Event reading is public
   *
   * Setup:
   * - Create an incident as admin
   *
   * Action (unauthenticated):
   * 1. GET /events
   * 2. GET /events/<id>
   * 3. GET /events/<id>/updates
   * 4. GET /events/<id>/changes
   * 5. GET /services/<slug>/events
   *
   * Expected Result:
   * - All endpoints return HTTP 200
   * - Event data is accessible without authentication
   * - Public users can view all event information
   */
  test.describe('I2: Event reading is public', () => {
    test('events list is public', async ({ api, publicApi }) => {
      // Setup: Create an event as admin
      const svc = await api.createService({ name: uniqueSlug('test-svc') });
      await api.createEvent({
        title: 'Public incident',
        type: 'incident',
        status: 'investigating',
        severity: 'minor',
        description: 'Test',
        affected_services: [{ service_id: svc.id, status: 'degraded' }],
      });

      // Action: Read as public
      const { status } = await publicApi.rawGet('/api/v1/events');
      expect(status).toBe(200);
    });

    test('event details are public', async ({ api, publicApi }) => {
      const svc = await api.createService({ name: uniqueSlug('test-svc') });
      const { id: eventId } = await api.createEvent({
        title: 'Public incident',
        type: 'incident',
        status: 'investigating',
        severity: 'minor',
        description: 'Test',
        affected_services: [{ service_id: svc.id, status: 'degraded' }],
      });

      const { status } = await publicApi.rawGet(`/api/v1/events/${eventId}`);
      expect(status).toBe(200);
    });

    test('event updates are public', async ({ api, publicApi }) => {
      const svc = await api.createService({ name: uniqueSlug('test-svc') });
      const { id: eventId } = await api.createEvent({
        title: 'Public incident',
        type: 'incident',
        status: 'investigating',
        severity: 'minor',
        description: 'Test',
        affected_services: [{ service_id: svc.id, status: 'degraded' }],
      });

      const { status } = await publicApi.rawGet(`/api/v1/events/${eventId}/updates`);
      expect(status).toBe(200);
    });

    test('event changes are public', async ({ api, publicApi }) => {
      const svc = await api.createService({ name: uniqueSlug('test-svc') });
      const { id: eventId } = await api.createEvent({
        title: 'Public incident',
        type: 'incident',
        status: 'investigating',
        severity: 'minor',
        description: 'Test',
        affected_services: [{ service_id: svc.id, status: 'degraded' }],
      });

      const { status } = await publicApi.rawGet(`/api/v1/events/${eventId}/changes`);
      expect(status).toBe(200);
    });

    test('service events are public', async ({ api, publicApi }) => {
      const svc = await api.createService({ name: uniqueSlug('test-svc') });
      await api.createEvent({
        title: 'Public incident',
        type: 'incident',
        status: 'investigating',
        severity: 'minor',
        description: 'Test',
        affected_services: [{ service_id: svc.id, status: 'degraded' }],
      });

      const { status } = await publicApi.rawGet(`/api/v1/services/${svc.slug}/events`);
      expect(status).toBe(200);
    });
  });

  /**
   * I3: Event deletion requires admin
   *
   * Setup:
   * - Resolved incident
   *
   * Action (with operator token):
   * DELETE /events/<id>
   * Authorization: Bearer <operator-token>
   *
   * Expected Result:
   * - HTTP 403 Forbidden
   * - Event still exists
   *
   * Action (with admin token):
   * DELETE /events/<id>
   * Authorization: Bearer <admin-token>
   *
   * Expected Result:
   * - HTTP 204 No Content
   * - Event is deleted
   */
  test.describe('I3: Event deletion requires admin', () => {
    test('operator cannot delete', async ({ api, operatorApi }) => {
      // Setup as admin
      const svc = await api.createService({ name: uniqueSlug('test-svc') });
      const { id: eventId } = await api.createEvent({
        title: 'Test incident',
        type: 'incident',
        status: 'investigating',
        severity: 'minor',
        description: 'Test',
        affected_services: [{ service_id: svc.id, status: 'degraded' }],
      });

      // Resolve it
      await api.addEventUpdate(eventId, {
        status: 'resolved',
        message: 'Fixed',
      });

      // Try to delete as operator
      const status = await operatorApi.deleteEvent(eventId);
      expect(status).toBe(403);
    });

    test('admin can delete', async ({ api }) => {
      const svc = await api.createService({ name: uniqueSlug('test-svc') });
      const { id: eventId } = await api.createEvent({
        title: 'Test incident',
        type: 'incident',
        status: 'investigating',
        severity: 'minor',
        description: 'Test',
        affected_services: [{ service_id: svc.id, status: 'degraded' }],
      });

      // Resolve it
      await api.addEventUpdate(eventId, {
        status: 'resolved',
        message: 'Fixed',
      });

      // Delete as admin
      const status = await api.deleteEvent(eventId);
      expect(status).toBe(204);
    });
  });
});
