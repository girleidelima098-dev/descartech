import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { BackBtn, Btn, useTopPad } from '../../components/ui';
import { validateQr } from '../../services/api';
import { C, F } from '../../theme';


export default function ScannerScreen({ onBack }: { onBack: () => void }) {
  const top = useTopPad();
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function onScan({ data }: { data: string }) {
    if (busy || result) return;
    setBusy(true);
    setResult(await validateQr(data));
    setBusy(false);
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.BG }}>
      <View style={{ paddingHorizontal: 20, paddingTop: top, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <BackBtn onPress={onBack} />
        <Text style={{ fontFamily: F.bold, fontSize: 20, color: C.SLATE }}>Validar QR Code</Text>
      </View>

      {!permission ? null : !permission.granted ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 }}>
          <Text style={{ fontFamily: F.med, fontSize: 14, color: C.SLATE, textAlign: 'center' }}>
            Precisamos de acesso à câmera para ler o QR Code do cliente.
          </Text>
          <Btn label="Permitir câmera" onPress={requestPermission} />
        </View>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 20, gap: 16 }}>
          <View style={s.cam}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={result ? undefined : onScan}
            />
          </View>
          {result ? (
            <View style={{ gap: 12 }}>
              <View style={{ padding: 12, borderRadius: 12, backgroundColor: result.ok ? C.G_LIGHT : C.RED_LT }}>
                <Text style={{ fontFamily: F.semi, fontSize: 14, textAlign: 'center', color: result.ok ? C.G : C.RED }}>{result.message}</Text>
              </View>
              <Btn label="Ler outro código" onPress={() => setResult(null)} />
            </View>
          ) : (
            <Text style={{ fontFamily: F.med, fontSize: 12, color: C.MUTED, textAlign: 'center' }}>
              {busy ? 'Validando…' : 'Aponte a câmera para o QR Code do cliente'}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  cam: { flex: 1, borderRadius: 24, overflow: 'hidden', backgroundColor: '#000' },
});
