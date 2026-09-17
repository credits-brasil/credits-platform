import SpcMaxiResultadoPage from "@/pages/325SpcMaxiResultado";
import { SPC_POSITIVO_INTERMEDIARIO_PJ_DEFAULT_INSUMOS } from "@/constants/spc-positivo-intermediario-pj";

export default function SpcPositivoIntermediarioPjResultadoPage() {
  return (
    <SpcMaxiResultadoPage
      product={{
        slug: "629-spc-positivo-intermediario-pj",
        name: "SPC POSITIVO INTERMEDIÁRIO PJ",
        endpoint: "/api/629-spc-positivo-intermediario-pj",
        defaultInsumos: SPC_POSITIVO_INTERMEDIARIO_PJ_DEFAULT_INSUMOS,
      }}
    />
  );
}
