import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { deleteAccount } from '../services/api';
import { C, F } from '../theme';


export default function DeleteAccountButton({ onDeleted, extra }: { onDeleted: () => void; extra?: string }) {
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    const r = await deleteAccount();
    setBusy(false);
    if (r.ok) onDeleted();
    else Alert.alert('Não foi possível excluir', r.message);
  }

  function ask() {
    Alert.alert(
      'Excluir conta?',
      `Esta ação é definitiva: sua conta e todos os seus dados serão apagados da plataforma.${extra ? `\n\n${extra}` : ''}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: run },
      ],
    );
  }

  return (
    <View style={{ alignItems: 'center', paddingVertical: 8 }}>
      <Pressable
        onPress={ask}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel="Excluir conta"
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(229,57,53,0.45)', opacity: busy ? 0.6 : 1 }}
      >
        {busy ? <ActivityIndicator size="small" color={C.RED} /> : <Ionicons name="trash-outline" size={14} color={C.RED} />}
        <Text style={{ fontFamily: F.semi, fontSize: 12, color: C.RED }}>{busy ? 'Excluindo…' : 'Excluir conta'}</Text>
      </Pressable>
    </View>
  );
}
