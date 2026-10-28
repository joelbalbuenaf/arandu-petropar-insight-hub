import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";
import { aFiltrosVentas, validarFiltrosUrl } from "@/lib/filtros-url";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
  const rutas = [
    "/",
    "/comercial",
    "/logistica",
    "/mercado",
    "/operadores",
    "/chat",
    "/chat/abc123",
    "/presentacion",
    "/soluciones/estaciones",
    "/soluciones/evaluador",
    "/soluciones/competencia",
    "/soluciones/b2b",
    "/soluciones/sap",
  ];

  for (const ruta of rutas)
    it(`encuentra una página para ${ruta}`, () => {
      const matches = router.matchRoutes(ruta);
      expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
    });

  it("valida los filtros de la URL y descarta valores inventados", () => {
    expect(validarFiltrosUrl({ p: "t3", prod: "glp", depto: "Itapúa" })).toEqual({
      p: "t3",
      prod: "glp",
      depto: "Itapúa",
    });
    expect(validarFiltrosUrl({ p: "1999", prod: "kerosene", depto: "Narnia" })).toEqual({});
    expect(aFiltrosVentas({ p: "a2025" })).toMatchObject({ desde: "2025-01", hasta: "2025-12" });
  });
});
