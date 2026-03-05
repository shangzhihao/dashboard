import { useEffect, useRef, useState } from 'react';

type UseJsonResourceOptions<T> = {
  url: string;
  emptyState: T;
  errorPrefix: string;
  mapPayload: (payload: unknown) => T;
};

export const useJsonResource = <T>({
  url,
  emptyState,
  errorPrefix,
  mapPayload,
}: UseJsonResourceOptions<T>) => {
  const [state, setState] = useState<T>(emptyState);
  const emptyStateRef = useRef(emptyState);
  const mapPayloadRef = useRef(mapPayload);

  useEffect(() => {
    emptyStateRef.current = emptyState;
  }, [emptyState]);

  useEffect(() => {
    mapPayloadRef.current = mapPayload;
  }, [mapPayload]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        if (!url) {
          if (isMounted) {
            setState(emptyStateRef.current);
          }
          return;
        }

        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`${errorPrefix}: ${response.status}`);
        }
        const payload: unknown = await response.json();
        if (isMounted) {
          setState(mapPayloadRef.current(payload));
        }
      } catch (error) {
        console.warn(error);
        if (isMounted) {
          setState(emptyStateRef.current);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [url, errorPrefix]);

  return state;
};
