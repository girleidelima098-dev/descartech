import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Btn } from '../../components/ui';
import { useLive } from '../../hooks/useLive';
import { getMyPoint } from '../../services/api';
import { C, F } from '../../theme';
import { AppUser, Point } from '../../types';
import PartnerDashboard from './PartnerDashboard';
import PartnerManage from './PartnerManage';

type Tab = 'ops' | 'manage';
const TABS: { id: Tab; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { id: 'ops', label: 'Operação', icon: 'speedometer-outline' },
  { id: 'manage', label: 'Gestão', icon: 'settings-outline' },
];

/** Duas frentes do parceiro: Operação (acompanha) e Gestão (cadastra). As duas leem o mesmo ecoponto, ao vivo. */
export default function PartnerApp({ user, onLogout }: { user?: AppUser; onLogout: () => void }) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('ops');
  const { data: point, loading } = useLive<Point | null>(getMyPoint, null);

  if (!point) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.BG, padding: 32, gap: 16 }}>
        {loading ? (
          <ActivityIndicator color={C.G} />
        ) : (
          <>
            <Text style={{ fontFamily: F.semi, fontSize: 14, color: C.SLATE, textAlign: 'center' }}>Não encontramos o ecoponto vinculado a esta conta.</Text>
            <Btn label="Sair" onPress={onLogout} variant="outline" />
          </>
        )}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.BG }}>
      <View style={{ flex: 1 }}>
        {tab === 'ops' ? (
          <PartnerDashboard point={point} user={user} onLogout={onLogout} onManage={() => setTab('manage')} />
        ) : (
          <PartnerManage key={point.id} point={point} onBack={() => setTab('ops')} onDeleted={onLogout} />
        )}
      </View>
      <View style={[s.nav, { paddingBottom: 12 + insets.bottom }]}>
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <Pressable key={t.id} onPress={() => setTab(t.id)} style={s.navBtn}>
              <Ionicons name={t.icon} size={22} color={active ? C.G : C.MUTED} />
              <Text style={{ fontFamily: F.semi, fontSize: 12, color: active ? C.G : C.MUTED }}>{t.label}</Text>
              {active && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: C.G }} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 16, paddingTop: 12, backgroundColor: C.WHITE, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  navBtn: { alignItems: 'center', gap: 4, minWidth: 80, paddingHorizontal: 12, paddingVertical: 4 },
});
