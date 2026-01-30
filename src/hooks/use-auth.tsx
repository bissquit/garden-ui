'use client';

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { publicClient } from '@/api/client';
import type { User, TokenPair, Role } from '@/types';
import { ApiError } from '@/lib/api-error';
import { useToast } from '@/hooks/use-toast';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: Role) => boolean;
  hasMinRole: (minRole: Role) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ROLE_HIERARCHY: Record<Role, number> = {
  user: 1,
  operator: 2,
  admin: 3,
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<TokenPair | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Восстановление сессии при загрузке
  useEffect(() => {
    // В реальном приложении можно попробовать восстановить сессию
    // Пока просто помечаем, что загрузка завершена
    setIsLoading(false);
  }, []);

  // Обновляем глобальный токен для API клиента
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__AUTH_TOKEN__ = tokens?.access_token;
    }
  }, [tokens]);

  // Обработка 401 ошибок (session expired)
  useEffect(() => {
    const handleUnauthorized = () => {
      // Очищаем состояние только если пользователь был залогинен
      if (user) {
        setUser(null);
        setTokens(null);
        if (typeof window !== 'undefined') {
          window.__AUTH_TOKEN__ = undefined;
        }

        toast({
          title: 'Session expired',
          description: 'Please log in again',
          variant: 'destructive',
        });

        router.push('/login');
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('auth:unauthorized', handleUnauthorized);
      return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }
  }, [user, router, toast]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data, error, response } = await publicClient.POST(
        '/api/v1/auth/login',
        {
          body: { email, password },
        }
      );

      if (error || !data) {
        throw ApiError.fromResponse(response.status, error as any);
      }

      const loginData = data.data;
      if (!loginData?.user || !loginData?.tokens) {
        throw new Error('Invalid response from server');
      }

      setUser(loginData.user as User);
      setTokens(loginData.tokens as TokenPair);

      router.push('/dashboard');
    },
    [router]
  );

  const logout = useCallback(async () => {
    if (tokens?.refresh_token) {
      try {
        await publicClient.POST('/api/v1/auth/logout', {
          body: { refresh_token: tokens.refresh_token },
        });
      } catch {
        // Ignore errors during logout
      }
    }

    setUser(null);
    setTokens(null);
    if (typeof window !== 'undefined') {
      window.__AUTH_TOKEN__ = undefined;
    }

    router.push('/login');
  }, [tokens, router]);

  const hasRole = useCallback(
    (role: Role): boolean => {
      return user?.role === role;
    },
    [user]
  );

  const hasMinRole = useCallback(
    (minRole: Role): boolean => {
      if (!user) return false;
      return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[minRole];
    },
    [user]
  );

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user && !!tokens,
    isLoading,
    login,
    logout,
    hasRole,
    hasMinRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
