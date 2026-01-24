# StatusPage UI

Web interface for StatusPage API. Provides public status page and admin dashboard for service status management.

## Features

- 📊 **Public Status Page**: Real-time service status display
- 🔐 **Authentication**: JWT-based auth with role-based access control
- 🎯 **Admin Dashboard**: Manage services, events, groups, and templates
- 📱 **Responsive Design**: Mobile-first approach
- 🧪 **Well Tested**: Unit, integration, and E2E tests
- 🎨 **Modern Stack**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui

## Tech Stack

| Component        | Technology              |
|------------------|-------------------------|
| Framework        | Next.js 14 (App Router) |
| Language         | TypeScript 5            |
| Styling          | Tailwind CSS 3          |
| UI Components    | shadcn/ui               |
| State Management | TanStack Query v5       |
| Forms            | React Hook Form + Zod   |
| API Client       | openapi-fetch           |
| Testing          | Vitest + Playwright     |

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running (see [incident-garden](https://github.com/bissquit/incident-garden))

### Installation

```bash
# Clone the repository
git clone https://github.com/bissquit/statuspage-ui.git
cd statuspage-ui

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Update API specification from backend
npm run api:update

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Environment Variables

Create `.env.local` file:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
BACKEND_REPO_URL=https://raw.githubusercontent.com/bissquit/incident-garden/main
```

## Development

### Available Scripts

```bash
npm run dev           # Development server (localhost:3000)
npm run build         # Production build
npm run start         # Start production server
npm run lint          # ESLint
npm run lint:fix      # ESLint with auto-fix
npm run typecheck     # TypeScript type checking
npm run format        # Prettier formatting
npm run test          # Unit + Integration tests (watch mode)
npm run test:run      # Unit + Integration tests (single run)
npm run test:coverage # Tests with coverage report
npm run test:e2e      # E2E tests (Playwright)
npm run verify        # Full validation (lint + typecheck + test + build)
npm run api:update    # Update OpenAPI spec from backend
npm run api:generate  # Generate TypeScript types from OpenAPI
```

### Project Structure

```
statuspage-ui/
├── src/
│   ├── api/              # API client and OpenAPI types
│   ├── app/              # Next.js App Router pages
│   │   ├── (public)/     # Public pages (SSR/SSG)
│   │   ├── (auth)/       # Auth pages (login/register)
│   │   ├── dashboard/    # Protected admin area
│   │   └── settings/     # User settings
│   ├── components/
│   │   ├── ui/           # shadcn/ui components
│   │   ├── layout/       # Layout components
│   │   └── features/     # Feature components
│   ├── hooks/            # React hooks
│   ├── lib/              # Utilities and helpers
│   └── types/            # TypeScript types
├── tests/
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   ├── e2e/              # E2E tests
│   └── mocks/            # MSW mocks
└── scripts/              # Build and utility scripts
```

## API Integration

This project uses [openapi-fetch](https://openapi-ts.dev/openapi-fetch/) for type-safe API calls.

### Update API Types

When backend API changes:

```bash
# Download latest OpenAPI spec and regenerate types
npm run api:update
```

### Backend Compatibility

| Frontend | Backend  | Status       |
|----------|----------|--------------|
| 1.x.x    | >= 1.0.0 | ✅ Compatible |

## Testing

### Coverage Thresholds

Minimum coverage: **70%** for statements, branches, functions, and lines.

```bash
# Run tests with coverage
npm run test:coverage
```

### E2E Tests

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui
```

## Authentication

- **Type**: JWT tokens (access + refresh)
- **Access Token**: Short-lived (15 minutes)
- **Refresh Token**: Long-lived (7 days)
- **Storage**: In-memory (tokens not persisted in localStorage/cookies)

### Roles

- `user`: Basic user access
- `operator`: Can manage services and events
- `admin`: Full access to all features

## Contributing

Please read [CLAUDE.md](./CLAUDE.md) for development guidelines and architecture decisions.

### Before Submitting PR

```bash
# Run full validation
npm run verify
```

All checks must pass before submitting a pull request.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Related Projects

- [incident-garden](https://github.com/bissquit/incident-garden) - Backend API
