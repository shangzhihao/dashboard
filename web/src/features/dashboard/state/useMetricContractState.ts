import { useEffect, useMemo, useState } from 'react';
import { getCurrentContractKey } from '../helpers';
import type { SelectOption } from './types';

export const useMetricContractState = (
  metricOptions: SelectOption[],
  defaultMetricKey: string,
  metricContractMap: Record<string, string[]>,
  contractOptions: SelectOption[],
) => {
  const [metricType, setMetricType] = useState('');
  const [contractValue, setContractValue] = useState('');
  const [currentContractKey, setCurrentContractKey] = useState('');

  useEffect(() => {
    setCurrentContractKey(getCurrentContractKey());
  }, []);

  useEffect(() => {
    if (metricType || metricOptions.length === 0) {
      return;
    }
    const nextMetric = defaultMetricKey || metricOptions[0]?.value || '';
    if (nextMetric) {
      setMetricType(nextMetric);
    }
  }, [defaultMetricKey, metricOptions, metricType]);

  const activeContractKeys = useMemo(() => {
    if (!metricType) {
      return [];
    }
    const allowed = metricContractMap[metricType];
    return allowed && allowed.length > 0
      ? allowed
      : contractOptions.map((option) => option.value);
  }, [contractOptions, metricContractMap, metricType]);

  const activeContractOptions = useMemo(() => {
    if (activeContractKeys.length === 0) {
      return [];
    }
    const allowed = new Set(activeContractKeys);
    return contractOptions.filter((option) => allowed.has(option.value));
  }, [activeContractKeys, contractOptions]);

  useEffect(() => {
    if (!metricType || activeContractKeys.length === 0) {
      return;
    }
    const fallback = activeContractKeys[0];
    const nextDefault =
      currentContractKey && activeContractKeys.includes(currentContractKey)
        ? currentContractKey
        : fallback;
    if (!contractValue || !activeContractKeys.includes(contractValue)) {
      setContractValue(nextDefault);
    }
  }, [activeContractKeys, contractValue, currentContractKey, metricType]);

  return {
    metricType,
    setMetricType,
    contractValue,
    setContractValue,
    activeContractKeys,
    activeContractOptions,
  };
};
