import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DeleteAccountButton from '../../components/DeleteAccountButton';
import { Btn, useTopPad } from '../../components/ui';
import { requestPartnerPickup } from '../../services/api';
import { C, F } from '../../theme';
import { AppUser, Point } from '../../types';
import { MATERIAL_COLORS, MATERIALS } from '../../utils/materials';
import ScannerScreen from './ScannerScreen';

const PERIOD = { morning: 'Manhã (08h–12h)', afternoon: 'Tarde (13h–18h)' } as const;

/** Tela de Operação: tudo aqui vem do ecoponto cadastrado na Gestão e dos descartes dos clientes (ao vivo). */
export default function PartnerDashboard({ point: p, user, onLogout, onManage }: { point: Point; user?: AppUser; onLogout: () => void; onManage: () => void }) {
  const top = useTopPad(4);
  const [requested, setRequested] = useState(false);
  const [sending, setSending] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');

  const pct = p.fill;
  const critical = pct >= 80;
  const barColor = critical ? C.RED : pct >= 60 ? C.ORANGE : C.G;
  const remaining = p.offer ? Math.max(0, p.offer.quantity - p.couponsIssued) : 0;
  const usedRate = p.couponsIssued > 0 ? Math.round((p.couponsUsed / p.couponsIssued) * 100) : 0;
  const co2 = Math.round(p.lifetimeKg * 2.4); // estimativa: ~2,4 kg de CO₂ evitados por kg reciclado

  const metrics = [
    { label: 'Pessoas Atendidas', value: String(p.served), detail: 'descartes confirmados', color: C.G },
    { label: 'Volume Coletado', value: `${p.usedKg} kg`, detail: `de ${p.capacityKg} kg de capacidade`, color: C.ORANGE },
    { label: 'Cupons Disponíveis', value: String(remaining), detail: p.offer ? `de ${p.offer.quantity} disponibilizados` : 'configure na Gestão', color: C.SLATE_LT },
    { label: 'Cupons Utilizados', value: String(p.couponsUsed), detail: p.couponsIssued ? `${usedRate}% dos emitidos` : 'nenhum emitido ainda', color: C.G_DARK },
  ];

  async function request() {
    setError('');
    setSending(true);
    const r = await requestPartnerPickup();
    setSending(false);
    if (r.ok) setRequested(true);
    else setError(r.message);
  }

  if (scanning) return <ScannerScreen onBack={() => setScanning(false)} />;

  return (
    <View style={{ flex: 1, backgroundColor: C.BG }}>
      <LinearGradient colors={[C.SLATE, '#455A64']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingHorizontal: 20, paddingTop: top + 8, paddingBottom: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: F.semi, fontSize: 12, color: C.WHITE, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.6 }}>Empresa Parceira · Operação</Text>
            <Text numberOfLines={1} style={{ fontFamily: F.bold, fontSize: 20, color: C.WHITE, marginTop: 2 }}>{p.name || user?.fullName}</Text>
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
        {!!p.address && <Text style={{ fontFamily: F.reg, fontSize: 12, color: C.WHITE, opacity: 0.7, marginTop: 8 }}>{p.address} · {p.city}</Text>}
      </LinearGradient>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        {p.items.length === 0 && (
          <Pressable onPress={onManage} style={s.setup}>
            <Ionicons name="alert-circle" size={22} color={C.ORANGE} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: F.bold, fontSize: 13, color: '#795548' }}>Cadastre os materiais aceitos</Text>
              <Text style={{ fontFamily: F.reg, fontSize: 12, color: '#795548' }}>Os clientes veem essa lista ao pesquisar seu ecoponto. Toque para abrir a Gestão.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#795548" />
          </Pressable>
        )}

        <View>
          <Text style={[s.label, { marginBottom: 12 }]}>Visão geral</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {metrics.map((m) => (
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
              {p.usedKg} kg <Text style={{ fontFamily: F.med, fontSize: 14, color: C.MUTED }}>de {p.capacityKg} kg</Text>
            </Text>
            <Text style={{ fontFamily: F.bold, fontSize: 16, color: barColor }}>{pct}%</Text>
          </View>
          <View style={{ height: 14, borderRadius: 7, overflow: 'hidden', backgroundColor: '#F1F3F4', marginTop: 12 }}>
            <View style={{ height: '100%', width: `${pct}%`, borderRadius: 7, backgroundColor: barColor }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
            <Text style={s.tick}>0 kg</Text>
            <Text style={s.tick}>{Math.round(p.capacityKg / 2)} kg</Text>
            <Text style={s.tick}>{p.capacityKg} kg</Text>
          </View>

          {critical && !p.collection && (
            <View style={s.critical}>
              <Ionicons name="warning" size={20} color={C.RED} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: F.bold, fontSize: 13, color: C.RED }}>Atenção crítica</Text>
                <Text style={{ fontFamily: F.reg, fontSize: 12, color: '#795548', marginTop: 2 }}>
                  Restam apenas {Math.max(0, Math.round((p.capacityKg - p.usedKg) * 10) / 10)} kg de espaço. Solicite a retirada o quanto antes.
                </Text>
              </View>
            </View>
          )}

          {p.collection && (
            <View style={s.scheduled}>
              <Ionicons name="car-outline" size={20} color={C.G_DARK} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: F.bold, fontSize: 13, color: C.G_DARK }}>Retirada agendada</Text>
                <Text style={{ fontFamily: F.reg, fontSize: 12, color: C.G_DARK, marginTop: 2 }}>
                  {p.collection.coopName} · {PERIOD[p.collection.period]} · placa {p.collection.plate}
                </Text>
              </View>
            </View>
          )}

          <View style={{ marginTop: 16, gap: 8 }}>
            <Btn
              label={p.collection ? 'Retirada já agendada' : requested ? 'Alerta enviado à cooperativa' : sending ? 'Enviando…' : 'Solicitar retirada à cooperativa'}
              onPress={request}
              disabled={!!p.collection || requested || sending || p.usedKg === 0}
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
              <Text style={{ fontFamily: F.reg, fontSize: 12, color: C.MUTED, marginTop: 2 }}>Volume por categoria (teto de {p.capacityKg} kg)</Text>
            </View>
            <Text style={{ fontFamily: F.bold, fontSize: 12, color: C.G }}>{p.usedKg} kg</Text>
          </View>
          <View style={{ gap: 14 }}>
            {MATERIALS.map((m) => (
              <View key={m} style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: F.med, fontSize: 12, color: C.SLATE }}>{m}</Text>
                  <Text style={{ fontFamily: F.bold, fontSize: 12, color: C.SLATE }}>{p.materials[m]} kg</Text>
                </View>
                <View style={{ height: 10, borderRadius: 5, backgroundColor: '#F1F3F4', overflow: 'hidden' }}>
                  <View style={{ height: '100%', width: `${Math.min(100, (p.materials[m] / p.capacityKg) * 100)}%`, borderRadius: 5, backgroundColor: MATERIAL_COLORS[m] }} />
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
                Você já evitou {co2} kg de CO₂ e atraiu {p.served} {p.served === 1 ? 'cliente sustentável' : 'clientes sustentáveis'}.
              </Text>
              <Text style={{ fontFamily: F.reg, fontSize: 12, color: C.WHITE, opacity: 0.75, marginTop: 8 }}>Estimativa a partir de {p.lifetimeKg} kg coletados</Text>
            </View>
          </View>
        </LinearGradient>

        <DeleteAccountButton onDeleted={onLogout} extra="Seu ecoponto será removido do mapa e os cupons emitidos por ele deixam de valer." />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: C.WHITE, borderWidth: 1.5, borderColor: C.BORDER },
  label: { fontFamily: F.bold, fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase', color: C.MUTED },
  tick: { fontFamily: F.reg, fontSize: 10, color: C.MUTED },
  setup: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, backgroundColor: C.AMBER_LT, borderWidth: 1, borderColor: '#FFE082' },
  critical: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginTop: 16, padding: 12, borderRadius: 12, backgroundColor: C.RED_LT, borderWidth: 1, borderColor: 'rgba(229,57,53,0.3)' },
  scheduled: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginTop: 16, padding: 12, borderRadius: 12, backgroundColor: C.G_LIGHT },
});
