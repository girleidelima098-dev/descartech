import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppUser } from '../types';

const KEY = 'descartetech:session';
type Stored = { user: AppUser; token?: string };

export async function saveSession(data: Stored) {
  await AsyncStorage.setItem(KEY, JSON.stringify(data));
}
export async function loadSession(): Promise<Stored | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    return null;
  }
}
export async function clearSession() {
  await AsyncStorage.removeItem(KEY);
}
