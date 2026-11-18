import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F } from '../theme';


export function useTopPad(extra = 12) {
  return useSafeAreaInsets().top + extra;
}

export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[s.chip, { backgroundColor: active ? C.G : C.WHITE, borderColor: active ? C.G : C.BORDER }]}
    >
      <Text style={[s.chipTxt, { color: active ? C.WHITE : C.SLATE_LT }]}>{label}</Text>
    </Pressable>
  );
}

type Variant = 'primary' | 'outline' | 'danger' | 'ghost';

export function Btn({
  label, onPress, variant = 'primary', disabled = false, small = false,
}: {
  label: string; onPress?: () => void; variant?: Variant; disabled?: boolean; small?: boolean;
}) {
  const v = {
    primary: { bg: disabled ? '#BDBDBD' : C.G, fg: C.WHITE, border: 'transparent' },
    outline: { bg: C.WHITE, fg: C.SLATE, border: C.BORDER },
    danger: { bg: C.RED, fg: C.WHITE, border: 'transparent' },
    ghost: { bg: 'transparent', fg: C.G, border: 'transparent' },
  }[variant];
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        s.btn,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          paddingVertical: small ? 8 : 14,
          paddingHorizontal: small ? 14 : 20,
          opacity: pressed && !disabled ? 0.8 : 1,
        },
      ]}
    >
      <Text style={{ color: v.fg, fontFamily: F.semi, fontSize: small ? 13 : 15 }}>{label}</Text>
    </Pressable>
  );
}

export function BackBtn({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel="Voltar" style={s.back}>
      <Ionicons name="chevron-back" size={18} color={C.SLATE} />
    </Pressable>
  );
}

export function Field(props: TextInputProps & { label: string }) {
  const { label, style, ...rest } = props;
  return (
    <TextInput
      accessibilityLabel={label}
      placeholder={label}
      placeholderTextColor={C.MUTED}
      autoCapitalize="none"
      {...rest}
      style={[s.field, style]}
    />
  );
}

export function Logo({ size = 56 }: { size?: number }) {
  return (
    <View style={[s.logo, { width: size, height: size }]}>
      <Svg width={size * 0.57} height={size * 0.57} viewBox="0 0 42 42" fill="none">
        <Path
          d="M21 6C12.716 6 6 12.716 6 21s6.716 15 15 15 15-6.716 15-15S29.284 6 21 6zm0 4a11 11 0 0 1 10.95 12H21v-9a2 2 0 0 0-4 0v9H6.05A11 11 0 0 1 21 10zm-8 18h16l-3 5H16l-3-5z"
          fill={C.WHITE}
        />
        <Circle cx={29} cy={13} r={5} fill={C.ORANGE} />
      </Svg>
    </View>
  );
}

const s = StyleSheet.create({
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1.5, marginRight: 8 },
  chipTxt: { fontFamily: F.semi, fontSize: 12 },
  btn: { borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', width: '100%' },
  back: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: C.WHITE, borderWidth: 1.5,
    borderColor: C.BORDER, alignItems: 'center', justifyContent: 'center',
  },
  field: {
    borderRadius: 12, borderWidth: 1.5, borderColor: C.BORDER, backgroundColor: C.WHITE,
    paddingHorizontal: 16, paddingVertical: 12, fontFamily: F.reg, fontSize: 14, color: C.SLATE,
  },
  logo: {
    backgroundColor: C.G, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
});
