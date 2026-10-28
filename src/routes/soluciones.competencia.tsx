import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Kpi } from "@/components/AppShell";
import { BotonCsv, Seccion, Tabla } from "@/components/comercial/comun";
import { HubMap, type CapaMapa } from "@/components/map/HubMap";
import { Contenido, EncabezadoSolucion } from "@/components/soluciones/comun";
import { Toggle } from "@/components/ui/toggle";
import {
  competencia,
  departamentos,
  emblemas,
  estaciones,
  participacionMercado,
  vaciosDeCobertura,
  type Emblema,
} from "@/lib/data";
import { fmtNumero } from "@/lib/export";

export const Route = createFileRoute("/soluciones/competencia")({
  head: () => ({ meta: [{ title: "Radar de competencia · Hub Petropar" }] }),
  component: Page,
});

// Color fijo por emblema (sigue a la entidad, no al orden): 4 primeros slots + gris para "Otros".
const colorEmblema: Record<Emblema, string> = {
  Copetrol: "var(--series-2)",
  Puma: "var(--series-3)",
  Shell: "var(--series-4)",
  Petrobras: "var(--series-5)",
  Otros: "var(--series-muted)",
};

function Page() {
  const [visibles, setVisibles] = useState<Set<Emblema>>(new Set(emblemas));
  const [verPropias, setVerPropias] = useState(true);
  const vacios = vaciosDeCobertura();

  const capas: CapaMapa[] = useMemo(
    () => [
      ...emblemas
        .filter((e) => visibles.has(e))
        .map((e) => ({
          id: e,
          nombre: e,
          color: colorEmblema[e],
          radio: 4,
          puntos: competencia
            .filter((c) => c.emblema === e)
            .map((c) => ({
              id: c.id,
              lat: c.lat,
              lng: c.lng,
              titulo: `${c.emblema} · ${c.ciudad}`,
              detalle: c.depto,
            })),
        })),
      ...(verPropias
        ? [
            {
              id: "petropar",
              nombre: "Petropar",
              color: "var(--series-1)",
              radio: 5,
              puntos: estaciones.map((e) => ({
                id: e.id,
                lat: e.lat,
                lng: e.lng,
                titulo: e.nombre,
                detalle: e.operador,
              })),
            },
          ]
        : []),
      {
        id: "vacios",
        nombre: "Vacío de cobertura",
        color: "var(--destructive)",
        radio: 11,
        puntos: vacios.map((v) => ({
          id: v.nombre,
          lat: v.lat,
          lng: v.lng,
          titulo: `Vacío: ${v.nombre}`,
          detalle: `${v.competidores} competidores a 6 km · Petropar a ${fmtNumero(v.estacionPropiaKm)} km`,
        })),
      },
    ],
    [visibles, verPropias, vacios],
  );

  const densidad = departamentos
    .map((d) => {
      const comp = competencia.filter((c) => c.depto === d.nombre).length;
      const propias = estaciones.filter((e) => e.depto === d.nombre).length;
      return {
        depto: d.nombre,
        competencia: comp,
        petropar: propias,
        ratio: propias ? comp / propias : null,
        cuotaRed: (propias / (comp + propias || 1)) * 100,
      };
    })
    .sort((a, b) => b.competencia - a.competencia);

  return (
    <main className="pb-10">
      <EncabezadoSolucion
        categoria="Inteligencia de mercado"
        titulo="Radar de competencia"
        desc="Estaciones de emblemas privados, su densidad por zona y vacíos de cobertura de Petropar."
        requiere="Para producción hace falta un registro geolocalizado y actualizado de estaciones de todos los emblemas."
        pregunta="¿Dónde hay vacíos de cobertura frente a la competencia?"
      />
      <Contenido>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi label="Estaciones de la competencia" value={fmtNumero(competencia.length, 0)} />
          <Kpi
            label="Red Petropar"
            value={fmtNumero(estaciones.length, 0)}
            hint={`${fmtNumero((estaciones.length / (estaciones.length + competencia.length)) * 100)}% de las estaciones del mapa`}
          />
          <Kpi
            label="Participación de mercado"
            value={`${participacionMercado[0]?.pct}%`}
            hint="Por volumen (incluye mayoristas)"
          />
          <Kpi
            label="Vacíos de cobertura"
            value={fmtNumero(vacios.length, 0)}
            hint="Ciudades con competencia y sin Petropar a 10 km"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-2 shadow-card">
          <span className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Mostrar
          </span>
          <Toggle
            pressed={verPropias}
            onPressedChange={setVerPropias}
            size="sm"
            className="gap-1.5"
          >
            <span className="size-2.5 rounded-full" style={{ background: "var(--series-1)" }} />{" "}
            Petropar
          </Toggle>
          {emblemas.map((e) => (
            <Toggle
              key={e}
              size="sm"
              className="gap-1.5"
              pressed={visibles.has(e)}
              onPressedChange={(on) =>
                setVisibles((v) => {
                  const n = new Set(v);
                  if (on) n.add(e);
                  else n.delete(e);
                  return n;
                })
              }
            >
              <span className="size-2.5 rounded-full" style={{ background: colorEmblema[e] }} /> {e}{" "}
              ({competencia.filter((c) => c.emblema === e).length})
            </Toggle>
          ))}
        </div>
        <Seccion titulo="Mapa de estaciones">
          <HubMap capas={capas} alto={560} />
        </Seccion>
        <div className="grid gap-6 xl:grid-cols-2">
          <Seccion
            titulo="Vacíos de cobertura"
            acciones={<BotonCsv filas={vacios} nombre="vacios" />}
          >
            <Tabla
              filas={vacios}
              clave={(v) => v.nombre}
              columnas={[
                { titulo: "Ciudad", valor: (v) => v.nombre },
                { titulo: "Depto", valor: (v) => v.depto },
                { titulo: "Competidores", valor: (v) => v.competidores, numero: true },
                {
                  titulo: "Petropar a",
                  valor: (v) => `${fmtNumero(v.estacionPropiaKm)} km`,
                  numero: true,
                },
                {
                  titulo: "",
                  valor: (v) => (
                    <Link
                      to="/soluciones/evaluador"
                      search={{ lat: v.lat + 0.008, lng: v.lng + 0.008 }}
                      className="text-xs font-semibold text-primary dark:text-sidebar-primary"
                    >
                      Evaluar sitio →
                    </Link>
                  ),
                },
              ]}
            />
          </Seccion>
          <Seccion
            titulo="Densidad por departamento"
            acciones={<BotonCsv filas={densidad} nombre="densidad" />}
          >
            <Tabla
              alto={380}
              filas={densidad}
              clave={(d) => d.depto}
              columnas={[
                { titulo: "Departamento", valor: (d) => d.depto },
                { titulo: "Competencia", valor: (d) => d.competencia, numero: true },
                { titulo: "Petropar", valor: (d) => d.petropar, numero: true },
                {
                  titulo: "Comp. por estación",
                  valor: (d) => (d.ratio === null ? "—" : fmtNumero(d.ratio)),
                  numero: true,
                },
                {
                  titulo: "% red Petropar",
                  valor: (d) => `${fmtNumero(d.cuotaRed)}%`,
                  numero: true,
                },
              ]}
            />
          </Seccion>
        </div>
      </Contenido>
    </main>
  );
}
