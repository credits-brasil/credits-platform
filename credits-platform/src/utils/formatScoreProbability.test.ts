import { describe, expect, it } from "vitest";
import { formatScoreProbability } from "./formatScoreProbability";

describe("formatScoreProbability", () => {
  it.each([
    ["4.93", "4,93%"], ["31.15", "31,15%"],
    ["6.331318404957606", "6,33%"], ["11.3", "11,30%"],
    [0, "0,00%"], [null, "?"], [undefined, "?"], ["", "?"], ["invalid", "?"],
  ])("formats %s as %s", (value, expected) => {
    expect(formatScoreProbability(value)).toBe(expected);
  });
});
