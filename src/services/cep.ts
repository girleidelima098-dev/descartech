import axios from 'axios';
import { onlyDigits } from '../utils/format';


export async function lookupCep(cep: string): Promise<{ street: string; neighborhood: string; city: string; state: string } | null> {
  const d = onlyDigits(cep);
  if (d.length !== 8) return null;
  const { data } = await axios.get(`https://viacep.com.br/ws/${d}/json/`, { timeout: 6000 });
  if (!data || data.erro) return null;
  return { street: data.logradouro ?? '', neighborhood: data.bairro ?? '', city: data.localidade ?? '', state: data.uf ?? '' };
}
