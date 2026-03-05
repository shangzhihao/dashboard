import type { NormalizedChartSeries } from '../../types/chart';

type Translate = (key: string) => string;

type ChartLegendProps = {
  resolvedSeries: NormalizedChartSeries[];
  hiddenSeriesKeys: Set<string>;
  onToggle: (dataKey: string) => void;
  translate: Translate;
};

const ChartLegend = ({
  resolvedSeries,
  hiddenSeriesKeys,
  onToggle,
  translate,
}: ChartLegendProps) => {
  return (
    <div className="chart-legend">
      {resolvedSeries.map((series) => {
        const label = series.labelKey ? translate(series.labelKey) : series.label;
        const isHidden = hiddenSeriesKeys.has(series.key);
        const color = isHidden ? '#c2c6d6' : series.color || '#6d63f3';
        return (
          <button
            key={series.key}
            type="button"
            className="chart-legend-item"
            onClick={() => {
              onToggle(series.key);
            }}
            style={{ color }}
          >
            <span className="chart-legend-dot" style={{ background: color }} />
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default ChartLegend;
