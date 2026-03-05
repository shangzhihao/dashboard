import { Button, DatePicker, Select } from 'antd';
import dayjs from 'dayjs';
import type { ReactNode } from 'react';
import { filterCategoryOption, resolveSecondChoice } from './helpers';
import type { DashboardControlsModel } from './models';

type DashboardChartControlsProps = {
  model: DashboardControlsModel;
};

type TermStructureControlsProps = Pick<
  DashboardControlsModel,
  'termStructureDateInput' | 'setTermStructureDateInput' | 'setTermStructureDateApplied' | 'translate'
>;

const TermStructureControls = ({
  termStructureDateInput,
  setTermStructureDateInput,
  setTermStructureDateApplied,
  translate,
}: TermStructureControlsProps): ReactNode => (
  <>
    <DatePicker
      className="filter"
      allowClear={false}
      value={dayjs(termStructureDateInput)}
      onChange={(value) => {
        if (!value) {
          return;
        }
        setTermStructureDateInput(value.format('YYYY-MM-DD'));
      }}
    />
    <Button
      type="primary"
      onClick={() => {
        setTermStructureDateApplied(termStructureDateInput);
      }}
    >
      {translate('common.query')}
    </Button>
  </>
);

type CalendarSpreadControlsProps = Pick<
  DashboardControlsModel,
  | 'calendarNearContractInput'
  | 'calendarFarContractInput'
  | 'setCalendarNearContractInput'
  | 'setCalendarFarContractInput'
  | 'setCalendarNearContractApplied'
  | 'setCalendarFarContractApplied'
  | 'activeContractKeys'
  | 'activeContractOptions'
  | 'translate'
>;

const CalendarSpreadControls = ({
  calendarNearContractInput,
  calendarFarContractInput,
  setCalendarNearContractInput,
  setCalendarFarContractInput,
  setCalendarNearContractApplied,
  setCalendarFarContractApplied,
  activeContractKeys,
  activeContractOptions,
  translate,
}: CalendarSpreadControlsProps): ReactNode => (
  <>
    <Select
      className="filter"
      value={calendarNearContractInput}
      onChange={(value) => {
        setCalendarNearContractInput(value);
        if (value === calendarFarContractInput) {
          setCalendarFarContractInput(resolveSecondChoice(activeContractKeys, value));
        }
      }}
      options={activeContractOptions}
      placeholder={translate('chart.calendarSpread.nearContract')}
    />
    <Select
      className="filter"
      value={calendarFarContractInput}
      onChange={(value) => {
        setCalendarFarContractInput(value);
        if (value === calendarNearContractInput) {
          setCalendarNearContractInput(resolveSecondChoice(activeContractKeys, value));
        }
      }}
      options={activeContractOptions}
      placeholder={translate('chart.calendarSpread.farContract')}
    />
    <Button
      type="primary"
      disabled={
        !calendarNearContractInput ||
        !calendarFarContractInput ||
        calendarNearContractInput === calendarFarContractInput
      }
      onClick={() => {
        setCalendarNearContractApplied(calendarNearContractInput);
        setCalendarFarContractApplied(calendarFarContractInput);
      }}
    >
      {translate('common.query')}
    </Button>
  </>
);

type InterCommoditySpreadControlsProps = Pick<
  DashboardControlsModel,
  | 'interCommodityLeftCategoryInput'
  | 'interCommodityRightCategoryInput'
  | 'setInterCommodityLeftCategoryInput'
  | 'setInterCommodityRightCategoryInput'
  | 'setInterCommodityLeftCategoryApplied'
  | 'setInterCommodityRightCategoryApplied'
  | 'interCommodityLeftContractInput'
  | 'interCommodityRightContractInput'
  | 'setInterCommodityLeftContractInput'
  | 'setInterCommodityRightContractInput'
  | 'setInterCommodityLeftContractApplied'
  | 'setInterCommodityRightContractApplied'
  | 'activeContractOptions'
  | 'categoryOptions'
  | 'setActiveCategoryKey'
  | 'translate'
>;

const InterCommoditySpreadControls = ({
  interCommodityLeftCategoryInput,
  interCommodityRightCategoryInput,
  setInterCommodityLeftCategoryInput,
  setInterCommodityRightCategoryInput,
  setInterCommodityLeftCategoryApplied,
  setInterCommodityRightCategoryApplied,
  interCommodityLeftContractInput,
  interCommodityRightContractInput,
  setInterCommodityLeftContractInput,
  setInterCommodityRightContractInput,
  setInterCommodityLeftContractApplied,
  setInterCommodityRightContractApplied,
  activeContractOptions,
  categoryOptions,
  setActiveCategoryKey,
  translate,
}: InterCommoditySpreadControlsProps): ReactNode => (
  <>
    <Select
      className="filter"
      showSearch
      optionFilterProp="label"
      filterOption={(input, option) =>
        filterCategoryOption(input, option as { label?: string; searchText?: string })
      }
      value={interCommodityLeftCategoryInput}
      onChange={(value) => {
        const categoryKeys = categoryOptions.map((option) => option.value);
        setInterCommodityLeftCategoryInput(value);
        setActiveCategoryKey(value);
        if (value === interCommodityRightCategoryInput) {
          setInterCommodityRightCategoryInput(resolveSecondChoice(categoryKeys, value));
        }
      }}
      options={categoryOptions}
      placeholder={translate('chart.interCommoditySpread.leftCategory')}
    />
    <Select
      className="filter"
      value={interCommodityLeftContractInput}
      onChange={setInterCommodityLeftContractInput}
      options={activeContractOptions}
      placeholder={translate('chart.interCommoditySpread.leftContract')}
    />
    <Select
      className="filter"
      showSearch
      optionFilterProp="label"
      filterOption={(input, option) =>
        filterCategoryOption(input, option as { label?: string; searchText?: string })
      }
      value={interCommodityRightCategoryInput}
      onChange={(value) => {
        const categoryKeys = categoryOptions.map((option) => option.value);
        setInterCommodityRightCategoryInput(value);
        if (value === interCommodityLeftCategoryInput) {
          const fallbackLeft = resolveSecondChoice(categoryKeys, value);
          setInterCommodityLeftCategoryInput(fallbackLeft);
          setActiveCategoryKey(fallbackLeft);
        }
      }}
      options={categoryOptions}
      placeholder={translate('chart.interCommoditySpread.rightCategory')}
    />
    <Select
      className="filter"
      value={interCommodityRightContractInput}
      onChange={setInterCommodityRightContractInput}
      options={activeContractOptions}
      placeholder={translate('chart.interCommoditySpread.rightContract')}
    />
    <Button
      type="primary"
      disabled={
        !interCommodityLeftCategoryInput ||
        !interCommodityRightCategoryInput ||
        !interCommodityLeftContractInput ||
        !interCommodityRightContractInput ||
        (interCommodityLeftCategoryInput === interCommodityRightCategoryInput &&
          interCommodityLeftContractInput === interCommodityRightContractInput)
      }
      onClick={() => {
        setInterCommodityLeftCategoryApplied(interCommodityLeftCategoryInput);
        setInterCommodityRightCategoryApplied(interCommodityRightCategoryInput);
        setInterCommodityLeftContractApplied(interCommodityLeftContractInput);
        setInterCommodityRightContractApplied(interCommodityRightContractInput);
      }}
    >
      {translate('common.query')}
    </Button>
  </>
);

const DashboardChartControls = ({ model }: DashboardChartControlsProps): ReactNode => {
  if (model.isTermStructureView) {
    return <TermStructureControls {...model} />;
  }
  if (model.isCalendarSpreadView) {
    return <CalendarSpreadControls {...model} />;
  }
  if (model.isInterCommoditySpreadView) {
    return <InterCommoditySpreadControls {...model} />;
  }
  return undefined;
};

export default DashboardChartControls;
