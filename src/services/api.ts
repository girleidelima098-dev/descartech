import axios from 'axios';
import { COUPONS, POINTS, WALLET_SUMMARY } from '../data/mock';
import { AppUser, Coupon, Disposal, PickupAlert, Point, Role } from '../types';



const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const MOCK = !BASE_URL;

export const http = axios.create({ baseURL: BASE_URL, timeout: 10000 });

export function setAuthToken(token?: string) {
  if (token) http.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete http.defaults.headers.common.Authorization;
}

const wait = (ms = 450) => new Promise<void>((r) => setTimeout(r, ms));

function errMsg(e: unknown, fallback: string) {
  if (axios.isAxiosError(e)) {
    const m = (e.response?.data as { message?: string } | undefined)?.message;
    if (m) return m;
    if (!e.response) return 'Sem conexão com o servidor. Tente novamente.';
  }
  return fallback;
}

export type AuthResult =
  | { ok: true; user: AppUser; token?: string }
  | { ok: false; message: string };

export async function signIn(p: { email: string; password: string; role: Role }): Promise<AuthResult> {
  if (MOCK) {
    await wait();
    return { ok: true, user: { role: p.role, email: p.email, fullName: p.email.split('@')[0] } };
  }
  try {
    const { data } = await http.post('/auth/login', p);
    return { ok: true, user: data.user as AppUser, token: data.token };
  } catch (e) {
    return { ok: false, message: errMsg(e, 'E-mail ou senha incorretos.') };
  }
}

export async function signUp(p: {
  fullName: string;
  cnpj?: string;
  email: string;
  password: string;
  role: Role;
  photoUri?: string;
}): Promise<AuthResult> {
  
  const { photoUri, ...body } = p;
  if (MOCK) {
    await wait();
    return { ok: true, user: { role: p.role, email: p.email, fullName: p.fullName, photoUri } };
  }
  try {
    const { data } = await http.post('/auth/register', body);
    return { ok: true, user: data.user as AppUser, token: data.token };
  } catch (e) {
    return { ok: false, message: errMsg(e, 'Não foi possível concluir o cadastro.') };
  }
}

export async function getPoints(): Promise<Point[]> {
  if (MOCK) return POINTS;
  const { data } = await http.get<Point[]>('/points');
  return data;
}

export async function getCoupons(): Promise<Coupon[]> {
  if (MOCK) return COUPONS;
  const { data } = await http.get<Coupon[]>('/coupons');
  return data;
}

export async function getWalletSummary(): Promise<{ totalSaved: number; disposals: number }> {
  if (MOCK) return WALLET_SUMMARY;
  const { data } = await http.get('/wallet');
  return data;
}

export async function createDisposal(pointId: number, items: string[]): Promise<Disposal> {
  if (MOCK) {
    await wait(300);
    return { token: `DT-${pointId}-${Date.now()}`, altCode: '472831', expiresAt: Date.now() + 15 * 60 * 1000 };
  }
  const { data } = await http.post<Disposal>('/disposals', { pointId, items });
  return data;
}

export async function requestCollection(p: { pointId: number; plate: string; period: 'morning' | 'afternoon' }) {
  if (MOCK) return wait();
  await http.post('/collections', p);
}

// Alertas de retirada urgente (mock em memória; no back-end vira tabela/endpoint + WebSocket ou polling)
const mockAlerts: PickupAlert[] = [];

export async function requestPartnerPickup(p: { partnerName: string; pointId: number; usedKg: number; maxKg: number }) {
  if (MOCK) {
    await wait();
    mockAlerts.push({
      id: Date.now(),
      partner: p.partnerName,
      pointId: p.pointId,
      fillPercent: Math.round((p.usedKg / p.maxKg) * 100),
      createdAt: Date.now(),
    });
    return;
  }
  await http.post('/partner/pickups', p);
}

export async function getPickupAlerts(): Promise<PickupAlert[]> {
  if (MOCK) return [...mockAlerts];
  const { data } = await http.get<PickupAlert[]>('/pickups', { params: { status: 'pending' } });
  return data;
}

export async function resolvePickupAlert(id: number) {
  if (MOCK) {
    const i = mockAlerts.findIndex((a) => a.id === id);
    if (i >= 0) mockAlerts.splice(i, 1);
    return;
  }
  await http.post(`/pickups/${id}/resolve`);
}

export async function validateQr(token: string): Promise<{ ok: boolean; message: string }> {
  if (MOCK) {
    await wait();
    return { ok: true, message: 'Descarte validado com sucesso.' };
  }
  try {
    const { data } = await http.post('/disposals/validate', { token });
    return { ok: !!data.ok, message: data.message ?? 'Descarte validado.' };
  } catch (e) {
    return { ok: false, message: errMsg(e, 'QR Code inválido ou expirado.') };
  }
}
