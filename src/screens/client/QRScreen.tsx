import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { BackBtn, Btn, useTopPad } from '../../components/ui';
import { createDisposal } from '../../services/api';
import { C, F } from '../../theme';
import { Disposal, Point } from '../../types';

export default function QRScreen({ point, items, onClose, onConfirm }: { point: Point; items: string[]; onClose: () => void; onConfirm: () => void }) {
  const top = useTopPad();
  const [disposal, setDisposal] = useState<Disposal | null>(null);
  const [failed, setFailed] = useState(false);
  const [secs, setSecs] = useState(900);

  useEffect(() => {
    let alive = true;
    createDisposal(point.id, items)
      .then((d) => {
        if (!alive) return;
        setDisposal(d);
        setSecs(Math.max(0, Math.round((d.expiresAt - Date.now()) / 1000)));
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [point.id, items]);

  useEffect(() => {
    const id = setInterval(() => setSecs((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const sec = String(secs % 60).padStart(2, '0');
  const urgent = secs < 120;
  const alt = disposal?.altCode ?? '';
  const altFmt = alt ? `${alt.slice(0, 3).split('').join(' ')} – ${alt.slice(3).split('').join(' ')}` : '— — —';

  return (
    <View style={{ flex: 1, backgroundColor: C.BG }}>
      <View style={{ paddingHorizontal: 20, paddingTop: top, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackBtn onPress={onClose} />
        <Text style={{ fontFamily: F.bold, fontSize: 20, color: C.SLATE }}>QR Code de Descarte</Text>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, gap: 20 }}>
        <View style={s.card}>
          <Text style={{ fontFamily: F.semi, fontSize: 14, color: C.SLATE }}>{point.name} · {point.address.split('–').pop()?.trim()}</Text>

          <View style={s.qrBox}>
            {disposal ? (
              <QRCode value={disposal.token} size={164} color={C.G} backgroundColor="#F5F5F5" />
            ) : (
              <View style={{ width: 164, height: 164, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: F.med, fontSize: 12, color: C.MUTED }}>{failed ? 'Não foi possível gerar o código.' : 'Gerando código…'}</Text>
              </View>
            )}
          </View>

          <View style={[s.timer, { backgroundColor: urgent ? C.RED_LT : C.G_LIGHT }]}>
            <Ionicons name="time-outline" size={18} color={urgent ? C.RED : C.G} />
            <Text style={{ fontFamily: F.bold, fontSize: 24, color: urgent ? C.RED : C.G, fontVariant: ['tabular-nums'] }}>{m}:{sec}</Text>
            <Text style={{ fontFamily: F.med, fontSize: 12, color: urgent ? C.RED : C.MUTED }}>{secs === 0 ? 'Expirado' : urgent ? 'Expirando!' : 'restantes'}</Text>
          </View>

          <View style={{ width: '100%', alignItems: 'center', gap: 4 }}>
            <Text style={{ fontFamily: F.semi, fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase', color: C.MUTED }}>Código alternativo</Text>
            <View style={s.alt}>
              <Text style={{ fontFamily: F.bold, fontSize: 18, letterSpacing: 4, color: C.SLATE }}>{altFmt}</Text>
            </View>
          </View>
        </View>

        <View style={s.notice}>
          <Ionicons name="information-circle" size={22} color={C.ORANGE} />
          <Text style={{ flex: 1, fontFamily: F.semi, fontSize: 14, color: '#795548' }}>Apresente este código ao atendente do ponto de coleta</Text>
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingVertical: 20 }}>
        <Btn label="Confirmar Entrega ao Atendente" onPress={onConfirm} disabled={!disposal || secs === 0} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    width: '100%', borderRadius: 24, padding: 24, alignItems: 'center', gap: 20, backgroundColor: C.WHITE,
    borderWidth: 2, borderColor: 'rgba(76,175,80,0.13)', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4,
  },
  qrBox: { padding: 16, borderRadius: 16, backgroundColor: '#F5F5F5' },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  alt: { width: '100%', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 8, borderRadius: 12, backgroundColor: '#F5F5F5', borderWidth: 1.5, borderColor: C.BORDER, borderStyle: 'dashed' },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, backgroundColor: 'rgba(255,152,0,0.09)', borderWidth: 1.5, borderColor: 'rgba(255,152,0,0.27)' },
});
