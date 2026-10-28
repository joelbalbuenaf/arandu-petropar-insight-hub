import {
  BarChart3,
  Building2,
  Database,
  Fuel,
  Globe2,
  LayoutGrid,
  MapPin,
  Radar,
  Truck,
  Users,
} from "lucide-react";

export const navReportes = [
  { to: "/", label: "Inicio", icon: LayoutGrid },
  { to: "/comercial", label: "Reportes Comerciales", icon: BarChart3 },
  { to: "/logistica", label: "Reportes Logística", icon: Truck },
  { to: "/mercado", label: "Reportes Mercado", icon: Globe2 },
  { to: "/operadores", label: "Comercial por Operadores", icon: Users },
] as const;

export const navSoluciones = [
  { to: "/soluciones/estaciones", label: "Red de estaciones", icon: Fuel },
  { to: "/soluciones/evaluador", label: "Evaluador de sitios", icon: MapPin },
  { to: "/soluciones/competencia", label: "Radar de competencia", icon: Radar },
  { to: "/soluciones/b2b", label: "Radar B2B", icon: Building2 },
  { to: "/soluciones/sap", label: "Consulta SAP", icon: Database },
] as const;
