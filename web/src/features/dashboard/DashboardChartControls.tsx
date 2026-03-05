import { Button, DatePicker, Select } from 'antd';
import dayjs from 'dayjs';
import type { ReactNode } from 'react';
import { filterCategoryOption, resolveSecondChoice } from './helpers';

type Translate = (key: string, options?: Record<string, unknown>) => string;

type SelectOption = { value: string; label: string };
type CategoryOption = SelectOption & { searchText: string };

type DashboardChartControlsProps = {
  isTermStructureView: boolean;
  isCalendarSpreadView: boolean;
  isInterCommoditySpreadView: boolean;
  termStructureDateInput: string;
  setTermStructureDateInput: (value: string) => void;
  setTermStructureDateApplied: (value: string) => void;
  calendarNearContractInput: string;
  calendarFarContractInput: string;
  setCalendarNearContractInput: (value: string) => void;
  setCalendarFarContractInput: (value: string) => void;
  setCalendarNearContractApplied: (value: string) => void;
  setCalendarFarContractApplied: (value: string) => void;
  interCommodityLeftCategoryInput: string;
  interCommodityRightCategoryInput: string;
  setInterCommodityLeftCategoryInput: (value: string) => void;
  setInterCommodityRightCategoryInput: (value: string) => void;
  setInterCommodityLeftCategoryApplied: (value: string) => void;
  setInterCommodityRightCategoryApplied: (value: string) => void;
  interCommodityLeftContractInput: string;
  interCommodityRightContractInput: string;
  setInterCommodityLeftContractInput: (value: string) => void;
  setInterCommodityRightContractInput: (value: string) => void;
  setInterCommodityLeftContractApplied: (value: string) => void;
  setInterCommodityRightContractApplied: (value: string) => void;
  activeContractKeys: string[];
  activeContractOptions: SelectOption[];
  categoryOptions: CategoryOption[];
  setActiveCategoryKey: (value: string) => void;
  translate: Translate;
};

const DashboardChartControls = ({
  isTermStructureView,
  isCalendarSpreadView,
  isInterCommoditySpreadView,
  termStructureDateInput,
  setTermStructureDateInput,
  setTermStructureDateApplied,
  calendarNearContractInput,
  calendarFarContractInput,
  setCalendarNearContractInput,
  setCalendarFarContractInput,
  setCalendarNearContractApplied,
  setCalendarFarContractApplied,
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
  activeContractKeys,
  activeContractOptions,
  categoryOptions,
  setActiveCategoryKey,
  translate,
}: DashboardChartControlsProps): ReactNode => {
  if (isTermStructureView) {
    return (
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
  }

  if (isCalendarSpreadView) {
    return (
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
  }

  if (isInterCommoditySpreadView) {
    return (
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
  }

  return undefined;
};

export default DashboardChartControls;
