import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { FlaskConical, MessageSquareText } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

/** Encabezado de módulo de solución con aviso explícito de demo. */
export function EncabezadoSolucion({
  titulo,
  desc,
  categoria,
  requiere,
  pregunta,
}: {
  titulo: string;
  desc: string;
  categoria: string;
  /** Qué haría falta para usarlo con datos reales. */
  requiere: string;
  pregunta: string;
}) {
  return (
    <>
      <PageHeader
        eyebrow={`Soluciones · ${categoria}`}
        title={titulo}
        desc={desc}
        periodo="Ene–Sep 2026"
        acciones={
          <Button asChild>
            <Link to="/chat" search={{ q: pregunta }}>
              <MessageSquareText /> Analizar con Arandu
            </Link>
          </Button>
        }
      />
      <div className="px-6 md:px-10">
        <p className="flex items-start gap-2 rounded-lg border border-dashed border-warning/60 bg-warning/10 px-4 py-2.5 text-xs leading-relaxed">
          <FlaskConical className="mt-0.5 size-4 shrink-0 text-warning" />
          <span>
            <strong>Demo con datos ficticios.</strong> {requiere}
          </span>
        </p>
      </div>
    </>
  );
}

export function Contenido({ children }: { children: ReactNode }) {
  return <div className="space-y-6 px-6 pt-6 md:px-10">{children}</div>;
}
