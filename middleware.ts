import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Маршруты, требующие авторизации
const protectedRoutes = ['/dashboard', '/settings'];

// Маршруты только для неавторизованных
const authRoutes = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Проверяем наличие токена (в реальности нужна более надежная проверка)
  // Так как токен хранится в памяти (window.__AUTH_TOKEN__), middleware не может его проверить
  // Поэтому используем cookie-based подход или проверку в client component

  // Для простоты пока пропускаем все запросы
  // В production должна быть проверка JWT токена из cookie или header

  // Если это защищенный маршрут и нет токена - редирект на login
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Если это auth маршрут и есть токен - редирект на dashboard
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // В текущей реализации защита происходит на уровне client components
  // через useAuth hook и AuthProvider

  return NextResponse.next();
}

// Указываем, на каких путях должен работать middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
