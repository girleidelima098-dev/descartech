import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTopPad } from '../../components/ui';
import { C, F } from '../../theme';
import { AppUser } from '../../types';

export default function ProfileTab({ user, onLogout, coupons, disposals }: { user?: AppUser; onLogout: () => void; coupons: number; disposals: number }) {
  const top = useTopPad();
  
    const fields = [
    { label: 'Descartes realizados', value: `${disposals} descartes` },
    { label: 'Cupons ativos', value: `${coupons} cupons` },
  ];
  return (
    <View style={{ flex: 1, backgroundColor: C.BG }}>
      <View style={{ paddingHorizontal: 20, paddingTop: top + 8, paddingBottom: 20 }}>
        <Text style={{ fontFamily: F.bold, fontSize: 20, color: C.SLATE }}>Perfil</Text>
      </View>

      <View style={{ alignItems: 'center', gap: 12, paddingBottom: 24 }}>
        {user?.photoUri ? (
          <Image source={{ uri: user.photoUri }} style={s.avatar} />
        ) : (
          <View style={[s.avatar, { backgroundColor: C.G_LIGHT, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontFamily: F.bold, fontSize: 28, color: C.G }}>{(user?.fullName ?? 'U').trim().charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontFamily: F.bold, fontSize: 18, color: C.SLATE }}>{user?.fullName ?? 'Usuário'}</Text>
          <Text style={{ fontFamily: F.reg, fontSize: 14, color: C.MUTED }}>{user?.email ?? ''}</Text>
        </View>
        <View style={{ backgroundColor: C.G_LIGHT, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999 }}>
          <Text style={{ fontFamily: F.semi, fontSize: 12, color: C.G }}>Usuária Verificada ✓</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, gap: 12 }}>
        <Text style={{ fontFamily: F.bold, fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase', color: C.MUTED }}>Dados Pessoais</Text>
        <View style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: C.WHITE, borderWidth: 1.5, borderColor: C.BORDER }}>
          {fields.map((f, i) => (
            <View key={f.label} style={[s.row, i < fields.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.BORDER }]}>
              <Text style={{ fontFamily: F.med, fontSize: 14, color: C.MUTED }}>{f.label}</Text>
              <Text style={{ fontFamily: F.semi, fontSize: 14, color: C.SLATE }}>{f.value}</Text>
            </View>
          ))}
        </View>

        <Pressable onPress={onLogout} style={s.logout}>
          <Text style={{ fontFamily: F.semi, fontSize: 14, color: C.RED }}>Sair da conta</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: C.G },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  logout: { marginTop: 12, paddingVertical: 14, borderRadius: 12, borderWidth: 2, borderColor: C.RED, alignItems: 'center' },
});
