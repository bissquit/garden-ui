# CLAUDE.md — Garden UI

## ОБЯЗАТЕЛЬНО: После любых изменений проекта

```
ПОСЛЕ КАЖДОГО ИЗМЕНЕНИЯ КОДА обнови этот файл:
- Добавь новые файлы в CODEMAP
- Обнови STATUS если завершена задача
- Обнови HOOKS/COMPONENTS если добавлены новые
```

---

## 1. QUICK REFERENCE

```bash
# Команды
npm run dev              # Dev server :3000
npm run verify           # lint + typecheck + test:coverage + build (CI parity)
npm run test:run         # Unit/Integration тесты
npm run test:e2e         # E2E Playwright
npm run api:update       # Скачать OpenAPI спеку из backend
npm run api:generate     # Сгенерировать TypeScript типы

# Окружение для тестов
JWT_SECRET_KEY=qwertyuiopasdfghjklzxcvbnmqwertyuioasdfghjklxcvbnm docker compose up -d
JWT_SECRET_KEY=qwertyuiopasdfghjklzxcvbnmqwertyuioasdfghjklxcvbnm docker compose down && \
  docker volume rm garden-ui_migrations garden-ui_postgres_data && \
  docker image rm garden-ui-frontend:latest ghcr.io/bissquit/incident-garden:latest
```

---

## 2. CODEMAP

```
src/
├── api/
│   ├── client.ts              # publicClient (no auth), apiClient (with auth middleware)
│   ├── openapi.yaml           # OpenAPI spec (source: backend)
│   └── types.generated.ts     # DO NOT EDIT - generated types
│
├── app/                       # Next.js 14 App Router
│   ├── (public)/              # SSR pages (no auth)
│   │   ├── page.tsx           # Status page
│   │   └── history/page.tsx   # History (7 days)
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   └── dashboard/             # Protected (operator/admin)
│       ├── page.tsx           # Overview
│       ├── services/page.tsx  # CRUD services
│       ├── groups/page.tsx    # CRUD groups
│       ├── events/page.tsx    # Events list + filters
│       ├── events/[id]/page.tsx  # Event detail + timeline
│       └── templates/page.tsx # CRUD templates
│
├── components/
│   ├── ui/                    # shadcn/ui (20 components)
│   ├── layout/                # header, footer, dashboard-sidebar, theme-switcher
│   └── features/
│       ├── auth/              # LoginForm
│       ├── status/            # OverallStatusBanner, ServiceList, ServiceItem,
│       │                      # ActiveIncidents, ScheduledMaintenance, EventCard,
│       │                      # HistoryList, HistoryDayGroup
│       └── dashboard/         # DataTable, EmptyState, DeleteConfirmationDialog,
│                              # ServicesTable, ServiceForm, ServiceFormDialog,
│                              # GroupsTable, GroupForm, GroupFormDialog,
│                              # EventsTable, EventsFilters, EventForm, EventFormDialog,
│                              # EventDetailsCard, EventTimeline, EventChangesTimeline,
│                              # EventServicesManager, EventUpdateForm
│
├── hooks/
│   ├── use-auth.tsx           # Auth context: login, logout, hasRole, hasMinRole
│   ├── use-public-status.ts   # useServices, useGroups, usePublicStatus, useStatusHistory
│   ├── use-services-mutations.ts  # useCreateService, useUpdateService, useDeleteService, useRestoreService
│   ├── use-groups-mutations.ts    # useCreateGroup, useUpdateGroup, useDeleteGroup, useRestoreGroup
│   ├── use-events.ts          # useEvents, useEvent, useEventUpdates, useEventServiceChanges
│   ├── use-events-mutations.ts    # useCreateEvent, useAddEventUpdate, useDeleteEvent, useAddServicesToEvent, useRemoveServicesFromEvent
│   ├── use-templates.ts       # useTemplates
│   ├── use-templates-mutations.ts # useCreateTemplate, useDeleteTemplate
│   └── use-theme.ts           # Theme switching (Garden/Ocean/Sunset/Forest)
│
├── lib/
│   ├── api-error.ts           # ApiError class
│   ├── utils.ts               # cn(), formatDate(), formatRelativeTime()
│   ├── status-utils.ts        # serviceStatusConfig, severityConfig, eventStatusConfig,
│   │                          # calculateOverallStatus, groupServices, filterActiveEvents
│   └── validations/           # Zod schemas
│       ├── service.ts         # createServiceSchema, updateServiceSchema
│       ├── group.ts           # createGroupSchema, updateGroupSchema
│       ├── event.ts           # createEventSchema, createEventUpdateSchema
│       └── template.ts        # template schemas
│
└── types/index.ts             # Role, User, TokenPair, AuthState
```

---

## 3. STATUS

| Phase              | Status | Notes                                                |
|--------------------|--------|------------------------------------------------------|
| 1. Foundation      | ✅      | Next.js, Tailwind, shadcn, API client, Auth          |
| 2. CI/CD           | ✅      | GitHub Actions, Dockerfile, docker-compose           |
| 3. Public Pages    | ✅      | Status page, History, SSR                            |
| 4. Dashboard Read  | ✅      | Services/Groups/Events lists, Event detail           |
| 5. Dashboard Write | ✅      | CRUD all entities, Event updates, Service management |
| 6. User Settings   | 🔜     | Profile, Channels, Subscriptions                     |
| 7. Polish          | 🔜     | E2E in CI, Dark mode, Mobile, Error boundaries       |

**Current version:** 1.0.0
**Backend compatibility:** >= 1.0.0

---

## 4. ARCHITECTURE RULES (нарушение = дизайн-баг)

### Layer Boundaries
```
Pages (app/)         → Только routing/composition, БЕЗ бизнес-логики, БЕЗ HTTP
Feature Components   → UI + используют hooks
Hooks (hooks/)       → TanStack Query (queryKey, queryFn, invalidate)
API (api/)           → Единое место для клиента и auth
Lib (lib/)           → Чистые функции, Zod, маппинги
```

### Обязательные UI состояния
```
Каждый компонент с данными: loading | error | empty | success
Опасные действия: DeleteConfirmationDialog
Долгие операции: disabled button + spinner
```

### API Pattern (всегда так)
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

### Validation Pattern (всегда так)
```typescript
// lib/validations/xxx.ts
export const createXxxSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  // ...
});
export type CreateXxxInput = z.infer<typeof createXxxSchema>;

// В форме:
const form = useForm<CreateXxxInput>({
  resolver: zodResolver(createXxxSchema),
});
```

---

## 5. TASK EXECUTION CHECKLIST

### Перед началом
- [ ] Прочитай CODEMAP — найди связанные файлы
- [ ] Проверь существующие hooks/validations — не дублируй
- [ ] Endpoint есть в openapi.yaml? Типы в types.generated.ts?

### Реализация
- [ ] Типы из types.generated.ts + Zod на границах
- [ ] Hook с TanStack Query (pattern выше)
- [ ] UI: loading/error/empty/success states
- [ ] Опасные действия: confirmation dialog

### После реализации
- [ ] `npm run verify` проходит
- [ ] Тест добавлен (unit для utils/validations, integration для форм)
- [ ] **ОБНОВИ CLAUDE.md** — добавь в CODEMAP, обнови STATUS

---

## 6. TESTING MATRIX

| Слой                          | Что тестировать  | Инструмент               |
|-------------------------------|------------------|--------------------------|
| lib/* (utils, validations)    | Unit обязательно | Vitest                   |
| hooks/*                       | Unit обязательно | Vitest + MSW             |
| components/features/* (формы) | Integration      | Vitest + Testing Library |
| Auth flow, CRUD               | E2E критичные    | Playwright               |

**Coverage thresholds:** 70% (statements, branches, functions, lines)

**Test file location:** рядом с исходником `xxx.test.ts(x)`

---

## 7. ERROR HANDLING

```typescript
// Централизованно в lib/api-error.ts
class ApiError extends Error {
  status: number;
  static fromResponse(status, error) { ... }
  get isUnauthorized() { return this.status === 401; }
  get isForbidden() { return this.status === 403; }
}

// Обработка в UI:
// 401 → logout + redirect /login
// 403 → "Access denied" message
// 5xx → user-friendly message + retry option
```

---

## 8. AUTH

```
Storage: access_token в памяти (window.__AUTH_TOKEN__), НИКОГДА в localStorage
Flow: login → tokens в state → apiClient middleware добавляет header
401: apiClient middleware диспатчит 'auth:unauthorized' event → logout
```

**Roles:** user < operator < admin
**Dashboard:** требует operator или admin

---

## 9. STYLING

```
Framework: Tailwind CSS + shadcn/ui
Themes: Garden (default), Ocean, Sunset, Forest — каждая Light/Dark
Colors: ТОЛЬКО через Tailwind классы (bg-background, text-foreground, text-primary)
Статусы: serviceStatusConfig в lib/status-utils.ts
```

---

## 10. FILE NAMING

```
Components: PascalCase (ServiceForm.tsx → export function ServiceForm)
Hooks: camelCase с use- (use-services.ts → export function useServices)
Utils: camelCase (format-date.ts → export function formatDate)
Files/dirs: kebab-case
Types: PascalCase + суффикс (CreateServiceInput, ServiceFormProps)
```

---

## 11. WHEN ADDING NEW ENTITY

1. **Validation:** `lib/validations/xxx.ts` — Zod schema
2. **Hook queries:** `hooks/use-xxx.ts` — useXxx, useXxxById
3. **Hook mutations:** `hooks/use-xxx-mutations.ts` — useCreateXxx, useUpdateXxx, useDeleteXxx
4. **Table:** `components/features/dashboard/xxx-table.tsx`
5. **Form:** `components/features/dashboard/xxx-form.tsx`
6. **Dialog:** `components/features/dashboard/xxx-form-dialog.tsx`
7. **Page:** `app/dashboard/xxx/page.tsx`
8. **Tests:** рядом с каждым файлом
9. **CLAUDE.md:** обнови CODEMAP и STATUS

---

## 12. GIT RULES

```
НЕ делать: commit, push, создание веток, изменение истории
МОЖНО: read-only операции (status, log, diff, blame)
```

---

## 13. DONT

- `any` без комментария почему
- HTTP вызовы из компонентов напрямую
- Ручные типы вместо generated
- localStorage для токенов
- Хардкод цветов вместо Tailwind классов
- Создание файлов без необходимости
- Забывать обновить CLAUDE.md

---

## 14. ENV

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## 15. BACKEND

```
Repo: https://github.com/bissquit/incident-garden
API spec: api/openapi/openapi.yaml
Update: npm run api:update && npm run api:generate
```
