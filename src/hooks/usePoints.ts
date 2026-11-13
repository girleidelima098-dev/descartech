import { useEffect, useState } from 'react';
import { getPoints } from '../services/api';
import { Point } from '../types';

export function usePoints() {
  const [points, setPoints] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    getPoints()
      .then((p) => alive && setPoints(p))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);
  return { points, loading };
}
