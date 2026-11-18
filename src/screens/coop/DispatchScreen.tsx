import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BackBtn, Btn, useTopPad } from '../../components/ui';
import { requestCollection } from '../../services/api';
import { C, F } from '../../theme';
import { Point } from '../../types';
import { MATERIAL_COLORS, MATERIALS } from '../../utils/materials';

const PERIODS = [
  { id: 'morning', label: 'Manhã', sub: '08h – 12h' },
  { id: 'afternoon', label: 'Tarde', sub: '13h – 18h' },
] as const;

const PLATE_RE = /^[A-Z]{3}\d[A-Z0-9]\d{2}$/;

/** `point` vem ao vivo: se o parceiro ou um cliente alterar o ponto, o lote muda aqui na hora. */
export default function DispatchScreen({ point: p, coopName, onBack }: { point: Point; coopName: string; onBack: () => void }) {
  const top = useTopPad();
  const [plate, setPlate] = useState('');
  const [period, setPeriod] = useState<(typeof PERIODS)[number]['id']>('afternoon');
  const [confirmed, setConfirmed] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const plateOk = PLATE_RE.test(plate);
  const periodInfo = PERIODS.find((x) => x.id === period)!;
  const collected = MATERIALS.filter((m) => p.materials[m] > 0);
  const barColor = p.fill > 80 ? C.RED : p.fill > 50 ? C.ORANGE : C.G;

  async function confirm() {
    setError('');
    setSending(true);
    const r = await requestCollection({ pointId: p.id, plate, period, coopName });
    setSending(false);
    if (r.ok) setConfirmed(true);
    else setError(r.message);
  }

  if (confirmed) {
    return (
      <View style={{ flex: 1, backgroundColor: C.BG, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 24 }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: C.G_LIGHT, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="checkmark-circle" size={48} color={C.G} />
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontFamily: F.bold, fontSize: 20, color: C.SLATE }}>Coleta Confirmada!</Text>
          <Text style={{ fontFamily: F.med, fontSize: 14, color: C.MUTED, marginTop: 8, textAlign: 'center' }}>O parceiro já foi avisado da retirada.</Text>
        </View>
        <View style={[s.card, { width: '100%', gap: 8 }]}>
          <Text style={s.label}>Resumo da coleta</Text>
          <Text style={{ fontFamily: F.semi, fontSize: 14, color: C.SLATE }}>{p.name}</Text>
          <Text style={{ fontFamily: F.reg, fontSize: 14, color: C.MUTED }}>{p.address} · {p.city}</Text>
          <View style={{ height: 1, backgroundColor: C.BORDER, marginVertical: 4 }} />
          <Row k="Veículo (placa)" v={plate} />
          <Row k="Período" v={`${periodInfo.label} (${periodInfo.sub})`} />
          <Row k="Peso estimado" v={`${p.usedKg} kg`} />
        </View>
        <Btn label="Voltar ao Painel" onPress={onBack} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.BG }}>
      <View style={{ paddingHorizontal: 20, paddingTop: top, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackBtn onPress={onBack} />
        <Text style={{ fontFamily: F.bold, fontSize: 20, color: C.SLATE }}>Solicitar Coleta</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <Text style={[s.label, { marginBottom: 8 }]}>Ponto de Coleta</Text>
          <Text style={{ fontFamily: F.bold, fontSize: 14, color: C.SLATE }}>{p.name}</Text>
          <Text style={{ fontFamily: F.reg, fontSize: 12, color: C.MUTED, marginTop: 2 }}>{p.address} · {p.city}</Text>
          <Text style={{ fontFamily: F.reg, fontSize: 12, color: C.MUTED, marginTop: 2 }}>{p.hours || 'Horário não informado'}</Text>
          <View style={{ marginTop: 12, height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: C.GRAY_LT }}>
            <View style={{ height: '100%', width: `${p.fill}%`, backgroundColor: barColor, borderRadius: 4 }} />
          </View>
          <Text style={{ fontFamily: F.semi, fontSize: 12, color: barColor, marginTop: 4 }}>
            {p.usedKg} kg de {p.capacityKg} kg ({p.fill}% da capacidade){p.fill > 80 ? ' — Coleta urgente' : ''}
          </Text>
        </View>

        <View style={s.card}>
          <Text style={[s.label, { marginBottom: 12 }]}>Detalhes do Lote</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ fontFamily: F.med, fontSize: 14, color: C.SLATE }}>Peso estimado</Text>
            <Text style={{ fontFamily: F.bold, fontSize: 14, color: C.SLATE }}>{p.usedKg} kg</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontFamily: F.med, fontSize: 14, color: C.SLATE }}>Capacidade do ponto</Text>
            <Text style={{ fontFamily: F.bold, fontSize: 14, color: C.SLATE }}>{p.capacityKg} kg</Text>
          </View>
          {collected.length === 0 && (
            <Text style={{ fontFamily: F.reg, fontSize: 12, color: C.MUTED, borderTopWidth: 1, borderTopColor: C.BORDER, paddingTop: 10 }}>
              Nenhum material coletado neste ponto ainda.
            </Text>
          )}
          {collected.map((m) => (
            <View key={m} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.BORDER }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: MATERIAL_COLORS[m] }} />
                <Text style={{ fontFamily: F.reg, fontSize: 14, color: C.MUTED }}>{m}</Text>
              </View>
              <Text style={{ fontFamily: F.semi, fontSize: 14, color: C.SLATE }}>{p.materials[m]} kg</Text>
            </View>
          ))}
          {!!p.items.length && (
            <View style={{ borderTopWidth: 1, borderTopColor: C.BORDER, paddingTop: 10, marginTop: 4 }}>
              <Text style={[s.label, { marginBottom: 6 }]}>Materiais aceitos no ponto</Text>
              <Text style={{ fontFamily: F.reg, fontSize: 12, color: C.MUTED, lineHeight: 18 }}>{p.items.join(' · ')}</Text>
            </View>
          )}
        </View>

        <View style={{ gap: 8 }}>
          <Text style={s.label}>Placa do Veículo de Retirada</Text>
          <TextInput
            value={plate}
            onChangeText={(t) => setPlate(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7))}
            placeholder="Digite a placa (ex.: ABC1D23)"
            placeholderTextColor={C.MUTED}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={7}
            accessibilityLabel="Placa do veículo"
            style={[s.input, plate.length === 7 && !plateOk && { borderColor: C.RED }]}
          />
          {plate.length === 7 && !plateOk && <Text style={{ fontFamily: F.med, fontSize: 12, color: C.RED }}>Placa inválida. Use o formato ABC1234 ou ABC1D23.</Text>}
        </View>

        <View style={{ gap: 8 }}>
          <Text style={s.label}>Período de Retirada</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {PERIODS.map((x) => {
              const on = period === x.id;
              return (
                <Pressable key={x.id} onPress={() => setPeriod(x.id)} style={[s.opt, { backgroundColor: on ? C.G_LIGHT : C.WHITE, borderColor: on ? C.G : C.BORDER }]}>
                  <Text style={{ fontFamily: F.bold, fontSize: 14, color: on ? C.G : C.SLATE }}>{x.label}</Text>
                  <Text style={{ fontFamily: F.reg, fontSize: 12, color: on ? C.G : C.MUTED }}>{x.sub}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {!!error && (
          <View style={{ backgroundColor: C.RED_LT, borderRadius: 8, padding: 8 }}>
            <Text style={{ fontFamily: F.semi, fontSize: 12, color: C.RED, textAlign: 'center' }}>{error}</Text>
          </View>
        )}
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingVertical: 20 }}>
        <Btn label={sending ? 'Enviando…' : plateOk ? 'Confirmar Ordem de Coleta' : 'Informe a placa do veículo'} onPress={confirm} disabled={sending || !plateOk} />
      </View>
    </View>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ fontFamily: F.reg, fontSize: 14, color: C.MUTED }}>{k}</Text>
      <Text style={{ fontFamily: F.semi, fontSize: 14, color: C.SLATE }}>{v}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: { padding: 16, borderRadius: 16, backgroundColor: C.WHITE, borderWidth: 1.5, borderColor: C.BORDER },
  label: { fontFamily: F.bold, fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase', color: C.MUTED },
  input: { borderRadius: 12, borderWidth: 1.5, borderColor: C.BORDER, backgroundColor: C.WHITE, paddingHorizontal: 16, paddingVertical: 12, fontFamily: F.bold, fontSize: 18, letterSpacing: 1, color: C.SLATE },
  opt: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', gap: 2 },
});
