import { useEffect } from 'react';
import { useIncludedTickerIdsAtomValue, useSelectedTickerIdAtomValue, useSetSelectedTickerIdWrite } from '@/jotai';

export const useEnsureSelectedTicker = () => {
  const selectedTickerId = useSelectedTickerIdAtomValue();
  const includedTickerIds = useIncludedTickerIdsAtomValue();
  const setSelectedTickerId = useSetSelectedTickerIdWrite();

  useEffect(() => {
    if (selectedTickerId && !includedTickerIds.includes(selectedTickerId)) {
      setSelectedTickerId(includedTickerIds[0] ?? null);
    }
  }, [includedTickerIds, selectedTickerId, setSelectedTickerId]);
};
