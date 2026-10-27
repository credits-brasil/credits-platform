import { useQuery } from "@tanstack/react-query";

const VIACEP_URL = "https://viacep.com.br/ws";

export interface ViaCepAddress {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
}

/** Keeps only the digits, restoring leading zeros dropped by numeric CEPs. */
function normalizeCep(cep?: string | number): string | null {
  const digits = String(cep ?? "").replace(/\D/g, "");
  return digits ? digits.padStart(8, "0") : null;
}

async function fetchViaCep(cep: string): Promise<ViaCepAddress | null> {
  const response = await fetch(`${VIACEP_URL}/${cep}/json/`);

  if (!response.ok) {
    throw new Error(`ViaCEP respondeu com status ${response.status}.`);
  }

  const data = await response.json();

  // ViaCEP answers 200 with `{ erro: true }` for CEPs it does not know.
  return data?.erro ? null : data;
}

export function useViaCep(cep?: string | number) {
  const normalizedCep = normalizeCep(cep);

  return useQuery({
    queryKey: ["viacep", normalizedCep],
    queryFn: () => fetchViaCep(normalizedCep!),
    enabled: normalizedCep?.length === 8,
    staleTime: Infinity,
    retry: false,
  });
}
