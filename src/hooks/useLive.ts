import { useCallback, useEffect, useRef, useState } from 'react';
import { subscribe } from '../services/store';


export function useLive<T>(fetcher: () => Promise<T>, initial: T, intervalMs = 5000) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const fetchRef = useRef(fetcher);
  fetchRef.current = fetcher;

  const reload = useCallback(async () => {
    try {
      setData(await fetchRef.current());
    } catch {
      /* mantém o último valor */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    const run = () => {
      if (alive) reload();
    };
    run();
    const off = subscribe(run);
    const id = setInterval(run, intervalMs);
    return () => {
      alive = false;
      off();
      clearInterval(id);
    };
  }, [reload, intervalMs]);

  return { data, loading, reload };
}
