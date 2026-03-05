import type { MonthlyChangeRow } from '../types/monthlyChange';
import { isRecord } from '../utils/guards';
import { useJsonResource } from './useJsonResource';

const normalizeRow = (value: unknown): MonthlyChangeRow | null => {
  if (!isRecord(value)) {
    return null;
  }

  const year = typeof value.year === 'string' ? value.year : String(value.year ?? '');
  if (!year) {
    return null;
  }

  const readMonth = (key: string): number | null => {
    const raw = value[key];
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      return raw;
    }
    if (raw === null) {
      return null;
    }
    if (typeof raw === 'string' && raw.trim() !== '') {
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  return {
    year,
    m01: readMonth('m01'),
    m02: readMonth('m02'),
    m03: readMonth('m03'),
    m04: readMonth('m04'),
    m05: readMonth('m05'),
    m06: readMonth('m06'),
    m07: readMonth('m07'),
    m08: readMonth('m08'),
    m09: readMonth('m09'),
    m10: readMonth('m10'),
    m11: readMonth('m11'),
    m12: readMonth('m12'),
  };
};

export const useMonthlyChangeData = (url: string) => {
  return useJsonResource({
    url,
    emptyState: { rows: [] as MonthlyChangeRow[] },
    errorPrefix: 'Failed to load monthly change data',
    mapPayload: (payload) => {
      const items =
        isRecord(payload) && Array.isArray(payload.items) ? payload.items : [];
      const normalized = items
        .map((item) => normalizeRow(item))
        .filter((item): item is MonthlyChangeRow => item !== null);
      return { rows: normalized };
    },
  });
};
