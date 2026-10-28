// Universo comercial por operador (Ene–Sep 2026). Es independiente de la serie por
// departamento: no se reconcilian.

export const operadores = [
  {
    operador: "Emblemas Petropar Propias",
    estaciones: 42,
    litrosMl: 312,
    crecimientoPct: 8.1,
    cumplimientoPct: 104,
  },
  {
    operador: "Red Franquiciada Norte",
    estaciones: 61,
    litrosMl: 268,
    crecimientoPct: 5.4,
    cumplimientoPct: 98,
  },
  {
    operador: "Red Franquiciada Sur",
    estaciones: 55,
    litrosMl: 241,
    crecimientoPct: 3.2,
    cumplimientoPct: 95,
  },
  {
    operador: "Grandes Clientes Industriales",
    estaciones: 0,
    litrosMl: 389,
    crecimientoPct: 11.7,
    cumplimientoPct: 109,
  },
  {
    operador: "Distribuidores Mayoristas",
    estaciones: 0,
    litrosMl: 455,
    crecimientoPct: -2.3,
    cumplimientoPct: 91,
  },
  {
    operador: "Sector Público",
    estaciones: 0,
    litrosMl: 211,
    crecimientoPct: 4.0,
    cumplimientoPct: 100,
  },
];

export const nombresOperadores = operadores.map((o) => o.operador);

/** Nombres cortos para ejes de gráficos (los largos se recortan y se confunden entre sí). */
export const nombreCortoOperador: Record<string, string> = {
  "Emblemas Petropar Propias": "Red propia",
  "Red Franquiciada Norte": "Franquicia Norte",
  "Red Franquiciada Sur": "Franquicia Sur",
  "Grandes Clientes Industriales": "Industriales",
  "Distribuidores Mayoristas": "Mayoristas",
  "Sector Público": "Sector público",
};

export const operadoresDetalle = operadores.map((o, i) => {
  const metaMl = Number((o.litrosMl / (o.cumplimientoPct / 100)).toFixed(2));
  return {
    ...o,
    metaMl,
    brechaMl: Number((o.litrosMl - metaMl).toFixed(2)),
    presupuestoMUSD: [275, 240, 216, 334, 405, 172][i] ?? 0,
    ejecutadoMUSD: [272, 247, 222, 322, 423, 156][i] ?? 0,
    facturacionMUSD: [279, 233, 207, 344, 398, 181][i] ?? 0,
    margenPct: [9.2, 8.1, 7.8, 10.3, 6.4, 8.7][i] ?? 0,
  };
});

export const presupuestoComercial = operadoresDetalle.map((o) => ({
  operador: o.operador,
  presupuesto: o.presupuestoMUSD,
  ejecutado: o.ejecutadoMUSD,
}));

export const kpisComerciales = {
  ventasTotalesMl: 1876,
  facturacionMMUSD: 1642,
  margenBrutoPct: 8.4,
  crecimientoInteranualPct: 6.2,
};
