import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Circle, Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { Chip, useTopPad } from '../../components/ui';
import { geocodeCity } from '../../services/geocode';
import { C, F } from '../../theme';
import { Point } from '../../types';
import { Coords, distanceKm, formatKm, normalize } from '../../utils/geo';

const RADIUS_KM = 100; // raio considerado "próximo"
const BRAZIL: Region = { latitude: -14.5, longitude: -51.5, latitudeDelta: 40, longitudeDelta: 40 };
const CHIPS = ['Todos', 'Monitores', 'Smartphones', 'Laptops', 'Cabos', 'Baterias'];
const ALIASES: Record<string, string[]> = { Smartphones: ['celulares', 'smartphones'], Laptops: ['notebooks', 'laptops'] };

type Origin = { coords: Coords; label: string; isUser?: boolean };
type Suggestion = { key: string; kind: 'city' | 'point'; title: string; sub: string; p: Point };

export default function MapTab({ points, onOpenDetail }: { points: Point[]; onOpenDetail: (id: number) => void }) {
  const top = useTopPad();
  const mapRef = useRef<MapView>(null);
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const ys = useRef<Record<number, number>>({});
  const [filter, setFilter] = useState('Todos');
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [searching, setSearching] = useState(false);
  const [msg, setMsg] = useState('');

  function fly(c: Coords, delta = 0.4) {
    mapRef.current?.animateToRegion({ latitude: c.latitude, longitude: c.longitude, latitudeDelta: delta, longitudeDelta: delta }, 700);
  }


  async function useMyLocation(silent = false) {
    setMsg('');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      if (!silent) setMsg('Permita o acesso à localização para ver os pontos mais próximos de você.');
      return;
    }
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setOrigin({ coords: pos.coords, label: 'sua localização', isUser: true });
    setQuery('');
    setSelectedId(null);
    fly(pos.coords, 0.4);
  }

  useEffect(() => {
    useMyLocation(true).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  async function runSearch(text: string) {
    const q = text.trim();
    if (!q) return;
    Keyboard.dismiss();
    setFocused(false);
    setSearching(true);
    setMsg('');
    try {
      const g = await geocodeCity(q);
      if (!g) {
        setMsg('Cidade não encontrada. Confira o nome e tente novamente.');
      } else {
        setOrigin({ coords: g.coords, label: g.label });
        setSelectedId(null);
        fly(g.coords, g.delta);
      }
    } catch {
      setMsg('Não foi possível buscar agora. Verifique sua conexão.');
    } finally {
      setSearching(false);
    }
  }

  const filtered = useMemo(
    () =>
      points.filter((p) => {
        if (filter === 'Todos') return true;
        const hay = normalize([p.name, ...p.items].join(' '));
        return (ALIASES[filter] ?? [normalize(filter)]).some((t) => hay.includes(normalize(t)));
      }),
    [points, filter],
  );

  const sorted = useMemo(() => {
    const rows = filtered.map((p) => ({ p, km: origin && p.lat != null && p.lng != null ? distanceKm(origin.coords, { lat: p.lat, lng: p.lng }) : null }));
    if (origin) rows.sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity));
    return rows;
  }, [filtered, origin]);

  const nearby = origin ? sorted.filter((r) => r.km != null && r.km <= RADIUS_KM) : sorted;
  const fallback = !!origin && nearby.length === 0;
  const list = fallback ? sorted.slice(0, 5) : nearby;

 
  const suggestions = useMemo<Suggestion[]>(() => {
    const n = normalize(query.trim());
    if (n.length < 2) return [];
    const cities = new Map<string, { count: number; p: Point }>();
    points.forEach((p) => {
      if (normalize(p.city).includes(n)) {
        const e = cities.get(p.city);
        if (e) e.count += 1;
        else cities.set(p.city, { count: 1, p });
      }
    });
    const cityRows: Suggestion[] = [...cities.entries()].slice(0, 3).map(([city, e]) => ({
      key: `c-${city}`, kind: 'city', title: city, sub: `${e.count} ecoponto${e.count > 1 ? 's' : ''}`, p: e.p,
    }));
    const pointRows: Suggestion[] = points
      .filter((p) => normalize(`${p.name} ${p.address}`).includes(n))
      .slice(0, 3)
      .map((p) => ({ key: `p-${p.id}`, kind: 'point', title: p.name, sub: `${p.address} · ${p.city}`, p }));
    return [...cityRows, ...pointRows];
  }, [query, points]);

  function pickSuggestion(s: Suggestion) {
    Keyboard.dismiss();
    setFocused(false);
    setMsg('');
    setQuery(s.title);
    if (s.p.lat == null || s.p.lng == null) {
      setQuery(s.title);
      runSearch(s.p.city || s.title);
      return;
    }
    const c = { latitude: s.p.lat, longitude: s.p.lng };
    setOrigin({ coords: c, label: s.p.city });
    if (s.kind === 'point') {
      setSelectedId(s.p.id);
      fly(c, 0.06);
    } else {
      setSelectedId(null);
      fly(c, 0.3);
    }
  }

  function pickPin(p: Point) {
    setSelectedId(p.id);
    setFocused(false);
    if (!list.some((r) => r.p.id === p.id) && p.lat != null && p.lng != null) {
      const c = { latitude: p.lat, longitude: p.lng };
      setOrigin({ coords: c, label: p.city });
      fly(c, 0.3);
    }
  }

  useEffect(() => {
    if (selectedId == null) return;
    const t = setTimeout(() => {
      const y = ys.current[selectedId];
      if (y != null) scrollRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: true });
    }, 200);
    return () => clearTimeout(t);
  }, [selectedId, origin]);

  const showDrop = focused && query.trim().length >= 2;

  return (
    <View style={{ flex: 1, backgroundColor: C.BG }}>
      <View style={{ zIndex: 20, paddingHorizontal: 20, paddingTop: top + 8, paddingBottom: 12 }}>
        <Text style={s.h2}>Pontos de Coleta no Brasil</Text>

        <View style={{ marginTop: 12, zIndex: 30 }}>
          <View style={s.search}>
            <Ionicons name="search" size={16} color={C.MUTED} />
            <TextInput
              value={query}
              onChangeText={(t) => { setQuery(t); setMsg(''); }}
              onFocus={() => setFocused(true)}
              onSubmitEditing={() => runSearch(query)}
              returnKeyType="search"
              placeholder="Digite a cidade ou o endereço"
              placeholderTextColor={C.MUTED}
              accessibilityLabel="Buscar cidade ou ecoponto"
              autoCorrect={false}
              style={s.searchInput}
            />
            {searching ? (
              <ActivityIndicator size="small" color={C.G} />
            ) : query ? (
              <Pressable onPress={() => { setQuery(''); setMsg(''); }} accessibilityLabel="Limpar busca" hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={C.MUTED} />
              </Pressable>
            ) : null}
            <View style={s.divider} />
            <Pressable onPress={() => useMyLocation()} accessibilityLabel="Usar minha localização" hitSlop={8}>
              <Ionicons name="locate" size={20} color={origin?.isUser ? C.G : C.SLATE_LT} />
            </Pressable>
          </View>

          {showDrop && (
            <View style={s.drop}>
              {suggestions.map((sg) => (
                <Pressable key={sg.key} onPress={() => pickSuggestion(sg)} style={s.dropRow}>
                  <Ionicons name={sg.kind === 'city' ? 'business-outline' : 'location'} size={18} color={C.G} />
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ fontFamily: F.semi, fontSize: 14, color: C.SLATE }}>{sg.title}</Text>
                    <Text numberOfLines={1} style={{ fontFamily: F.reg, fontSize: 12, color: C.MUTED }}>{sg.sub}</Text>
                  </View>
                </Pressable>
              ))}
              <Pressable onPress={() => runSearch(query)} style={s.dropRow}>
                <Ionicons name="map-outline" size={18} color={C.SLATE_LT} />
                <Text style={{ flex: 1, fontFamily: F.med, fontSize: 14, color: C.SLATE_LT }}>
                  Buscar “{query.trim()}” no mapa
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {!!msg && (
          <View style={s.msg}>
            <Text style={{ fontFamily: F.semi, fontSize: 12, color: C.RED }}>{msg}</Text>
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} keyboardShouldPersistTaps="handled">
          {CHIPS.map((c) => (
            <Chip key={c} label={c} active={filter === c} onPress={() => setFilter(c)} />
          ))}
        </ScrollView>
      </View>

      <View style={s.mapBox}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={BRAZIL}
          showsUserLocation
          showsMyLocationButton={false}
          toolbarEnabled={false}
          onPress={() => { Keyboard.dismiss(); setFocused(false); }}
        >
          {origin && !origin.isUser && (
            <Marker coordinate={origin.coords} anchor={{ x: 0.5, y: 0.5 }} tappable={false}>
              <View style={s.originDot} />
            </Marker>
          )}
          {origin && (
            <Circle
              center={origin.coords}
              radius={RADIUS_KM * 1000}
              strokeColor="rgba(76,175,80,0.7)"
              fillColor="rgba(76,175,80,0.08)"
              strokeWidth={1.5}
            />
          )}
          {filtered.filter((p) => p.lat != null && p.lng != null).map((p) => {
            const sel = p.id === selectedId;
            return (
              <Marker
                key={p.id}
                coordinate={{ latitude: p.lat as number, longitude: p.lng as number }}
                onPress={() => pickPin(p)}
                zIndex={sel ? 10 : 1}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View style={[s.pin, { backgroundColor: p.fill > 80 ? C.RED : C.G }, sel && s.pinSel]}>
                  <Ionicons name="location" size={sel ? 18 : 14} color={C.WHITE} />
                </View>
              </Marker>
            );
          })}
        </MapView>
        <View pointerEvents="none" style={s.mapLabel}>
          <Text style={s.mapLabelTxt}>{filtered.length} ecopontos no Brasil</Text>
        </View>
      </View>

      <View style={s.legend}>
        <Legend color={C.G} label="Disponível" />
        <Legend color={C.RED} label="Quase cheio" />
      </View>

      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12, gap: 12 }} keyboardShouldPersistTaps="handled">
        <View>
          <Text style={s.h3}>{origin ? 'Pontos de coleta próximos' : 'Todos os pontos de coleta'}</Text>
          <Text style={{ fontFamily: F.reg, fontSize: 12, color: C.MUTED, marginTop: 2 }}>
            {!origin
              ? 'Pesquise sua cidade ou ative a localização para ver os mais próximos.'
              : fallback
                ? `Nenhum ecoponto em até ${RADIUS_KM} km de ${origin.label}. Mostrando os mais próximos.`
                : `${list.length} ${list.length === 1 ? 'ponto' : 'pontos'} em até ${RADIUS_KM} km de ${origin.label}`}
          </Text>
        </View>

        {list.length === 0 && (
          <View style={[s.card, { padding: 24, alignItems: 'center' }]}>
            <Text style={{ fontFamily: F.bold, fontSize: 14, color: C.SLATE }}>Nenhum ecoponto encontrado</Text>
            <Text style={{ fontFamily: F.reg, fontSize: 12, color: C.MUTED, marginTop: 4, textAlign: 'center' }}>
              Tente outro tipo de material ou outra cidade.
            </Text>
          </View>
        )}

        {list.map(({ p, km }) => {
          const sel = p.id === selectedId;
          return (
            <Pressable
              key={p.id}
              onLayout={(e) => { ys.current[p.id] = e.nativeEvent.layout.y; }}
              onPress={() => onOpenDetail(p.id)}
              style={[s.card, { padding: 14 }, sel && { borderColor: C.G, backgroundColor: '#F4FBF5' }]}
            >
              <View style={s.row}>
                <View style={s.iconBox}>
                  <Ionicons name="location" size={20} color={C.G} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={s.name}>{p.name}</Text>
                  <Text numberOfLines={1} style={s.sub}>{p.address}</Text>
                  <Text numberOfLines={1} style={s.sub}>{p.city}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Text style={{ fontFamily: F.bold, fontSize: 12, color: C.G }}>{km != null ? formatKm(km) : p.distance}</Text>
                  <View style={[s.badge, { backgroundColor: p.fill > 80 ? C.RED_LT : C.G_LIGHT }]}>
                    <Text style={{ fontFamily: F.semi, fontSize: 12, color: p.fill > 80 ? C.RED : C.G }}>{p.fill}% cheio</Text>
                  </View>
                </View>
              </View>
              {sel && (
                <View style={s.select}>
                  <Text style={{ fontFamily: F.bold, fontSize: 13, color: C.WHITE }}>Selecionar este ponto →</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <Text style={{ fontFamily: F.med, fontSize: 12, color: C.MUTED }}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  h2: { fontFamily: F.bold, fontSize: 20, color: C.SLATE },
  h3: { fontFamily: F.bold, fontSize: 16, color: C.SLATE },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 12, backgroundColor: C.WHITE, borderWidth: 1.5, borderColor: C.BORDER,
  },
  searchInput: { flex: 1, fontFamily: F.reg, fontSize: 14, color: C.SLATE, padding: 0 },
  divider: { width: 1, height: 20, backgroundColor: C.BORDER },
  drop: {
    position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6, borderRadius: 12, backgroundColor: C.WHITE,
    borderWidth: 1.5, borderColor: C.BORDER, zIndex: 40, elevation: 8,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
  },
  dropRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  msg: { marginTop: 10, backgroundColor: C.RED_LT, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  mapBox: { marginHorizontal: 20, height: 260, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#DDE8DF' },
  mapLabel: { position: 'absolute', left: 12, top: 10, backgroundColor: 'rgba(248,249,250,0.9)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  mapLabelTxt: { fontFamily: F.xbold, fontSize: 10, letterSpacing: 1.4, color: '#64806C', textTransform: 'uppercase' },
  originDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#1E88E5', borderWidth: 3, borderColor: C.WHITE },
  pin: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: C.WHITE, alignItems: 'center', justifyContent: 'center' },
  pinSel: { width: 40, height: 40, borderRadius: 20, borderColor: C.SLATE, borderWidth: 3 },
  legend: { flexDirection: 'row', gap: 16, paddingHorizontal: 22, paddingVertical: 10 },
  card: { backgroundColor: C.WHITE, borderRadius: 12, borderWidth: 1.5, borderColor: C.BORDER },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.G_LIGHT, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: F.semi, fontSize: 14, color: C.SLATE },
  sub: { fontFamily: F.reg, fontSize: 12, color: C.MUTED, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  select: { marginTop: 12, backgroundColor: C.G, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
});
