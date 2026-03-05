import dayjs from 'dayjs';

export const getCurrentContractKey = () => {
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  return `c${month}`;
};

export const getTodayIsoDate = () => dayjs().format('YYYY-MM-DD');

export const toApiContract = (contract: string) => {
  if (/^c\d{2}$/.test(contract)) {
    return contract.slice(1);
  }
  return contract;
};

export const toTermStructureDatePath = (value: string) => {
  const matched = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!matched) {
    return '';
  }
  return `${matched[1]}/${matched[2]}/${matched[3]}`;
};

export const resolveSecondChoice = (choices: string[], first: string) =>
  choices.find((choice) => choice !== first) || first;

export const filterCategoryOption = (
  input: string,
  option?: { label?: string | number; searchText?: string },
) => {
  const keyword = input.trim().toLowerCase();
  if (!keyword) {
    return true;
  }
  const label = String(option?.label ?? '').toLowerCase();
  const searchText = String(option?.searchText ?? '');
  return label.includes(keyword) || searchText.includes(keyword);
};
