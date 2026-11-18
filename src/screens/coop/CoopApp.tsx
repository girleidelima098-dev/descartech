import React, { useState } from 'react';
import { useLive } from '../../hooks/useLive';
import { usePoints } from '../../hooks/usePoints';
import { getPickupAlerts } from '../../services/api';
import { AppUser, PickupAlert } from '../../types';
import CoopDashboard from './CoopDashboard';
import DispatchScreen from './DispatchScreen';

const NO_ALERTS: PickupAlert[] = [];

export default function CoopApp({ user, onLogout }: { user?: AppUser; onLogout: () => void }) {
  const { points } = usePoints(); // sempre atualizado: cadastro e gestão dos parceiros aparecem aqui
  const { data: alerts } = useLive(getPickupAlerts, NO_ALERTS);
  const [selected, setSelected] = useState<number | null>(null);
  const point = selected != null ? points.find((p) => p.id === selected) : undefined;

  return point ? (
    <DispatchScreen point={point} coopName={user?.fullName ?? 'Cooperativa'} onBack={() => setSelected(null)} />
  ) : (
    <CoopDashboard name={user?.fullName} points={points} alerts={alerts} onDispatch={setSelected} onLogout={onLogout} />
  );
}
