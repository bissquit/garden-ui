/**
 * Events Lifecycle E2E Tests
 *
 * Group A: Incident Lifecycle
 * Group B: Maintenance Lifecycle
 */

import { test, expect, uniqueSlug } from './fixtures';

test.describe('Incident Lifecycle', () => {
  /**
   * A1: Create incident with service statuses
   *
   * Setup:
   * - Create service "api-gateway" (status: operational)
   * - Create service "auth-service" (status: operational)
   *
   * Action:
   * Create incident:
   * {
   *   "title": "API Performance Issues",
   *   "type": "incident",
   *   "status": "investigating",
   *   "severity": "major",
   *   "description": "Response times increased",
   *   "affected_services": [
   *     {"service_id": "<api-gateway-id>", "status": "partial_outage"},
   *     {"service_id": "<auth-service-id>", "status": "degraded"}
   *   ]
   * }
   *
   * Expected Result:
   * 1. Incident created, returns 201
   * 2. GET /services/api-gateway:
   *    - effective_status = "partial_outage"
   *    - has_active_events = true
   * 3. GET /services/auth-service:
   *    - effective_status = "degraded"
   *    - has_active_events = true
   * 4. GET /events/<id>:
   *    - service_ids contains both IDs
   *    - status = "investigating"
   */
  test.describe('A1: Create incident with service statuses', () => {
    test('services get effective_status from incident', async ({ api }) => {
      // Setup
      const svc1 = await api.createService({ name: uniqueSlug('api-gateway') });
      const svc2 = await api.createService({ name: uniqueSlug('auth-service') });

      // Action: Create incident with affected services
      const { id: eventId, status } = await api.createEvent({
        title: 'API Performance Issues',
        type: 'incident',
        status: 'investigating',
        severity: 'major',
        description: 'Response times increased',
        affected_services: [
          { service_id: svc1.id, status: 'partial_outage' },
          { service_id: svc2.id, status: 'degraded' },
        ],
      });

      // Assertions
      expect(status).toBe(201);

      const service1 = await api.getService(svc1.slug);
      expect(service1.effective_status).toBe('partial_outage');
      expect(service1.has_active_events).toBe(true);

      const service2 = await api.getService(svc2.slug);
      expect(service2.effective_status).toBe('degraded');
      expect(service2.has_active_events).toBe(true);

      const event = await api.getEvent(eventId);
      expect(event?.service_ids).toContain(svc1.id);
      expect(event?.service_ids).toContain(svc2.id);
      expect(event?.status).toBe('investigating');
    });
  });

  /**
   * A2: Create incident with service group
   *
   * Setup:
   * - Create group "backend-services"
   * - Create services "database", "cache", "queue" in this group (all operational)
   *
   * Action:
   * Create incident:
   * {
   *   "title": "Backend Infrastructure Issue",
   *   "type": "incident",
   *   "status": "investigating",
   *   "severity": "critical",
   *   "description": "Multiple backend services affected",
   *   "affected_groups": [
   *     {"group_id": "<backend-services-id>", "status": "major_outage"}
   *   ]
   * }
   *
   * Expected Result:
   * 1. Incident created
   * 2. ALL group services get effective_status = "major_outage":
   *    - GET /services/database → effective_status = "major_outage"
   *    - GET /services/cache → effective_status = "major_outage"
   *    - GET /services/queue → effective_status = "major_outage"
   * 3. GET /events/<id> contains all three service_ids
   */
  test.describe('A2: Create incident with group', () => {
    test('all group services get effective_status', async ({ api }) => {
      // Setup
      const group = await api.createGroup({ name: uniqueSlug('backend-services') });
      const svc1 = await api.createService({ name: uniqueSlug('database'), group_ids: [group.id] });
      const svc2 = await api.createService({ name: uniqueSlug('cache'), group_ids: [group.id] });
      const svc3 = await api.createService({ name: uniqueSlug('queue'), group_ids: [group.id] });

      // Action
      const { id: eventId, status } = await api.createEvent({
        title: 'Backend Infrastructure Issue',
        type: 'incident',
        status: 'investigating',
        severity: 'critical',
        description: 'Multiple backend services affected',
        affected_groups: [{ group_id: group.id, status: 'major_outage' }],
      });

      // Assertions
      expect(status).toBe(201);

      const service1 = await api.getService(svc1.slug);
      expect(service1.effective_status).toBe('major_outage');

      const service2 = await api.getService(svc2.slug);
      expect(service2.effective_status).toBe('major_outage');

      const service3 = await api.getService(svc3.slug);
      expect(service3.effective_status).toBe('major_outage');

      const event = await api.getEvent(eventId);
      expect(event?.service_ids?.length).toBe(3);
    });
  });

  /**
   * A3: Create incident - explicit service priority over group
   *
   * Setup:
   * - Group "backend" with services: database, cache
   * - Service database is also specified explicitly
   *
   * Action:
   * {
   *   "title": "Mixed selection test",
   *   "type": "incident",
   *   "status": "investigating",
   *   "severity": "major",
   *   "description": "Test",
   *   "affected_services": [
   *     {"service_id": "<database-id>", "status": "degraded"}
   *   ],
   *   "affected_groups": [
   *     {"group_id": "<backend-id>", "status": "major_outage"}
   *   ]
   * }
   *
   * Expected Result:
   * 1. database: effective_status = "degraded" (explicit priority)
   * 2. cache: effective_status = "major_outage" (from group)
   */
  test.describe('A3: Explicit service priority over group', () => {
    test('explicit service status takes priority', async ({ api }) => {
      // Setup
      const group = await api.createGroup({ name: uniqueSlug('backend') });
      const database = await api.createService({ name: uniqueSlug('database'), group_ids: [group.id] });
      const cache = await api.createService({ name: uniqueSlug('cache'), group_ids: [group.id] });

      // Action: database explicitly set to degraded, group to major_outage
      const { status } = await api.createEvent({
        title: 'Mixed selection test',
        type: 'incident',
        status: 'investigating',
        severity: 'major',
        description: 'Test',
        affected_services: [{ service_id: database.id, status: 'degraded' }],
        affected_groups: [{ group_id: group.id, status: 'major_outage' }],
      });

      expect(status).toBe(201);

      // database: explicit status takes priority
      const dbService = await api.getService(database.slug);
      expect(dbService.effective_status).toBe('degraded');

      // cache: from group
      const cacheService = await api.getService(cache.slug);
      expect(cacheService.effective_status).toBe('major_outage');
    });
  });

  /**
   * A4: Update incident - change service statuses
   *
   * Setup:
   * - Active incident with services api-gateway (partial_outage), auth-service (degraded)
   *
   * Action:
   * POST /events/<id>/updates
   * {
   *   "status": "identified",
   *   "message": "Root cause found",
   *   "service_updates": [
   *     {"service_id": "<api-gateway-id>", "status": "degraded"}
   *   ]
   * }
   *
   * Expected Result:
   * 1. Update created (201)
   * 2. Incident: status = "identified"
   * 3. api-gateway: effective_status = "degraded" (changed)
   * 4. auth-service: effective_status = "degraded" (unchanged)
   */
  test.describe('A4: Update incident - change service statuses', () => {
    test('service statuses are updated', async ({ api }) => {
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
          { service_id: svc1.id, status: 'partial_outage' },
          { service_id: svc2.id, status: 'degraded' },
        ],
      });

      // Action: Update api-gateway status
      const { status } = await api.addEventUpdate(eventId, {
        status: 'identified',
        message: 'Root cause found',
        service_updates: [{ service_id: svc1.id, status: 'degraded' }],
      });

      expect(status).toBe(201);

      // Assertions
      const event = await api.getEvent(eventId);
      expect(event?.status).toBe('identified');

      const service1 = await api.getService(svc1.slug);
      expect(service1.effective_status).toBe('degraded');

      const service2 = await api.getService(svc2.slug);
      expect(service2.effective_status).toBe('degraded');
    });
  });

  /**
   * A5: Update incident - add new services
   *
   * Setup:
   * - Active incident with api-gateway
   * - Service "database" exists, operational
   *
   * Action:
   * POST /events/<id>/updates
   * {
   *   "status": "identified",
   *   "message": "Database also affected",
   *   "add_services": [
   *     {"service_id": "<database-id>", "status": "major_outage"}
   *   ],
   *   "reason": "Investigation revealed database impact"
   * }
   *
   * Expected Result:
   * 1. database added to incident
   * 2. database: effective_status = "major_outage"
   * 3. GET /events/<id>/changes contains record about adding database
   */
  test.describe('A5: Update incident - add new services', () => {
    test('new service is added with status', async ({ api }) => {
      // Setup
      const svc1 = await api.createService({ name: uniqueSlug('api-gateway') });
      const database = await api.createService({ name: uniqueSlug('database') });

      const { id: eventId } = await api.createEvent({
        title: 'Test incident',
        type: 'incident',
        status: 'investigating',
        severity: 'major',
        description: 'Test',
        affected_services: [{ service_id: svc1.id, status: 'partial_outage' }],
      });

      // Action: Add database
      const { status } = await api.addEventUpdate(eventId, {
        status: 'identified',
        message: 'Database also affected',
        add_services: [{ service_id: database.id, status: 'major_outage' }],
        reason: 'Investigation revealed database impact',
      });

      expect(status).toBe(201);

      // Assertions
      const dbService = await api.getService(database.slug);
      expect(dbService.effective_status).toBe('major_outage');
      expect(dbService.has_active_events).toBe(true);

      const changes = await api.getEventChanges(eventId);
      const addedChange = changes.find(c => c.service_id === database.id && c.action === 'added');
      expect(addedChange).toBeDefined();
    });
  });

  /**
   * A6: Update incident - add group
   *
   * Setup:
   * - Active incident
   * - Group "frontend" with services website, mobile-app (both operational)
   *
   * Action:
   * POST /events/<id>/updates
   * {
   *   "status": "identified",
   *   "message": "Frontend also impacted",
   *   "add_groups": [
   *     {"group_id": "<frontend-id>", "status": "degraded"}
   *   ]
   * }
   *
   * Expected Result:
   * 1. website and mobile-app added to incident
   * 2. Both: effective_status = "degraded"
   * 3. GET /events/<id> contains group_id in list
   */
  test.describe('A6: Update incident - add group', () => {
    test('group services are added', async ({ api }) => {
      // Setup
      const svc1 = await api.createService({ name: uniqueSlug('api-gateway') });
      const group = await api.createGroup({ name: uniqueSlug('frontend') });
      const website = await api.createService({ name: uniqueSlug('website'), group_ids: [group.id] });
      const mobileApp = await api.createService({ name: uniqueSlug('mobile-app'), group_ids: [group.id] });

      const { id: eventId } = await api.createEvent({
        title: 'Test incident',
        type: 'incident',
        status: 'investigating',
        severity: 'major',
        description: 'Test',
        affected_services: [{ service_id: svc1.id, status: 'partial_outage' }],
      });

      // Action: Add frontend group
      const { status } = await api.addEventUpdate(eventId, {
        status: 'identified',
        message: 'Frontend also impacted',
        add_groups: [{ group_id: group.id, status: 'degraded' }],
      });

      expect(status).toBe(201);

      // Assertions
      const websiteService = await api.getService(website.slug);
      expect(websiteService.effective_status).toBe('degraded');

      const mobileService = await api.getService(mobileApp.slug);
      expect(mobileService.effective_status).toBe('degraded');

      const event = await api.getEvent(eventId);
      expect(event?.group_ids).toContain(group.id);
    });
  });

  /**
   * A7: Update incident - remove service
   *
   * Setup:
   * - Active incident with services: api-gateway, auth-service, database
   *
   * Action:
   * POST /events/<id>/updates
   * {
   *   "status": "monitoring",
   *   "message": "Auth service was not affected",
   *   "remove_service_ids": ["<auth-service-id>"],
   *   "reason": "Incorrectly added"
   * }
   *
   * Expected Result:
   * 1. auth-service removed from incident
   * 2. auth-service: effective_status = "operational" (if no other events)
   * 3. auth-service: has_active_events = false
   * 4. GET /events/<id>/changes contains removal record
   */
  test.describe('A7: Update incident - remove service', () => {
    test('removed service returns to operational', async ({ api }) => {
      // Setup
      const svc1 = await api.createService({ name: uniqueSlug('api-gateway') });
      const svc2 = await api.createService({ name: uniqueSlug('auth-service') });
      const database = await api.createService({ name: uniqueSlug('database') });

      const { id: eventId } = await api.createEvent({
        title: 'Test incident',
        type: 'incident',
        status: 'investigating',
        severity: 'major',
        description: 'Test',
        affected_services: [
          { service_id: svc1.id, status: 'partial_outage' },
          { service_id: svc2.id, status: 'degraded' },
          { service_id: database.id, status: 'major_outage' },
        ],
      });

      // Action: Remove auth-service
      const { status } = await api.addEventUpdate(eventId, {
        status: 'monitoring',
        message: 'Auth service was not affected',
        remove_service_ids: [svc2.id],
        reason: 'Incorrectly added',
      });

      expect(status).toBe(201);

      // Assertions
      const authService = await api.getService(svc2.slug);
      expect(authService.effective_status).toBe('operational');
      expect(authService.has_active_events).toBe(false);

      const changes = await api.getEventChanges(eventId);
      const removedChange = changes.find(c => c.service_id === svc2.id && c.action === 'removed');
      expect(removedChange).toBeDefined();
    });
  });

  /**
   * A8: Partial recovery - service operational while incident active
   *
   * Setup:
   * - Active incident with api-gateway (major_outage), database (major_outage)
   *
   * Action:
   * POST /events/<id>/updates
   * {
   *   "status": "monitoring",
   *   "message": "API Gateway recovered",
   *   "service_updates": [
   *     {"service_id": "<api-gateway-id>", "status": "operational"}
   *   ]
   * }
   *
   * Expected Result:
   * 1. api-gateway: effective_status = "operational"
   * 2. api-gateway REMAINS in incident (service_ids still contains it)
   * 3. database: effective_status = "major_outage"
   * 4. Incident: status = "monitoring" (still active)
   */
  test.describe('A8: Partial recovery - service operational but incident active', () => {
    test('service can be operational while remaining in incident', async ({ api }) => {
      // Setup
      const svc1 = await api.createService({ name: uniqueSlug('api-gateway') });
      const database = await api.createService({ name: uniqueSlug('database') });

      const { id: eventId } = await api.createEvent({
        title: 'Test incident',
        type: 'incident',
        status: 'investigating',
        severity: 'major',
        description: 'Test',
        affected_services: [
          { service_id: svc1.id, status: 'major_outage' },
          { service_id: database.id, status: 'major_outage' },
        ],
      });

      // Action: Set api-gateway to operational
      const { status } = await api.addEventUpdate(eventId, {
        status: 'monitoring',
        message: 'API Gateway recovered',
        service_updates: [{ service_id: svc1.id, status: 'operational' }],
      });

      expect(status).toBe(201);

      // Assertions
      const apiService = await api.getService(svc1.slug);
      expect(apiService.effective_status).toBe('operational');

      // Service still in incident
      const event = await api.getEvent(eventId);
      expect(event?.service_ids).toContain(svc1.id);
      expect(event?.status).toBe('monitoring');

      // Database still affected
      const dbService = await api.getService(database.slug);
      expect(dbService.effective_status).toBe('major_outage');
    });
  });

  /**
   * A9: Close incident
   *
   * Setup:
   * - Active incident with api-gateway (degraded), database (partial_outage)
   *
   * Action:
   * POST /events/<id>/updates
   * {
   *   "status": "resolved",
   *   "message": "All services recovered"
   * }
   *
   * Expected Result:
   * 1. Incident: status = "resolved", resolved_at is set
   * 2. api-gateway:
   *    - stored_status = "operational"
   *    - effective_status = "operational"
   *    - has_active_events = false
   * 3. database:
   *    - stored_status = "operational"
   *    - effective_status = "operational"
   *    - has_active_events = false
   */
  test.describe('A9: Close incident', () => {
    test('all services return to operational', async ({ api }) => {
      // Setup
      const svc1 = await api.createService({ name: uniqueSlug('api-gateway') });
      const database = await api.createService({ name: uniqueSlug('database') });

      const { id: eventId } = await api.createEvent({
        title: 'Test incident',
        type: 'incident',
        status: 'investigating',
        severity: 'major',
        description: 'Test',
        affected_services: [
          { service_id: svc1.id, status: 'degraded' },
          { service_id: database.id, status: 'partial_outage' },
        ],
      });

      // Action: Resolve incident
      const { status } = await api.addEventUpdate(eventId, {
        status: 'resolved',
        message: 'All services recovered',
      });

      expect(status).toBe(201);

      // Assertions
      const event = await api.getEvent(eventId);
      expect(event?.status).toBe('resolved');
      expect(event?.resolved_at).not.toBeNull();

      const apiService = await api.getService(svc1.slug);
      expect(apiService.status).toBe('operational');
      expect(apiService.effective_status).toBe('operational');
      expect(apiService.has_active_events).toBe(false);

      const dbService = await api.getService(database.slug);
      expect(dbService.status).toBe('operational');
      expect(dbService.effective_status).toBe('operational');
      expect(dbService.has_active_events).toBe(false);
    });
  });

  /**
   * A10: Close incident when another is active
   *
   * Setup:
   * - Incident A: api-gateway (major_outage) — active
   * - Incident B: api-gateway (degraded) — active
   *
   * Action:
   * Close incident A:
   * POST /events/<incident-A-id>/updates
   * {
   *   "status": "resolved",
   *   "message": "Resolved"
   * }
   *
   * Expected Result:
   * 1. Incident A: status = "resolved"
   * 2. api-gateway:
   *    - effective_status = "degraded" (from incident B, worst-case)
   *    - has_active_events = true
   * 3. stored_status NOT changed to operational (another active exists)
   */
  test.describe('A10: Close incident with another active', () => {
    test('service status recalculated from remaining incident', async ({ api }) => {
      // Setup
      const svc1 = await api.createService({ name: uniqueSlug('api-gateway') });

      // Create two incidents on same service
      const { id: incidentA } = await api.createEvent({
        title: 'Incident A',
        type: 'incident',
        status: 'investigating',
        severity: 'major',
        description: 'Test A',
        affected_services: [{ service_id: svc1.id, status: 'major_outage' }],
      });

      const { id: incidentB } = await api.createEvent({
        title: 'Incident B',
        type: 'incident',
        status: 'investigating',
        severity: 'minor',
        description: 'Test B',
        affected_services: [{ service_id: svc1.id, status: 'degraded' }],
      });

      // Action: Close incident A
      const { status } = await api.addEventUpdate(incidentA, {
        status: 'resolved',
        message: 'Resolved',
      });

      expect(status).toBe(201);

      // Assertions
      const eventA = await api.getEvent(incidentA);
      expect(eventA?.status).toBe('resolved');

      // Service still affected by incident B
      const apiService = await api.getService(svc1.slug);
      expect(apiService.effective_status).toBe('degraded');
      expect(apiService.has_active_events).toBe(true);

      // Cleanup: close incident B
      await api.addEventUpdate(incidentB, {
        status: 'resolved',
        message: 'Resolved',
      });
    });
  });

  /**
   * A11: Cannot update resolved incident
   *
   * Setup:
   * - Resolved incident (status = "resolved")
   *
   * Action:
   * POST /events/<id>/updates
   * {
   *   "status": "monitoring",
   *   "message": "Trying to reopen"
   * }
   *
   * Expected Result:
   * - HTTP 409 Conflict
   * - Message: "cannot update resolved event"
   */
  test.describe('A11: Cannot update resolved incident', () => {
    test('returns 409 Conflict', async ({ api }) => {
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

      // Close it
      await api.addEventUpdate(eventId, {
        status: 'resolved',
        message: 'Resolved',
      });

      // Action: Try to update resolved incident
      const { status, error } = await api.addEventUpdate(eventId, {
        status: 'monitoring',
        message: 'Trying to reopen',
      });

      expect(status).toBe(409);
      expect(error).toContain('resolved');
    });
  });
});

test.describe('Maintenance Lifecycle', () => {
  /**
   * B1: Create scheduled maintenance - statuses unchanged
   *
   * Setup:
   * - Service database (operational)
   *
   * Action:
   * {
   *   "title": "Database Migration",
   *   "type": "maintenance",
   *   "status": "scheduled",
   *   "description": "Planned migration",
   *   "scheduled_start_at": "<future date>",
   *   "scheduled_end_at": "<future date + 4 hours>",
   *   "affected_services": [
   *     {"service_id": "<database-id>", "status": "maintenance"}
   *   ]
   * }
   *
   * Expected Result:
   * 1. Maintenance created
   * 2. database:
   *    - effective_status = "operational" (NOT maintenance!)
   *    - has_active_events = false (scheduled is not considered active)
   */
  test.describe('B1: Create scheduled maintenance - statuses unchanged', () => {
    test('service status stays operational for scheduled maintenance', async ({ api }) => {
      // Setup
      const database = await api.createService({ name: uniqueSlug('database') });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);

      // Action: Create scheduled maintenance
      const { id: eventId, status } = await api.createEvent({
        title: 'Database Migration',
        type: 'maintenance',
        status: 'scheduled',
        description: 'Planned migration',
        scheduled_start_at: tomorrow.toISOString(),
        scheduled_end_at: dayAfter.toISOString(),
        affected_services: [{ service_id: database.id, status: 'maintenance' }],
      });

      expect(status).toBe(201);

      // Assertions: status should NOT change for scheduled maintenance
      const dbService = await api.getService(database.slug);
      expect(dbService.effective_status).toBe('operational');
      expect(dbService.has_active_events).toBe(false);
    });
  });

  /**
   * B2: Start maintenance (scheduled -> in_progress)
   *
   * Setup:
   * - Scheduled maintenance with database
   *
   * Action:
   * POST /events/<id>/updates
   * {
   *   "status": "in_progress",
   *   "message": "Maintenance started"
   * }
   *
   * Expected Result:
   * 1. Maintenance: status = "in_progress"
   * 2. database:
   *    - effective_status = "maintenance"
   *    - has_active_events = true
   */
  test.describe('B2: Start maintenance (scheduled -> in_progress)', () => {
    test('service status changes to maintenance', async ({ api }) => {
      // Setup
      const database = await api.createService({ name: uniqueSlug('database') });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);

      const { id: eventId } = await api.createEvent({
        title: 'Database Migration',
        type: 'maintenance',
        status: 'scheduled',
        description: 'Planned migration',
        scheduled_start_at: tomorrow.toISOString(),
        scheduled_end_at: dayAfter.toISOString(),
        affected_services: [{ service_id: database.id, status: 'maintenance' }],
      });

      // Action: Start maintenance
      const { status } = await api.addEventUpdate(eventId, {
        status: 'in_progress',
        message: 'Maintenance started',
      });

      expect(status).toBe(201);

      // Assertions
      const event = await api.getEvent(eventId);
      expect(event?.status).toBe('in_progress');

      const dbService = await api.getService(database.slug);
      expect(dbService.effective_status).toBe('maintenance');
      expect(dbService.has_active_events).toBe(true);
    });
  });

  /**
   * B3: Complete maintenance
   *
   * Setup:
   * - Maintenance in_progress with database (maintenance)
   *
   * Action:
   * POST /events/<id>/updates
   * {
   *   "status": "completed",
   *   "message": "Migration completed"
   * }
   *
   * Expected Result:
   * 1. Maintenance: status = "completed", resolved_at is set
   * 2. database:
   *    - stored_status = "operational"
   *    - effective_status = "operational"
   *    - has_active_events = false
   */
  test.describe('B3: Complete maintenance', () => {
    test('service returns to operational', async ({ api }) => {
      // Setup
      const database = await api.createService({ name: uniqueSlug('database') });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);

      const { id: eventId } = await api.createEvent({
        title: 'Database Migration',
        type: 'maintenance',
        status: 'scheduled',
        description: 'Planned migration',
        scheduled_start_at: tomorrow.toISOString(),
        scheduled_end_at: dayAfter.toISOString(),
        affected_services: [{ service_id: database.id, status: 'maintenance' }],
      });

      // Start maintenance
      await api.addEventUpdate(eventId, {
        status: 'in_progress',
        message: 'Maintenance started',
      });

      // Action: Complete maintenance
      const { status } = await api.addEventUpdate(eventId, {
        status: 'completed',
        message: 'Migration completed',
      });

      expect(status).toBe(201);

      // Assertions
      const event = await api.getEvent(eventId);
      expect(event?.status).toBe('completed');
      expect(event?.resolved_at).not.toBeNull();

      const dbService = await api.getService(database.slug);
      expect(dbService.status).toBe('operational');
      expect(dbService.effective_status).toBe('operational');
      expect(dbService.has_active_events).toBe(false);
    });
  });

  /**
   * B4: Scheduled maintenance + active incident
   *
   * Setup:
   * - Active incident: api-gateway (major_outage)
   * - Create scheduled maintenance with api-gateway
   *
   * Action:
   * Create scheduled maintenance
   *
   * Expected Result:
   * 1. api-gateway: effective_status = "major_outage" (incident, NOT scheduled)
   * 2. Move maintenance to in_progress
   * 3. api-gateway: effective_status = "major_outage" (worst-case: 4 > 1)
   */
  test.describe('B4: Scheduled maintenance + active incident', () => {
    test('incident status takes precedence', async ({ api }) => {
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

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);

      // Create scheduled maintenance
      const { id: maintId } = await api.createEvent({
        title: 'Scheduled maintenance',
        type: 'maintenance',
        status: 'scheduled',
        description: 'Test',
        scheduled_start_at: tomorrow.toISOString(),
        scheduled_end_at: dayAfter.toISOString(),
        affected_services: [{ service_id: svc1.id, status: 'maintenance' }],
      });

      // Service should show incident status, not scheduled
      let apiService = await api.getService(svc1.slug);
      expect(apiService.effective_status).toBe('major_outage');

      // Start maintenance
      await api.addEventUpdate(maintId, {
        status: 'in_progress',
        message: 'Maintenance started',
      });

      // Major outage > maintenance (priority)
      apiService = await api.getService(svc1.slug);
      expect(apiService.effective_status).toBe('major_outage');
    });
  });
});
