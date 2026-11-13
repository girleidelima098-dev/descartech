import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useTopPad } from '../../components/ui';
import { getCoupons, getWalletSummary } from '../../services/api';
import { C, F } from '../../theme';
import { Coupon } from '../../types';

const urgentColor = (d: number) => (d <= 7 ? C.RED : d <= 14 ? C.ORANGE : C.G);

export default function WalletTab({ onSummary }: { onSummary?: (coupons: number, disposals: number) => void }) {
  const top = useTopPad();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [summary, setSummary] = useState({ totalSaved: 0, disposals: 0 });
  const [copied, setCopied] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([getCoupons(), getWalletSummary()])
      .then(([c, w]) => {
        setCoupons(c);
        setSummary(w);
        onSummary?.(c.length, w.disposals);
      })
      .catch(() => {});
  }, [onSummary]);

  async function copy(c: Coupon) {
    await Clipboard.setStringAsync(c.code);
    setCopied(c.id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.BG }}>
      <View style={{ paddingHorizontal: 20, paddingTop: top + 8, paddingBottom: 16 }}>
        <Text style={{ fontFamily: F.bold, fontSize: 20, color: C.SLATE }}>Minha Carteira</Text>
        <Text style={{ fontFamily: F.reg, fontSize: 14, color: C.MUTED, marginTop: 4 }}>{coupons.length} cupons disponíveis</Text>
        <LinearGradient colors={[C.G, C.G_DARK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.summary}>
          <View>
            <Text style={s.sumLabel}>TOTAL ECONOMIZADO</Text>
            <Text style={s.sumValue}>R$ {summary.totalSaved.toFixed(2).replace('.', ',')}</Text>
          </View>
          <View style={{ width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <View>
            <Text style={s.sumLabel}>DESCARTES</Text>
            <Text style={s.sumValue}>{summary.disposals}</Text>
          </View>
        </LinearGradient>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, gap: 12 }}>
        {coupons.map((c) => {
          const uc = urgentColor(c.expires);
          return (
            <View key={c.id} style={s.coupon}>
              <View style={{ width: 12, backgroundColor: c.color }} />
              <View style={{ flex: 1, padding: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: F.bold, fontSize: 16, color: C.SLATE }}>{c.store}</Text>
                    <Text style={{ fontFamily: F.reg, fontSize: 12, color: C.MUTED }}>{c.category}</Text>
                  </View>
                  <View style={{ backgroundColor: c.bg, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
                    <Text style={{ fontFamily: F.bold, fontSize: 16, color: c.color }}>{c.discount}</Text>
                  </View>
                </View>

                <View style={s.couponFoot}>
                  <View style={[s.expire, { backgroundColor: `${uc}18`, borderColor: `${uc}44` }]}>
                    <Ionicons name="time-outline" size={11} color={uc} />
                    <Text style={{ fontFamily: F.semi, fontSize: 12, color: uc }}>Expira em {c.expires}d</Text>
                  </View>
                  <Pressable onPress={() => copy(c)} style={[s.useBtn, { backgroundColor: copied === c.id ? C.G : c.color }]}>
                    <Text style={{ fontFamily: F.bold, fontSize: 12, color: C.WHITE }}>{copied === c.id ? '✓ Copiado!' : 'Utilizar'}</Text>
                  </Pressable>
                </View>
                <Text style={{ marginTop: 6, fontSize: 12, color: C.MUTED, fontFamily: F.reg }}>
                  Código: <Text style={{ fontFamily: F.bold }}>{c.code}</Text>
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  summary: { marginTop: 16, padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  sumLabel: { fontFamily: F.semi, fontSize: 12, color: C.WHITE, opacity: 0.75 },
  sumValue: { fontFamily: F.bold, fontSize: 30, color: C.WHITE },
  coupon: { flexDirection: 'row', borderRadius: 16, overflow: 'hidden', backgroundColor: C.WHITE, borderWidth: 1.5, borderColor: C.BORDER },
  couponFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.BORDER, borderStyle: 'dashed' },
  expire: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  useBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 12 },
});
