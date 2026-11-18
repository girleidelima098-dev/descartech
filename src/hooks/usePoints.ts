import { getPoints } from '../services/api';
import { Point } from '../types';
import { useLive } from './useLive';

const EMPTY: Point[] = [];


export function usePoints() {
  const { data, loading } = useLive(getPoints, EMPTY);
  return { points: data, loading };
}
