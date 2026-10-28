// Evaluador de sitios: puntaje transparente con factores explícitos. Modelo ficticio para la demo.
import { ciudades, rutas } from "./geografia";
import { dentroDeRadio, distanciaARutaKm, distanciaKm, masCercano, type Punto } from "./geo";
import { competencia, estaciones } from "./red";
import { redondear } from "./random";

export type Factor = { nombre: string; valor: string; aporte: number; explicacion: string };

export function evaluarSitio(p: Punto) {
  const ciudad = masCercano(p, ciudades);
  // Demanda: ciudades cercanas ponderadas por distancia.
  const demanda = ciudades.reduce((s, c) => s + c.peso * Math.exp(-distanciaKm(p, c) / 12), 0);
  const ruta = rutas
    .map((r) => ({ nombre: r.nombre, km: distanciaARutaKm(p, r.puntos) }))
    .sort((a, b) => a.km - b.km)[0];
  const competidores = dentroDeRadio(p, competencia, 5);
  const propias = dentroDeRadio(p, estaciones, 5);

  const fDemanda = Math.min(40, demanda * 7);
  const fRuta = ruta ? Math.max(0, 25 - ruta.km * 2.5) : 0;
  const fCompetencia = -Math.min(20, competidores.length * 2.2);
  const fCanibal = -Math.min(
    25,
    propias.reduce((s, e) => s + 9 * Math.exp(-e.distanciaKm / 2), 0),
  );
  const puntaje = Math.round(
    Math.max(0, Math.min(100, 45 + fDemanda + fRuta + fCompetencia + fCanibal)),
  );

  // Volumen estimado anual (ML) para una estación nueva, calibrado con la red actual.
  const mediaRed = estaciones.reduce((s, e) => s + e.ventasMl, 0) / estaciones.length / 9; // ML/mes
  const volumenAnualMl = redondear(mediaRed * 12 * (0.35 + puntaje / 70), 1);
  const canibalizacionMl = redondear(
    propias.reduce((s, e) => s + (e.ventasMl / 9) * 12 * 0.12 * Math.exp(-e.distanciaKm / 2), 0),
    1,
  );

  const factores: Factor[] = [
    {
      nombre: "Demanda del entorno",
      valor: `${redondear(demanda, 2)} índice`,
      aporte: Math.round(fDemanda),
      explicacion: `Ciudades cercanas ponderadas por distancia; la más próxima es ${ciudad?.nombre ?? "—"} a ${redondear(ciudad?.distanciaKm ?? 0, 1)} km.`,
    },
    {
      nombre: "Tráfico de ruta",
      valor: ruta ? `${redondear(ruta.km, 1)} km` : "—",
      aporte: Math.round(fRuta),
      explicacion: ruta ? `Distancia a ${ruta.nombre}.` : "Sin ruta troncal cercana.",
    },
    {
      nombre: "Competencia (5 km)",
      valor: `${competidores.length} estaciones`,
      aporte: Math.round(fCompetencia),
      explicacion: competidores.length
        ? `Emblemas: ${[...new Set(competidores.map((c) => c.emblema))].join(", ")}.`
        : "Sin competidores en 5 km.",
    },
    {
      nombre: "Canibalización (5 km)",
      valor: `${propias.length} Petropar`,
      aporte: Math.round(fCanibal),
      explicacion: propias.length
        ? `La más cercana: ${propias[0]?.nombre} a ${redondear(propias[0]?.distanciaKm ?? 0, 1)} km.`
        : "Sin estaciones propias en 5 km.",
    },
  ];

  return {
    lat: redondear(p.lat, 4),
    lng: redondear(p.lng, 4),
    ciudadCercana: ciudad?.nombre ?? "—",
    depto: ciudad?.depto ?? "—",
    puntaje,
    recomendacion:
      puntaje >= 70 ? "Sitio atractivo" : puntaje >= 50 ? "Evaluar en detalle" : "Poco atractivo",
    volumenAnualMl,
    canibalizacionMl,
    factores,
    competidores: competidores
      .slice(0, 8)
      .map((c) => ({ emblema: c.emblema, km: redondear(c.distanciaKm, 1) })),
    nota: "Modelo ilustrativo con datos ficticios: no reemplaza un estudio de tráfico, demografía ni factibilidad.",
  };
}

export type EvaluacionSitio = ReturnType<typeof evaluarSitio>;
