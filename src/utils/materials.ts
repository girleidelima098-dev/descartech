import { Material } from '../types';
import { normalize } from './geo';

export const MATERIALS: Material[] = ['Pilhas/Baterias', 'Telas/Monitores', 'Cabos/Fios', 'Pequenos Eletrônicos'];

export const MATERIAL_COLORS: Record<Material, string> = {
  'Pilhas/Baterias': '#4CAF50',
  'Telas/Monitores': '#66BB6A',
  'Cabos/Fios': '#FF9800',
  'Pequenos Eletrônicos': '#546E7A',
};

export const zeroMaterials = (): Record<Material, number> => ({
  'Pilhas/Baterias': 0,
  'Telas/Monitores': 0,
  'Cabos/Fios': 0,
  'Pequenos Eletrônicos': 0,
});

/** Equipamentos da grade do Cliente, com peso estimado (kg) e a categoria em que entram no painel. */
export const EQUIPMENT = [
  { label: 'Monitor', icon: 'desktop-outline', material: 'Telas/Monitores', kg: 5, keywords: ['monitor', 'tela'] },
  { label: 'Smartphone', icon: 'phone-portrait-outline', material: 'Pequenos Eletrônicos', kg: 0.2, keywords: ['smartphone', 'celular'] },
  { label: 'Laptop', icon: 'laptop-outline', material: 'Pequenos Eletrônicos', kg: 2.5, keywords: ['laptop', 'notebook', 'computador'] },
  { label: 'Tablet', icon: 'tablet-portrait-outline', material: 'Pequenos Eletrônicos', kg: 0.5, keywords: ['tablet'] },
  { label: 'Fios em geral', icon: 'flash-outline', material: 'Cabos/Fios', kg: 0.5, keywords: ['fio', 'cabo'] },
  { label: 'Baterias', icon: 'battery-charging-outline', material: 'Pilhas/Baterias', kg: 0.3, keywords: ['bateria', 'pilha'] },
] as const;

export type Equipment = (typeof EQUIPMENT)[number];

/** O equipamento é aceito no ponto? Compara com as listas "aceitos" e "não aceitos" cadastradas pelo parceiro. */
export function isEquipmentAccepted(eq: Equipment, items: string[], restricted: string[]): boolean {
  const hit = (list: string[]) => list.map(normalize).some((t) => eq.keywords.some((k) => t.includes(k)));
  if (hit(restricted)) return false;
  const acceptsAll = items.map(normalize).some((t) => t.includes('todos'));
  return acceptsAll || hit(items);
}

/** Peso estimado (kg) e divisão por categoria dos equipamentos escolhidos (1 unidade de cada). */
export function estimate(labels: string[]) {
  const byMaterial = zeroMaterials();
  let kg = 0;
  labels.forEach((l) => {
    const eq = EQUIPMENT.find((e) => e.label === l);
    if (!eq) return;
    kg += eq.kg;
    byMaterial[eq.material] += eq.kg;
  });
  return { kg: Math.round(kg * 10) / 10, byMaterial };
}

export const MATERIAL_SUGGESTIONS = [
  'Monitores', 'Computadores', 'Notebooks', 'Celulares', 'Tablets', 'Teclados e mouses', 'Cabos e fios',
  'Baterias', 'Pilhas', 'Carregadores', 'Impressoras', 'Lâmpadas', 'Eletrodomésticos grandes', 'Aparelhos com gás',
];
