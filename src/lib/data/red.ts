// Red de estaciones Petropar, estaciones de la competencia y prospectos B2B. Todo ficticio:
// nombres inventados y ubicaciones aproximadas alrededor de ciudades reales.
import { ciudades, departamentos, rutas, type Ciudad } from "./geografia";
import { dentroDeRadio, distanciaARutaKm, masCercano, type Punto } from "./geo";
import { operadores } from "./operadores";
import { crearAzar, elegir, entre, redondear, repartir, type Azar } from "./random";
import { serieNacional } from "./ventas";

type CiudadDepto = Ciudad & { depto: string };

function ubicarCerca(azar: Azar, c: Punto, dispersion = 0.03): Punto {
  return {
    lat: redondear(c.lat + entre(azar, -dispersion, dispersion), 4),
    lng: redondear(c.lng + entre(azar, -dispersion, dispersion), 4),
  };
}

function elegirCiudadPonderada(azar: Azar, lista: CiudadDepto[]): CiudadDepto {
  const total = lista.reduce((s, c) => s + c.peso, 0);
  let r = azar() * total;
  for (const c of lista) {
    r -= c.peso;
    if (r <= 0) return c;
  }
  return lista[lista.length - 1] as CiudadDepto;
}

const ciudadesDe = (depto: string) => ciudades.filter((c) => c.depto === depto);

// ── Estaciones Petropar ────────────────────────────────────────────────────────────────

// Cantidad de estaciones por operador y departamento (suman las estaciones de cada operador).
const distribucionRed: Record<string, Record<string, number>> = {
  "Emblemas Petropar Propias": {
    Asunción: 8,
    Central: 16,
    Cordillera: 3,
    "Alto Paraná": 5,
    Itapúa: 3,
    Caaguazú: 3,
    Paraguarí: 2,
    "Presidente Hayes": 2,
  },
  "Red Franquiciada Norte": {
    "San Pedro": 12,
    Concepción: 8,
    Amambay: 7,
    Canindeyú: 9,
    Caaguazú: 8,
    "Presidente Hayes": 4,
    Boquerón: 7,
    "Alto Paraguay": 2,
    Cordillera: 4,
  },
  "Red Franquiciada Sur": {
    Itapúa: 12,
    "Alto Paraná": 11,
    Misiones: 7,
    Ñeembucú: 5,
    Caazapá: 6,
    Guairá: 7,
    Paraguarí: 7,
  },
};

const sufijos = [
  "Centro",
  "Ruta",
  "Acceso",
  "Terminal",
  "Norte",
  "Sur",
  "Avenida",
  "Cruce",
  "Km 5",
  "Mercado",
  "Costanera",
  "Rotonda",
];

export type Formato = "Urbana" | "Ruta" | "Rural";

export type Estacion = Punto & {
  id: string;
  nombre: string;
  operador: string;
  depto: string;
  ciudad: string;
  formato: Formato;
  tienda: boolean;
  /** Ventas Ene–Sep 2026 de combustibles líquidos (ML). */
  ventasMl: number;
  /** Ventas mensuales Ene–Sep 2026 (ML). */
  mensual: number[];
  /** Potencial estimado de la zona para el mismo período (ML). */
  potencialMl: number;
  /** ventas / potencial, en %. */
  aprovechamientoPct: number;
  competidores3km: number;
};

// ── Competencia ────────────────────────────────────────────────────────────────────────

export const emblemas = ["Copetrol", "Puma", "Shell", "Petrobras", "Otros"] as const;
export type Emblema = (typeof emblemas)[number];
const cantidadPorEmblema: Record<Emblema, number> = {
  Copetrol: 95,
  Puma: 60,
  Shell: 52,
  Petrobras: 43,
  Otros: 48,
};

export type EstacionCompetencia = Punto & {
  id: string;
  emblema: Emblema;
  depto: string;
  ciudad: string;
};

function construirCompetencia(): EstacionCompetencia[] {
  const azar = crearAzar("competencia");
  const out: EstacionCompetencia[] = [];
  let n = 1;
  for (const emblema of emblemas) {
    for (let i = 0; i < cantidadPorEmblema[emblema]; i++) {
      // Los privados se concentran en zonas urbanas: ponderar al cuadrado.
      const c = elegirCiudadPonderada(
        azar,
        ciudades.map((x) => ({ ...x, peso: x.peso ** 1.6 })),
      );
      out.push({
        id: `CMP-${String(n++).padStart(3, "0")}`,
        emblema,
        depto: c.depto,
        ciudad: c.nombre,
        ...ubicarCerca(azar, c, 0.035),
      });
    }
  }
  return out;
}

export const competencia = construirCompetencia();

function construirEstaciones(): Estacion[] {
  const azar = crearAzar("estaciones");
  const pauta = Array.from({ length: 9 }, (_, i) => {
    const p = `2026-${String(i + 1).padStart(2, "0")}`;
    return (
      (serieNacional.diesel[p] ?? 0) +
      (serieNacional.naftas[p] ?? 0) +
      (serieNacional.etanol[p] ?? 0)
    );
  });
  const out: Estacion[] = [];
  let n = 1;
  for (const op of operadores.filter((o) => o.estaciones > 0)) {
    const borrador: Omit<
      Estacion,
      "ventasMl" | "mensual" | "potencialMl" | "aprovechamientoPct"
    >[] = [];
    const pesos: number[] = [];
    for (const [depto, cantidad] of Object.entries(distribucionRed[op.operador] ?? {})) {
      for (let i = 0; i < cantidad; i++) {
        const c = elegirCiudadPonderada(azar, ciudadesDe(depto));
        const punto = ubicarCerca(azar, c);
        const distRuta = Math.min(...rutas.map((r) => distanciaARutaKm(punto, r.puntos)));
        const formato: Formato = c.peso >= 2 ? "Urbana" : distRuta < 4 ? "Ruta" : "Rural";
        const competidores3km = dentroDeRadio(punto, competencia, 3).length;
        borrador.push({
          id: `EST-${String(n++).padStart(3, "0")}`,
          nombre: `Petropar ${c.nombre} ${elegir(azar, sufijos)}`,
          operador: op.operador,
          depto,
          ciudad: c.nombre,
          formato,
          tienda: formato === "Urbana" ? azar() < 0.7 : azar() < 0.3,
          competidores3km,
          ...punto,
        });
        pesos.push(c.peso ** 0.5 * (formato === "Ruta" ? 1.3 : 1) * entre(azar, 0.55, 1.6));
      }
    }
    const ventas = repartir(op.litrosMl, pesos, 2);
    borrador.forEach((e, i) => {
      const ventasMl = ventas[i] ?? 0;
      const mensual = repartir(
        ventasMl,
        pauta.map((v) => v * entre(azar, 0.92, 1.08)),
        2,
      );
      // Más competencia cerca → menor aprovechamiento del potencial de la zona.
      const aprovechamiento = Math.max(
        0.42,
        Math.min(1.04, 0.96 - 0.024 * e.competidores3km + entre(azar, -0.24, 0.12)),
      );
      out.push({
        ...e,
        ventasMl,
        mensual,
        potencialMl: redondear(ventasMl / aprovechamiento, 2),
        aprovechamientoPct: redondear(aprovechamiento * 100, 1),
      });
    });
  }
  return out;
}

export const estaciones = construirEstaciones();

/** Ciudades con competencia y sin estación Petropar a menos de `radioKm`. */
export function vaciosDeCobertura(radioKm = 10) {
  return ciudades
    .map((c) => {
      const propia = masCercano(c, estaciones);
      const competidores = dentroDeRadio(c, competencia, 6).length;
      return { ...c, competidores, estacionPropiaKm: redondear(propia?.distanciaKm ?? 999, 1) };
    })
    .filter((c) => c.estacionPropiaKm > radioKm && c.competidores >= 2)
    .sort((a, b) => b.competidores * b.peso - a.competidores * a.peso);
}

// ── Prospectos B2B ─────────────────────────────────────────────────────────────────────

export const sectores = [
  "Transporte de carga",
  "Agroindustria",
  "Constructora",
  "Cooperativa",
  "Transporte de pasajeros",
  "Industria",
] as const;
export type Sector = (typeof sectores)[number];

const nombresBase = [
  "Ñandutí",
  "Yvytu",
  "Mbareté",
  "Arasá",
  "Yporã",
  "Tajy",
  "Ybyrá",
  "Itá Pytã",
  "Karanda'y",
  "Mburucuyá",
  "Jasy",
  "Kuarahy",
  "Ysyry",
  "Guavirá",
  "Ka'aguy",
  "Tape Pyahu",
  "Aguaí",
  "Pyahu",
  "Ñu Guasu",
  "Tatakua",
];
const prefijos: Record<Sector, string[]> = {
  "Transporte de carga": ["Transportes", "Logística", "Fletes"],
  Agroindustria: ["Agro", "Granos", "Silos"],
  Constructora: ["Constructora", "Obras", "Ingeniería"],
  Cooperativa: ["Cooperativa", "Coop. de Producción", "Coop. Agrícola"],
  "Transporte de pasajeros": ["Empresa de Ómnibus", "Turismo", "Línea"],
  Industria: ["Industrias", "Cerámica", "Frigorífico"],
};
// Afinidad de cada sector con cada región (pondera dónde aparecen).
const afinidad: Record<Sector, Partial<Record<string, number>>> = {
  "Transporte de carga": {
    Metropolitana: 2,
    Este: 2,
    "Oriental Sur": 1,
    "Oriental Norte": 1,
    Chaco: 1,
  },
  Agroindustria: { Este: 3, "Oriental Sur": 2, "Oriental Norte": 2, Chaco: 1 },
  Constructora: { Metropolitana: 3, Este: 1 },
  Cooperativa: { Chaco: 3, "Oriental Sur": 1.5, Este: 1.5, "Oriental Norte": 1 },
  "Transporte de pasajeros": { Metropolitana: 3, Este: 1, "Oriental Sur": 1 },
  Industria: { Metropolitana: 3, Este: 1, "Oriental Sur": 0.5 },
};
const pesoSector: Record<Sector, number> = {
  "Transporte de carga": 30,
  Agroindustria: 28,
  Constructora: 16,
  Cooperativa: 14,
  "Transporte de pasajeros": 14,
  Industria: 18,
};

export type EstadoProspecto = "Prospecto" | "En negociación" | "Cliente actual";

export type Prospecto = Punto & {
  id: string;
  nombre: string;
  sector: Sector;
  depto: string;
  ciudad: string;
  flota: number;
  consumoM3Mes: number;
  estado: EstadoProspecto;
  estacionCercana: string;
  estacionCercanaKm: number;
  /** 0–100: consumo, cercanía a la red y afinidad del sector. */
  prioridad: number;
};

function construirProspectos(): Prospecto[] {
  const azar = crearAzar("prospectos");
  const regionDe = Object.fromEntries(departamentos.map((d) => [d.nombre, d.region]));
  const out: Prospecto[] = [];
  const usados = new Set<string>();
  let n = 1;
  for (const sector of sectores) {
    for (let i = 0; i < pesoSector[sector]; i++) {
      const c = elegirCiudadPonderada(
        azar,
        ciudades.map((x) => ({
          ...x,
          peso: x.peso * (afinidad[sector][regionDe[x.depto] ?? ""] ?? 0.2),
        })),
      );
      let nombre = "";
      do
        nombre = `${elegir(azar, prefijos[sector])} ${elegir(azar, nombresBase)}${azar() < 0.5 ? " S.A." : " S.R.L."}`;
      while (usados.has(nombre));
      usados.add(nombre);
      const punto = ubicarCerca(azar, c, 0.05);
      const flota = Math.round(
        sector === "Cooperativa" || sector === "Agroindustria"
          ? entre(azar, 15, 140)
          : entre(azar, 8, 220),
      );
      const consumoM3Mes = redondear(flota * entre(azar, 1.2, 3.4), 0);
      const cercana = masCercano(punto, estaciones);
      const estado: EstadoProspecto =
        azar() < 0.18 ? "Cliente actual" : azar() < 0.22 ? "En negociación" : "Prospecto";
      const km = cercana?.distanciaKm ?? 99;
      const prioridad = Math.round(
        Math.min(
          100,
          (consumoM3Mes / 7) * 0.6 +
            Math.max(0, 40 - km) * 0.9 +
            (sector === "Transporte de carga" || sector === "Agroindustria" ? 10 : 4),
        ),
      );
      out.push({
        id: `B2B-${String(n++).padStart(3, "0")}`,
        nombre,
        sector,
        depto: c.depto,
        ciudad: c.nombre,
        flota,
        consumoM3Mes,
        estado,
        estacionCercana: cercana?.nombre ?? "—",
        estacionCercanaKm: redondear(km, 1),
        prioridad,
        ...punto,
      });
    }
  }
  return out.sort((a, b) => b.prioridad - a.prioridad);
}

export const prospectos = construirProspectos();
