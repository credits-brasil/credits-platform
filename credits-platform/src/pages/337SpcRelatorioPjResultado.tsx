import SpcMaxiResultadoPage from "@/pages/325SpcMaxiResultado";
import {
  SPC_RELATORIO_PJ_DEFAULT_INSUMOS,
  SPC_RELATORIO_PJ_EXCLUDED_INSUMOS,
} from "@/constants/spc-relatorio-pj";

export default function SpcRelatorioResultadoPage() {
  return (
    <SpcMaxiResultadoPage
      product={{
        slug: "337-spc-relatorio-pj",
        name: "337 SPC RELATÓRIO PJ",
        endpoint: "/api/337-spc-relatorio",
        excludedInsumos: SPC_RELATORIO_PJ_EXCLUDED_INSUMOS,
        defaultInsumos: SPC_RELATORIO_PJ_DEFAULT_INSUMOS,
      }}
    />
  );
}
