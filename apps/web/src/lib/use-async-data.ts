import {
  useEffect,
  useState,
  type Dispatch,
  type DependencyList,
  type SetStateAction,
} from 'react';

export interface UseAsyncDataResult<T> {
  data: T | null;
  error: string | null;
  setData: Dispatch<SetStateAction<T | null>>;
}

export function useAsyncData<T>(
  loader: () => Promise<T>,
  deps: DependencyList,
): UseAsyncDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    loader()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'erro');
      });
    return () => {
      cancelled = true;
    };
  }, deps);

  return { data, error, setData };
}
