export type ChartDatum = {
  date: string;
  [key: string]: number | string;
};

export type ChartSeriesConfig = {
  key: string;
  label?: string;
  labelKey?: string;
  name?: string;
  type?: 'line' | 'area';
  yAxisId?: 'left' | 'right';
  color?: string;
  strokeWidth?: number;
  areaTopOpacity?: number;
  areaBottomOpacity?: number;
};

export type ChartAxisConfig = {
  label?: string;
  labelKey?: string;
};

export type ChartAxesConfig = {
  left?: ChartAxisConfig;
  right?: ChartAxisConfig;
};

export type ChartTitlesConfig = {
  panel?: string;
  panelKey?: string;
  chart?: string;
  chartKey?: string;
};

export type NormalizedChartSeries = {
  key: string;
  label: string;
  labelKey?: string;
  type: 'line' | 'area';
  yAxisId: 'left' | 'right';
  color: string;
  strokeWidth: number;
  areaTopOpacity: number;
  areaBottomOpacity: number;
};

export type ChartTooltipEntry = {
  dataKey?: string | number;
  color?: string;
  name?: string;
  value?: number | string | null;
};

export type ChartTooltipProps = {
  active?: boolean;
  payload?: ChartTooltipEntry[];
  label?: string | number;
};
