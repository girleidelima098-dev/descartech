import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BackBtn, Btn, useTopPad } from '../../components/ui';
import { C, F } from '../../theme';

const STEPS = [
  'Faça backup dos seus arquivos importantes',
  'Apague todos os dados pessoais do dispositivo',
  'Realize a restauração de fábrica (factory reset)',
  'Retire cartões SIM, memória e acessórios',
  'Embale o item com proteção básica',
];

export default function SafetyScreen({ onClose, onGenerate }: { onClose: () => void; onGenerate: () => void }) {
  const top = useTopPad();
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const allDone = checked.size === STEPS.length;
  const toggle = (i: number) =>
    setChecked((prev) => {
      const n = new Set(prev);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });

  return (
    <View style={{ flex: 1, backgroundColor: C.BG }}>
      <View style={{ paddingHorizontal: 20, paddingTop: top, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackBtn onPress={onClose} />
        <Text style={{ fontFamily: F.bold, fontSize: 20, color: C.SLATE }}>Instruções de Preparo</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}>
        <LinearGradient colors={[C.G, C.G_DARK]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.banner}>
          <View style={s.bannerIcon}>
            <Ionicons name="information-circle" size={26} color={C.WHITE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: F.bold, fontSize: 14, color: C.WHITE }}>Proteção de Dados</Text>
            <Text style={{ fontFamily: F.reg, fontSize: 12, color: C.WHITE, opacity: 0.8 }}>Proteja sua privacidade antes do descarte.</Text>
          </View>
        </LinearGradient>

        <Text style={s.label}>Checklist Obrigatório</Text>
        <View style={{ gap: 8 }}>
          {STEPS.map((step, i) => {
            const on = checked.has(i);
            return (
              <Pressable key={step} onPress={() => toggle(i)} style={[s.item, { backgroundColor: on ? C.G_LIGHT : C.WHITE, borderColor: on ? C.G : C.BORDER }]}>
                <View style={[s.box, { backgroundColor: on ? C.G : C.GRAY_LT, borderColor: on ? C.G : C.BORDER }]}>
                  {on && <Ionicons name="checkmark" size={14} color={C.WHITE} />}
                </View>
                <Text style={{ flex: 1, fontFamily: F.med, fontSize: 14, color: on ? C.G : C.SLATE }}>{step}</Text>
              </Pressable>
            );
          })}
        </View>
        {!allDone && (
          <Text style={{ textAlign: 'center', fontFamily: F.med, fontSize: 12, color: C.MUTED, marginTop: 16 }}>
            Marque todos os itens para continuar
          </Text>
        )}
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingVertical: 20 }}>
        <Btn label={allDone ? 'Gerar QR Code de Descarte →' : 'Complete o checklist acima'} onPress={allDone ? onGenerate : undefined} disabled={!allDone} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  banner: { padding: 16, borderRadius: 16, marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  bannerIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: F.bold, fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase', color: C.MUTED, marginBottom: 12 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12, borderWidth: 1.5 },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
