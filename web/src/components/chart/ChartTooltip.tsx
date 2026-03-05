import type { ChartTooltipProps } from '../../types/chart';
import { tooltipFormatter } from '../../utils/chart';

const ChartTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{label}</div>
      {payload.map((entry) => (
        <div key={String(entry.dataKey ?? entry.name ?? 'series')} className="chart-tooltip-row">
          <span className="dot" style={{ background: entry.color }} />
          <span className="name">{entry.name}</span>
          <span className="value">{tooltipFormatter(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default ChartTooltip;
