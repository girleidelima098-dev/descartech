import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DeleteAccountButton from '../../components/DeleteAccountButton';
import { Btn, Field, useTopPad } from '../../components/ui';
import { updateProfile } from '../../services/api';
import { C, F } from '../../theme';
import { AppUser } from '../../types';
import { formatPhone, isEmailValid, isPhoneValid, onlyDigits } from '../../utils/format';
import AddressFields from '../../components/AddressFields';
import { addressLines, emptyAddress, toAddress, toForm, validateAddress } from '../../utils/address';

export default function ProfileTab({
  user, onLogout, onUserChange, coupons, disposals,
}: {
  user?: AppUser; onLogout: () => void; onUserChange: (u: AppUser) => void; coupons: number; disposals: number;
}) {
  const top = useTopPad();
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState<string | undefined>();
  const [address, setAddress] = useState(emptyAddress());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const summary = [
    { label: 'Descartes realizados', value: `${disposals} descartes` },
    { label: 'Cupons ativos', value: `${coupons} cupons` },
  ];

  function startEdit() {
    setEmail(user?.email ?? '');
    setPhone(formatPhone(user?.phone ?? ''));
    setPhoto(user?.photoUri);
    setAddress(toForm(user?.address));
    setError('');
    setSaved(false);
    setEditing(true);
  }

  async function pickPhoto() {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.6 });
    if (!r.canceled) setPhoto(r.assets[0].uri);
  }

  async function save() {
    if (!user) return;
    setError('');
    if (!isEmailValid(email)) return setError('Informe um e-mail válido.');
    if (!isPhoneValid(phone)) return setError('Informe um telefone válido com DDD.');
    const addressError = validateAddress(address);
    if (addressError) return setError(addressError);
    setSaving(true);
    const res = await updateProfile(user, { email: email.trim(), phone: onlyDigits(phone), address: toAddress(address), photoUri: photo });
    setSaving(false);
    if (res.ok) {
      onUserChange(res.user);
      setEditing(false);
      setSaved(true);
    } else setError(res.message);
  }

  const shownPhoto = editing ? photo : user?.photoUri;
  const initial = (user?.fullName ?? 'U').trim().charAt(0).toUpperCase();

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.BG }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ paddingHorizontal: 20, paddingTop: top + 8, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: F.bold, fontSize: 20, color: C.SLATE }}>Perfil</Text>
        {!editing && (
          <Pressable onPress={startEdit} style={s.editBtn} accessibilityRole="button" accessibilityLabel="Editar perfil">
            <Ionicons name="create-outline" size={16} color={C.G} />
            <Text style={{ fontFamily: F.semi, fontSize: 13, color: C.G }}>Editar</Text>
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', gap: 12, paddingBottom: 20 }}>
          <Pressable onPress={editing ? pickPhoto : undefined} disabled={!editing} accessibilityLabel={editing ? 'Trocar foto de perfil' : undefined}>
            {shownPhoto ? (
              <Image source={{ uri: shownPhoto }} style={s.avatar} />
            ) : (
              <View style={[s.avatar, { backgroundColor: C.G_LIGHT, alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ fontFamily: F.bold, fontSize: 28, color: C.G }}>{initial}</Text>
              </View>
            )}
            {editing && (
              <View style={s.camBadge}>
                <Ionicons name="camera" size={14} color={C.WHITE} />
              </View>
            )}
          </Pressable>

          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: F.bold, fontSize: 18, color: C.SLATE }}>{user?.fullName ?? 'Usuário'}</Text>
            {!editing && <Text style={{ fontFamily: F.reg, fontSize: 14, color: C.MUTED }}>{user?.email ?? ''}</Text>}
            {!editing && !!user?.phone && <Text style={{ fontFamily: F.reg, fontSize: 14, color: C.MUTED }}>{formatPhone(user.phone)}</Text>}
          </View>

          {!editing && (
            <View style={{ backgroundColor: C.G_LIGHT, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999 }}>
              <Text style={{ fontFamily: F.semi, fontSize: 12, color: C.G }}>Usuária Verificada ✓</Text>
            </View>
          )}
          {editing && <Text style={{ fontFamily: F.med, fontSize: 12, color: C.MUTED }}>Toque na foto para trocar</Text>}
        </View>

        {editing ? (
          <View style={{ paddingHorizontal: 20, gap: 14 }}>
            <View style={{ gap: 6 }}>
              <Text style={s.label}>E-mail</Text>
              <Field label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
            </View>
            <View style={{ gap: 6 }}>
              <Text style={s.label}>Telefone</Text>
              <Field label="Telefone com DDD" value={phone} onChangeText={(t) => setPhone(formatPhone(t))} keyboardType="phone-pad" autoComplete="tel" maxLength={15} />
            </View>

            <AddressFields value={address} onChange={setAddress} title="Endereço" />

            {!!error && (
              <View style={{ backgroundColor: C.RED_LT, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}>
                <Text style={{ fontFamily: F.semi, fontSize: 12, color: C.RED, textAlign: 'center' }}>{error}</Text>
              </View>
            )}

            <View style={{ gap: 10, marginTop: 4 }}>
              <Btn label={saving ? 'Salvando…' : 'Salvar alterações'} onPress={save} disabled={saving} />
              <Btn label="Cancelar" onPress={() => setEditing(false)} variant="outline" disabled={saving} />
            </View>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, gap: 12 }}>
            {saved && (
              <View style={{ backgroundColor: C.G_LIGHT, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}>
                <Text style={{ fontFamily: F.semi, fontSize: 12, color: C.G_DARK, textAlign: 'center' }}>Perfil atualizado com sucesso.</Text>
              </View>
            )}
            <Text style={s.label}>Meu Resumo</Text>
            <View style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: C.WHITE, borderWidth: 1.5, borderColor: C.BORDER }}>
              {summary.map((f, i) => (
                <View key={f.label} style={[s.row, i < summary.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.BORDER }]}>
                  <Text style={{ fontFamily: F.med, fontSize: 14, color: C.MUTED }}>{f.label}</Text>
                  <Text style={{ fontFamily: F.semi, fontSize: 14, color: C.SLATE }}>{f.value}</Text>
                </View>
              ))}
            </View>

            {!!user?.address && (
              <>
                <Text style={s.label}>Endereço</Text>
                <View style={{ borderRadius: 16, backgroundColor: C.WHITE, borderWidth: 1.5, borderColor: C.BORDER, padding: 16, gap: 2 }}>
                  {addressLines(user.address).map((line, i) => (
                    <Text key={i} style={{ fontFamily: i === 0 ? F.semi : F.reg, fontSize: 14, color: i === 0 ? C.SLATE : C.MUTED }}>{line}</Text>
                  ))}
                </View>
              </>
            )}

            <Pressable onPress={onLogout} style={s.logout}>
              <Text style={{ fontFamily: F.semi, fontSize: 14, color: C.RED }}>Sair da conta</Text>
            </Pressable>
            <DeleteAccountButton onDeleted={onLogout} extra="Sua carteira de cupons e seu histórico de descartes também serão apagados." />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: C.G },
  camBadge: { position: 'absolute', right: -2, bottom: -2, width: 28, height: 28, borderRadius: 14, backgroundColor: C.G, borderWidth: 2, borderColor: C.WHITE, alignItems: 'center', justifyContent: 'center' },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: C.G_LIGHT },
  label: { fontFamily: F.bold, fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase', color: C.MUTED },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  logout: { marginTop: 12, paddingVertical: 14, borderRadius: 12, borderWidth: 2, borderColor: C.RED, alignItems: 'center' },
});
