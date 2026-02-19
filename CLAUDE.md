# CLAUDE.md — Garden UI

## ⚠️ ПОСЛЕ ЛЮБОГО ИЗМЕНЕНИЯ КОДА

```
1. Обнови CODEMAP — добавь новые файлы/компоненты
2. Обнови STATUS — если завершена задача/фаза
3. npm run verify — должен проходить
4. Этот файл = источник истины о проекте
```

---

## 1. QUICK REFERENCE

```bash
npm run dev              # Dev server :3000
npm run verify           # lint + typecheck + test:coverage + build (CI parity)
npm run test:run         # Unit/Integration
npm run test:e2e         # E2E Playwright (headless)
npm run test:e2e:ui      # E2E Playwright с интерактивным UI
npm run test:e2e:headed  # E2E Playwright с браузером
npm run api:update       # Скачать OpenAPI спеку из backend
npm run api:generate     # Сгенерировать TypeScript типы
```

**Backend:** https://github.com/bissquit/incident-garden
**Compatibility:** Frontend 1.4.0 ↔ Backend >= 2.8.0

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

### Phase 6 Tasks ✅
- [x] Profile section (read-only: email, role)
- [x] Notification channels — hooks + UI components (ChannelsTable, ChannelForm, ChannelFormDialog)
- [x] Subscriptions — hooks + UI component (SubscriptionEditor)
- [x] Settings page `/dashboard/settings` — объединение profile + channels + subscriptions

### Phase 7 Tasks
- [x] E2E тесты в CI для критических flows
- [x] HTTP-only cookies authentication (frontend готов, ожидает backend)
- [ ] Mobile optimization
- [ ] Loading skeletons
- [ ] Error boundaries
- [ ] i18n (опционально)

### ✅ Backend 2.8.0 Migration (Completed)

Per-channel subscriptions model fully implemented:
- `GET /api/v1/me/subscriptions` — returns `SubscriptionsMatrixResponse`
- `PUT /api/v1/me/channels/{id}/subscriptions` — per-channel subscription settings
- Matrix UI: channels × services with "All services" toggle
- Mattermost channel type support
- Email verification with 6-digit code

---

## 4. ARCHITECTURE

### Layer Boundaries (нарушение = дизайн-баг)

| Layer                  | Responsibility                                 | Forbidden                  |
|------------------------|------------------------------------------------|----------------------------|
| `app/`                 | routing, composition                           | business logic, HTTP calls |
| `components/features/` | UI + hooks usage                               | direct API calls           |
| `hooks/`               | TanStack Query (queryKey, queryFn, invalidate) | UI logic                   |
| `api/`                 | client setup, auth middleware                  | business logic             |
| `lib/`                 | pure functions, Zod, mappings                  | React, side effects        |

### Patterns (применяй всегда)

- **Feature module:** фича = компоненты + hooks + validations + tests в одном домене
- **Container/Presentational:** логика в хуках, UI в компонентах
- **Single source of truth:** server state только в TanStack Query, без дублирования
- **SSR boundary:** публичные страницы SSR, интерактив — client components точечно

### Required UI States

Каждый компонент с данными **обязан** реализовать:
```
loading | error | empty | success
```

### Dangerous Actions

- Удаление/отключение → **DeleteConfirmationDialog**
- Долгие операции → **disabled button + spinner**

---

## 5. TASK ALGORITHM (обязательная последовательность)

```
1. CODEMAP        → найти связанные файлы, не дублировать
2. openapi.yaml   → endpoint существует? типы сгенерированы?
3. lib/validations → Zod schema (createXxxSchema, updateXxxSchema)
4. hooks/         → TanStack Query по паттерну (секция 6)
5. components/    → UI с 4 состояниями (loading/error/empty/success)
6. tests/         → unit для lib/hooks, integration для форм
7. npm run verify → lint + typecheck + test + build
8. CLAUDE.md      → обновить CODEMAP и STATUS
```

---

## 6. API PATTERN

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

---

## 7. VALIDATION PATTERN

```typescript
// lib/validations/xxx.ts
export const createXxxSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});
export type CreateXxxInput = z.infer<typeof createXxxSchema>;

// В форме:
const form = useForm<CreateXxxInput>({
  resolver: zodResolver(createXxxSchema),
});
```

---

## 8. TASK CHECKLIST

### Before
- [ ] Read CODEMAP — find related files
- [ ] Check existing hooks/validations — don't duplicate
- [ ] Endpoint exists in openapi.yaml? Types in types.generated.ts?

### Implementation
- [ ] Types from types.generated.ts + Zod at boundaries
- [ ] Hook with TanStack Query (pattern from section 6)
- [ ] UI: loading/error/empty/success states
- [ ] Dangerous actions: confirmation dialog

### Definition of Done (блокирует PR)
- [ ] Нет HTTP из компонентов напрямую
- [ ] Все 4 UI состояния реализованы
- [ ] Типы из types.generated.ts (не ручные)
- [ ] Тесты добавлены по матрице (секция 9)
- [ ] `npm run verify` проходит
- [ ] **CLAUDE.md обновлён** (CODEMAP, STATUS)

---

## 9. TESTING MATRIX

| Layer                         | Test Type   | Tool                     | Required      |
|-------------------------------|-------------|--------------------------|---------------|
| `lib/*` (utils, validations)  | Unit        | Vitest                   | ✅ обязательно |
| `hooks/*`                     | Unit        | Vitest + MSW             | ✅ обязательно |
| `components/features/*` forms | Integration | Vitest + Testing Library | ✅ обязательно |
| Auth flow, CRUD               | E2E         | Playwright               | критичные     |

**Coverage threshold:** 70% (statements, branches, functions, lines)
**Test location:** рядом с исходником `xxx.test.ts(x)`

---

## 10. ERROR HANDLING

```typescript
// lib/api-error.ts
class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
  static fromResponse(status: number, error: unknown): ApiError { /* ... */ }
  get isUnauthorized() { return this.status === 401; }
  get isForbidden() { return this.status === 403; }
  get isServerError() { return this.status >= 500; }
}
```

**UI Handling:**

| Status | Action                                      |
|--------|---------------------------------------------|
| 401    | logout + redirect `/login` (via middleware) |
| 403    | "Access denied" message (no redirect)       |
| 5xx    | user-friendly message + retry option        |

---

## 11. AUTH

**Storage:** HTTP-only cookies (access_token, refresh_token), управляются backend
**Roles:** user < operator < admin | Dashboard requires operator+

**Flow:**
```
login → server sets HTTP-only cookies → credentials: 'include' автоматически отправляет cookies
401 → middleware dispatches 'auth:unauthorized' → logout → redirect /login
```

**Full Sequence:**
1. `POST /api/v1/auth/login` → `{ user }` → server sets cookies → redirect /dashboard
2. Session restore: `GET /api/v1/me` → проверка сессии при загрузке
3. Request: cookies отправляются автоматически с `credentials: 'include'`
4. On 401: server refreshes tokens if possible, иначе → logout
5. Logout: `POST /api/v1/auth/logout` → server clears cookies → redirect /login

---

## 12. SECURITY RULES

- **Tokens:** HTTP-only cookies (управляются backend), НИКОГДА localStorage/sessionStorage (XSS risk)
- **Credentials:** `credentials: 'include'` в API clients для автоматической отправки cookies
- **Sensitive data:** не логировать, не выводить в console
- **User input:** всегда валидировать Zod на границах
- **API URL:** только через `NEXT_PUBLIC_API_URL`
- **Credentials:** не коммитить `.env`, использовать `.env.example`

---

## 13. STYLING

- **Framework:** Tailwind CSS + shadcn/ui
- **Themes:** Garden (default), Ocean, Sunset, Forest — каждая Light/Dark
- **Colors:** ТОЛЬКО Tailwind классы (`bg-background`, `text-foreground`, `text-primary`)
- **Status colors:** `serviceStatusConfig` из `lib/status-utils.ts`

---

## 14. NAMING CONVENTIONS

| Type       | Pattern               | Example                                           |
|------------|-----------------------|---------------------------------------------------|
| Components | `PascalCase.tsx`      | `ServiceForm.tsx` → `export function ServiceForm` |
| Hooks      | `use-xxx.ts`          | `use-services.ts` → `export function useServices` |
| Utils      | `kebab-case.ts`       | `api-error.ts` → `export class ApiError`          |
| Types      | `PascalCase` + suffix | `CreateServiceInput`, `ServiceFormProps`          |
| Files/dirs | `kebab-case`          | `service-form.tsx`, `use-auth.tsx`                |

---

## 15. ADDING NEW ENTITY

```
1. lib/validations/xxx.ts         — Zod schema
2. hooks/use-xxx.ts               — useXxx, useXxxById
3. hooks/use-xxx-mutations.ts     — useCreateXxx, useUpdateXxx, useDeleteXxx
4. components/features/dashboard/xxx-table.tsx
5. components/features/dashboard/xxx-form.tsx
6. components/features/dashboard/xxx-form-dialog.tsx
7. app/dashboard/xxx/page.tsx
8. Tests рядом с каждым файлом
9. CLAUDE.md — обновить CODEMAP и STATUS
```

---

## 16. DON'T

- `any` без комментария почему
- HTTP вызовы из компонентов напрямую
- Ручные типы вместо types.generated.ts
- localStorage для токенов
- Хардкод цветов вместо Tailwind классов
- git commit/push/branch (read-only allowed)
- Создавать файлы без необходимости
- **Забывать обновить CLAUDE.md**

---

## 17. ENV

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
```
