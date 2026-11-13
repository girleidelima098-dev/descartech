import React, { useEffect, useState } from 'react';
import { usePoints } from '../../hooks/usePoints';
import { getPickupAlerts, resolvePickupAlert } from '../../services/api';
import { AppUser, PickupAlert } from '../../types';
import CoopDashboard from './CoopDashboard';
import DispatchScreen from './DispatchScreen';

export default function CoopApp({ user, onLogout }: { user?: AppUser; onLogout: () => void }) {
  const { points } = usePoints();
  const [selected, setSelected] = useState<{ pointId: number; alertId?: number } | null>(null);
  const [alerts, setAlerts] = useState<PickupAlert[]>([]);

  
  useEffect(() => {
    let alive = true;
    const load = () => getPickupAlerts().then((a) => alive && setAlerts(a)).catch(() => {});
    load();
    const id = setInterval(load, 8000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const point = selected ? points.find((p) => p.id === selected.pointId) : undefined;

  if (point && selected) {
    return (
      <DispatchScreen
        point={point}
        onBack={() => setSelected(null)}
        onScheduled={() => {
          if (selected.alertId) {
            resolvePickupAlert(selected.alertId).catch(() => {});
            setAlerts((a) => a.filter((x) => x.id !== selected.alertId));
          }
        }}
      />
    );
  }

  return (
    <CoopDashboard
      name={user?.fullName}
      points={points}
      alerts={alerts}
      onDispatch={(pointId, alertId) => setSelected({ pointId, alertId })}
      onLogout={onLogout}
    />
  );
}
