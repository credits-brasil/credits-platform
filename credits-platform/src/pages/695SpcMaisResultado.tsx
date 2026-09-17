import SpcMaxiResultadoPage from "@/pages/325SpcMaxiResultado";
import { SPC_MAIS_DEFAULT_INSUMOS } from "@/constants/spc-mais";

export default function SpcMaisResultadoPage() {
  return (
    <SpcMaxiResultadoPage
      product={{
        slug: "695-spc-mais",
        name: "695 SPC MAIS",
        endpoint: "/api/695-spc-mais",
        defaultInsumos: SPC_MAIS_DEFAULT_INSUMOS,
      }}
    />
  );
}
