import SpcMaxiResultadoPage from "@/pages/325SpcMaxiResultado";
import { SPC_AVANCADA_PJ_EXCLUDED_INSUMOS } from "@/constants/spc-avancada-pj";

export default function SpcAvancadaResultadoPage() {
  return (
    <SpcMaxiResultadoPage
      product={{
        slug: "668-spc-avancada-pj",
        name: "668 SPC AVANÇADA PJ",
        endpoint: "/api/668-spc-avancada-pj",
        excludedInsumos: SPC_AVANCADA_PJ_EXCLUDED_INSUMOS,
      }}
    />
  );
}
