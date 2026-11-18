export type Role = 'client' | 'coop' | 'partner';

export type Address = {
  cep: string; 
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string; 
};

export type AppUser = { fullName: string; email: string; role: Role; photoUri?: string; phone?: string; address?: Address };


export type Material = 'Pilhas/Baterias' | 'Telas/Monitores' | 'Cabos/Fios' | 'Pequenos Eletrônicos';


export type CouponOffer = {
  discount: number; 
  category: string; 
  code: string;
  validityDays: number; 
  quantity: number; 
};

export type Collection = { plate: string; period: 'morning' | 'afternoon'; coopName: string; scheduledAt: number };


export type Point = {
  id: number;
  name: string;
  address: string;
  city: string;
  hours: string;
  items: string[]; 
  restricted: string[]; 
  distance: string; 
  rating: number;
  lat?: number;
  lng?: number;
  capacityKg: number; 
  usedKg: number; 
  fill: number; 
  materials: Record<Material, number>; 
  served: number; 
  lifetimeKg: number; 
  offer?: CouponOffer;
  couponsIssued: number;
  couponsUsed: number;
  collection?: Collection; 
};


export type PointSettings = {
  hours: string;
  capacityKg: number;
  items: string[];
  restricted: string[];
  offer: CouponOffer | null;
};

export type Coupon = {
  id: number;
  pointId: number;
  store: string;
  discount: string; // "15% OFF"
  category: string;
  expires: number; // dias restantes
  expiresAt: number;
  code: string;
  color: string;
  bg: string;
  used: boolean;
  expired: boolean;
};

export type Wallet = { coupons: Coupon[]; disposals: number; totalSaved: number };

export type Disposal = { token: string; altCode: string; expiresAt: number };

export type PickupAlert = { id: number; partner: string; pointId: number; fillPercent: number; createdAt: number };
