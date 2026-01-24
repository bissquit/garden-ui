# CLAUDE.md — StatusPage Frontend

## 🎯 Цель проекта

Веб-интерфейс для StatusPage API. Позволяет:
- Просматривать статус сервисов (публичная страница)
- Управлять сервисами, событиями, шаблонами (админка)
- Настраивать уведомления (личный кабинет)

---

## 🔗 Связь с Backend

**Backend репозиторий:** https://github.com/bissquit/incident-garden

**API спецификация:**
- Источник истины: backend репозиторий `api/openapi/openapi.yaml`
- Локальная копия: `src/api/openapi.yaml`
- Сгенерированные типы: `src/api/types.generated.ts`

**Обновление API:**
```bash
npm run api:update    # Скачать свежую спеку из backend
npm run api:generate  # Сгенерировать TypeScript типы
```

**Матрица совместимости:**

| Frontend | Backend    | Статус       |
|----------|------------|--------------|
| 1.x.x    | >= 1.0.0   | ✅ Совместимы |

> При обновлении backend API — обновить спеку, сгенерировать типы, исправить ошибки TypeScript.

---

## 📊 Текущий статус

| Компонент             | Статус     | Описание                      |
|-----------------------|------------|-------------------------------|
| Public Status Page    | 🔜 Planned | Отображение статусов сервисов |
| Auth (Login/Logout)   | 🔜 Planned | JWT аутентификация            |
| Dashboard Layout      | 🔜 Planned | Общий layout админки          |
| Services Management   | 🔜 Planned | CRUD сервисов                 |
| Groups Management     | 🔜 Planned | CRUD групп                    |
| Events Management     | 🔜 Planned | CRUD событий                  |
| Event Updates         | 🔜 Planned | Timeline обновлений           |
| Templates             | 🔜 Planned | Управление шаблонами          |
| Notification Channels | 🔜 Planned | Email, Telegram каналы        |
| Subscriptions         | 🔜 Planned | Подписки на уведомления       |
| User Profile          | 🔜 Planned | Настройки пользователя        |

---

## 🛠 Технологический стек

| Компонент        | Технология              | Обоснование                              |
|------------------|-------------------------|------------------------------------------|
| Framework        | Next.js 14 (App Router) | SSR для публичной страницы, SEO          |
| Language         | TypeScript 5            | Type safety, интеграция с OpenAPI        |
| Styling          | Tailwind CSS 3          | Utility-first, быстрая разработка        |
| UI Components    | shadcn/ui               | Качественные компоненты, кастомизация    |
| State Management | TanStack Query v5       | Server state, кэширование, синхронизация |
| Forms            | React Hook Form + Zod   | Валидация, type safety                   |
| API Client       | openapi-fetch           | Type-safe запросы из OpenAPI спеки       |
| Icons            | Lucide React            | Консистентная иконография                |
| Testing          | Vitest + Playwright     | Unit/Integration + E2E                   |
| Linting          | ESLint + Prettier       | Code quality                             |

---

## 📁 Структура проекта

```
statuspage-ui/
├── src/
│   ├── api/
│   │   ├── openapi.yaml          # Копия спеки из backend
│   │   ├── types.generated.ts    # Сгенерированные типы (не редактировать!)
│   │   └── client.ts             # Настроенный API клиент
│   │
│   ├── app/                      # Next.js App Router
│   │   ├── (public)/             # Публичные страницы (без auth)
│   │   │   ├── page.tsx          # Главная — статус сервисов
│   │   │   ├── history/          # История событий
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (auth)/               # Auth страницы
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── layout.tsx
│   │   │
│   │   ├── dashboard/            # Защищённая зона (требует auth)
│   │   │   ├── page.tsx          # Dashboard home
│   │   │   ├── services/         # Управление сервисами
│   │   │   ├── groups/           # Управление группами
│   │   │   ├── events/           # Управление событиями
│   │   │   ├── templates/        # Управление шаблонами
│   │   │   └── layout.tsx        # Dashboard layout с sidebar
│   │   │
│   │   ├── settings/             # Настройки пользователя
│   │   │   ├── profile/
│   │   │   ├── channels/         # Каналы уведомлений
│   │   │   ├── subscriptions/    # Подписки
│   │   │   └── layout.tsx
│   │   │
│   │   ├── layout.tsx            # Root layout
│   │   ├── providers.tsx         # React Query, Auth providers
│   │   └── globals.css           # Tailwind imports
│   │
│   ├── components/
│   │   ├── ui/                   # shadcn/ui компоненты
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/               # Layout компоненты
│   │   │   ├── header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── footer.tsx
│   │   │   └── mobile-nav.tsx
│   │   │
│   │   └── features/             # Бизнес-компоненты
│   │       ├── auth/
│   │       │   ├── login-form.tsx
│   │       │   └── register-form.tsx
│   │       ├── services/
│   │       │   ├── service-card.tsx
│   │       │   ├── service-list.tsx
│   │       │   ├── service-form.tsx
│   │       │   └── service-status-badge.tsx
│   │       ├── events/
│   │       │   ├── event-card.tsx
│   │       │   ├── event-list.tsx
│   │       │   ├── event-form.tsx
│   │       │   ├── event-timeline.tsx
│   │       │   └── event-update-form.tsx
│   │       └── status/
│   │           ├── status-overview.tsx
│   │           ├── status-history.tsx
│   │           └── overall-status.tsx
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── use-auth.ts           # Auth state и методы
│   │   ├── use-services.ts       # Services queries
│   │   ├── use-events.ts         # Events queries
│   │   └── use-media-query.ts    # Responsive helpers
│   │
│   ├── lib/                      # Утилиты и конфигурация
│   │   ├── utils.ts              # Общие утилиты (cn, formatDate, etc.)
│   │   ├── auth.ts               # Auth utilities
│   │   ├── validations.ts        # Zod schemas
│   │   └── constants.ts          # Константы приложения
│   │
│   └── types/                    # Дополнительные TypeScript типы
│       └── index.ts
│
├── tests/
│   ├── unit/                     # Vitest unit тесты
│   ├── integration/              # Component тесты
│   ├── e2e/                      # Playwright E2E тесты
│   └── mocks/                    # MSW handlers
│       ├── handlers.ts
│       └── server.ts
│
├── public/
│   ├── favicon.ico
│   └── ...
│
├── scripts/
│   ├── update-api.sh             # Скачать свежую OpenAPI спеку
│   └── generate-types.sh         # Сгенерировать типы
│
├── .env.example
├── .env.local                    # Локальные переменные (не в git)
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
├── package.json
├── CHANGELOG.md
├── README.md
└── CLAUDE.md
```

---

## 🔐 Аутентификация

### Механизм

- **Тип:** JWT токены от backend API
- **Access token:** короткоживущий (15 минут)
- **Refresh token:** долгоживущий (7 дней)

### Хранение токенов

```typescript
// ⚠️ ВАЖНО: НЕ использовать localStorage — уязвимость XSS

// Правильно: хранить в памяти (React state/context)
const [accessToken, setAccessToken] = useState<string | null>(null);

// Refresh token: 
// - Идеально: httpOnly cookie (требует изменений в backend)
// - Допустимо: память (теряется при перезагрузке страницы)
```

### Auth Flow

```
1. Login
   POST /api/v1/auth/login { email, password }
   → { data: { user, tokens: { access_token, refresh_token } } }
   → Сохранить токены в state
   → Redirect to /dashboard

2. Authenticated Request
   GET /api/v1/services
   Headers: { Authorization: "Bearer <access_token>" }

3. Token Refresh (при 401)
   POST /api/v1/auth/refresh { refresh_token }
   → Новая пара токенов
   → Повторить оригинальный запрос

4. Logout
   POST /api/v1/auth/logout { refresh_token }
   → Очистить токены из state
   → Redirect to /login
```

### Auth Context

```typescript
// src/hooks/use-auth.ts
interface AuthContext {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: Role) => boolean;
}
```

---

## 🎨 UI/UX Guidelines

### Публичная страница

- **Цель:** быстро показать текущий статус
- **Дизайн:** минималистичный, чистый
- **Производительность:** SSR/SSG, минимум JS
- **Мобильная версия:** обязательна
- **Accessibility:** WCAG 2.1 AA

**Элементы:**
- Overall status indicator (All Systems Operational / Partial Outage / Major Outage)
- Список сервисов с текущим статусом
- Активные инциденты с timeline
- Запланированные maintenance
- История за последние 7 дней

### Админка (Dashboard)

- **Layout:** sidebar navigation + main content
- **Таблицы:** пагинация, сортировка, фильтры
- **Формы:** inline validation, loading states
- **Actions:** confirmation dialogs для опасных действий
- **Feedback:** toast notifications для результатов операций

### Статусы и цвета

```typescript
const statusColors = {
  operational: 'green',
  degraded: 'yellow', 
  partial_outage: 'orange',
  major_outage: 'red',
  maintenance: 'blue',
} as const;

const severityColors = {
  minor: 'yellow',
  major: 'orange',
  critical: 'red',
} as const;
```

### Responsive Breakpoints

```typescript
// Tailwind defaults
// sm: 640px
// md: 768px
// lg: 1024px
// xl: 1280px

// Mobile-first approach
// Default styles → mobile
// sm: → tablet
// lg: → desktop
```

---

## 📋 API Integration

### Настройка клиента

```typescript
// src/api/client.ts
import createClient from 'openapi-fetch';
import type { paths } from './types.generated';

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const client = createClient<paths>({ baseUrl });

// Добавление auth header
export function createAuthClient(accessToken: string) {
  return createClient<paths>({
    baseUrl,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
```

### Использование с TanStack Query

```typescript
// src/hooks/use-services.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/api/client';

export function useServices() {
  return useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await client.GET('/api/v1/services');
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (body: CreateServiceRequest) => {
      const { data, error } = await authClient.POST('/api/v1/services', { body });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
}
```

### Обработка ошибок

```typescript
// src/lib/api-error.ts
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// В компонентах
const { error } = useServices();
if (error instanceof ApiError) {
  if (error.status === 401) {
    // Redirect to login
  }
  if (error.status === 403) {
    // Show "Access denied"
  }
}
```

---

## 🧪 Тестирование

### Стратегия

```
Пирамида тестов:
         /\
        /  \     E2E (10%) — критические user flows
       /────\
      /      \   Integration (30%) — компоненты + мок API
     /────────\
    /          \ Unit (60%) — хуки, утилиты, чистые функции
   /────────────\
```

### Unit тесты (Vitest)

**Что тестировать:**
- Custom hooks (без API)
- Utility функции
- Валидационные схемы
- Pure компоненты

```typescript
// src/lib/utils.test.ts
import { formatStatus, cn } from './utils';

describe('formatStatus', () => {
  it('formats operational status', () => {
    expect(formatStatus('operational')).toBe('Operational');
  });
  
  it('formats partial_outage', () => {
    expect(formatStatus('partial_outage')).toBe('Partial Outage');
  });
});
```

### Integration тесты (Vitest + Testing Library)

**Что тестировать:**
- Компоненты с мок API (MSW)
- Формы (заполнение, валидация, submit)
- User interactions

```typescript
// src/components/features/auth/login-form.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './login-form';

describe('LoginForm', () => {
  it('submits and calls onSuccess', async () => {
    const onSuccess = vi.fn();
    render(<LoginForm onSuccess={onSuccess} />);
    
    await userEvent.type(screen.getByLabelText(/email/i), 'admin@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'admin123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
  
  it('shows validation errors', async () => {
    render(<LoginForm />);
    
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
  });
});
```

### E2E тесты (Playwright)

**Что тестировать:**
- Критические user flows против реального backend
- Auth flow
- CRUD операции

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('[name="email"]', 'admin@example.com');
    await page.fill('[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });
  
  test('logout', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[name="email"]', 'admin@example.com');
    await page.fill('[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
    
    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Logout');
    
    await expect(page).toHaveURL('/login');
  });
});
```

### Запуск тестов

```bash
npm run test              # Unit + Integration (watch mode)
npm run test:run          # Unit + Integration (single run)
npm run test:coverage     # С coverage отчётом
npm run test:e2e          # E2E тесты
npm run test:e2e:ui       # E2E с UI
```

---

## 🚀 Development

### Первоначальная настройка

```bash
# 1. Клонировать репозиторий
git clone https://github.com/bissquit/statuspage-ui.git
cd statuspage-ui

# 2. Установить зависимости
npm install

# 3. Скопировать env
cp .env.example .env.local

# 4. Запустить backend (в отдельном терминале)
cd ../incident-management
make docker-up

# 5. Запустить frontend
npm run dev
```

### Команды

```bash
npm run dev           # Development server (localhost:3000)
npm run build         # Production build
npm run start         # Start production server
npm run lint          # ESLint
npm run lint:fix      # ESLint с автофиксом
npm run typecheck     # TypeScript проверка
npm run format        # Prettier
npm run api:update    # Обновить OpenAPI спеку
npm run api:generate  # Сгенерировать типы
```

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8080  # Backend API URL
```

### Работа с API спекой

При изменениях в backend API:

```bash
# 1. Обновить спеку
npm run api:update

# 2. Сгенерировать типы
npm run api:generate

# 3. Исправить ошибки TypeScript (если есть breaking changes)
npm run typecheck
```

---

## 📍 Roadmap

### Phase 1: Foundation
- [ ] Project setup (Next.js, Tailwind, shadcn/ui)
- [ ] API client и типы
- [ ] Auth (login, logout, protected routes)
- [ ] Base layout (header, footer)

### Phase 2: Public Pages
- [ ] Status page (список сервисов, текущий статус)
- [ ] Active incidents
- [ ] Scheduled maintenance
- [ ] History page

### Phase 3: Dashboard — Read
- [ ] Dashboard layout (sidebar)
- [ ] Services list
- [ ] Groups list
- [ ] Events list
- [ ] Event details с timeline

### Phase 4: Dashboard — Write
- [ ] Create/Edit/Delete services
- [ ] Create/Edit/Delete groups
- [ ] Create event (incident/maintenance)
- [ ] Add event updates
- [ ] Manage templates

### Phase 5: User Settings
- [ ] Profile settings
- [ ] Notification channels (add, verify, enable/disable)
- [ ] Subscriptions management

### Phase 6: Polish
- [ ] Dark mode
- [ ] Mobile optimization
- [ ] Loading skeletons
- [ ] Error boundaries
- [ ] i18n (опционально)

---

## ⚠️ Важные соглашения

### Code Style

1. **Компоненты:** PascalCase, один компонент = один файл
2. **Хуки:** camelCase, префикс `use`
3. **Утилиты:** camelCase
4. **Типы:** PascalCase, суффикс по смыслу (Props, State, etc.)

### Безопасность

1. **Токены:** НИКОГДА не хранить в localStorage
2. **API URL:** только через environment variables
3. **Sensitive data:** не логировать в console
4. **User input:** всегда валидировать (Zod)

### API Integration

1. **Типы:** генерировать из OpenAPI, не писать вручную
2. **Ошибки:** всегда обрабатывать, показывать пользователю
3. **Loading states:** всегда показывать
4. **Оптимистичные обновления:** использовать где уместно

### Git

1. **Commits:** conventional commits (feat:, fix:, etc.)
2. **Branches:** feature/, fix/, docs/
3. **PR:** описание + скриншоты для UI изменений

---

## 💬 Как работать с Claude

### При создании компонента:

1. Опиши что компонент должен делать
2. Укажи какие данные использует (API endpoint)
3. Опиши желаемое поведение и состояния

### При работе с API:

1. Сначала проверь, есть ли endpoint в спеке
2. Используй сгенерированные типы
3. Оберни в custom hook с TanStack Query

### При написании тестов:

1. Unit: для чистых функций и хуков без API
2. Integration: для компонентов с MSW
3. E2E: только для критических flows

### Флаги:

- `[COMPONENT]` — создать новый компонент
- `[PAGE]` — создать новую страницу
- `[HOOK]` — создать custom hook
- `[FIX]` — исправить баг
- `[REFACTOR]` — рефакторинг
- `[TEST]` — написать тесты
