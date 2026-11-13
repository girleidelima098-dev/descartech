export type Role = 'client' | 'coop' | 'partner';

export type AppUser = { fullName: string; email: string; role: Role; photoUri?: string };

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
  fill: number; // % de ocupação
  lat: number;
  lng: number;
};

export type Coupon = {
  id: number;
  store: string;
  discount: string;
  category: string;
  expires: number; // dias
  code: string;
  color: string;
  bg: string;
};

export type Disposal = { token: string; altCode: string; expiresAt: number };

export type PickupAlert = { id: number; partner: string; pointId: number; fillPercent: number; createdAt: number };
