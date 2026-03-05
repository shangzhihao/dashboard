import { useEffect, useState } from 'react';

export const useInterCommodityContractState = (activeContractKeys: string[]) => {
  const [interCommodityLeftContractInput, setInterCommodityLeftContractInput] = useState('');
  const [interCommodityRightContractInput, setInterCommodityRightContractInput] = useState('');
  const [interCommodityLeftContractApplied, setInterCommodityLeftContractApplied] = useState('');
  const [interCommodityRightContractApplied, setInterCommodityRightContractApplied] = useState('');

  useEffect(() => {
    if (activeContractKeys.length === 0) {
      return;
    }
    const fallback = activeContractKeys[0];

    if (
      !interCommodityLeftContractInput ||
      !activeContractKeys.includes(interCommodityLeftContractInput)
    ) {
      setInterCommodityLeftContractInput(fallback);
    }
    if (
      !interCommodityLeftContractApplied ||
      !activeContractKeys.includes(interCommodityLeftContractApplied)
    ) {
      setInterCommodityLeftContractApplied(fallback);
    }
    if (
      !interCommodityRightContractInput ||
      !activeContractKeys.includes(interCommodityRightContractInput)
    ) {
      setInterCommodityRightContractInput(fallback);
    }
    if (
      !interCommodityRightContractApplied ||
      !activeContractKeys.includes(interCommodityRightContractApplied)
    ) {
      setInterCommodityRightContractApplied(fallback);
    }
  }, [
    activeContractKeys,
    interCommodityLeftContractApplied,
    interCommodityLeftContractInput,
    interCommodityRightContractApplied,
    interCommodityRightContractInput,
  ]);

  return {
    interCommodityLeftContractInput,
    setInterCommodityLeftContractInput,
    interCommodityRightContractInput,
    setInterCommodityRightContractInput,
    interCommodityLeftContractApplied,
    setInterCommodityLeftContractApplied,
    interCommodityRightContractApplied,
    setInterCommodityRightContractApplied,
  };
};
