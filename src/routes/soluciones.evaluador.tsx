import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, X } from "lucide-react";
import { BotonCsv, Seccion, Tabla } from "@/components/comercial/comun";
import { HubMap, type CapaMapa } from "@/components/map/HubMap";
import { Contenido, EncabezadoSolucion } from "@/components/soluciones/comun";
import { Button } from "@/components/ui/button";
import {
  ciudades,
  competencia,
  estaciones,
  evaluarSitio,
  vaciosDeCobertura,
  type EvaluacionSitio,
} from "@/lib/data";
import { fmtNumero } from "@/lib/export";

type Busqueda = { lat?: number; lng?: number };

export const Route = createFileRoute("/soluciones/evaluador")({
  validateSearch: (s: Record<string, unknown>): Busqueda => {
    const lat = Number(s["lat"]);
    const lng = Number(s["lng"]);
    return lat < -19 && lat > -28 && lng < -54 && lng > -63 ? { lat, lng } : {};
  },
  head: () => ({ meta: [{ title: "Evaluador de sitios · Hub Petropar" }] }),
  component: Page,
});

const colorPuntaje = (p: number) =>
  p >= 70 ? "text-success" : p >= 50 ? "text-warning" : "text-destructive";

function Medidor({ puntaje }: { puntaje: number }) {
  const r = 52;
  const largo = Math.PI * r;
  return (
    <svg viewBox="0 0 120 70" className="w-40" role="img" aria-label={`Puntaje ${puntaje} de 100`}>
      <path
        d="M8 62 A52 52 0 0 1 112 62"
        fill="none"
        stroke="var(--muted)"
        strokeWidth={10}
        strokeLinecap="round"
      />
      <path
        d="M8 62 A52 52 0 0 1 112 62"
        fill="none"
        stroke={
          puntaje >= 70 ? "var(--success)" : puntaje >= 50 ? "var(--warning)" : "var(--destructive)"
        }
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={`${(largo * puntaje) / 100} ${largo}`}
      />
      <text
        x="60"
        y="58"
        textAnchor="middle"
        className="fill-foreground"
        fontSize="22"
        fontWeight={700}
      >
        {puntaje}
      </text>
    </svg>
  );
}

function Page() {
  const inicial = Route.useSearch();
  const [punto, setPunto] = useState<{ lat: number; lng: number } | null>(
    inicial.lat && inicial.lng ? { lat: inicial.lat, lng: inicial.lng } : null,
  );
  const [comparados, setComparados] = useState<EvaluacionSitio[]>([]);
  const ev = useMemo(() => (punto ? evaluarSitio(punto) : null), [punto]);
  const vacios = vaciosDeCobertura();

  const capas: CapaMapa[] = useMemo(() => {
    if (!punto) return [];
    const cerca = (p: { lat: number; lng: number }) =>
      Math.abs(p.lat - punto.lat) < 0.25 && Math.abs(p.lng - punto.lng) < 0.25;
    return [
      {
        id: "competencia",
        nombre: "Competencia",
        color: "var(--series-2)",
        radio: 5,
        puntos: competencia
          .filter(cerca)
          .map((c) => ({ id: c.id, lat: c.lat, lng: c.lng, titulo: c.emblema, detalle: c.ciudad })),
      },
      {
        id: "propias",
        nombre: "Petropar",
        color: "var(--series-1)",
        radio: 6,
        puntos: estaciones.filter(cerca).map((e) => ({
          id: e.id,
          lat: e.lat,
          lng: e.lng,
          titulo: e.nombre,
          detalle: `${e.ventasMl} ML Ene–Sep 2026`,
        })),
      },
      {
        id: "sitio",
        nombre: "Sitio evaluado",
        color: "var(--foreground)",
        radio: 8,
        puntos: [
          {
            id: "sitio",
            lat: punto.lat,
            lng: punto.lng,
            titulo: "Sitio evaluado",
            detalle: ev ? `Puntaje ${ev.puntaje}/100` : "",
          },
        ],
      },
    ];
  }, [punto, ev]);

  const comparar = () => {
    if (!ev) return;
    setComparados((c) => [...c.filter((x) => x.lat !== ev.lat || x.lng !== ev.lng), ev].slice(-3));
  };

  return (
    <main className="pb-10">
      <EncabezadoSolucion
        categoria="Expansión territorial"
        titulo="Evaluador de sitios"
        desc="Hacé clic en el mapa (o elegí una ciudad) para estimar el potencial de una nueva estación o punto Ñande Gas."
        requiere="El puntaje es un modelo ilustrativo con factores explícitos; para producción hacen falta datos de tráfico, demografía y un modelo de demanda validado."
        pregunta="¿Dónde abrirías la próxima estación Petropar y por qué?"
      />
      <Contenido>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Vacíos de cobertura:
          </span>
          {vacios.map((v) => (
            <Button
              key={v.nombre}
              variant="outline"
              size="sm"
              onClick={() => setPunto({ lat: v.lat + 0.008, lng: v.lng + 0.008 })}
            >
              {v.nombre}
            </Button>
          ))}
          <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Otras:
          </span>
          {["Luque", "Ciudad del Este", "Encarnación", "Coronel Oviedo", "Filadelfia"].map((n) => {
            const c = ciudades.find((x) => x.nombre === n);
            return c ? (
              <Button
                key={n}
                variant="ghost"
                size="sm"
                onClick={() => setPunto({ lat: c.lat + 0.012, lng: c.lng - 0.01 })}
              >
                {n}
              </Button>
            ) : null;
          })}
        </div>
        <div className="grid gap-6 xl:grid-cols-5">
          <div className="xl:col-span-3">
            <Seccion titulo="Elegí un punto en el mapa">
              <HubMap
                capas={capas}
                alto={540}
                onClickMapa={setPunto}
                marcador={punto}
                radioKm={5}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Círculo punteado = radio de análisis de 5 km.
              </p>
            </Seccion>
          </div>
          <div className="xl:col-span-2">
            <Seccion titulo="Resultado">
              {!ev ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Hacé clic en cualquier punto de Paraguay para evaluarlo.
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Medidor puntaje={ev.puntaje} />
                    <div>
                      <p className={`text-lg font-bold ${colorPuntaje(ev.puntaje)}`}>
                        {ev.recomendacion}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Cerca de {ev.ciudadCercana} ({ev.depto})
                      </p>
                      <p className="mt-1 text-sm">
                        <strong>{fmtNumero(ev.volumenAnualMl)} ML/año</strong> estimados ·{" "}
                        <span className="text-muted-foreground">
                          canibalización {fmtNumero(ev.canibalizacionMl)} ML/año
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {ev.factores.map((f) => (
                      <div key={f.nombre} className="rounded-md border p-2.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{f.nombre}</span>
                          <span
                            className={`font-semibold tabular-nums ${f.aporte >= 0 ? "text-success" : "text-destructive"}`}
                          >
                            {f.aporte > 0 ? "+" : ""}
                            {f.aporte}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {f.valor} · {f.explicacion}
                        </p>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground">
                      Base 45 puntos + aportes de cada factor (0–100).
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={comparar} variant="outline" size="sm">
                      <Plus className="size-3.5" /> Agregar a la comparación
                    </Button>
                    <Button asChild size="sm" variant="ghost">
                      <Link
                        to="/chat"
                        search={{
                          q: `Evalúa un sitio nuevo en ${ev.ciudadCercana} y compáralo con la red actual.`,
                        }}
                      >
                        Preguntar a Arandu
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </Seccion>
          </div>
        </div>
        {comparados.length > 0 && (
          <Seccion
            titulo={`Comparación de sitios (${comparados.length}/3)`}
            acciones={
              <BotonCsv
                filas={comparados.map(({ factores: _f, competidores: _c, ...e }) => e)}
                nombre="comparacion-sitios"
              />
            }
          >
            <Tabla
              filas={comparados}
              clave={(e) => `${e.lat},${e.lng}`}
              columnas={[
                { titulo: "Sitio", valor: (e) => `${e.ciudadCercana} (${e.depto})` },
                {
                  titulo: "Puntaje",
                  valor: (e) => (
                    <span className={`font-bold ${colorPuntaje(e.puntaje)}`}>{e.puntaje}</span>
                  ),
                  numero: true,
                },
                { titulo: "ML/año", valor: (e) => fmtNumero(e.volumenAnualMl), numero: true },
                {
                  titulo: "Canibalización",
                  valor: (e) => fmtNumero(e.canibalizacionMl),
                  numero: true,
                },
                ...[0, 1, 2, 3].map((i) => ({
                  titulo: comparados[0]?.factores[i]?.nombre.split(" (")[0] ?? "",
                  valor: (e: EvaluacionSitio) => e.factores[i]?.aporte ?? 0,
                  numero: true,
                })),
                {
                  titulo: "",
                  valor: (e) => (
                    <button
                      aria-label="Quitar"
                      onClick={() => setComparados((c) => c.filter((x) => x !== e))}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-4" />
                    </button>
                  ),
                },
              ]}
            />
          </Seccion>
        )}
      </Contenido>
    </main>
  );
}
