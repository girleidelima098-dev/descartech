import axios from 'axios';
import { Address, AppUser, Disposal, PickupAlert, Point, PointSettings, Role, Wallet } from '../types';
import { geocodeCity } from './geocode';
import * as store from './store';


const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const MOCK = !BASE_URL;

export const http = axios.create({ baseURL: BASE_URL, timeout: 10000 });

export function setAuthToken(token?: string) {
  if (token) http.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete http.defaults.headers.common.Authorization;
}

// Quem está logado (só o modo de teste usa; com o back-end real a identidade vem do token)
let sessionEmail = '';
export function setSessionUser(email?: string) {
  sessionEmail = email ?? '';
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

type Ok = { ok: true };
type Fail = { ok: false; message: string };


export type AuthResult = { ok: true; user: AppUser; token?: string } | Fail;

const toUser = (a: store.Account): AppUser => ({ role: a.role, email: a.email, fullName: a.fullName, phone: a.phone, address: a.address, photoUri: a.photoUri });

export async function signIn(p: { email: string; password: string; role: Role }): Promise<AuthResult> {
  if (MOCK) {
    await wait();
    const acc = store.authenticate(p.email, p.password, p.role);
    if (!acc) return { ok: false, message: 'E-mail ou senha incorretos.' };
    return { ok: true, user: toUser(acc) };
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
  phone?: string;
  address?: Address;
}): Promise<AuthResult> {
  
  const { photoUri, ...body } = p;
  if (MOCK) {
    await wait();
    // Parceiro cadastrado vira um ecoponto no mapa: descobre as coordenadas pelo endereço
    let coords: { lat: number; lng: number } | null = null;
    if (p.role === 'partner' && p.address) {
      const a = p.address;
      try {
        const g = (await geocodeCity(`${a.street}, ${a.number}, ${a.neighborhood}, ${a.city} - ${a.state}`)) ?? (await geocodeCity(`${a.city} - ${a.state}`));
        if (g) coords = { lat: g.coords.latitude, lng: g.coords.longitude };
      } catch {
        
      }
    }
    const r = store.createAccount({ ...p, coords });
    if (!r.ok) return r;
    return { ok: true, user: toUser(r.account) };
  }
  try {
    const { data } = await http.post('/auth/register', body);
    return { ok: true, user: data.user as AppUser, token: data.token };
  } catch (e) {
    return { ok: false, message: errMsg(e, 'Não foi possível concluir o cadastro.') };
  }
}


export async function requestPasswordReset(p: { email: string; role: Role }): Promise<Ok | Fail> {
  if (MOCK) {
    await wait();
    return { ok: true };
  }
  try {
    await http.post('/auth/forgot-password', p);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: errMsg(e, 'Não foi possível enviar o e-mail agora. Tente novamente.') };
  }
}


export async function updateProfile(
  current: AppUser,
  changes: { email: string; phone: string; address: Address; photoUri?: string },
): Promise<{ ok: true; user: AppUser } | Fail> {
  const { photoUri, ...body } = changes; // a foto é simulada: fica no aparelho (upload virá com o back-end)
  if (MOCK) {
    await wait();
    const r = store.updateAccountContact(current.email, changes);
    if (!r.ok) return r;
    setSessionUser(r.account.email);
    return { ok: true, user: toUser(r.account) };
  }
  try {
    const { data } = await http.patch('/me', body);
    return { ok: true, user: { ...current, ...(data?.user ?? {}), email: body.email, phone: body.phone, address: body.address, photoUri } };
  } catch (e) {
    return { ok: false, message: errMsg(e, 'Não foi possível salvar as alterações.') };
  }
}


export async function deleteAccount(): Promise<Ok | Fail> {
  if (MOCK) {
    await wait(600);
    return store.deleteAccount(sessionEmail);
  }
  try {
    await http.delete('/me');
    return { ok: true };
  } catch (e) {
    return { ok: false, message: errMsg(e, 'Não foi possível excluir a conta. Tente novamente.') };
  }
}


export async function getPoints(): Promise<Point[]> {
  if (MOCK) return store.listPoints();
  const { data } = await http.get<Point[]>('/points');
  return data;
}


export async function getMyPoint(): Promise<Point | null> {
  if (MOCK) return store.pointOfPartner(sessionEmail);
  const { data } = await http.get<Point>('/partner/point');
  return data;
}


export async function savePointSettings(pointId: number, s: PointSettings): Promise<Ok | Fail> {
  if (MOCK) {
    await wait(300);
    return store.savePointSettings(pointId, s);
  }
  try {
    await http.put('/partner/point', s);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: errMsg(e, 'Não foi possível salvar as configurações.') };
  }
}


export async function createDisposal(pointId: number, items: string[]): Promise<Disposal> {
  if (MOCK) {
    await wait(300);
    const r = store.createDisposal(sessionEmail, pointId, items);
    if (!r.ok) throw new Error(r.message);
    return r.disposal;
  }
  try {
    const { data } = await http.post<Disposal>('/disposals', { pointId, items });
    return data;
  } catch (e) {
    throw new Error(errMsg(e, 'Não foi possível gerar o código.'));
  }
}


export async function confirmDisposal(token: string): Promise<{ ok: boolean; message: string }> {
  if (MOCK) return store.confirmDisposal(token);
  try {
    const { data } = await http.post('/disposals/confirm', { token });
    return { ok: !!data.ok, message: data.message ?? 'Descarte confirmado.' };
  } catch (e) {
    return { ok: false, message: errMsg(e, 'Não foi possível confirmar o descarte.') };
  }
}


export async function validateQr(token: string): Promise<{ ok: boolean; message: string }> {
  if (MOCK) {
    await wait(300);
    return store.confirmDisposal(token);
  }
  try {
    const { data } = await http.post('/disposals/validate', { token });
    return { ok: !!data.ok, message: data.message ?? 'Descarte validado.' };
  } catch (e) {
    return { ok: false, message: errMsg(e, 'QR Code inválido ou expirado.') };
  }
}

export async function getWallet(): Promise<Wallet> {
  if (MOCK) return store.getWallet(sessionEmail);
  const { data } = await http.get<Wallet>('/wallet');
  return data;
}

export async function redeemCoupon(couponId: number): Promise<{ ok: boolean }> {
  if (MOCK) return store.redeemCoupon(sessionEmail, couponId);
  try {
    await http.post(`/coupons/${couponId}/redeem`);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}


export async function requestPartnerPickup(): Promise<Ok | Fail> {
  if (MOCK) {
    await wait();
    const p = store.pointOfPartner(sessionEmail);
    return p ? store.createPickupAlert(p.id) : { ok: false, message: 'Ecoponto não encontrado.' };
  }
  try {
    await http.post('/partner/pickups');
    return { ok: true };
  } catch (e) {
    return { ok: false, message: errMsg(e, 'Não foi possível enviar o alerta.') };
  }
}

export async function getPickupAlerts(): Promise<PickupAlert[]> {
  if (MOCK) return store.listAlerts();
  const { data } = await http.get<PickupAlert[]>('/pickups', { params: { status: 'pending' } });
  return data;
}

export async function requestCollection(p: { pointId: number; plate: string; period: 'morning' | 'afternoon'; coopName: string }): Promise<Ok | Fail> {
  if (MOCK) {
    await wait();
    return store.scheduleCollection(p.pointId, { plate: p.plate, period: p.period, coopName: p.coopName });
  }
  try {
    await http.post('/collections', p);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: errMsg(e, 'Não foi possível agendar a coleta.') };
  }
}

/** A cooperativa retirou o material: zera o volume do ecoponto. */
export async function completeCollection(pointId: number): Promise<Ok | Fail> {
  if (MOCK) return store.completeCollection(pointId);
  try {
    await http.post(`/collections/${pointId}/complete`);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: errMsg(e, 'Não foi possível concluir a coleta.') };
  }
}
