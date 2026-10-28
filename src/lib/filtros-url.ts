// Filtros globales en la URL (?p=ytd&prod=diesel&depto=Itapúa): links compartibles.
import {
  nombresDepartamentos,
  normalizarFiltros,
  presetsPeriodo,
  type FiltroProducto,
  type FiltrosVentas,
} from "@/lib/data";

export type FiltrosUrl = { p?: string; prod?: FiltroProducto; depto?: string };

const productosValidos: FiltroProducto[] = ["liquidos", "diesel", "naftas", "etanol", "glp"];

export function validarFiltrosUrl(search: Record<string, unknown>): FiltrosUrl {
  const out: FiltrosUrl = {};
  if (typeof search["p"] === "string" && presetsPeriodo.some((x) => x.id === search["p"]))
    out.p = search["p"];
  if (productosValidos.includes(search["prod"] as FiltroProducto))
    out.prod = search["prod"] as FiltroProducto;
  if (typeof search["depto"] === "string" && nombresDepartamentos.includes(search["depto"]))
    out.depto = search["depto"];
  return out;
}

export function aFiltrosVentas(f: FiltrosUrl): FiltrosVentas {
  const preset = presetsPeriodo.find((x) => x.id === (f.p ?? "ytd")) ?? presetsPeriodo[0];
  return normalizarFiltros({
    desde: preset?.desde,
    hasta: preset?.hasta,
    producto: f.prod ?? "liquidos",
    depto: f.depto,
  });
}

export const etiquetaPreset = (id?: string) =>
  presetsPeriodo.find((x) => x.id === (id ?? "ytd"))?.label ?? "";
