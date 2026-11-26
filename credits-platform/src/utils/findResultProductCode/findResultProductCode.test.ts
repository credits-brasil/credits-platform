import { describe, expect, it } from "vitest";
import { findResultProductCode } from ".";

describe("findResultProductCode", () => {
  it("uses the product code in the name", () => {
    expect(findResultProductCode("695 SPC MAIS")).toBe("695");
    expect(findResultProductCode("325 SPC MAXI")).toBe("325");
    expect(findResultProductCode("668 SPC AVANÇADA PJ")).toBe("668");
    expect(findResultProductCode("323-spc-mix-mais")).toBe("323");
  });

  it("falls back to the product name, ignoring case and accents", () => {
    expect(findResultProductCode("SPC Positivo Intermediário PJ")).toBe("629");
    expect(findResultProductCode("spc relatório pj")).toBe("337");
    expect(findResultProductCode("SPC MAXI")).toBe("325");
  });

  it("does not confuse SPC MIX MAIS with SPC MAIS", () => {
    expect(findResultProductCode("NOVO SPC MIX MAIS")).toBe("323");
    expect(findResultProductCode("SPC MAIS")).toBe("695");
  });

  it("does not match codes inside longer numbers", () => {
    expect(findResultProductCode("Produto 13250")).toBeNull();
  });

  it("returns null for unknown or empty names", () => {
    expect(findResultProductCode("Outro produto")).toBeNull();
    expect(findResultProductCode("")).toBeNull();
    expect(findResultProductCode(undefined)).toBeNull();
  });
});
