import { Address } from '../types';
import { onlyDigits } from './format';

/** Estado dos campos de endereço nos formulários (tudo texto). */
export type AddressForm = {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

export const emptyAddress = (): AddressForm => ({ cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '' });

export const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

export function formatCep(v: string) {
  const d = onlyDigits(v).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

/** Devolve a mensagem de erro, ou null se estiver tudo certo. O complemento é opcional. */
export function validateAddress(a: AddressForm): string | null {
  if (onlyDigits(a.cep).length !== 8) return 'Informe o CEP com 8 dígitos.';
  if (a.street.trim().length < 3) return 'Informe a rua.';
  if (!a.number.trim()) return 'Informe o número (ou S/N).';
  if (a.neighborhood.trim().length < 2) return 'Informe o bairro.';
  if (a.city.trim().length < 2) return 'Informe a cidade.';
  if (!UFS.includes(a.state.trim().toUpperCase())) return 'Informe a UF com 2 letras (ex.: SP).';
  return null;
}

/** Formulário -> objeto enviado ao back-end (CEP só com dígitos). */
export const toAddress = (a: AddressForm): Address => ({
  cep: onlyDigits(a.cep),
  street: a.street.trim(),
  number: a.number.trim(),
  complement: a.complement.trim() || undefined,
  neighborhood: a.neighborhood.trim(),
  city: a.city.trim(),
  state: a.state.trim().toUpperCase(),
});

/** Objeto salvo -> formulário (para editar). */
export const toForm = (a?: Address): AddressForm =>
  a
    ? { cep: formatCep(a.cep), street: a.street, number: a.number, complement: a.complement ?? '', neighborhood: a.neighborhood, city: a.city, state: a.state }
    : emptyAddress();

export function addressLines(a: Address): string[] {
  return [
    `${a.street}, ${a.number}${a.complement ? ` – ${a.complement}` : ''}`,
    a.neighborhood,
    `${a.city} – ${a.state}`,
    `CEP ${formatCep(a.cep)}`,
  ];
}
