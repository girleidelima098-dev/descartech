/** Ecopontos de exemplo (iniciais). Em produção virão do back-end. `fill` só define o volume inicial. */
export type Seed = {
  id: number; name: string; address: string; city: string; hours: string;
  items: string[]; restricted: string[]; distance: string; rating: number; fill: number; lat: number; lng: number;
};

export const SEEDS: Seed[] = [
  { id: 1, name: 'EcoPonto Central', address: 'R. das Flores, 120 – Centro', city: 'Mogi das Cruzes – SP', hours: 'Seg–Sex 8h–18h · Sáb 8h–13h', items: ['Monitores', 'CPUs', 'Teclados', 'Mouses', 'Cabos'], restricted: ['Pilhas AA/AAA', 'Baterias automotivas'], distance: '0,8 km', rating: 4.9, fill: 82, lat: -23.5225, lng: -46.1883 },
  { id: 2, name: 'ReciclaTech Tatuapé', address: 'Av. Radial Leste, 554', city: 'São Paulo – SP', hours: 'Seg–Sex 9h–19h', items: ['Celulares', 'Tablets', 'Notebooks', 'Carregadores'], restricted: ['Eletrodomésticos grandes', 'Lâmpadas'], distance: '1,4 km', rating: 4.6, fill: 42, lat: -23.54, lng: -46.577 },
  { id: 3, name: 'GreenDrop Augusta', address: 'R. Augusta, 887 – Consolação', city: 'São Paulo – SP', hours: 'Seg–Sáb 8h–20h', items: ['Todos os eletrônicos', 'Pilhas', 'Baterias', 'Impressoras'], restricted: ['Aparelhos com gás'], distance: '2,1 km', rating: 4.8, fill: 68, lat: -23.556, lng: -46.656 },
  { id: 4, name: 'Eco Digital Manaus', address: 'Av. Djalma Batista, 1661', city: 'Manaus – AM', hours: 'Seg–Sáb 9h–18h', items: ['Celulares', 'Notebooks', 'Cabos', 'Baterias'], restricted: ['Linha branca'], distance: 'Disponível', rating: 4.7, fill: 51, lat: -3.095, lng: -60.017 },
  { id: 5, name: 'Recicla Nordeste', address: 'Av. Agamenon Magalhães, 890', city: 'Recife – PE', hours: 'Seg–Sex 8h–17h', items: ['Monitores', 'Celulares', 'Notebooks', 'Carregadores'], restricted: ['Equipamentos hospitalares'], distance: 'Disponível', rating: 4.8, fill: 37, lat: -8.056, lng: -34.896 },
  { id: 6, name: 'Ponto Verde Salvador', address: 'Av. ACM, 2500 – Brotas', city: 'Salvador – BA', hours: 'Seg–Sáb 8h–18h', items: ['Todos os eletrônicos', 'Pilhas', 'Cabos'], restricted: ['Aparelhos com gás'], distance: 'Disponível', rating: 4.6, fill: 73, lat: -12.99, lng: -38.454 },
  { id: 7, name: 'E-Lixo Brasília', address: 'SCS Quadra 7 – Asa Sul', city: 'Brasília – DF', hours: 'Seg–Sex 8h–18h', items: ['Computadores', 'Monitores', 'Celulares', 'Baterias'], restricted: ['Lâmpadas fluorescentes'], distance: 'Disponível', rating: 4.9, fill: 59, lat: -15.799, lng: -47.89 },
  { id: 8, name: 'EcoTech Curitiba', address: 'R. Marechal Deodoro, 630', city: 'Curitiba – PR', hours: 'Seg–Sáb 9h–18h', items: ['Notebooks', 'Celulares', 'Cabos', 'Carregadores'], restricted: ['Linha branca'], distance: 'Disponível', rating: 4.7, fill: 46, lat: -25.43, lng: -49.27 },
  { id: 9, name: 'Circular Porto Alegre', address: 'Av. Ipiranga, 6681', city: 'Porto Alegre – RS', hours: 'Seg–Sex 9h–19h', items: ['Monitores', 'Computadores', 'Baterias', 'Cabos'], restricted: ['Aparelhos com gás'], distance: 'Disponível', rating: 4.8, fill: 64, lat: -30.012, lng: -51.16 },
];
