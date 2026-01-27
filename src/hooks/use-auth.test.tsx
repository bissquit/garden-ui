import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './use-auth';
import type { ReactNode } from 'react';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock API client
vi.mock('@/api/client', () => ({
  publicClient: {
    POST: vi.fn(),
  },
}));

import { publicClient } from '@/api/client';

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof window !== 'undefined') {
      window.__AUTH_TOKEN__ = undefined;
    }
  });

  it('starts with unauthenticated state', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('login sets user and tokens', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      role: 'admin' as const,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    };
    const mockTokens = {
      access_token: 'test-token',
      refresh_token: 'test-refresh',
      expires_in: 900,
    };

    vi.mocked(publicClient.POST).mockResolvedValueOnce({
      data: { data: { user: mockUser, tokens: mockTokens } },
      response: { status: 200 },
    } as any);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });

  it('hasMinRole checks role hierarchy correctly', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      role: 'operator' as const,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    };
    const mockTokens = {
      access_token: 'test-token',
      refresh_token: 'test-refresh',
      expires_in: 900,
    };

    vi.mocked(publicClient.POST).mockResolvedValueOnce({
      data: { data: { user: mockUser, tokens: mockTokens } },
      response: { status: 200 },
    } as any);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    expect(result.current.hasMinRole('user')).toBe(true);
    expect(result.current.hasMinRole('operator')).toBe(true);
    expect(result.current.hasMinRole('admin')).toBe(false);
  });
});
