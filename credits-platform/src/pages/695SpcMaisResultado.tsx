import SpcMaxiResultadoPage from "@/pages/325SpcMaxiResultado";

export default function SpcMaisResultadoPage() {
  return (
    <SpcMaxiResultadoPage
      product={{
        slug: "695-spc-mais",
        name: "695 SPC MAIS",
        endpoint: "/api/695-spc-mais",
        excludedInsumos: ["78"],
      }}
    />
  );
}
