export const onlyDigits = (v: string) => v.replace(/\D/g, '');

/** Máscara de telefone brasileiro: (11) 98765-4321 ou (11) 3456-7890 */
export function formatPhone(v: string) {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export const isPhoneValid = (v: string) => {
  const n = onlyDigits(v).length;
  return n === 10 || n === 11;
};

export const isEmailValid = (v: string) => /^\S+@\S+\.\S+$/.test(v.trim());
