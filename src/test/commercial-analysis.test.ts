import { describe, expect, it } from "vitest";
import { operadoresDetalle, proyectarVentas, ventasLiquidas, ventasMensuales } from "@/lib/petropar-data";
import { parseAnalyticalResponse } from "@/lib/analytical-questions";
describe("commercial calculations", () => {
  it("keeps GLP outside liquid volumes", () => {
    expect(ventasLiquidas[0]?.realizado).toBe(191);
    const first = ventasMensuales[0];
    if (!first) throw new Error("Missing demo month");
    expect(ventasLiquidas[0]?.realizado).toBe(first.diesel + first.naftas + first.etanol);
  });
  it("calculates operator target and gap from fulfillment", () => {
    const mayorista = operadoresDetalle.find(o => o.operador === "Distribuidores Mayoristas");
    expect(mayorista?.metaMl).toBe(500);
    expect(mayorista?.brechaMl).toBe(-45);
  });
  it("compares expense execution to expense budget", () => {
    const mayorista = operadoresDetalle.find(o => o.operador === "Distribuidores Mayoristas");
    expect((mayorista?.ejecutadoMUSD ?? 0) - (mayorista?.presupuestoMUSD ?? 0)).toBe(18);
  });
  it("applies scenario percentage to a three-month forecast", () => {
    const base = proyectarVentas("total");
    const high = proyectarVentas("total", 10);
    expect(base.map(v => v.mes)).toEqual(["Oct", "Nov", "Dic"]);
    expect(base[0]?.base).toBe(236.31);
    expect(high[0]?.escenario).toBe(259.94);
  });
  it("accepts only known unique chart markers", () => {
    expect(parseAnalyticalResponse("[[grafico:metas]][[grafico:metas]][[grafico:unknown]]").charts).toEqual(["metas"]);
  });
});