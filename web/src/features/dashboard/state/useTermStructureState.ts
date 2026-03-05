import { useState } from 'react';
import { getTodayIsoDate } from '../helpers';

export const useTermStructureState = () => {
  const [termStructureDateInput, setTermStructureDateInput] = useState(getTodayIsoDate);
  const [termStructureDateApplied, setTermStructureDateApplied] = useState(getTodayIsoDate);

  return {
    termStructureDateInput,
    setTermStructureDateInput,
    termStructureDateApplied,
    setTermStructureDateApplied,
  };
};
