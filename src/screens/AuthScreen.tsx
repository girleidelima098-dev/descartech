import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Btn, Field, Logo, useTopPad } from '../components/ui';
import { requestPasswordReset, signIn, signUp } from '../services/api';
import { C, F } from '../theme';
import { AppUser, Role } from '../types';
import { formatPhone, isEmailValid, isPhoneValid, onlyDigits } from '../utils/format';
import AddressFields from '../components/AddressFields';
import { emptyAddress, toAddress, validateAddress } from '../utils/address';

const ROLES: Role[] = ['client', 'coop', 'partner'];
const ROLE_LABEL: Record<Role, string> = { client: 'Cliente', coop: 'Cooperativa', partner: 'Parceiro' };

type Mode = 'login' | 'signup' | 'forgot';

export default function AuthScreen({ onLogin }: { onLogin: (user: AppUser, token?: string) => void }) {
  const top = useTopPad(16);
  const [tab, setTab] = useState<Role>('client');
  const [mode, setMode] = useState<Mode>('login');
  const [fullName, setFullName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState(emptyAddress());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [photo, setPhoto] = useState<string | undefined>();

  
  async function pickPhoto() {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.6 });
    if (!r.canceled) setPhoto(r.assets[0].uri);
  }

  function goTo(m: Mode) {
    setMode(m);
    setMessage('');
    setResetSent(false);
  }

  async function submit() {
    setMessage('');

    
    if (mode === 'forgot') {
      if (!isEmailValid(email)) return setMessage('Informe o e-mail cadastrado.');
      setPending(true);
      const r = await requestPasswordReset({ email: email.trim(), role: tab });
      setPending(false);
      if (r.ok) setResetSent(true);
      else setMessage(r.message);
      return;
    }

    if (!isEmailValid(email)) return setMessage('Informe um e-mail válido.');
    if (mode === 'signup') {
      if (fullName.trim().length < 3) return setMessage('Informe seu nome completo.');
      if (tab === 'client' && !isPhoneValid(phone)) return setMessage('Informe um telefone válido com DDD.');
      if (tab !== 'client' && onlyDigits(cnpj).length !== 14) return setMessage('O CNPJ deve ter 14 dígitos.');
      if (password.length < 8) return setMessage('A senha deve ter no mínimo 8 caracteres.');
      const addressError = validateAddress(address);
      if (addressError) return setMessage(addressError);
    } else if (!password) {
      return setMessage('Informe sua senha.');
    }

    setPending(true);
    const phoneDigits = tab === 'client' ? onlyDigits(phone) : undefined;
    const res =
      mode === 'signup'
        ? await signUp({
            fullName: fullName.trim(),
            cnpj: tab !== 'client' ? onlyDigits(cnpj) : undefined,
            email: email.trim(),
            password,
            role: tab,
            photoUri: tab === 'client' ? photo : undefined,
            phone: phoneDigits,
            address: toAddress(address),
          })
        : await signIn({ email: email.trim(), password, role: tab });
    setPending(false);
    if (res.ok) {
      onLogin(
        {
          ...res.user,
          photoUri: res.user.photoUri ?? (mode === 'signup' && tab === 'client' ? photo : undefined),
          phone: res.user.phone ?? (mode === 'signup' ? phoneDigits : undefined),
          address: res.user.address ?? (mode === 'signup' ? toAddress(address) : undefined),
        },
        res.token,
      );
    } else setMessage(res.message);
  }

  function googleLogin() {
    setMessage('');
    if (tab !== 'client' && onlyDigits(cnpj).length !== 14) {
      setMode('signup');
      setMessage('Informe o CNPJ antes de continuar com o Google.');
      return;
    }
    
    setMessage('Login com Google será habilitado quando o back-end estiver pronto.');
  }

  const isForgot = mode === 'forgot';

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.BG }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', paddingHorizontal: 28, paddingTop: top + 8, paddingBottom: 24, gap: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', gap: 8 }}>
          <Logo />
          <Text style={s.title}>DescarTech</Text>
          <Text style={s.subtitle}>Descarte eletrônicos com responsabilidade e ganhe recompensas</Text>
        </View>

        <View style={{ gap: 12 }}>
          <View style={s.roles}>
            {ROLES.map((r) => (
              <Pressable
                key={r}
                onPress={() => { setTab(r); setMessage(''); setResetSent(false); }}
                style={[s.roleBtn, { backgroundColor: tab === r ? C.G : C.WHITE }]}
              >
                <Text style={[s.roleTxt, { color: tab === r ? C.WHITE : C.MUTED }]}>{ROLE_LABEL[r]}</Text>
              </Pressable>
            ))}
          </View>

          {isForgot ? (
            <View style={{ gap: 4 }}>
              <Text style={{ fontFamily: F.bold, fontSize: 18, color: C.SLATE }}>Recuperar senha</Text>
              <Text style={{ fontFamily: F.reg, fontSize: 13, color: C.MUTED, lineHeight: 19 }}>
                Informe o e-mail do seu cadastro de {ROLE_LABEL[tab]}. Vamos enviar um link para você criar uma nova senha.
              </Text>
            </View>
          ) : (
            <View style={s.modes}>
              {(['login', 'signup'] as const).map((m) => (
                <Pressable key={m} onPress={() => goTo(m)} style={[s.modeBtn, { backgroundColor: mode === m ? C.WHITE : 'transparent' }]}>
                  <Text style={[s.modeTxt, { color: mode === m ? C.SLATE : C.MUTED }]}>{m === 'login' ? 'Entrar' : 'Cadastrar'}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <View style={{ gap: 10 }}>
            {mode === 'signup' && tab === 'client' && (
              <Pressable onPress={pickPhoto} style={s.photoRow}>
                {photo ? (
                  <Image source={{ uri: photo }} style={s.photo} />
                ) : (
                  <View style={[s.photo, { backgroundColor: C.G_LIGHT, alignItems: 'center', justifyContent: 'center' }]}>
                    <Ionicons name="camera-outline" size={22} color={C.G} />
                  </View>
                )}
                <Text style={{ fontFamily: F.semi, fontSize: 13, color: C.G }}>{photo ? 'Trocar foto de perfil' : 'Adicionar foto de perfil'}</Text>
              </Pressable>
            )}
            {mode === 'signup' && <Field label={tab === 'client' ? 'Nome completo' : 'Nome da empresa'} value={fullName} onChangeText={setFullName} autoCapitalize="words" autoComplete="name" />}
            {mode === 'signup' && tab !== 'client' && (
              <Field label="CNPJ (14 dígitos)" value={cnpj} onChangeText={(t) => setCnpj(onlyDigits(t).slice(0, 14))} keyboardType="number-pad" />
            )}
            <Field label="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
            {mode === 'signup' && tab === 'client' && (
              <Field label="Telefone com DDD" value={phone} onChangeText={(t) => setPhone(formatPhone(t))} keyboardType="phone-pad" autoComplete="tel" maxLength={15} />
            )}
            {!isForgot && (
              <Field label="Senha (mínimo de 8 caracteres)" value={password} onChangeText={setPassword} secureTextEntry />
            )}
            {mode === 'signup' && (
              <AddressFields title={tab === 'client' ? 'Endereço' : 'Endereço da empresa'} value={address} onChange={setAddress} />
            )}
            {mode === 'login' && (
              <Pressable onPress={() => goTo('forgot')} hitSlop={8} style={{ alignSelf: 'flex-end' }} accessibilityRole="button">
                <Text style={s.forgot}>Esqueci minha senha</Text>
              </Pressable>
            )}
          </View>

          {resetSent && (
            <View style={s.success}>
              <Text style={s.successTxt}>
                Se este e-mail estiver cadastrado, você receberá em instantes um link para redefinir a senha. Confira também a caixa de spam.
              </Text>
            </View>
          )}
          {!!message && (
            <View style={s.alert}>
              <Text style={s.alertTxt}>{message}</Text>
            </View>
          )}

          <Btn
            label={
              pending
                ? 'Aguarde…'
                : isForgot
                  ? resetSent ? 'Enviar novamente' : 'Enviar link de recuperação'
                  : mode === 'signup' ? 'Cadastrar e entrar' : 'Entrar'
            }
            onPress={submit}
            disabled={pending}
          />

          {isForgot ? (
            <Pressable onPress={() => goTo('login')} hitSlop={8} style={{ alignItems: 'center', paddingVertical: 4 }}>
              <Text style={s.forgot}>← Voltar ao login</Text>
            </Pressable>
          ) : (
            <Pressable onPress={googleLogin} style={s.google}>
              <AntDesign name="google" size={18} color="#4285F4" />
              <Text style={s.googleTxt}>Entrar com Google</Text>
            </Pressable>
          )}
        </View>

        {!process.env.EXPO_PUBLIC_API_URL && mode === 'login' && (
          <Text style={s.demo}>Modo de teste: entre com cliente@demo.com, parceiro@demo.com ou cooperativa@demo.com (senha demo12345), ou cadastre-se.</Text>
        )}

        <Text style={s.footer}>DescarTech v2.1 · Certificado ABNT NBR 16156</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  title: { fontFamily: F.bold, fontSize: 24, color: C.G, letterSpacing: -0.5 },
  subtitle: { fontFamily: F.med, fontSize: 12, color: C.MUTED, textAlign: 'center' },
  roles: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 12, borderWidth: 1.5, borderColor: C.BORDER, backgroundColor: C.WHITE },
  roleBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  roleTxt: { fontFamily: F.semi, fontSize: 12 },
  modes: { flexDirection: 'row', padding: 4, borderRadius: 12, backgroundColor: '#ECEFF1' },
  modeBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  modeTxt: { fontFamily: F.bold, fontSize: 12 },
  forgot: { fontFamily: F.semi, fontSize: 13, color: C.G },
  alert: { backgroundColor: C.RED_LT, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  alertTxt: { fontFamily: F.semi, fontSize: 12, color: C.RED, textAlign: 'center' },
  success: { backgroundColor: C.G_LIGHT, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  successTxt: { fontFamily: F.med, fontSize: 12, color: C.G_DARK, lineHeight: 18 },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  photo: { width: 56, height: 56, borderRadius: 28 },
  google: {
    paddingVertical: 12, borderRadius: 12, backgroundColor: C.WHITE, borderWidth: 1.5, borderColor: C.BORDER,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  googleTxt: { fontFamily: F.semi, fontSize: 14, color: C.SLATE },
  demo: { fontFamily: F.reg, fontSize: 11, color: C.MUTED, textAlign: 'center', lineHeight: 16 },
  footer: { fontFamily: F.reg, fontSize: 10, color: '#BDBDBD', textAlign: 'center' },
});
