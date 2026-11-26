import { NOVO_SPC_MIX_MAIS_EXCLUDED_INSUMOS } from "@/constants/novo-spc-mix-mais";
import {
  SPC_RELATORIO_PJ_DEFAULT_INSUMOS,
  SPC_RELATORIO_PJ_EXCLUDED_INSUMOS,
} from "@/constants/spc-relatorio-pj";
import { SPC_POSITIVO_INTERMEDIARIO_PJ_DEFAULT_INSUMOS } from "@/constants/spc-positivo-intermediario-pj";
import { SPC_AVANCADA_PJ_EXCLUDED_INSUMOS } from "@/constants/spc-avancada-pj";
import { SPC_MAIS_DEFAULT_INSUMOS } from "@/constants/spc-mais";
import type { ResultProductCode } from "@/utils/findResultProductCode";

/** How the shared result page (`325SpcMaxiResultado`) adapts to each product. */
export interface SpcResultProduct {
  slug: string;
  name: string;
  endpoint: string;
  excludedInsumos?: string[];
  excludedInsumosByDocType?: Partial<Record<"CPF" | "CNPJ", string[]>>;
  defaultInsumos?: string[];
}

/**
 * Product configs used by the result routes and by the consultation viewer.
 * 325 SPC MAXI has no entry: the result page renders it with its own defaults (no `product`).
 */
export const RESULT_PRODUCTS: Record<Exclude<ResultProductCode, "325">, SpcResultProduct> = {
  "323": {
    slug: "323-novo-spc-mix-mais",
    name: "323 NOVO SPC MIX MAIS",
    endpoint: "/api/323-spc-mix-mais",
    excludedInsumosByDocType: {
      CNPJ: NOVO_SPC_MIX_MAIS_EXCLUDED_INSUMOS,
    },
  },
  "337": {
    slug: "337-spc-relatorio-pj",
    name: "337 SPC RELATÓRIO PJ",
    endpoint: "/api/337-spc-relatorio",
    excludedInsumos: SPC_RELATORIO_PJ_EXCLUDED_INSUMOS,
    defaultInsumos: SPC_RELATORIO_PJ_DEFAULT_INSUMOS,
  },
  "629": {
    slug: "629-spc-positivo-intermediario-pj",
    name: "SPC POSITIVO INTERMEDIÁRIO PJ",
    endpoint: "/api/629-spc-positivo-intermediario-pj",
    defaultInsumos: SPC_POSITIVO_INTERMEDIARIO_PJ_DEFAULT_INSUMOS,
  },
  "668": {
    slug: "668-spc-avancada-pj",
    name: "668 SPC AVANÇADA PJ",
    endpoint: "/api/668-spc-avancada-pj",
    excludedInsumos: SPC_AVANCADA_PJ_EXCLUDED_INSUMOS,
  },
  "695": {
    slug: "695-spc-mais",
    name: "695 SPC MAIS",
    endpoint: "/api/695-spc-mais",
    defaultInsumos: SPC_MAIS_DEFAULT_INSUMOS,
  },
};

/** The `product` prop for the result page; `undefined` means 325 SPC MAXI. */
export function getResultProduct(code: ResultProductCode): SpcResultProduct | undefined {
  return code === "325" ? undefined : RESULT_PRODUCTS[code];
}
