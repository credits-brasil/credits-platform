import SpcMaxiResultadoPage from "@/pages/325SpcMaxiResultado";

export default function SpcAvancadaResultadoPage() {
  return (
    <SpcMaxiResultadoPage
      product={{
        slug: "668-spc-avancada-pj",
        name: "668 SPC AVANÇADA PJ",
        endpoint: "/api/668-spc-avancada-pj",
        excludedInsumos: ["5185"],
      }}
    />
  );
}
