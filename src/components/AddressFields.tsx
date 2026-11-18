import React, { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { lookupCep } from '../services/cep';
import { C, F } from '../theme';
import { AddressForm, formatCep } from '../utils/address';
import { onlyDigits } from '../utils/format';
import { Field } from './ui';


export default function AddressFields({ value, onChange, title = 'Endereço' }: { value: AddressForm; onChange: (a: AddressForm) => void; title?: string }) {
  const [looking, setLooking] = useState(false);
  const [hint, setHint] = useState('');
  const set = (patch: Partial<AddressForm>) => onChange({ ...value, ...patch });

  async function onCep(text: string) {
    const cep = formatCep(text);
    setHint('');
    const isNew = onlyDigits(cep).length === 8 && onlyDigits(cep) !== onlyDigits(value.cep);
    onChange({ ...value, cep });
    if (!isNew) return;
    setLooking(true);
    try {
      const r = await lookupCep(cep);
      if (r) {
        onChange({
          ...value,
          cep,
          street: r.street || value.street,
          neighborhood: r.neighborhood || value.neighborhood,
          city: r.city || value.city,
          state: r.state || value.state,
        });
      } else {
        setHint('CEP não encontrado. Preencha o endereço manualmente.');
      }
    } catch {
      setHint('Não foi possível consultar o CEP agora. Preencha manualmente.');
    } finally {
      setLooking(false);
    }
  }

  return (
    <View style={{ gap: 10 }}>
      <Text style={{ fontFamily: F.bold, fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase', color: C.MUTED, marginTop: 6 }}>{title}</Text>
      <View>
        <Field label="CEP" value={value.cep} onChangeText={onCep} keyboardType="number-pad" maxLength={9} autoComplete="postal-code" />
        {looking && <ActivityIndicator size="small" color={C.G} style={{ position: 'absolute', right: 14, top: 15 }} />}
      </View>
      {!!hint && <Text style={{ fontFamily: F.med, fontSize: 12, color: C.ORANGE }}>{hint}</Text>}
      <Field label="Rua" value={value.street} onChangeText={(t) => set({ street: t })} autoCapitalize="words" autoComplete="street-address" />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Field label="Número" value={value.number} onChangeText={(t) => set({ number: t })} />
        </View>
        <View style={{ flex: 2 }}>
          <Field label="Complemento (opcional)" value={value.complement} onChangeText={(t) => set({ complement: t })} autoCapitalize="sentences" />
        </View>
      </View>
      <Field label="Bairro" value={value.neighborhood} onChangeText={(t) => set({ neighborhood: t })} autoCapitalize="words" />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 3 }}>
          <Field label="Cidade" value={value.city} onChangeText={(t) => set({ city: t })} autoCapitalize="words" />
        </View>
        <View style={{ flex: 1 }}>
          <Field label="UF" value={value.state} onChangeText={(t) => set({ state: t.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2) })} autoCapitalize="characters" maxLength={2} />
        </View>
      </View>
    </View>
  );
}
