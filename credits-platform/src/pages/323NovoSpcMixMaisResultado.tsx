import SpcMaxiResultadoPage from "@/pages/325SpcMaxiResultado";
import { NOVO_SPC_MIX_MAIS_EXCLUDED_INSUMOS } from "@/constants/novo-spc-mix-mais";

export default function SpcMixMaisResultadoPage() {
  return (
    <SpcMaxiResultadoPage
      product={{
        slug: "323-novo-spc-mix-mais",
        name: "323 NOVO SPC MIX MAIS",
        endpoint: "/api/323-spc-mix-mais",
        excludedInsumosByDocType: {
          CNPJ: NOVO_SPC_MIX_MAIS_EXCLUDED_INSUMOS,
        },
      }}
    />
  );
}
