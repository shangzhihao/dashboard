import { useEffect, useState } from 'react';
import type {
  ChartAxesConfig,
  ChartDatum,
  ChartSeriesConfig,
  ChartTitlesConfig,
} from '../types/chart';
import { isRecord } from '../utils/guards';

export const useChartData = (chartDataUrl: string) => {
  const [chartData, setChartData] = useState<ChartDatum[]>([]);
  const [chartSeries, setChartSeries] = useState<ChartSeriesConfig[]>([]);
  const [chartAxes, setChartAxes] = useState<ChartAxesConfig>({});
  const [chartTitles, setChartTitles] = useState<ChartTitlesConfig>({});

  useEffect(() => {
    let isMounted = true;

    const loadChartData = async () => {
      try {
        const response = await fetch(chartDataUrl, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Failed to load chart data: ${response.status}`);
        }
        const payload: unknown = await response.json();
        const items = Array.isArray(payload)
          ? payload
          : isRecord(payload) && Array.isArray(payload.items)
            ? payload.items
            : [];
        const series =
          isRecord(payload) && Array.isArray(payload.series) ? payload.series : [];
        const axes = isRecord(payload) && isRecord(payload.axes) ? payload.axes : {};
        const titles =
          isRecord(payload) && isRecord(payload.titles) ? payload.titles : {};
        if (isMounted) {
          setChartData((Array.isArray(items) ? items : []) as ChartDatum[]);
          setChartSeries(series as ChartSeriesConfig[]);
          setChartAxes(axes as ChartAxesConfig);
          setChartTitles(titles as ChartTitlesConfig);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn(error);
        if (isMounted) {
          setChartData([]);
          setChartSeries([]);
          setChartAxes({});
          setChartTitles({});
        }
      }
    };

    loadChartData();

    return () => {
      isMounted = false;
    };
  }, [chartDataUrl]);

  return { chartData, chartSeries, chartAxes, chartTitles };
};
