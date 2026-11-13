import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Btn, useTopPad } from '../../components/ui';
import { requestPartnerPickup } from '../../services/api';
import { C, F } from '../../theme';
import { AppUser } from '../../types';
import ScannerScreen from './ScannerScreen';

const MAX_KG = 50;
const PARTNER_POINT_ID = 1; 
const MATERIALS = [
  { label: 'Pilhas/Baterias', kg: 16, color: C.G },
  { label: 'Telas/Monitores', kg: 11, color: '#66BB6A' },
  { label: 'Cabos/Fios', kg: 8, color: C.ORANGE },
  { label: 'Pequenos Eletrônicos', kg: 6, color: C.SLATE_LT },
];
const USED_KG = MATERIALS.reduce((sum, m) => sum + m.kg, 0); // 41 kg
const PCT = Math.round((USED_KG / MAX_KG) * 100);
const CRITICAL = PCT >= 80;
const BAR_COLOR = CRITICAL ? C.RED : PCT >= 60 ? C.ORANGE : C.G;

const METRICS = [
  { label: 'Pessoas Atendidas', value: '328', detail: '+18 este mês', color: C.G },
  { label: 'Volume Coletado', value: `${USED_KG} kg`, detail: `de ${MAX_KG} kg de capacidade`, color: C.ORANGE },
  { label: 'Cupons Usados', value: '214', detail: '43% validados', color: C.G_DARK },
  { label: 'Cupons Disponíveis', value: '500', detail: 'campanha atual', color: C.SLATE_LT },
];

export default function PartnerDashboard({ user, onLogout }: { user?: AppUser; onLogout: () => void }) {
  const top = useTopPad(4);
  const [requested, setRequested] = useState(false);
  const [sending, setSending] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const company = user?.fullName ?? 'Fast Shop Centro';

  async function request() {
    setError('');
    setSending(true);
    try {
      await requestPartnerPickup({ partnerName: company, pointId: PARTNER_POINT_ID, usedKg: USED_KG, maxKg: MAX_KG });
      setRequested(true);
    } catch {
      setError('Não foi possível enviar o alerta. Tente novamente.');
    } finally {
      setSending(false);
    }
  }

  if (scanning) return <ScannerScreen onBack={() => setScanning(false)} />;

  return (
    <View style={{ flex: 1, backgroundColor: C.BG }}>
      <LinearGradient colors={[C.SLATE, '#455A64']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: 20, paddingTop: top + 8, paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: F.semi, fontSize: 12, color: C.WHITE, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.6 }}>Empresa Parceira</Text>
            <Text numberOfLines={1} style={{ fontFamily: F.bold, fontSize: 20, color: C.WHITE, marginTop: 2 }}>{company}</Text>
          </View>
          <Pressable onPress={onLogout} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.14)' }}>
            <Text style={{ fontFamily: F.semi, fontSize: 12, color: C.WHITE }}>Sair</Text>
          </Pressable>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: C.G_LIGHT }}>
            <Ionicons name="shield-checkmark" size={12} color={C.G} />
            <Text style={{ fontFamily: F.bold, fontSize: 10, color: C.G_DARK }}>Parceiro Verde DescarTech</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#69F0AE' }} />
            <Text style={{ fontFamily: F.med, fontSize: 12, color: C.WHITE }}>Em funcionamento</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View>
          <Text style={[s.label, { marginBottom: 12 }]}>Visão geral</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {METRICS.map((m) => (
              <View key={m.label} style={[s.card, { width: '47.8%', padding: 14, borderRadius: 16 }]}>
                <View style={{ width: 28, height: 4, borderRadius: 2, backgroundColor: m.color, marginBottom: 12 }} />
                <Text style={{ fontFamily: F.xbold, fontSize: 20, color: C.SLATE }}>{m.value}</Text>
                <Text style={{ fontFamily: F.semi, fontSize: 12, color: C.SLATE, marginTop: 4 }}>{m.label}</Text>
                <Text style={{ fontFamily: F.reg, fontSize: 10, color: C.MUTED, marginTop: 2 }}>{m.detail}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[s.card, { borderRadius: 24, padding: 20 }]}>
          <Text style={s.label}>Capacidade do Ecoponto</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={{ fontFamily: F.xbold, fontSize: 28, color: C.SLATE }}>
              {USED_KG} kg <Text style={{ fontFamily: F.med, fontSize: 14, color: C.MUTED }}>de {MAX_KG} kg</Text>
            </Text>
            <Text style={{ fontFamily: F.bold, fontSize: 16, color: BAR_COLOR }}>{PCT}%</Text>
          </View>
          <View style={{ height: 14, borderRadius: 7, overflow: 'hidden', backgroundColor: '#F1F3F4', marginTop: 12 }}>
            <View style={{ height: '100%', width: `${PCT}%`, borderRadius: 7, backgroundColor: BAR_COLOR }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
            <Text style={s.tick}>0 kg</Text>
            <Text style={s.tick}>{MAX_KG / 2} kg</Text>
            <Text style={s.tick}>{MAX_KG} kg</Text>
          </View>

          {CRITICAL && (
            <View style={s.critical}>
              <Ionicons name="warning" size={20} color={C.RED} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: F.bold, fontSize: 13, color: C.RED }}>Atenção crítica</Text>
                <Text style={{ fontFamily: F.reg, fontSize: 12, color: '#795548', marginTop: 2 }}>
                  Restam apenas {MAX_KG - USED_KG} kg de espaço. Solicite a retirada o quanto antes.
                </Text>
              </View>
            </View>
          )}

          <View style={{ marginTop: 16, gap: 8 }}>
            <Btn
              label={requested ? 'Alerta enviado à cooperativa' : sending ? 'Enviando…' : 'Solicitar retirada à cooperativa'}
              onPress={request}
              disabled={requested || sending}
            />
            {!!error && <Text style={{ fontFamily: F.semi, fontSize: 12, color: C.RED, textAlign: 'center' }}>{error}</Text>}
            {/* Adição ao protótipo: leitor de QR Code (câmera) para validar descartes */}
            <Btn label="Ler QR Code do cliente" onPress={() => setScanning(true)} variant="outline" />
          </View>
        </View>

        <View style={[s.card, { borderRadius: 16, padding: 16 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View>
              <Text style={{ fontFamily: F.bold, fontSize: 14, color: C.SLATE }}>Distribuição de Materiais</Text>
              <Text style={{ fontFamily: F.reg, fontSize: 12, color: C.MUTED, marginTop: 2 }}>Volume por categoria (teto de {MAX_KG} kg)</Text>
            </View>
            <Text style={{ fontFamily: F.bold, fontSize: 12, color: C.G }}>{USED_KG} kg</Text>
          </View>
          <View style={{ gap: 14 }}>
            {MATERIALS.map((m) => (
              <View key={m.label} style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: F.med, fontSize: 12, color: C.SLATE }}>{m.label}</Text>
                  <Text style={{ fontFamily: F.bold, fontSize: 12, color: C.SLATE }}>{m.kg} kg</Text>
                </View>
                <View style={{ height: 10, borderRadius: 5, backgroundColor: '#F1F3F4', overflow: 'hidden' }}>
                  <View style={{ height: '100%', width: `${(m.kg / MAX_KG) * 100}%`, borderRadius: 5, backgroundColor: m.color }} />
                </View>
              </View>
            ))}
          </View>
        </View>

        <LinearGradient colors={['#047857', '#10B981']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 16, borderRadius: 16, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', right: -20, bottom: -20, width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.09)' }} />
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="leaf" size={22} color={C.WHITE} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: F.bold, fontSize: 12, color: C.WHITE, opacity: 0.85, textTransform: 'uppercase', letterSpacing: 0.6 }}>Impacto ESG e Sustentabilidade</Text>
              <Text style={{ fontFamily: F.bold, fontSize: 16, color: C.WHITE, marginTop: 4, lineHeight: 22 }}>
                Você já evitou 98 kg de CO₂ e atraiu 86 novos clientes sustentáveis.
              </Text>
              <Text style={{ fontFamily: F.reg, fontSize: 12, color: C.WHITE, opacity: 0.75, marginTop: 8 }}>Impacto calculado nos últimos 90 dias</Text>
            </View>
          </View>
        </LinearGradient>

        <Pressable onPress={onLogout} style={s.logout}>
          <Text style={{ fontFamily: F.semi, fontSize: 14, color: C.RED }}>Sair da conta</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: C.WHITE, borderWidth: 1.5, borderColor: C.BORDER },
  label: { fontFamily: F.bold, fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase', color: C.MUTED },
  tick: { fontFamily: F.reg, fontSize: 10, color: C.MUTED },
  critical: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginTop: 16, padding: 12, borderRadius: 12, backgroundColor: C.RED_LT, borderWidth: 1, borderColor: 'rgba(229,57,53,0.3)' },
  logout: { paddingVertical: 14, borderRadius: 12, borderWidth: 2, borderColor: C.RED, alignItems: 'center' },
});
