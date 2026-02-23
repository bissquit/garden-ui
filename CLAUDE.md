# CLAUDE.md — Garden UI

## AFTER ANY CODE CHANGE

```
1. Update CODEMAP — add new files/components
2. Update STATUS — if a task/phase is completed
3. npm run verify — must pass
4. This file = single source of truth for the project
```

---

## 1. QUICK REFERENCE

```bash
npm run dev              # Dev server :3000
npm run verify           # lint + typecheck + test:coverage + build (CI parity)
npm run test:run         # Unit/Integration
npm run test:e2e         # E2E Playwright (headless)
npm run test:e2e:ui      # E2E Playwright with interactive UI
npm run test:e2e:headed  # E2E Playwright with browser
npm run api:update       # Download OpenAPI spec from backend
npm run api:generate     # Generate TypeScript types
```

**Backend:** https://github.com/bissquit/incident-garden
**Compatibility:** Frontend 1.5.0 ↔ Backend >= 2.11.0
**ENV:** `NEXT_PUBLIC_API_URL=http://localhost:8080`

### Default Accounts (pre-seeded by backend migrations)

| Role     | Email                  | Password  |
|----------|------------------------|-----------|
| admin    | admin@example.com      | admin123  |
| operator | operator@example.com   | admin123  |
| user     | user@example.com       | user123   |

### Test Environment

```bash
# Up:
JWT_SECRET_KEY=qwertyuiopasdfghjklzxcvbnmqwertyuioasdfghjklxcvbnm \
  docker compose up -d

# Down + cleanup:
JWT_SECRET_KEY=qwertyuiopasdfghjklzxcvbnmqwertyuioasdfghjklxcvbnm \
  docker compose down && \
  docker volume rm garden-ui_migrations garden-ui_postgres_data && \
  docker image rm garden-ui-frontend:latest ghcr.io/bissquit/incident-garden:latest
```

---

## 2. CODEMAP

```
src/
├── api/
│   ├── client.ts              # publicClient, apiClient (both with credentials: 'include')
│   ├── openapi.yaml           # OpenAPI spec (source: backend)
│   └── types.generated.ts     # DO NOT EDIT - generated types
│
├── app/                       # Next.js 14 App Router
│   ├── (public)/              # SSR pages (no auth)
│   │   ├── page.tsx           # Status page
│   │   ├── history/page.tsx   # History (7 days)
│   │   └── events/[id]/page.tsx  # Public event details + timeline
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── dashboard/             # Protected (operator/admin only)
│   │   ├── layout.tsx         # Guard: operator+ required
│   │   ├── page.tsx           # Overview
│   │   ├── services/page.tsx  # CRUD services (tags edited in dialog)
│   │   ├── groups/page.tsx    # CRUD groups
│   │   ├── events/page.tsx    # Events list + filters
│   │   ├── events/[id]/page.tsx  # Event detail + timeline
│   │   └── templates/page.tsx # CRUD templates
│   └── settings/              # Protected (any authenticated user)
│       ├── layout.tsx         # Guard: any role
│       └── page.tsx           # Profile, Channels, Subscriptions
│
├── components/
│   ├── ui/                    # shadcn/ui primitives
│   ├── layout/                # header, footer, dashboard-sidebar, theme-switcher
│   └── features/
│       ├── auth/              # LoginForm
│       ├── status/            # OverallStatusBanner, ServiceList, ServiceItem,
│       │                      # ActiveIncidents, ScheduledMaintenance, EventCard,
│       │                      # HistoryList, HistoryDayGroup
│       ├── events/            # Shared event components (used by public + dashboard)
│       │                      # EventDetailsCard, EventUnifiedTimeline
│       └── dashboard/         # DataTable, EmptyState, DeleteConfirmationDialog,
│                              # ServicesTable (with active events indicator), ServiceForm, ServiceFormDialog,
│                              # ActiveEventsWarning (warning for services with active events),
│                              # GroupsTable, GroupForm, GroupFormDialog,
│                              # EventsTable, EventsFilters, EventForm, EventFormDialog,
│                              # EventServicesManager, EventUpdateForm (with service management),
│                              # CurrentServiceEditor, AddServicesSection,
│                              # ServiceStatusSelector, GroupStatusSelector,
│                              # TemplatesTable, TemplateForm, TemplateFormDialog,
│                              # ChannelsTable, ChannelForm, ChannelFormDialog,
│                              # VerifyEmailDialog,
│                              # SubscriptionEditor (matrix view: channels × services, service search/filter)
│
├── hooks/
│   ├── use-auth.tsx           # Auth context: login, logout, hasRole, hasMinRole
│   ├── use-public-status.ts   # useServices, useGroups, usePublicStatus, useStatusHistory
│   ├── use-public-events.ts   # usePublicEvent, usePublicEventUpdates, usePublicEventChanges
│   ├── use-services-mutations.ts  # useCreateService, useUpdateService, useDeleteService, useRestoreService
│   ├── use-service-tags.ts    # useServiceTags, useUpdateServiceTags
│   ├── use-groups-mutations.ts    # useCreateGroup, useUpdateGroup, useDeleteGroup, useRestoreGroup
│   ├── use-events.ts          # useEvents, useEvent, useEventUpdates, useEventServiceChanges
│   ├── use-events-mutations.ts    # useCreateEvent, useAddEventUpdate, useDeleteEvent
│   ├── use-templates.ts       # useTemplates
│   ├── use-templates-mutations.ts # useCreateTemplate, useDeleteTemplate
│   ├── use-notifications-config.ts # useNotificationsConfig (available channels, telegram bot config)
│   ├── use-channels.ts        # useChannels
│   ├── use-channels-mutations.ts  # useCreateChannel, useUpdateChannel, useDeleteChannel,
│   │                              # useVerifyChannel (with code for email), useResendVerificationCode
│   ├── use-subscriptions.ts   # useSubscriptionsMatrix (per-channel model)
│   ├── use-subscriptions-mutations.ts # useSetChannelSubscriptions
│   └── use-theme.ts           # Theme switching (Garden/Ocean/Sunset/Forest)
│
├── lib/
│   ├── api-error.ts           # ApiError class
│   ├── utils.ts               # cn(), formatDate(), formatRelativeTime()
│   ├── status-utils.ts        # serviceStatusConfig, severityConfig, eventStatusConfig,
│   │                          # calculateOverallStatus, groupServices, isEventActive, filterActiveEvents
│   ├── adapters/              # Adapters for API compatibility
│   │   └── event-adapter.ts   # convertLegacyToAffectedServices, convertLegacyToAffectedGroups
│   └── validations/           # Zod schemas
│       ├── service.ts         # createServiceSchema, updateServiceSchema, serviceStatusEnum
│       ├── group.ts           # createGroupSchema, updateGroupSchema
│       ├── event.ts           # createEventSchema, addEventUpdateSchema,
│       │                      # affectedServiceSchema, affectedGroupSchema
│       ├── template.ts        # template schemas
│       ├── channel.ts         # createChannelSchema (email/telegram/mattermost), verifyChannelSchema
│       └── subscription.ts    # setChannelSubscriptionsSchema (per-channel model)
│
└── types/index.ts             # Role, User, TokenPair, AuthState

tests/
└── e2e/                       # Playwright E2E tests
    ├── fixtures.ts            # Test fixtures, helpers, ApiHelper class, test user credentials
    ├── auth.spec.ts           # Login, logout, protected routes
    ├── services.spec.ts       # Services CRUD, archive/restore
    ├── groups.spec.ts         # Groups CRUD, archive/restore
    ├── events.spec.ts         # Events CRUD, updates, basic UI tests
    ├── events-lifecycle.spec.ts    # Groups A, B: Incident/Maintenance lifecycle, service status changes
    ├── events-multiple.spec.ts     # Group C: Multiple events on same service, worst-case calculation
    ├── events-manual-status.spec.ts # Group D: Manual status management vs event statuses
    ├── events-service-page.spec.ts  # Group E: Service events listing, filtering, pagination, status history
    ├── events-past.spec.ts          # Group F: Creating past (resolved) events
    ├── events-deletion.spec.ts      # Group G: Event deletion, related data cleanup
    ├── events-audit.spec.ts         # Group H: Status logs, event service changes audit
    ├── events-permissions.spec.ts   # Group I: Access control (operator+/admin)
    ├── events-validation.spec.ts    # Group J: Input validation (severity, status transitions)
    └── public-status.spec.ts  # Public status page, history, event details

.github/workflows/
├── ci.yml                     # Lint, typecheck, unit tests, build
└── e2e.yml                    # E2E tests with docker-compose.ci.yml

docker-compose.yml             # Local development: postgres + migrate + backend + frontend
docker-compose.ci.yml          # CI environment: postgres + migrate + backend (no frontend)
docker-compose.quickstart.yml  # Quick start: all services from GHCR images, no build required
```

---

## 3. STATUS

**Current:** Phase 7 (in progress) | **Version:** 1.4.0

| Phase              | Status | Scope                                                                         |
|--------------------|--------|-------------------------------------------------------------------------------|
| 1. Foundation      | ✅      | Next.js, Tailwind, shadcn, API client, Auth                                   |
| 2. CI/CD           | ✅      | GitHub Actions, Dockerfile, docker-compose                                    |
| 3. Public Pages    | ✅      | Status page, History, SSR                                                     |
| 4. Dashboard Read  | ✅      | Services/Groups/Events lists, Event detail                                    |
| 5. Dashboard Write | ✅      | CRUD all entities, Event updates, Service management, Templates, Service Tags |
| 6. User Settings   | ✅      | Profile, Channels, Subscriptions                                              |
| 7. Polish          | 🔄     | E2E in CI, Dark mode, Mobile, Error boundaries                                |

### Phase 7 Tasks
- [x] E2E tests in CI for critical flows
- [x] HTTP-only cookies authentication (frontend ready, awaiting backend)
- [ ] Mobile optimization
- [ ] Loading skeletons
- [ ] Error boundaries
- [ ] i18n (optional)

---

## 4. ARCHITECTURE

### Layer Boundaries (violation = design bug)

| Layer                  | Responsibility                                 | Forbidden                  |
|------------------------|------------------------------------------------|----------------------------|
| `app/`                 | routing, composition                           | business logic, HTTP calls |
| `components/features/` | UI + hooks usage                               | direct API calls           |
| `hooks/`               | TanStack Query (queryKey, queryFn, invalidate) | UI logic                   |
| `api/`                 | client setup, auth middleware                  | business logic             |
| `lib/`                 | pure functions, Zod, mappings                  | React, side effects        |

### Patterns (always apply)

- **Feature module:** feature = components + hooks + validations + tests in one domain
- **Container/Presentational:** logic in hooks, UI in components
- **Single source of truth:** server state only in TanStack Query, no duplication
- **SSR boundary:** public pages SSR, interactivity — client components selectively

### Required UI States

Every data-fetching component **must** implement:
```
loading | error | empty | success
```

### Dangerous Actions

- Delete/disable → **DeleteConfirmationDialog**
- Long operations → **disabled button + spinner**

---

## 5. WORKFLOW

### Sequence
```
1. CODEMAP        → find related files, don't duplicate
2. openapi.yaml   → endpoint exists? types generated?
3. lib/validations → Zod schema (createXxxSchema, updateXxxSchema)
4. hooks/         → TanStack Query per pattern (section 6)
5. components/    → UI with 4 states (loading/error/empty/success)
6. tests/         → unit for lib/hooks, integration for forms
7. npm run verify → lint + typecheck + test + build
8. CLAUDE.md      → update CODEMAP and STATUS
```

### New Entity File Template
```
1. lib/validations/xxx.ts         — Zod schema
2. hooks/use-xxx.ts               — useXxx, useXxxById
3. hooks/use-xxx-mutations.ts     — useCreateXxx, useUpdateXxx, useDeleteXxx
4. components/features/dashboard/xxx-table.tsx
5. components/features/dashboard/xxx-form.tsx
6. components/features/dashboard/xxx-form-dialog.tsx
7. app/dashboard/xxx/page.tsx
8. Tests co-located with each file
9. CLAUDE.md — update CODEMAP and STATUS
```

### Definition of Done (blocks PR)
- [ ] No HTTP calls from components directly
- [ ] All 4 UI states implemented
- [ ] Types from types.generated.ts (not manual)
- [ ] Tests added per matrix (section 7)
- [ ] `npm run verify` passes
- [ ] **CLAUDE.md updated** (CODEMAP, STATUS)

---

## 6. CODE PATTERNS

### API Hook

```typescript
// hooks/use-xxx.ts
export function useXxx() {
  return useQuery({
    queryKey: ['xxx'],
    queryFn: async () => {
      const { data, error, response } = await apiClient.GET('/api/v1/xxx');
      if (error) throw ApiError.fromResponse(response.status, error);
      return data?.data ?? [];
    },
  });
}

export function useCreateXxx() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateXxxRequest) => {
      const { data, error, response } = await apiClient.POST('/api/v1/xxx', { body });
      if (error) throw ApiError.fromResponse(response.status, error);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['xxx'] }),
  });
}
```

### Validation + Form

```typescript
// lib/validations/xxx.ts
export const createXxxSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});
export type CreateXxxInput = z.infer<typeof createXxxSchema>;

// In form:
const form = useForm<CreateXxxInput>({
  resolver: zodResolver(createXxxSchema),
});
```

---

## 7. TESTING MATRIX

| Layer                         | Test Type   | Tool                     | Required |
|-------------------------------|-------------|--------------------------|----------|
| `lib/*` (utils, validations)  | Unit        | Vitest                   | ✅ required |
| `hooks/*`                     | Unit        | Vitest + MSW             | ✅ required |
| `components/features/*` forms | Integration | Vitest + Testing Library | ✅ required |
| Auth flow, CRUD               | E2E         | Playwright               | critical |

**Coverage threshold:** 70% (statements, branches, functions, lines)
**Test location:** co-located with source `xxx.test.ts(x)`

---

## 8. ERROR HANDLING

| Status | Action                                      |
|--------|---------------------------------------------|
| 401    | logout + redirect `/login` (via middleware) |
| 403    | "Access denied" message (no redirect)       |
| 5xx    | user-friendly message + retry option        |

See `lib/api-error.ts` for `ApiError` class (status, message, details, helper getters).

---

## 9. AUTH

**Storage:** HTTP-only cookies (access_token, refresh_token), managed by backend
**Roles:** user < operator < admin | Dashboard requires operator+

**Flow:**
```
login → server sets HTTP-only cookies → credentials: 'include' automatically sends cookies
401 → middleware dispatches 'auth:unauthorized' → logout → redirect /login
```

---

## 10. STYLING

- **Framework:** Tailwind CSS + shadcn/ui
- **Themes:** Garden (default), Ocean, Sunset, Forest — each Light/Dark
- **Colors:** ONLY Tailwind classes (`bg-background`, `text-foreground`, `text-primary`)
- **Status colors:** `serviceStatusConfig` from `lib/status-utils.ts`

---

## 11. NAMING CONVENTIONS

| Type       | Pattern               | Example                                           |
|------------|-----------------------|---------------------------------------------------|
| Components | `PascalCase.tsx`      | `ServiceForm.tsx` → `export function ServiceForm` |
| Hooks      | `use-xxx.ts`          | `use-services.ts` → `export function useServices` |
| Utils      | `kebab-case.ts`       | `api-error.ts` → `export class ApiError`          |
| Types      | `PascalCase` + suffix | `CreateServiceInput`, `ServiceFormProps`          |
| Files/dirs | `kebab-case`          | `service-form.tsx`, `use-auth.tsx`                |

---

## 12. DON'T

- `any` without a comment explaining why
- HTTP calls from components directly
- Manual types instead of types.generated.ts
- localStorage/sessionStorage for tokens
- Hardcoded colors instead of Tailwind classes
- Log sensitive data to console
- git commit/push/branch (read-only allowed)
- Create files unnecessarily
- **Forget to update CLAUDE.md**
