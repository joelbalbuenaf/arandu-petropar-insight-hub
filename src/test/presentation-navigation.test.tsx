import { describe, expect, it } from "vitest";
import { normalizeSlide } from "@/lib/presentation-data";

describe("presentation URL navigation", () => {
  it("keeps navigation within the six-slide deck", () => {
    expect(normalizeSlide(0)).toBe(1);
    expect(normalizeSlide(7)).toBe(6);
    expect(normalizeSlide("3")).toBe(3);
    expect(normalizeSlide("invalid")).toBe(1);
  });
});