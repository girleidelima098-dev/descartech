// Design tokens copiados do protótipo do Figma (DescarteTech)
export const C = {
  G: '#4CAF50', // Forest Green (primária)
  G_DARK: '#388E3C',
  G_LIGHT: '#E8F5E9',
  SLATE: '#37474F', // Dark Slate Gray (secundária)
  SLATE_LT: '#546E7A',
  BG: '#F8F9FA',
  WHITE: '#FFFFFF',
  RED: '#E53935',
  RED_LT: '#FFEBEE',
  ORANGE: '#FF9800',
  AMBER_LT: '#FFF8E1',
  BORDER: '#E0E0E0',
  MUTED: '#9E9E9E',
  GRAY_LT: '#F5F5F5',
} as const;

// Fonte Inter (carregada em App.tsx com @expo-google-fonts/inter)
export const F = {
  reg: 'Inter_400Regular',
  med: 'Inter_500Medium',
  semi: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  xbold: 'Inter_800ExtraBold',
} as const;
