import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DeleteAccountButton from '../../components/DeleteAccountButton';
import { Btn, useTopPad } from '../../components/ui';
import { completeCollection } from '../../services/api';
import { C, F } from '../../theme';
import { PickupAlert, Point } from '../../types';

const fillColor = (f: number) => (f > 80 ? C.RED : f > 50 ? C.ORANGE : C.G);
const PERIOD = { morning: 'Manhã (08h–12h)', afternoon: 'Tarde (13h–18h)' } as const;

export default function CoopDashboard({
  name, points, alerts, onDispatch, onLogout,
}: {
  name?: string; points: Point[]; alerts: PickupAlert[]; onDispatch: (pointId: number) => void; onLogout: () => void;
}) {
  const top = useTopPad();
  // Indicadores calculados com os dados reais dos ecopontos.
  // "Disponíveis p/ coleta" = pontos com 50% ou mais de ocupação e sem retirada agendada.
  const summary = [
    { label: 'Pontos ativos', value: points.length, color: C.G_DARK },
    { label: 'Pontos cheios', value: points.filter((p) => p.fill > 80).length, color: C.RED },
    { label: 'Disponíveis p/ coleta', value: points.filter((p) => p.fill >= 50 && !p.collection).length, color: C.G },
  ];
  return (
    <View style={{ flex: 1, backgroundColor: C.BG }}>
      <LinearGradient colors={[C.G_DARK, C.G]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: 20, paddingTop: top + 8, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: F.med, fontSize: 12, color: C.WHITE, opacity: 0.8, textTransform: 'uppercase', letterSpacing: 0.6 }}>Painel de Gestão</Text>
          <Text numberOfLines={1} style={{ fontFamily: F.bold, fontSize: 20, color: C.WHITE }}>{name ?? 'Cooperativa'}</Text>
        </View>
        <Pressable onPress={onLogout} style={s.logout}>
          <Text style={{ fontFamily: F.semi, fontSize: 12, color: C.WHITE }}>Sair</Text>
        </Pressable>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        {alerts.map((a) => (
          <View key={a.id} style={s.alert}>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <Ionicons name="notifications" size={22} color={C.RED} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: F.bold, fontSize: 13, color: C.RED }}>Retirada urgente solicitada</Text>
                <Text style={{ fontFamily: F.reg, fontSize: 12, color: '#795548' }}>{a.partner} · {a.fillPercent}% da capacidade</Text>
              </View>
            </View>
            <View style={{ marginTop: 10 }}>
              <Btn label="Agendar coleta →" onPress={() => onDispatch(a.pointId)} small />
            </View>
          </View>
        ))}

        <View style={{ flexDirection: 'row', gap: 10 }}>
          {summary.map((x) => (
            <View key={x.label} style={[s.card, { flex: 1, padding: 12, gap: 4 }]}>
              <Text style={{ fontFamily: F.bold, fontSize: 24, color: x.color }}>{x.value}</Text>
              <Text style={{ fontFamily: F.reg, fontSize: 12, color: C.MUTED }}>{x.label}</Text>
            </View>
          ))}
        </View>

        <Text style={s.label}>Pontos de Coleta</Text>

        {points.map((p) => (
          <View key={p.id} style={[s.card, { padding: 16 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: F.bold, fontSize: 14, color: C.SLATE }}>{p.name}</Text>
                <Text style={{ fontFamily: F.reg, fontSize: 12, color: C.MUTED }}>{p.address}{p.city ? ` · ${p.city}` : ''}</Text>
              </View>
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: p.fill > 80 ? C.RED_LT : p.fill > 50 ? C.AMBER_LT : C.G_LIGHT }}>
                <Text style={{ fontFamily: F.bold, fontSize: 12, color: fillColor(p.fill) }}>{p.fill}% cheio</Text>
              </View>
            </View>
            <View style={{ height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: C.GRAY_LT, marginBottom: 6 }}>
              <View style={{ height: '100%', width: `${p.fill}%`, borderRadius: 4, backgroundColor: fillColor(p.fill) }} />
            </View>
            <Text style={{ fontFamily: F.med, fontSize: 12, color: C.MUTED, marginBottom: 12 }}>{p.usedKg} kg de {p.capacityKg} kg</Text>

            {p.collection ? (
              <View style={{ gap: 10 }}>
                <View style={s.scheduled}>
                  <Ionicons name="car-outline" size={18} color={C.G_DARK} />
                  <Text style={{ flex: 1, fontFamily: F.med, fontSize: 12, color: C.G_DARK }}>
                    Retirada agendada · {PERIOD[p.collection.period]} · placa {p.collection.plate}
                  </Text>
                </View>
                <Btn label="Confirmar retirada realizada" onPress={() => completeCollection(p.id)} variant="outline" small />
              </View>
            ) : p.fill > 80 ? (
              <Btn label="Solicitar Coleta →" onPress={() => onDispatch(p.id)} small />
            ) : (
              <Text style={{ fontFamily: F.med, fontSize: 12, color: C.MUTED }}>Capacidade disponível · Coleta automática agendada</Text>
            )}
          </View>
        ))}

        <DeleteAccountButton onDeleted={onLogout} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  logout: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)' },
  card: { backgroundColor: C.WHITE, borderRadius: 16, borderWidth: 1.5, borderColor: C.BORDER },
  label: { fontFamily: F.bold, fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase', color: C.MUTED },
  alert: { padding: 14, borderRadius: 16, backgroundColor: C.RED_LT, borderWidth: 1.5, borderColor: 'rgba(229,57,53,0.3)' },
  scheduled: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, backgroundColor: C.G_LIGHT },
});
