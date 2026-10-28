import { useNavigate } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { nombreFiltroProducto, nombresDepartamentos, presetsPeriodo } from "@/lib/data";
import type { FiltrosUrl } from "@/lib/filtros-url";

const TODOS = "__todos";

/** Barra de filtros en una fila sobre los gráficos; escribe en la URL de la página actual. */
export function FilterBar({
  filtros,
  mostrar = ["periodo", "producto", "depto"],
}: {
  filtros: FiltrosUrl;
  mostrar?: ("periodo" | "producto" | "depto")[];
}) {
  const navigate = useNavigate();
  const set = (cambio: { [K in keyof FiltrosUrl]?: FiltrosUrl[K] | undefined }) =>
    void navigate({
      to: ".",
      search: (prev: Record<string, unknown>) => {
        const next = { ...prev, ...cambio } as Record<string, unknown>;
        for (const k of Object.keys(next)) if (next[k] === undefined) delete next[k];
        return next;
      },
      replace: true,
    } as never);
  const activos = Boolean(filtros.p || filtros.prod || filtros.depto);

  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-2 shadow-card print:hidden"
      role="group"
      aria-label="Filtros"
    >
      {mostrar.includes("periodo") && (
        <Select
          value={filtros.p ?? "ytd"}
          onValueChange={(v) => set({ p: v === "ytd" ? undefined : v })}
        >
          <SelectTrigger className="h-9 w-48" aria-label="Período">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {presetsPeriodo.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {mostrar.includes("producto") && (
        <Select
          value={filtros.prod ?? "liquidos"}
          onValueChange={(v) =>
            set({ prod: v === "liquidos" ? undefined : (v as FiltrosUrl["prod"]) })
          }
        >
          <SelectTrigger className="h-9 w-52" aria-label="Producto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(["liquidos", "diesel", "naftas", "etanol", "glp"] as const).map((p) => (
              <SelectItem key={p} value={p}>
                {nombreFiltroProducto[p]}
                {p === "glp" ? " (kt)" : p === "liquidos" ? " (ML)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {mostrar.includes("depto") && (
        <Select
          value={filtros.depto ?? TODOS}
          onValueChange={(v) => set({ depto: v === TODOS ? undefined : v })}
        >
          <SelectTrigger className="h-9 w-52" aria-label="Departamento">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todo el país</SelectItem>
            {nombresDepartamentos.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {activos && (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => set({ p: undefined, prod: undefined, depto: undefined })}
        >
          <RotateCcw className="size-3.5" /> Limpiar
        </Button>
      )}
    </div>
  );
}
