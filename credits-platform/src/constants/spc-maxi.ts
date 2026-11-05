import { CNPJ_INSUMO_GROUPS } from "@/constants/insumo-groups";
import type { InsumoGroup } from "@/constants/insumo-groups";

// Only offered by SPC MAXI, so it is not part of the shared CNPJ groups.
const CNPJ_CADASTRAL_EXTRA_INSUMOS = [{ id: "5241", label: "Grupo econômico" }];

export const SPC_MAXI_CNPJ_INSUMO_GROUPS: InsumoGroup[] = CNPJ_INSUMO_GROUPS.map(
  (group) =>
    group.id === "cadastral"
      ? { ...group, items: [...group.items, ...CNPJ_CADASTRAL_EXTRA_INSUMOS] }
      : group,
);
