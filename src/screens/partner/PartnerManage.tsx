import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DeleteAccountButton from '../../components/DeleteAccountButton';
import { Btn, Field, useTopPad } from '../../components/ui';
import { savePointSettings } from '../../services/api';
import { C, F } from '../../theme';
import { CouponOffer, Point } from '../../types';
import { normalize } from '../../utils/geo';
import { MATERIAL_SUGGESTIONS } from '../../utils/materials';

const same = (a: string, b: string) => normalize(a) === normalize(b);
const digits = (t: string) => t.replace(/\D/g, '');

/**
 * Gestão do ecoponto. Abre só para leitura; "Editar" libera os campos e "Salvar" grava.
 * O que for salvo aparece na hora:
 *  - para o Cliente (materiais aceitos/não aceitos, horário e capacidade do ecoponto);
 *  - na tela de Operação (capacidade, volume e cupons);
 *  - para a Cooperativa (capacidade e lote).
 */
export default function PartnerManage({ point: p, onBack, onDeleted }: { point: Point; onBack: () => void; onDeleted: () => void }) {
  const top = useTopPad();
  const [editing, setEditing] = useState(p.items.length === 0); // primeiro acesso já abre para preencher
  const [hours, setHours] = useState(p.hours);
  const [capacity, setCapacity] = useState(String(p.capacityKg));
  const [items, setItems] = useState<string[]>(p.items);
  const [restricted, setRestricted] = useState<string[]>(p.restricted);
  const [discount, setDiscount] = useState(p.offer ? String(p.offer.discount) : '');
  const [category, setCategory] = useState(p.offer?.category ?? '');
  const [code, setCode] = useState(p.offer?.code ?? '');
  const [validity, setValidity] = useState(String(p.offer?.validityDays ?? 30));
  const [quantity, setQuantity] = useState(p.offer ? String(p.offer.quantity) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  function startEdit() {
    setHours(p.hours);
    setCapacity(String(p.capacityKg));
    setItems(p.items);
    setRestricted(p.restricted);
    setDiscount(p.offer ? String(p.offer.discount) : '');
    setCategory(p.offer?.category ?? '');
    setCode(p.offer?.code ?? '');
    setValidity(String(p.offer?.validityDays ?? 30));
    setQuantity(p.offer ? String(p.offer.quantity) : '');
    setError('');
    setSaved(false);
    setEditing(true);
  }

  function cancel() {
    setError('');
    setEditing(false);
  }

  // Um material nunca fica nas duas listas ao mesmo tempo
  function add(which: 'ok' | 'no', raw: string) {
    const label = raw.trim();
    if (label.length < 2) return;
    if (which === 'ok') {
      setRestricted((l) => l.filter((x) => !same(x, label)));
      setItems((l) => (l.some((x) => same(x, label)) ? l : [...l, label]));
    } else {
      setItems((l) => l.filter((x) => !same(x, label)));
      setRestricted((l) => (l.some((x) => same(x, label)) ? l : [...l, label]));
    }
  }

  async function save() {
    setError('');
    const cap = parseInt(capacity, 10);
    if (!cap || cap < 1) return setError('Informe a capacidade do ecoponto em kg.');
    if (items.length === 0) return setError('Cadastre ao menos um material aceito.');

    let offer: CouponOffer | null = null;
    const qty = parseInt(quantity || '0', 10);
    if (qty > 0) {
      const d = parseInt(discount, 10);
      const v = parseInt(validity, 10);
      if (!d || d < 1 || d > 100) return setError('O desconto do cupom deve ser entre 1% e 100%.');
      if (!/^[A-Za-z0-9]{3,12}$/.test(code.trim())) return setError('O código do cupom deve ter de 3 a 12 letras ou números.');
      if (!v || v < 1) return setError('Informe a validade do cupom em dias.');
      offer = { discount: d, category: category.trim() || 'Compras em geral', code: code.trim().toUpperCase(), validityDays: v, quantity: qty };
    }

    setSaving(true);
    const r = await savePointSettings(p.id, { hours, capacityKg: cap, items, restricted, offer });
    setSaving(false);
    if (r.ok) {
      setEditing(false);
      setSaved(true);
    } else setError(r.message);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.BG }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ paddingHorizontal: 20, paddingTop: top + 8, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Voltar" style={s.smallBtn}>
            <Ionicons name="chevron-back" size={14} color={C.SLATE_LT} />
            <Text style={{ fontFamily: F.semi, fontSize: 12, color: C.SLATE_LT }}>Voltar</Text>
          </Pressable>
          {!editing && (
            <Pressable onPress={startEdit} accessibilityRole="button" accessibilityLabel="Editar" style={[s.smallBtn, { backgroundColor: C.G_LIGHT, borderColor: 'transparent' }]}>
              <Ionicons name="create-outline" size={14} color={C.G} />
              <Text style={{ fontFamily: F.semi, fontSize: 12, color: C.G }}>Editar</Text>
            </Pressable>
          )}
        </View>
        <Text style={{ fontFamily: F.bold, fontSize: 20, color: C.SLATE }}>Gestão do Ecoponto</Text>
        <Text style={{ fontFamily: F.reg, fontSize: 12, color: C.MUTED, marginTop: 2 }}>
          {editing ? 'Modo de edição: altere o que precisar e toque em Salvar.' : 'O que está salvo aqui aparece para clientes e cooperativa e atualiza a Operação.'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 20 }} keyboardShouldPersistTaps="handled">
        {saved && !editing && (
          <View style={{ backgroundColor: C.G_LIGHT, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}>
            <Text style={{ fontFamily: F.semi, fontSize: 12, color: C.G_DARK, textAlign: 'center' }}>
              Configurações salvas. Clientes, cooperativa e Operação já foram atualizados.
            </Text>
          </View>
        )}

        {!editing ? (
          <>
            <View style={s.card}>
              <Text style={s.label}>Ecoponto</Text>
              <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.SLATE, marginTop: 6 }}>{p.name}</Text>
              {!!p.address && <Text style={{ fontFamily: F.reg, fontSize: 12, color: C.MUTED, marginTop: 2 }}>{p.address} · {p.city}</Text>}
              <Text style={{ fontFamily: F.semi, fontSize: 13, color: C.SLATE, marginTop: 10 }}>{p.hours || 'Horário não informado'}</Text>
            </View>

            <View style={s.card}>
              <Text style={s.label}>Capacidade</Text>
              <Text style={{ fontFamily: F.xbold, fontSize: 24, color: C.SLATE, marginTop: 6 }}>{p.capacityKg} kg</Text>
              <Text style={{ fontFamily: F.reg, fontSize: 12, color: C.MUTED, marginTop: 2 }}>Volume atual: {p.usedKg} kg ({p.fill}%)</Text>
            </View>

            <View style={s.card}>
              <Text style={[s.label, { color: C.G }]}>✓ Materiais aceitos</Text>
              <View style={[s.wrap, { marginTop: 10 }]}>
                {p.items.length === 0 && <Text style={s.none}>Nenhum material cadastrado.</Text>}
                {p.items.map((l) => (
                  <View key={l} style={[s.pill, { backgroundColor: C.G_LIGHT }]}>
                    <Text style={{ fontFamily: F.semi, fontSize: 12, color: C.G }}>{l}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={s.card}>
              <Text style={[s.label, { color: C.RED }]}>✗ Materiais não aceitos</Text>
              <View style={[s.wrap, { marginTop: 10 }]}>
                {p.restricted.length === 0 && <Text style={s.none}>Nenhum material cadastrado.</Text>}
                {p.restricted.map((l) => (
                  <View key={l} style={[s.pill, { backgroundColor: C.RED_LT }]}>
                    <Text style={{ fontFamily: F.semi, fontSize: 12, color: C.RED }}>{l}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={s.card}>
              <Text style={s.label}>Cupons para os clientes</Text>
              {p.offer ? (
                <View style={{ marginTop: 10 }}>
                  <Row k="Desconto" v={`${p.offer.discount}% OFF`} />
                  <Row k="Condição" v={p.offer.category} />
                  <Row k="Código" v={p.offer.code} />
                  <Row k="Validade" v={`${p.offer.validityDays} dias`} />
                  <Row k="Disponibilizados" v={String(p.offer.quantity)} />
                  <Row k="Emitidos / utilizados" v={`${p.couponsIssued} / ${p.couponsUsed}`} />
                </View>
              ) : (
                <Text style={[s.none, { marginTop: 10 }]}>Nenhum cupom configurado.</Text>
              )}
            </View>

            <DeleteAccountButton onDeleted={onDeleted} extra="Seu ecoponto será removido do mapa e os cupons emitidos por ele deixam de valer." />
          </>
        ) : (
          <>
            <View style={s.card}>
              <Text style={s.label}>Ecoponto</Text>
              <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.SLATE, marginTop: 6 }}>{p.name}</Text>
              {!!p.address && <Text style={{ fontFamily: F.reg, fontSize: 12, color: C.MUTED, marginTop: 2 }}>{p.address} · {p.city}</Text>}
              <View style={{ marginTop: 12, gap: 6 }}>
                <Text style={s.fieldLabel}>Horário de funcionamento</Text>
                <Field label="Ex.: Seg–Sex 8h–18h · Sáb 8h–13h" value={hours} onChangeText={setHours} autoCapitalize="sentences" />
              </View>
            </View>

            <View style={s.card}>
              <Text style={s.label}>Capacidade</Text>
              <Text style={s.help}>Quanto de material o ecoponto aceita. Esse limite vale para a barra de capacidade, para o lote da cooperativa e bloqueia novos descartes quando lotar.</Text>
              <View style={{ marginTop: 10, gap: 6 }}>
                <Text style={s.fieldLabel}>Limite de material (kg)</Text>
                <Field label="Ex.: 50" value={capacity} onChangeText={(t) => setCapacity(digits(t).slice(0, 6))} keyboardType="number-pad" />
                <Text style={{ fontFamily: F.reg, fontSize: 12, color: C.MUTED }}>Volume atual: {p.usedKg} kg</Text>
              </View>
            </View>

            <MaterialList
              title="Materiais aceitos"
              tone="ok"
              list={items}
              onAdd={(l) => add('ok', l)}
              onRemove={(l) => setItems((x) => x.filter((i) => i !== l))}
              hidden={[...items, ...restricted]}
            />
            <MaterialList
              title="Materiais não aceitos"
              tone="no"
              list={restricted}
              onAdd={(l) => add('no', l)}
              onRemove={(l) => setRestricted((x) => x.filter((i) => i !== l))}
              hidden={[...items, ...restricted]}
            />

            <View style={s.card}>
              <Text style={s.label}>Cupons para os clientes</Text>
              <Text style={s.help}>Quem descartar no seu ecoponto ganha um cupom na carteira. Deixe a quantidade em branco para não oferecer cupom.</Text>
              <View style={{ marginTop: 10, gap: 10 }}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={s.fieldLabel}>Desconto (%)</Text>
                    <Field label="Ex.: 15" value={discount} onChangeText={(t) => setDiscount(digits(t).slice(0, 3))} keyboardType="number-pad" />
                  </View>
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={s.fieldLabel}>Quantidade</Text>
                    <Field label="Ex.: 500" value={quantity} onChangeText={(t) => setQuantity(digits(t).slice(0, 6))} keyboardType="number-pad" />
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={s.fieldLabel}>Código</Text>
                    <Field label="Ex.: ECO15" value={code} onChangeText={(t) => setCode(t.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 12))} autoCapitalize="characters" />
                  </View>
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={s.fieldLabel}>Validade (dias)</Text>
                    <Field label="Ex.: 30" value={validity} onChangeText={(t) => setValidity(digits(t).slice(0, 3))} keyboardType="number-pad" />
                  </View>
                </View>
                <View style={{ gap: 6 }}>
                  <Text style={s.fieldLabel}>Condição</Text>
                  <Field label="Ex.: Compras acima de R$150" value={category} onChangeText={setCategory} autoCapitalize="sentences" />
                </View>
                <Text style={{ fontFamily: F.reg, fontSize: 12, color: C.MUTED }}>Já emitidos: {p.couponsIssued} · Utilizados: {p.couponsUsed}</Text>
              </View>
            </View>

            {!!error && (
              <View style={{ backgroundColor: C.RED_LT, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}>
                <Text style={{ fontFamily: F.semi, fontSize: 12, color: C.RED, textAlign: 'center' }}>{error}</Text>
              </View>
            )}

            <View style={{ gap: 10 }}>
              <Btn label={saving ? 'Salvando…' : 'Salvar'} onPress={save} disabled={saving} />
              <Btn label="Cancelar" onPress={cancel} variant="outline" disabled={saving} />
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderTopWidth: 1, borderTopColor: C.BORDER }}>
      <Text style={{ fontFamily: F.reg, fontSize: 13, color: C.MUTED }}>{k}</Text>
      <Text style={{ flex: 1, textAlign: 'right', fontFamily: F.semi, fontSize: 13, color: C.SLATE }}>{v}</Text>
    </View>
  );
}

function MaterialList({
  title, tone, list, onAdd, onRemove, hidden,
}: {
  title: string; tone: 'ok' | 'no'; list: string[]; onAdd: (label: string) => void; onRemove: (label: string) => void; hidden: string[];
}) {
  const [text, setText] = useState('');
  const color = tone === 'ok' ? C.G : C.RED;
  const bg = tone === 'ok' ? C.G_LIGHT : C.RED_LT;
  const suggestions = MATERIAL_SUGGESTIONS.filter((m) => !hidden.some((h) => same(h, m))).slice(0, 8);

  function submit() {
    onAdd(text);
    setText('');
  }

  return (
    <View style={s.card}>
      <Text style={[s.label, { color }]}>{tone === 'ok' ? '✓ ' : '✗ '}{title}</Text>
      <Text style={s.help}>{tone === 'ok' ? 'O cliente vê esta lista ao pesquisar seu ecoponto. Toque num item para remover.' : 'Itens que o ecoponto não recebe. O cliente também vê. Toque num item para remover.'}</Text>

      <View style={[s.wrap, { marginTop: 10 }]}>
        {list.length === 0 && <Text style={s.none}>Nenhum material cadastrado.</Text>}
        {list.map((l) => (
          <Pressable key={l} onPress={() => onRemove(l)} accessibilityLabel={`Remover ${l}`} style={[s.pill, { backgroundColor: bg, flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
            <Text style={{ fontFamily: F.semi, fontSize: 12, color }}>{l}</Text>
            <Ionicons name="close" size={14} color={color} />
          </Pressable>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Field label="Digite um material" value={text} onChangeText={setText} onSubmitEditing={submit} returnKeyType="done" autoCapitalize="sentences" />
        </View>
        <Pressable onPress={submit} style={[s.addBtn, { backgroundColor: color }]} accessibilityLabel="Adicionar material">
          <Ionicons name="add" size={22} color={C.WHITE} />
        </Pressable>
      </View>

      {suggestions.length > 0 && (
        <View style={{ marginTop: 10 }}>
          <Text style={{ fontFamily: F.med, fontSize: 12, color: C.MUTED, marginBottom: 6 }}>Sugestões (toque para adicionar)</Text>
          <View style={s.wrap}>
            {suggestions.map((m) => (
              <Pressable key={m} onPress={() => onAdd(m)} style={[s.pill, { backgroundColor: C.WHITE, borderWidth: 1.5, borderColor: C.BORDER }]}>
                <Text style={{ fontFamily: F.med, fontSize: 12, color: C.SLATE_LT }}>+ {m}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: { padding: 16, borderRadius: 16, backgroundColor: C.WHITE, borderWidth: 1.5, borderColor: C.BORDER },
  label: { fontFamily: F.bold, fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase', color: C.MUTED },
  fieldLabel: { fontFamily: F.semi, fontSize: 12, color: C.SLATE_LT },
  help: { fontFamily: F.reg, fontSize: 12, color: C.MUTED, marginTop: 4, lineHeight: 18 },
  none: { fontFamily: F.reg, fontSize: 12, color: C.MUTED },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  addBtn: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  smallBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: C.BORDER, backgroundColor: C.WHITE },
});
