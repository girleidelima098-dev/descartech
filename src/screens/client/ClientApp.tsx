import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLive } from '../../hooks/useLive';
import { usePoints } from '../../hooks/usePoints';
import { getWallet } from '../../services/api';
import { C, F } from '../../theme';
import { AppUser, Wallet } from '../../types';
import DetailScreen from './DetailScreen';
import MapTab from './MapTab';
import ProfileTab from './ProfileTab';
import QRScreen from './QRScreen';
import SafetyScreen from './SafetyScreen';
import WaitingScreen from './WaitingScreen';
import WalletTab from './WalletTab';

const EMPTY_WALLET: Wallet = { coupons: [], disposals: 0, totalSaved: 0 };

type Tab = 'map' | 'wallet' | 'profile';
type Modal = 'detail' | 'safety' | 'qrcode' | 'waiting' | null;

const TABS: { id: Tab; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { id: 'map', label: 'Mapa', icon: 'location' },
  { id: 'wallet', label: 'Carteira', icon: 'wallet-outline' },
  { id: 'profile', label: 'Perfil', icon: 'person-outline' },
];

export default function ClientApp({ user, onLogout, onUserChange }: { user?: AppUser; onLogout: () => void; onUserChange: (u: AppUser) => void }) {
  const insets = useSafeAreaInsets();
  const { points } = usePoints();
  const [tab, setTab] = useState<Tab>('map');
  const [modal, setModal] = useState<Modal>(null);
  const [selected, setSelected] = useState(1);
  const [items, setItems] = useState<string[]>([]);
  const [token, setToken] = useState('');
  const { data: wallet } = useLive(getWallet, EMPTY_WALLET);
  const activeCoupons = wallet.coupons.filter((c) => !c.used && !c.expired).length;
  const point = points.find((p) => p.id === selected);


  useEffect(() => {
    if (modal && modal !== 'waiting' && points.length > 0 && !point) setModal(null);
  }, [modal, point, points.length]);

  const finish = useCallback(() => {
    setModal(null);
    setTab('wallet');
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: C.BG }}>
      <View style={{ flex: 1 }}>
        {modal === null && tab === 'map' && <MapTab points={points} onOpenDetail={(id) => { setSelected(id); setModal('detail'); }} />}
        {modal === null && tab === 'wallet' && <WalletTab wallet={wallet} />}
        {modal === null && tab === 'profile' && <ProfileTab user={user} onLogout={onLogout} onUserChange={onUserChange} coupons={activeCoupons} disposals={wallet.disposals} />}
        {modal === 'detail' && point && <DetailScreen point={point} onClose={() => setModal(null)} onContinue={(chosen) => { setItems(chosen); setModal('safety'); }} />}
        {modal === 'safety' && <SafetyScreen onClose={() => setModal('detail')} onGenerate={() => setModal('qrcode')} />}
        {modal === 'qrcode' && point && <QRScreen point={point} items={items} onClose={() => setModal('safety')} onConfirm={(t) => { setToken(t); setModal('waiting'); }} />}
        {modal === 'waiting' && <WaitingScreen token={token} onDone={finish} onBack={() => { setModal(null); setTab('map'); }} />}
      </View>

      {modal === null && (
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
      )}
    </View>
  );
}

const s = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 16, paddingTop: 12, backgroundColor: C.WHITE, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  navBtn: { alignItems: 'center', gap: 4, minWidth: 60, paddingHorizontal: 12, paddingVertical: 4 },
});
