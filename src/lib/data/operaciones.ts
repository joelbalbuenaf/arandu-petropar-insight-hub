import { etiquetaCorta, periodos } from "./periodos";
import { crearAzar, entre, redondear } from "./random";

export const plantas = [
  {
    planta: "Villa Elisa",
    producto: "Combustibles",
    capacidadM3: 120000,
    stockM3: 86000,
    lat: -25.368,
    lng: -57.592,
  },
  {
    planta: "Hernandarias",
    producto: "Combustibles",
    capacidadM3: 45000,
    stockM3: 29500,
    lat: -25.405,
    lng: -54.64,
  },
  {
    planta: "Mauricio J. Troche (alcohol)",
    producto: "Etanol",
    capacidadM3: 30000,
    stockM3: 21800,
    lat: -25.8,
    lng: -56.26,
  },
  {
    planta: "San Antonio (GLP)",
    producto: "GLP",
    capacidadM3: 8000,
    stockM3: 5100,
    lat: -25.42,
    lng: -57.55,
  },
];

export const kpisLogistica = {
  stockDiasDiesel: 18,
  stockDiasNaftas: 22,
  ocupacionTanquesPct: 71,
  entregasATiempoPct: 94.3,
};

// Serie mensual Ene 2025 – Sep 2026. Los últimos tres meses son los del prototipo original.
const fijos: Record<string, { fluvial: number; terrestre: number; rio: number }> = {
  "2026-07": { fluvial: 210, terrestre: 48, rio: 1.35 },
  "2026-08": { fluvial: 195, terrestre: 55, rio: 1.05 },
  "2026-09": { fluvial: 172, terrestre: 66, rio: 0.85 },
};
// Nivel del río Paraguay en Asunción (m): alto en otoño, bajante en primavera.
const rioPorMes = [3.1, 3.4, 3.6, 3.9, 4.1, 3.7, 3.0, 2.3, 1.6, 1.2, 1.5, 2.4];

export const serieLogistica = (() => {
  const azar = crearAzar("logistica");
  return periodos.map((periodo, i) => {
    const mes = Number(periodo.slice(5, 7));
    const fijo = fijos[periodo];
    const rio =
      fijo?.rio ??
      redondear(
        (rioPorMes[mes - 1] ?? 2) * (periodo < "2026" ? 1 : 0.62) * entre(azar, 0.9, 1.1),
        2,
      );
    // Con río bajo se reemplaza transporte fluvial por terrestre.
    const fluvial =
      fijo?.fluvial ?? Math.round(Math.min(245, 120 + rio * 30) * entre(azar, 0.95, 1.05));
    const terrestre =
      fijo?.terrestre ?? Math.round(Math.max(30, 80 - rio * 12) * entre(azar, 0.92, 1.08));
    const stockDiasDiesel =
      i === periodos.length - 1 ? 18 : Math.round(entre(azar, 17, 26) + Math.min(rio, 3));
    const stockDiasNaftas =
      i === periodos.length - 1 ? 22 : Math.round(entre(azar, 20, 27) + Math.min(rio, 2));
    return {
      periodo,
      mes: etiquetaCorta(periodo),
      fluvial,
      terrestre,
      nivelRioM: rio,
      stockDiasDiesel,
      stockDiasNaftas,
    };
  });
})();

export const nivelRioParaguayM = 0.85;

// ── Mercado ────────────────────────────────────────────────────────────────────────────

export const participacionMercado = [
  { empresa: "Petropar", pct: 31 },
  { empresa: "Copetrol", pct: 22 },
  { empresa: "Puma", pct: 14 },
  { empresa: "Shell (Enex)", pct: 12 },
  { empresa: "Petrobras (Copec)", pct: 10 },
  { empresa: "Otros", pct: 11 },
];

const preciosFijos: Record<
  string,
  { petroparDiesel: number; mercadoDiesel: number; brent: number }
> = {
  "2026-07": { petroparDiesel: 7290, mercadoDiesel: 7650, brent: 78 },
  "2026-08": { petroparDiesel: 7290, mercadoDiesel: 7700, brent: 80 },
  "2026-09": { petroparDiesel: 7390, mercadoDiesel: 7790, brent: 83 },
};

export const seriePrecios = (() => {
  const azar = crearAzar("precios");
  // Brent: paseo aleatorio corregido para empalmar con los valores fijos de Jul 2026.
  const crudo: number[] = [];
  let b = 72;
  for (let i = 0; i < periodos.length; i++) crudo.push((b += entre(azar, -2.2, 2.4)));
  const ultimoLibre = periodos.findIndex((p) => preciosFijos[p]) - 1;
  const ajuste = 77 - (crudo[ultimoLibre] ?? 77);
  return periodos.map((periodo, i) => {
    const fijo = preciosFijos[periodo];
    const brent = fijo?.brent ?? redondear((crudo[i] ?? 74) + (ajuste * i) / ultimoLibre, 1);
    // Petropar ajusta en escalones de 100 Gs hasta llegar a 7.290 en Jun 2026; el mercado sigue a Brent con prima.
    const petroparDiesel = fijo?.petroparDiesel ?? 6990 + 100 * Math.floor((i * 3) / ultimoLibre);
    const mercadoDiesel =
      fijo?.mercadoDiesel ??
      Math.round((petroparDiesel + 250 + (brent - 74) * 18 + entre(azar, -40, 60)) / 10) * 10;
    const petroparNafta = petroparDiesel + 380;
    const mercadoNafta = mercadoDiesel + 520;
    return {
      periodo,
      mes: etiquetaCorta(periodo),
      petroparDiesel,
      mercadoDiesel,
      petroparNafta,
      mercadoNafta,
      brent,
    };
  });
})();
