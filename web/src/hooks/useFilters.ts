import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { isRecord } from '../utils/guards';
import { useJsonResource } from './useJsonResource';

type FilterMetric = {
  key: string;
  label?: string;
  labelKey?: string;
  contractKeys?: string[];
};

type FilterContract = {
  key: string;
  label?: string;
  labelKey?: string;
};

const normalizeMetrics = (value: unknown): FilterMetric[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!isRecord(entry) || typeof entry.key !== 'string') {
      return [];
    }

    const label = typeof entry.label === 'string' ? entry.label : undefined;
    const labelKey = typeof entry.labelKey === 'string' ? entry.labelKey : undefined;
    const contractKeys = Array.isArray(entry.contractKeys)
      ? entry.contractKeys.filter((key): key is string => typeof key === 'string')
      : undefined;

    return [
      {
        key: entry.key,
        label,
        labelKey,
        contractKeys,
      },
    ];
  });
};

const normalizeContracts = (value: unknown): FilterContract[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (!isRecord(entry) || typeof entry.key !== 'string') {
      return [];
    }

    const label = typeof entry.label === 'string' ? entry.label : undefined;
    const labelKey = typeof entry.labelKey === 'string' ? entry.labelKey : undefined;

    return [
      {
        key: entry.key,
        label,
        labelKey,
      },
    ];
  });
};

const resolveLabel = (
  translate: (key: string) => string,
  labelKey?: string,
  label?: string,
  fallback?: string,
) => {
  if (labelKey) {
    return translate(labelKey);
  }
  if (label) {
    return label;
  }
  return fallback ?? '';
};

export const useFilters = (filtersUrl: string) => {
  const { t } = useTranslation();
  const loaded = useJsonResource({
    url: filtersUrl,
    emptyState: {
      metrics: [] as FilterMetric[],
      contracts: [] as FilterContract[],
      defaultMetricKey: '',
    },
    errorPrefix: 'Failed to load filters',
    mapPayload: (payload) => {
      const metricsPayload =
        isRecord(payload) && Array.isArray(payload.metrics) ? payload.metrics : [];
      const contractsPayload =
        isRecord(payload) && Array.isArray(payload.contracts) ? payload.contracts : [];
      const defaultMetric =
        isRecord(payload) && typeof payload.defaultMetric === 'string'
          ? payload.defaultMetric
          : '';
      const nextMetrics = normalizeMetrics(metricsPayload);
      const nextContracts = normalizeContracts(contractsPayload);
      return {
        metrics: nextMetrics,
        contracts: nextContracts,
        defaultMetricKey: defaultMetric || nextMetrics[0]?.key || '',
      };
    },
  });
  const { metrics, contracts, defaultMetricKey } = loaded;

  const metricOptions = useMemo(
    () =>
      metrics.map((metric) => ({
        value: metric.key,
        label: resolveLabel(t, metric.labelKey, metric.label, metric.key),
      })),
    [metrics, t],
  );

  const contractOptions = useMemo(
    () =>
      contracts.map((contract) => ({
        value: contract.key,
        label: resolveLabel(t, contract.labelKey, contract.label, contract.key),
      })),
    [contracts, t],
  );

  const contractLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    contracts.forEach((contract) => {
      map[contract.key] = resolveLabel(t, contract.labelKey, contract.label, contract.key);
    });
    return map;
  }, [contracts, t]);

  const metricLabelMap = useMemo(() => {
    const map: Record<string, string> = {};
    metrics.forEach((metric) => {
      map[metric.key] = resolveLabel(t, metric.labelKey, metric.label, metric.key);
    });
    return map;
  }, [metrics, t]);

  const metricContractMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    metrics.forEach((metric) => {
      map[metric.key] = metric.contractKeys ? [...metric.contractKeys] : [];
    });
    return map;
  }, [metrics]);

  return {
    metricOptions,
    contractOptions,
    metricContractMap,
    contractLabelMap,
    metricLabelMap,
    defaultMetricKey,
  };
};
