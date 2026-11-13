import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BackBtn, Btn, useTopPad } from '../../components/ui';
import { C, F } from '../../theme';
import { Point } from '../../types';

const EQUIPMENT: { label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { label: 'Monitor', icon: 'desktop-outline' },
  { label: 'Smartphone', icon: 'phone-portrait-outline' },
  { label: 'Laptop', icon: 'laptop-outline' },
  { label: 'Tablet', icon: 'tablet-portrait-outline' },
  { label: 'Fios em geral', icon: 'flash-outline' },
  { label: 'Baterias', icon: 'battery-charging-outline' },
];

export default function DetailScreen({ point: p, onClose, onContinue }: { point: Point; onClose: () => void; onContinue: (items: string[]) => void }) {
  const top = useTopPad();
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (label: string) => setSelected((cur) => (cur.includes(label) ? cur.filter((x) => x !== label) : [...cur, label]));
  return (
    <View style={{ flex: 1, backgroundColor: C.BG }}>
      <View style={s.hero}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop&auto=format' }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          accessibilityLabel={p.name}
        />
        <LinearGradient colors={['rgba(0,0,0,0.05)', 'rgba(55,71,79,0.75)']} style={StyleSheet.absoluteFill} />
        <View style={{ position: 'absolute', top, left: 16 }}>
          <BackBtn onPress={onClose} />
        </View>
        <View style={[s.fillBadge, { top, backgroundColor: p.fill > 80 ? C.RED : C.G }]}>
          <Text style={{ fontFamily: F.bold, fontSize: 12, color: C.WHITE }}>{p.fill}% cheio</Text>
        </View>
        <View style={{ position: 'absolute', bottom: 16, left: 20, right: 20 }}>
          <Text style={{ fontFamily: F.bold, fontSize: 18, color: C.WHITE }}>{p.name}</Text>
          <Text style={{ fontFamily: F.reg, fontSize: 12, color: C.WHITE, opacity: 0.85 }}>{p.address} · {p.city}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 20, gap: 16 }}>
        <View style={s.hours}>
          <View style={s.hoursIcon}>
            <Ionicons name="time-outline" size={18} color={C.G} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>Horário</Text>
            <Text style={{ fontFamily: F.semi, fontSize: 14, color: C.SLATE }}>{p.hours}</Text>
          </View>
        </View>

        <View>
          <Text style={[s.label, { color: C.G, marginBottom: 8 }]}>✓ Aceitos</Text>
          <View style={s.wrap}>
            {p.items.map((i) => (
              <View key={i} style={[s.pill, { backgroundColor: C.G_LIGHT }]}>
                <Text style={[s.pillTxt, { color: C.G }]}>{i}</Text>
              </View>
            ))}
          </View>
        </View>

        <View>
          <Text style={[s.label, { color: C.RED, marginBottom: 8 }]}>✗ Não aceitos</Text>
          <View style={s.wrap}>
            {p.restricted.map((i) => (
              <View key={i} style={[s.pill, { backgroundColor: C.RED_LT }]}>
                <Text style={[s.pillTxt, { color: C.RED }]}>{i}</Text>
              </View>
            ))}
          </View>
        </View>

        <View>
          <Text style={[s.label, { marginBottom: 8 }]}>O que você vai descartar?</Text>
          <View style={s.wrap}>
            {EQUIPMENT.map((e) => {
              const on = selected.includes(e.label);
              return (
                <Pressable key={e.label} onPress={() => toggle(e.label)} accessibilityState={{ selected: on }} style={[s.eq, { backgroundColor: on ? C.G_LIGHT : C.WHITE, borderColor: on ? C.G : C.BORDER }]}>
                  <Ionicons name={e.icon} size={24} color={on ? C.G : C.SLATE_LT} />
                  <Text style={{ fontFamily: F.semi, fontSize: 12, color: on ? C.G : C.SLATE, textAlign: 'center' }}>{e.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={s.info}>
          <Text style={{ color: C.ORANGE }}>ℹ</Text>
          <Text style={{ flex: 1, fontFamily: F.med, fontSize: 12, color: '#795548' }}>
            Limite de 1 descarte por CPF por dia. Itens devem estar sem danos físicos aparentes.
          </Text>
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingVertical: 20 }}>
        <Btn label={selected.length ? 'Descartar Aqui →' : 'Selecione o equipamento'} onPress={() => onContinue(selected)} disabled={selected.length === 0} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  hero: { height: 176, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: 'hidden' },
  fillBadge: { position: 'absolute', right: 16, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  hours: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, backgroundColor: C.WHITE, borderWidth: 1.5, borderColor: C.BORDER },
  hoursIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: C.G_LIGHT, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: F.bold, fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase', color: C.MUTED },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  eq: { width: '31.5%', paddingVertical: 14, paddingHorizontal: 6, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', gap: 6 },
  pillTxt: { fontFamily: F.semi, fontSize: 12 },
  info: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 12, backgroundColor: C.AMBER_LT, borderWidth: 1, borderColor: '#FFE082' },
});
