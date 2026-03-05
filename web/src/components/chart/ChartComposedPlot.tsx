import {
  Area,
  Brush,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DefaultLegendContentProps } from 'recharts';
import ChartTooltip from './ChartTooltip';
import type { ChartDatum, NormalizedChartSeries } from '../../types/chart';

type ChartAxesLabels = {
  leftAxisLabel: string;
  rightAxisLabel: string;
};

type ChartComposedPlotProps = {
  chartData: ChartDatum[];
  visibleSeries: NormalizedChartSeries[];
  leftAxisDomain: [number, number] | undefined;
  rightAxisDomain: [number, number] | undefined;
  showRightAxis: boolean;
  yAxisTickFormatter: (value: string | number) => string;
  xAxisTickFormatter: (value: string | number) => string;
  axisLabels: ChartAxesLabels;
  legendHeight: number;
  onLegendRender: (props: DefaultLegendContentProps) => React.ReactNode;
  onChartClick: (event: { activeLabel?: string | number; activePayload?: unknown } | null) => void;
  resolveSeriesLabel: (series: NormalizedChartSeries) => string;
};

const ChartDefs = ({ visibleSeries }: { visibleSeries: NormalizedChartSeries[] }) => (
  <defs>
    {visibleSeries
      .filter((series) => series.type === 'area')
      .map((series) => (
        <linearGradient key={series.key} id={`area-${series.key}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={series.color} stopOpacity={series.areaTopOpacity} />
          <stop offset="100%" stopColor={series.color} stopOpacity={series.areaBottomOpacity} />
        </linearGradient>
      ))}
  </defs>
);

const ChartAxes = ({
  xAxisTickFormatter,
  yAxisTickFormatter,
  leftAxisDomain,
  rightAxisDomain,
  showRightAxis,
  axisLabels,
}: {
  xAxisTickFormatter: (value: string | number) => string;
  yAxisTickFormatter: (value: string | number) => string;
  leftAxisDomain: [number, number] | undefined;
  rightAxisDomain: [number, number] | undefined;
  showRightAxis: boolean;
  axisLabels: ChartAxesLabels;
}) => (
  <>
    <XAxis
      dataKey="date"
      tick={{ fill: '#7a8199', fontSize: 11 }}
      minTickGap={16}
      interval="preserveStartEnd"
      tickFormatter={xAxisTickFormatter}
    />
    <YAxis
      yAxisId="left"
      tick={{ fill: '#7a8199', fontSize: 11 }}
      width={84}
      tickMargin={8}
      domain={leftAxisDomain}
      tickFormatter={yAxisTickFormatter}
      label={{ value: axisLabels.leftAxisLabel, angle: -90, position: 'insideLeft', dx: 6, fill: '#a0a7bd' }}
    />
    {showRightAxis ? (
      <YAxis
        yAxisId="right"
        orientation="right"
        tick={{ fill: '#7a8199', fontSize: 11 }}
        width={84}
        tickMargin={8}
        domain={rightAxisDomain}
        tickFormatter={yAxisTickFormatter}
        label={{ value: axisLabels.rightAxisLabel, angle: 90, position: 'insideRight', dx: -6, fill: '#a0a7bd' }}
      />
    ) : null}
  </>
);

const ChartSeriesLayers = ({
  visibleSeries,
  resolveSeriesLabel,
}: {
  visibleSeries: NormalizedChartSeries[];
  resolveSeriesLabel: (series: NormalizedChartSeries) => string;
}) => (
  <>
    {visibleSeries.map((series) => {
      const seriesLabel = resolveSeriesLabel(series);
      return series.type === 'area' ? (
        <Area
          key={series.key}
          yAxisId={series.yAxisId}
          type="monotone"
          dataKey={series.key}
          name={seriesLabel}
          connectNulls
          stroke={series.color}
          strokeWidth={series.strokeWidth}
          fill={`url(#area-${series.key})`}
        />
      ) : (
        <Line
          key={series.key}
          yAxisId={series.yAxisId}
          type="monotone"
          dataKey={series.key}
          name={seriesLabel}
          connectNulls
          stroke={series.color}
          strokeWidth={series.strokeWidth}
          dot={false}
        />
      );
    })}
  </>
);

const ChartComposedPlot = ({
  chartData,
  visibleSeries,
  leftAxisDomain,
  rightAxisDomain,
  showRightAxis,
  yAxisTickFormatter,
  xAxisTickFormatter,
  axisLabels,
  legendHeight,
  onLegendRender,
  onChartClick,
  resolveSeriesLabel,
}: ChartComposedPlotProps) => (
  <ResponsiveContainer width="100%" height="100%">
    <ComposedChart data={chartData} margin={{ top: 10, right: 24, left: 10, bottom: 0 }} onClick={onChartClick}>
      <ChartDefs visibleSeries={visibleSeries} />
      <CartesianGrid stroke="#e6e9f2" strokeDasharray="3 3" vertical={false} />
      <ChartAxes
        xAxisTickFormatter={xAxisTickFormatter}
        yAxisTickFormatter={yAxisTickFormatter}
        leftAxisDomain={leftAxisDomain}
        rightAxisDomain={rightAxisDomain}
        showRightAxis={showRightAxis}
        axisLabels={axisLabels}
      />
      <Tooltip content={<ChartTooltip />} />
      <Legend verticalAlign="top" height={legendHeight} iconType="circle" content={onLegendRender} />
      <ChartSeriesLayers visibleSeries={visibleSeries} resolveSeriesLabel={resolveSeriesLabel} />
      <Brush dataKey="date" height={24} stroke="#6d63f3" travellerWidth={10} tickFormatter={xAxisTickFormatter} />
    </ComposedChart>
  </ResponsiveContainer>
);

export default ChartComposedPlot;
