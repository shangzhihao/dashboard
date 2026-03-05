import { useEffect, useState } from 'react';
import { resolveSecondChoice } from '../helpers';
import type { CategoryOption } from './types';

export const useInterCommodityCategoryState = (
  categoryOptions: CategoryOption[],
  activeCategoryKey: string,
) => {
  const [interCommodityLeftCategoryInput, setInterCommodityLeftCategoryInput] = useState('');
  const [interCommodityRightCategoryInput, setInterCommodityRightCategoryInput] = useState('');
  const [interCommodityLeftCategoryApplied, setInterCommodityLeftCategoryApplied] = useState('');
  const [interCommodityRightCategoryApplied, setInterCommodityRightCategoryApplied] = useState('');

  useEffect(() => {
    if (categoryOptions.length === 0) {
      return;
    }
    const categoryKeys = categoryOptions.map((option) => option.value);
    const fallbackLeft =
      activeCategoryKey && categoryKeys.includes(activeCategoryKey)
        ? activeCategoryKey
        : categoryKeys[0];
    const fallbackRight = resolveSecondChoice(categoryKeys, fallbackLeft);

    if (!interCommodityLeftCategoryInput || !categoryKeys.includes(interCommodityLeftCategoryInput)) {
      setInterCommodityLeftCategoryInput(fallbackLeft);
    }
    if (
      !interCommodityLeftCategoryApplied ||
      !categoryKeys.includes(interCommodityLeftCategoryApplied)
    ) {
      setInterCommodityLeftCategoryApplied(fallbackLeft);
    }
    if (
      !interCommodityRightCategoryInput ||
      !categoryKeys.includes(interCommodityRightCategoryInput)
    ) {
      setInterCommodityRightCategoryInput(fallbackRight);
    }
    if (
      !interCommodityRightCategoryApplied ||
      !categoryKeys.includes(interCommodityRightCategoryApplied)
    ) {
      setInterCommodityRightCategoryApplied(fallbackRight);
    }
  }, [
    activeCategoryKey,
    categoryOptions,
    interCommodityLeftCategoryApplied,
    interCommodityLeftCategoryInput,
    interCommodityRightCategoryApplied,
    interCommodityRightCategoryInput,
  ]);

  return {
    interCommodityLeftCategoryInput,
    setInterCommodityLeftCategoryInput,
    interCommodityRightCategoryInput,
    setInterCommodityRightCategoryInput,
    interCommodityLeftCategoryApplied,
    setInterCommodityLeftCategoryApplied,
    interCommodityRightCategoryApplied,
    setInterCommodityRightCategoryApplied,
  };
};
