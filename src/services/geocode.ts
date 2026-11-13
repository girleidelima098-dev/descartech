import axios from 'axios';
import * as Location from 'expo-location';
import { Coords } from '../utils/geo';


const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY;

export type GeoResult = { coords: Coords; label: string; delta: number };

export async function geocodeCity(query: string): Promise<GeoResult | null> {
  const q = query.trim();
  if (!q) return null;

  if (GOOGLE_KEY) {
    const { data } = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: { address: q, components: 'country:BR', region: 'br', language: 'pt-BR', key: GOOGLE_KEY },
      timeout: 8000,
    });
    const r = data?.results?.[0];
    if (data?.status !== 'OK' || !r) return null;
    const vp = r.geometry?.viewport;
    const span = vp ? Math.abs(vp.northeast.lat - vp.southwest.lat) : 0.3;
    return {
      coords: { latitude: r.geometry.location.lat, longitude: r.geometry.location.lng },
      label: String(r.formatted_address).replace(/,\s*Brasil$/i, ''),
      delta: Math.min(Math.max(span * 1.4, 0.08), 12),
    };
  }

  const found = await Location.geocodeAsync(`${q}, Brasil`);
  if (!found.length) return null;
  return { coords: { latitude: found[0].latitude, longitude: found[0].longitude }, label: q, delta: 0.3 };
}
