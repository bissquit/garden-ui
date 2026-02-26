import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useForgotPassword, useResetPassword } from './use-auth-recovery';
import { ApiError } from '@/lib/api-error';
import { type ReactNode, createElement } from 'react';

// Mock publicClient
vi.mock('@/api/client', () => ({
  publicClient: {
    POST: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  Wrapper.displayName = 'TestWrapper';

  return Wrapper;
}

describe('useForgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls POST /api/v1/auth/forgot-password with correct body', async () => {
    const { publicClient } = await import('@/api/client');
    vi.mocked(publicClient.POST).mockResolvedValue({
      data: { data: { message: 'If the email exists, a reset link has been sent' } },
      error: undefined,
      response: { status: 200 } as Response,
    });

    const { result } = renderHook(() => useForgotPassword(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ email: 'user@example.com' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(publicClient.POST).toHaveBeenCalledWith('/api/v1/auth/forgot-password', {
      body: { email: 'user@example.com' },
    });
  });

  it('returns message on success', async () => {
    const { publicClient } = await import('@/api/client');
    vi.mocked(publicClient.POST).mockResolvedValue({
      data: { data: { message: 'If the email exists, a reset link has been sent' } },
      error: undefined,
      response: { status: 200 } as Response,
    });

    const { result } = renderHook(() => useForgotPassword(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ email: 'user@example.com' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe('If the email exists, a reset link has been sent');
  });

  it('throws ApiError on error response', async () => {
    const { publicClient } = await import('@/api/client');
    vi.mocked(publicClient.POST).mockResolvedValue({
      data: undefined,
      error: { error: { message: 'Email is not configured' } },
      response: { status: 400 } as Response,
    });

    const { result } = renderHook(() => useForgotPassword(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ email: 'user@example.com' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect((result.current.error as ApiError).status).toBe(400);
    expect((result.current.error as ApiError).message).toBe('Email is not configured');
  });
});

describe('useResetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls POST /api/v1/auth/reset-password with correct body', async () => {
    const { publicClient } = await import('@/api/client');
    vi.mocked(publicClient.POST).mockResolvedValue({
      data: undefined,
      error: undefined,
      response: { status: 204 } as Response,
    });

    const { result } = renderHook(() => useResetPassword(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ token: 'reset-token', new_password: 'newpass123' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(publicClient.POST).toHaveBeenCalledWith('/api/v1/auth/reset-password', {
      body: { token: 'reset-token', new_password: 'newpass123' },
    });
  });

  it('handles 204 response successfully', async () => {
    const { publicClient } = await import('@/api/client');
    vi.mocked(publicClient.POST).mockResolvedValue({
      data: undefined,
      error: undefined,
      response: { status: 204 } as Response,
    });

    const { result } = renderHook(() => useResetPassword(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ token: 'reset-token', new_password: 'newpass123' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.error).toBeNull();
  });

  it('throws ApiError on 400 response', async () => {
    const { publicClient } = await import('@/api/client');
    vi.mocked(publicClient.POST).mockResolvedValue({
      data: undefined,
      error: { error: { message: 'Invalid or expired token' } },
      response: { status: 400 } as Response,
    });

    const { result } = renderHook(() => useResetPassword(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ token: 'bad-token', new_password: 'newpass123' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect((result.current.error as ApiError).status).toBe(400);
    expect((result.current.error as ApiError).message).toBe('Invalid or expired token');
  });
});
