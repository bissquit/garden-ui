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
import { apiClient, publicClient } from '@/api/client';
import type { User, Role } from '@/types';
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
  const [isLoading, setIsLoading] = useState(true);

  // Восстановление сессии при загрузке
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await apiClient.GET('/api/v1/me');
        if (!error && data?.data) {
          setUser(data.data as User);
        }
      } catch {
        // Not authenticated, that's ok
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  // Обработка 401 ошибок (session expired)
  useEffect(() => {
    const handleUnauthorized = () => {
      // Очищаем состояние только если пользователь был залогинен
      if (user) {
        setUser(null);

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
      if (!loginData?.user) {
        throw new Error('Invalid response from server');
      }

      setUser(loginData.user as User);
      // Токены теперь в cookies, устанавливаются сервером автоматически

      router.push('/dashboard');
    },
    [router]
  );

  const logout = useCallback(async () => {
    try {
      // Send empty refresh_token - backend will use HTTP-only cookie instead
      await apiClient.POST('/api/v1/auth/logout', {
        body: { refresh_token: '' },
      });
    } catch {
      // Ignore errors during logout
    }

    setUser(null);

    router.push('/login');
  }, [router]);

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
    isAuthenticated: !!user,
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
