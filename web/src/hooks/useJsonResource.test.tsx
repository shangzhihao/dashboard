import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useJsonResource } from './useJsonResource';

const mockFetch = (payload: unknown, ok = true) => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      json: async () => payload,
    } as Response),
  );
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('useJsonResource', () => {
  it('loads and maps payload', async () => {
    mockFetch({ value: 42 });

    const { result } = renderHook(() =>
      useJsonResource({
        url: '/data/mock.json',
        emptyState: { value: 0 },
        errorPrefix: 'Failed to load mock',
        mapPayload: (payload) => {
          const value =
            payload && typeof payload === 'object' && 'value' in payload
              ? Number((payload as { value?: unknown }).value)
              : 0;
          return { value: Number.isFinite(value) ? value : 0 };
        },
      }),
    );

    await waitFor(() => {
      expect(result.current.value).toBe(42);
    });
  });

  it('returns empty state when url is missing', async () => {
    const { result } = renderHook(() =>
      useJsonResource({
        url: '',
        emptyState: { value: 7 },
        errorPrefix: 'Failed to load mock',
        mapPayload: () => ({ value: 1 }),
      }),
    );

    await waitFor(() => {
      expect(result.current.value).toBe(7);
    });
  });
});
