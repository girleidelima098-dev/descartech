
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SEEDS } from '../data/mock';
import { Address, Collection, Coupon, Disposal, Material, PickupAlert, Point, PointSettings, Role, Wallet } from '../types';
import { estimate, MATERIALS, zeroMaterials } from '../utils/materials';

type StoredPoint = Omit<Point, 'fill'>;
export type Account = { email: string; password: string; role: Role; fullName: string; phone?: string; address?: Address; cnpj?: string; photoUri?: string; pointId?: number };
type DisposalRec = { token: string; altCode: string; pointId: number; clientEmail: string; weightKg: number; byMaterial: Record<Material, number>; expiresAt: number; status: 'pending' | 'completed' };
type StoredCoupon = Omit<Coupon, 'expires' | 'expired'>;
type StoredWallet = { coupons: StoredCoupon[]; disposals: number; totalSaved: number };
type DB = { v: 1; nextId: number; accounts: Account[]; points: StoredPoint[]; alerts: PickupAlert[]; disposals: DisposalRec[]; wallets: Record<string, StoredWallet> };

type Fail = { ok: false; message: string };
const fail = (message: string): Fail => ({ ok: false, message });

const KEY = 'descartech:db:v1';
const DAY = 86400000;
const SAVE_PER_COUPON = 25; 
const PALETTE: [string, string][] = [['#1565C0', '#E3F2FD'], ['#6A1B9A', '#F3E5F5'], ['#C62828', '#FFEBEE'], ['#00695C', '#E0F2F1'], ['#EF6C00', '#FFF3E0']];

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const round1 = (n: number) => Math.round(n * 10) / 10;
export const normEmail = (e: string) => e.trim().toLowerCase();

function seedDB(): DB {
  const discounts = [15, 12, 20, 10];
  const points: StoredPoint[] = SEEDS.map((s) => {
    const capacityKg = 50;
    const used = s.id === 1 ? 41 : Math.round((s.fill / 100) * capacityKg);
    const pil = Math.round(used * 0.39);
    const tel = Math.round(used * 0.27);
    const cab = Math.round(used * 0.2);
    const d = discounts[s.id % 4];
    return {
      id: s.id, name: s.name, address: s.address, city: s.city, hours: s.hours, items: s.items, restricted: s.restricted,
      distance: s.distance, rating: s.rating, lat: s.lat, lng: s.lng, capacityKg, usedKg: used,
      materials: { 'Pilhas/Baterias': pil, 'Telas/Monitores': tel, 'Cabos/Fios': cab, 'Pequenos Eletrônicos': Math.max(0, used - pil - tel - cab) },
      served: 40 + s.id * 23, lifetimeKg: used + 80 + s.id * 10,
      offer: { discount: d, category: 'Compras em geral', code: `ECO${s.id}${d}`, validityDays: 30, quantity: 100 },
      couponsIssued: 20 + s.id * 5, couponsUsed: 8 + s.id * 2,
    };
  });
  return {
    v: 1, nextId: 1000, points, alerts: [], disposals: [], wallets: {},
    accounts: [
      { email: 'cliente@demo.com', password: 'demo12345', role: 'client', fullName: 'Cliente Demo', phone: '11987654321' },
      { email: 'parceiro@demo.com', password: 'demo12345', role: 'partner', fullName: 'EcoPonto Central', pointId: 1 },
      { email: 'cooperativa@demo.com', password: 'demo12345', role: 'coop', fullName: 'Cooperativa EcoTech' },
    ],
  };
}

let db: DB = seedDB();
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | undefined;

function commit() {
  listeners.forEach((fn) => fn());
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => AsyncStorage.setItem(KEY, JSON.stringify(db)).catch(() => {}), 300);
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export async function initStore() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) db = JSON.parse(raw) as DB;
  } catch {
    /* começa com os dados de exemplo */
  }
}

const toPoint = (p: StoredPoint): Point => ({
  ...clone(p),
  fill: p.capacityKg > 0 ? Math.min(100, Math.round((p.usedKg / p.capacityKg) * 100)) : 0,
});
const pointRef = (id: number) => db.points.find((p) => p.id === id);
const walletRef = (email: string): StoredWallet => (db.wallets[normEmail(email)] ??= { coupons: [], disposals: 0, totalSaved: 0 });


export function authenticate(email: string, password: string, role: Role): Account | null {
  return db.accounts.find((a) => a.email === normEmail(email) && a.password === password && a.role === role) ?? null;
}

export function createAccount(p: {
  fullName: string; email: string; password: string; role: Role; cnpj?: string; phone?: string; address?: Address; photoUri?: string;
  coords?: { lat: number; lng: number } | null;
}): { ok: true; account: Account } | Fail {
  const email = normEmail(p.email);
  if (db.accounts.some((a) => a.email === email)) return fail('Este e-mail já está cadastrado.');
  const account: Account = { email, password: p.password, role: p.role, fullName: p.fullName, cnpj: p.cnpj, phone: p.phone, address: p.address, photoUri: p.photoUri };

  
  if (p.role === 'partner') {
    const a = p.address;
    const id = db.nextId++;
    db.points.push({
      id, name: p.fullName,
      address: a ? `${a.street}, ${a.number} – ${a.neighborhood}` : '',
      city: a ? `${a.city} – ${a.state}` : '',
      hours: '', items: [], restricted: [], distance: 'Disponível', rating: 5,
      lat: p.coords?.lat, lng: p.coords?.lng,
      capacityKg: 50, usedKg: 0, materials: zeroMaterials(), served: 0, lifetimeKg: 0, couponsIssued: 0, couponsUsed: 0,
    });
    account.pointId = id;
  }
  db.accounts.push(account);
  commit();
  return { ok: true, account };
}

export function updateAccountContact(
  oldEmail: string,
  c: { email: string; phone: string; address: Address; photoUri?: string },
): { ok: true; account: Account } | Fail {
  const old = normEmail(oldEmail);
  const acc = db.accounts.find((a) => a.email === old);
  if (!acc) return fail('Conta não encontrada.');
  const email = normEmail(c.email);
  if (email !== old && db.accounts.some((a) => a.email === email)) return fail('Este e-mail já está em uso.');
  if (email !== old && db.wallets[old]) {
    db.wallets[email] = db.wallets[old];
    delete db.wallets[old];
    db.disposals.forEach((d) => { if (d.clientEmail === old) d.clientEmail = email; });
  }
  acc.email = email;
  acc.phone = c.phone;
  acc.address = c.address;
  acc.photoUri = c.photoUri;
  commit();
  return { ok: true, account: acc };
}


export function deleteAccount(email: string): { ok: true } | Fail {
  const e = normEmail(email);
  const acc = db.accounts.find((a) => a.email === e);
  if (!acc) return fail('Conta não encontrada.');
  if (acc.pointId != null) {
    const id = acc.pointId;
    db.points = db.points.filter((p) => p.id !== id);
    db.alerts = db.alerts.filter((a) => a.pointId !== id);
    db.disposals = db.disposals.filter((d) => d.pointId !== id);
    Object.values(db.wallets).forEach((w) => { w.coupons = w.coupons.filter((c) => c.pointId !== id); });
  }
  delete db.wallets[e];
  db.disposals = db.disposals.filter((d) => d.clientEmail !== e);
  db.accounts = db.accounts.filter((a) => a.email !== e);
  commit();
  return { ok: true };
}


export const listPoints = (): Point[] => db.points.map(toPoint);

export function pointOfPartner(email: string): Point | null {
  const acc = db.accounts.find((a) => a.email === normEmail(email));
  const p = acc?.pointId ? pointRef(acc.pointId) : undefined;
  return p ? toPoint(p) : null;
}


export function savePointSettings(pointId: number, s: PointSettings): { ok: true } | Fail {
  const p = pointRef(pointId);
  if (!p) return fail('Ecoponto não encontrado.');
  if (!(s.capacityKg > 0)) return fail('Informe a capacidade do ecoponto em kg.');
  if (s.capacityKg < p.usedKg) return fail(`A capacidade não pode ser menor que o volume já coletado (${p.usedKg} kg).`);
  p.hours = s.hours.trim();
  p.capacityKg = s.capacityKg;
  p.items = s.items;
  p.restricted = s.restricted;
  p.offer = s.offer ?? undefined;
  commit();
  return { ok: true };
}


export function createDisposal(clientEmail: string, pointId: number, labels: string[]): { ok: true; disposal: Disposal } | Fail {
  const p = pointRef(pointId);
  if (!p) return fail('Ecoponto não encontrado.');
  const est = estimate(labels);
  if (est.kg <= 0) return fail('Selecione ao menos um equipamento.');
  if (p.usedKg + est.kg > p.capacityKg) return fail('Este ecoponto atingiu o limite de capacidade. Escolha outro ponto.');
  const rec: DisposalRec = {
    token: `DT-${pointId}-${Date.now()}-${Math.floor(Math.random() * 1e4)}`,
    altCode: String(Math.floor(100000 + Math.random() * 900000)),
    pointId, clientEmail: normEmail(clientEmail), weightKg: est.kg, byMaterial: est.byMaterial,
    expiresAt: Date.now() + 15 * 60 * 1000, status: 'pending',
  };
  db.disposals.push(rec);
  commit();
  return { ok: true, disposal: { token: rec.token, altCode: rec.altCode, expiresAt: rec.expiresAt } };
}


export function confirmDisposal(token: string): { ok: boolean; message: string } {
  const d = db.disposals.find((x) => x.token === token || x.altCode === token);
  if (!d) return { ok: false, message: 'QR Code inválido.' };
  if (d.status === 'completed') return { ok: true, message: 'Descarte já confirmado.' };
  if (Date.now() > d.expiresAt) return { ok: false, message: 'Código expirado. Gere um novo QR Code.' };
  const p = pointRef(d.pointId);
  if (!p) return { ok: false, message: 'Ecoponto não encontrado.' };
  if (p.usedKg + d.weightKg > p.capacityKg) return { ok: false, message: 'O ecoponto está sem capacidade no momento.' };

  p.usedKg = round1(p.usedKg + d.weightKg);
  p.lifetimeKg = round1(p.lifetimeKg + d.weightKg);
  MATERIALS.forEach((m) => { p.materials[m] = round1(p.materials[m] + d.byMaterial[m]); });
  p.served += 1;

  const w = walletRef(d.clientEmail);
  w.disposals += 1;
  if (p.offer && p.couponsIssued < p.offer.quantity) {
    p.couponsIssued += 1;
    const [color, bg] = PALETTE[p.id % PALETTE.length];
    w.coupons.unshift({
      id: db.nextId++, pointId: p.id, store: p.name, discount: `${p.offer.discount}% OFF`, category: p.offer.category,
      expiresAt: Date.now() + p.offer.validityDays * DAY, code: p.offer.code, color, bg, used: false,
    });
  }
  d.status = 'completed';
  commit();
  return { ok: true, message: 'Descarte validado com sucesso.' };
}


export function getWallet(email: string): Wallet {
  const w = walletRef(email);
  const now = Date.now();
  return {
    disposals: w.disposals,
    totalSaved: w.totalSaved,
    coupons: w.coupons.map((c) => ({ ...c, expires: Math.max(0, Math.ceil((c.expiresAt - now) / DAY)), expired: c.expiresAt < now })),
  };
}

export function redeemCoupon(email: string, couponId: number): { ok: boolean } {
  const w = walletRef(email);
  const c = w.coupons.find((x) => x.id === couponId);
  if (!c || c.used || c.expiresAt < Date.now()) return { ok: false };
  c.used = true;
  w.totalSaved += SAVE_PER_COUPON;
  const p = pointRef(c.pointId);
  if (p) p.couponsUsed += 1;
  commit();
  return { ok: true };
}


export function createPickupAlert(pointId: number): { ok: true } | Fail {
  const p = pointRef(pointId);
  if (!p) return fail('Ecoponto não encontrado.');
  if (!db.alerts.some((a) => a.pointId === pointId)) {
    db.alerts.push({ id: db.nextId++, partner: p.name, pointId, fillPercent: Math.round((p.usedKg / p.capacityKg) * 100), createdAt: Date.now() });
    commit();
  }
  return { ok: true };
}

export const listAlerts = (): PickupAlert[] => clone(db.alerts);

export function scheduleCollection(pointId: number, c: Omit<Collection, 'scheduledAt'>): { ok: true } | Fail {
  const p = pointRef(pointId);
  if (!p) return fail('Ecoponto não encontrado.');
  p.collection = { ...c, scheduledAt: Date.now() };
  db.alerts = db.alerts.filter((a) => a.pointId !== pointId); // pedido do parceiro atendido
  commit();
  return { ok: true };
}


export function completeCollection(pointId: number): { ok: true } | Fail {
  const p = pointRef(pointId);
  if (!p) return fail('Ecoponto não encontrado.');
  p.usedKg = 0;
  p.materials = zeroMaterials();
  p.collection = undefined;
  commit();
  return { ok: true };
}
