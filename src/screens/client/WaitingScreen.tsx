import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { Btn } from '../../components/ui';
import { confirmDisposal } from '../../services/api';
import { C, F } from '../../theme';

const STEPS = ['Código verificado', 'Checklist validado', 'Item conferido', 'Emitir cupom'];
const DONE = 3; 

export default function WaitingScreen({ token, onDone, onBack }: { token: string; onDone: () => void; onBack: () => void }) {
  const [dots, setDots] = useState(0);
  const [error, setError] = useState('');
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    const d = setInterval(() => setDots((v) => (v + 1) % 4), 600);
    let alive = true;
    
    Promise.all([confirmDisposal(token), new Promise((r) => setTimeout(r, 4000))]).then(([res]) => {
      if (!alive) return;
      if (res.ok) onDone();
      else setError(res.message);
    });
    return () => {
      alive = false;
      loop.stop();
      clearInterval(d);
    };
  }, [token, onDone, spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: C.BG, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 20 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: C.RED_LT, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="alert-circle" size={40} color={C.RED} />
        </View>
        <Text style={{ fontFamily: F.bold, fontSize: 18, color: C.SLATE, textAlign: 'center' }}>Não foi possível confirmar</Text>
        <Text style={{ fontFamily: F.med, fontSize: 14, color: C.MUTED, textAlign: 'center' }}>{error}</Text>
        <Btn label="Voltar ao mapa" onPress={onBack} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.BG, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 32 }}>
      <View style={{ alignItems: 'center', gap: 24, width: '100%' }}>
        <View style={{ width: 112, height: 112, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}>
            <Svg width={112} height={112} viewBox="0 0 100 100">
              <Circle cx={50} cy={50} r={42} fill="none" stroke={C.G_LIGHT} strokeWidth={8} />
              <Circle cx={50} cy={50} r={42} fill="none" stroke={C.G} strokeWidth={8} strokeDasharray="80 190" strokeLinecap="round" />
            </Svg>
          </Animated.View>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: C.G_LIGHT, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="checkmark-circle" size={36} color={C.G} />
          </View>
        </View>

        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text style={{ fontFamily: F.bold, fontSize: 20, color: C.SLATE }}>Processando{'.'.repeat(dots)}</Text>
          <Text style={{ fontFamily: F.med, fontSize: 14, color: C.MUTED, textAlign: 'center' }}>Aguardando validação com o atendente</Text>
        </View>

        <View style={{ gap: 12, width: '100%' }}>
          {STEPS.map((step, i) => (
            <View key={step} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: i < DONE ? C.G : C.BORDER }}>
                {i < DONE ? <Ionicons name="checkmark" size={14} color={C.WHITE} /> : <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.G }} />}
              </View>
              <Text style={{ fontFamily: F.med, fontSize: 14, color: i < DONE ? C.G : C.MUTED }}>{step}</Text>
            </View>
          ))}
        </View>
      </View>
      <Text style={{ fontFamily: F.reg, fontSize: 12, color: '#BDBDBD', textAlign: 'center' }}>Não saia desta tela. O processo leva cerca de 30 segundos.</Text>
    </View>
  );
}
