import { useEffect, useState } from 'react';
import { resolveSecondChoice } from '../helpers';

export const useCalendarState = (activeContractKeys: string[]) => {
  const [calendarNearContractInput, setCalendarNearContractInput] = useState('');
  const [calendarFarContractInput, setCalendarFarContractInput] = useState('');
  const [calendarNearContractApplied, setCalendarNearContractApplied] = useState('');
  const [calendarFarContractApplied, setCalendarFarContractApplied] = useState('');

  useEffect(() => {
    if (activeContractKeys.length === 0) {
      return;
    }
    const fallbackNear = activeContractKeys[0];
    const fallbackFar = resolveSecondChoice(activeContractKeys, fallbackNear);

    if (!calendarNearContractInput || !activeContractKeys.includes(calendarNearContractInput)) {
      setCalendarNearContractInput(fallbackNear);
    }
    if (!calendarNearContractApplied || !activeContractKeys.includes(calendarNearContractApplied)) {
      setCalendarNearContractApplied(fallbackNear);
    }
    if (!calendarFarContractInput || !activeContractKeys.includes(calendarFarContractInput)) {
      setCalendarFarContractInput(fallbackFar);
    }
    if (!calendarFarContractApplied || !activeContractKeys.includes(calendarFarContractApplied)) {
      setCalendarFarContractApplied(fallbackFar);
    }
  }, [
    activeContractKeys,
    calendarFarContractApplied,
    calendarFarContractInput,
    calendarNearContractApplied,
    calendarNearContractInput,
  ]);

  return {
    calendarNearContractInput,
    setCalendarNearContractInput,
    calendarFarContractInput,
    setCalendarFarContractInput,
    calendarNearContractApplied,
    setCalendarNearContractApplied,
    calendarFarContractApplied,
    setCalendarFarContractApplied,
  };
};
