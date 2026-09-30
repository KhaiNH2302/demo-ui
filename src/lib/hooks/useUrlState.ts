import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useUrlState<T extends Record<string, string>>(defaults: T) {
  const [searchParams, setSearchParams] = useSearchParams();

  const state = useMemo(() => {
    const result = { ...defaults };
    (Object.keys(defaults) as Array<keyof T>).forEach((key) => {
      const val = searchParams.get(String(key));
      if (val !== null) {
        result[key] = val as T[keyof T];
      }
    });
    return result;
  }, [searchParams, defaults]);

  const setKey = useCallback(
    <K extends keyof T>(key: K, value: T[K] | null | undefined) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const defaultVal = defaults[key];
          if (value === null || value === undefined || value === '' || value === defaultVal) {
            next.delete(String(key));
          } else {
            next.set(String(key), String(value));
          }
          if (key !== 'page' && next.has('page')) {
            next.delete('page');
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams, defaults],
  );

  const reset = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  return { state, setKey, reset };
}
