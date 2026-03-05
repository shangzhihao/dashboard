import { Card, Select, Space, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { getNumberLocale, normalizeLanguage } from '../i18n';
import type { MonthlyChangeRow } from '../types/monthlyChange';

const { Title } = Typography;

type MonthlyChangePanelProps = {
  title: string;
  rows: MonthlyChangeRow[];
  contractOptions: Array<{ value: string; label: string }>;
  contractValue: string;
  onContractChange: (value: string) => void;
};

const monthKeys = [
  'm01',
  'm02',
  'm03',
  'm04',
  'm05',
  'm06',
  'm07',
  'm08',
  'm09',
  'm10',
  'm11',
  'm12',
] as const;

type ChangeCellProps = {
  rowYear: string;
  monthKey: (typeof monthKeys)[number];
  value: number | null;
  formatter: Intl.NumberFormat;
};

const ChangeCell = ({ rowYear, monthKey, value, formatter }: ChangeCellProps) => {
  if (value === null) {
    return (
      <td key={`${rowYear}-${monthKey}`} className="monthly-change-cell is-empty">
        -
      </td>
    );
  }

  const variant = value >= 0 ? 'is-up' : 'is-down';
  return (
    <td key={`${rowYear}-${monthKey}`} className={`monthly-change-cell ${variant}`}>
      {formatter.format(value)}%
    </td>
  );
};

type MonthlyChangeTableProps = {
  rows: MonthlyChangeRow[];
  translate: (key: string) => string;
  formatter: Intl.NumberFormat;
};

const MonthlyChangeTable = ({ rows, translate, formatter }: MonthlyChangeTableProps) => (
  <table className="monthly-change-table">
    <thead>
      <tr>
        <th>{translate('stats.monthlyChange.year')}</th>
        {monthKeys.map((key) => (
          <th key={key}>{translate(`stats.monthlyChange.months.${key}`)}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map((row) => (
        <tr key={row.year}>
          <td className="monthly-change-year">{row.year}</td>
          {monthKeys.map((monthKey) => (
            <ChangeCell
              key={`${row.year}-${monthKey}`}
              rowYear={row.year}
              monthKey={monthKey}
              value={row[monthKey]}
              formatter={formatter}
            />
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

const MonthlyChangePanel = ({
  title,
  rows,
  contractOptions,
  contractValue,
  onContractChange,
}: MonthlyChangePanelProps) => {
  const { t, i18n } = useTranslation();
  const language = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);
  const toggleText = language === 'en' ? '中' : 'EN';
  const formatter = new Intl.NumberFormat(getNumberLocale(i18n.language), {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return (
    <Card className="panel" styles={{ body: { padding: 18 } }}>
      <div className="panel-header">
        <Title level={5} className="panel-title">
          {title}
        </Title>
        <Space wrap>
          <Select className="filter" value={contractValue} onChange={onContractChange} options={contractOptions} />
        </Space>
      </div>

      <div className="monthly-change-wrap">
        <MonthlyChangeTable rows={rows} translate={t} formatter={formatter} />
      </div>

      <div className="monthly-change-note">{t('stats.monthlyChange.note')}</div>
      <div className="panel-footer">
        {t('footer.copyright', { yearStart: 2018, yearEnd: 2026 })}{' '}
        <button
          type="button"
          className="footer-lang-toggle"
          onClick={() => i18n.changeLanguage(language === 'en' ? 'zh' : 'en')}
        >
          {toggleText}
        </button>
      </div>
    </Card>
  );
};

export default MonthlyChangePanel;
