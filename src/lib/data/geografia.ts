// Geografía aproximada de Paraguay para la demo. Coordenadas de ciudades reales redondeadas;
// los pesos de demanda son ficticios.

export type Region = "Metropolitana" | "Oriental Norte" | "Oriental Sur" | "Este" | "Chaco";

export type Ciudad = { nombre: string; lat: number; lng: number; peso: number };

export type Departamento = {
  nombre: string;
  region: Region;
  /** Participación ficticia en ventas de combustibles líquidos (se normaliza). */
  pesoLiquidos: number;
  /** Peso de la demanda de GLP (aprox. población). */
  pesoGlp: number;
  /** >1 = más diésel (agro, transporte de carga, Chaco); <1 = más naftas (urbano). */
  sesgoDiesel: number;
  ciudades: Ciudad[];
};

export const departamentos: Departamento[] = [
  {
    nombre: "Central",
    region: "Metropolitana",
    pesoLiquidos: 21.6,
    pesoGlp: 30,
    sesgoDiesel: 0.85,
    ciudades: [
      { nombre: "San Lorenzo", lat: -25.34, lng: -57.51, peso: 5 },
      { nombre: "Luque", lat: -25.27, lng: -57.49, peso: 5 },
      { nombre: "Capiatá", lat: -25.355, lng: -57.445, peso: 4 },
      { nombre: "Lambaré", lat: -25.346, lng: -57.606, peso: 3 },
      { nombre: "Fernando de la Mora", lat: -25.32, lng: -57.54, peso: 3 },
      { nombre: "Limpio", lat: -25.17, lng: -57.49, peso: 2 },
      { nombre: "Itauguá", lat: -25.39, lng: -57.35, peso: 2 },
      { nombre: "Ñemby", lat: -25.39, lng: -57.54, peso: 2 },
    ],
  },
  {
    nombre: "Asunción",
    region: "Metropolitana",
    pesoLiquidos: 8.7,
    pesoGlp: 9,
    sesgoDiesel: 0.7,
    ciudades: [
      { nombre: "Asunción Centro", lat: -25.285, lng: -57.63, peso: 4 },
      { nombre: "Asunción Este", lat: -25.29, lng: -57.57, peso: 3 },
      { nombre: "Asunción Norte", lat: -25.25, lng: -57.6, peso: 2 },
    ],
  },
  {
    nombre: "Alto Paraná",
    region: "Este",
    pesoLiquidos: 12.4,
    pesoGlp: 12,
    sesgoDiesel: 1.2,
    ciudades: [
      { nombre: "Ciudad del Este", lat: -25.51, lng: -54.66, peso: 5 },
      { nombre: "Hernandarias", lat: -25.4, lng: -54.65, peso: 2 },
      { nombre: "Presidente Franco", lat: -25.56, lng: -54.63, peso: 2 },
      { nombre: "Minga Guazú", lat: -25.48, lng: -54.8, peso: 2 },
      { nombre: "Santa Rita", lat: -25.79, lng: -55.09, peso: 1.5 },
    ],
  },
  {
    nombre: "Itapúa",
    region: "Oriental Sur",
    pesoLiquidos: 9.3,
    pesoGlp: 9,
    sesgoDiesel: 1.2,
    ciudades: [
      { nombre: "Encarnación", lat: -27.32, lng: -55.87, peso: 4 },
      { nombre: "Hohenau", lat: -27.08, lng: -55.65, peso: 1.5 },
      { nombre: "Coronel Bogado", lat: -27.17, lng: -56.25, peso: 1.2 },
      { nombre: "María Auxiliadora", lat: -26.52, lng: -55.27, peso: 1.2 },
    ],
  },
  {
    nombre: "Caaguazú",
    region: "Oriental Norte",
    pesoLiquidos: 6.4,
    pesoGlp: 7,
    sesgoDiesel: 1.15,
    ciudades: [
      { nombre: "Coronel Oviedo", lat: -25.45, lng: -56.44, peso: 3 },
      { nombre: "Caaguazú", lat: -25.47, lng: -56.02, peso: 2 },
      { nombre: "Campo 9", lat: -25.37, lng: -55.7, peso: 1.2 },
      { nombre: "Repatriación", lat: -25.53, lng: -55.95, peso: 0.8 },
    ],
  },
  {
    nombre: "San Pedro",
    region: "Oriental Norte",
    pesoLiquidos: 5.1,
    pesoGlp: 6,
    sesgoDiesel: 1.25,
    ciudades: [
      { nombre: "San Pedro del Ycuamandiyú", lat: -24.09, lng: -57.08, peso: 1.5 },
      { nombre: "Santa Rosa del Aguaray", lat: -23.8, lng: -56.52, peso: 1.2 },
      { nombre: "San Estanislao", lat: -24.66, lng: -56.44, peso: 1.6 },
      { nombre: "Choré", lat: -24.18, lng: -56.56, peso: 0.9 },
    ],
  },
  {
    nombre: "Boquerón",
    region: "Chaco",
    pesoLiquidos: 3.9,
    pesoGlp: 1.2,
    sesgoDiesel: 1.5,
    ciudades: [
      { nombre: "Filadelfia", lat: -22.35, lng: -60.03, peso: 1.5 },
      { nombre: "Loma Plata", lat: -22.38, lng: -59.84, peso: 1.3 },
      { nombre: "Mariscal Estigarribia", lat: -22.03, lng: -60.62, peso: 0.8 },
      { nombre: "Neuland", lat: -22.65, lng: -60.12, peso: 0.7 },
    ],
  },
  {
    nombre: "Canindeyú",
    region: "Este",
    pesoLiquidos: 5.0,
    pesoGlp: 3.5,
    sesgoDiesel: 1.35,
    ciudades: [
      { nombre: "Salto del Guairá", lat: -24.06, lng: -54.33, peso: 1.3 },
      { nombre: "Curuguaty", lat: -24.47, lng: -55.69, peso: 1.3 },
      { nombre: "Katueté", lat: -24.23, lng: -54.76, peso: 1 },
      { nombre: "Corpus Christi", lat: -24.08, lng: -54.93, peso: 0.7 },
    ],
  },
  {
    nombre: "Presidente Hayes",
    region: "Chaco",
    pesoLiquidos: 3.6,
    pesoGlp: 2,
    sesgoDiesel: 1.4,
    ciudades: [
      { nombre: "Villa Hayes", lat: -25.1, lng: -57.52, peso: 1.4 },
      { nombre: "Benjamín Aceval", lat: -24.97, lng: -57.57, peso: 0.8 },
      { nombre: "Pozo Colorado", lat: -23.49, lng: -58.79, peso: 0.6 },
      { nombre: "Cruce Pioneros", lat: -22.93, lng: -59.49, peso: 0.6 },
    ],
  },
  {
    nombre: "Amambay",
    region: "Oriental Norte",
    pesoLiquidos: 3.4,
    pesoGlp: 2.8,
    sesgoDiesel: 1.2,
    ciudades: [
      { nombre: "Pedro Juan Caballero", lat: -22.56, lng: -55.75, peso: 2.2 },
      { nombre: "Capitán Bado", lat: -23.27, lng: -55.54, peso: 0.8 },
      { nombre: "Bella Vista Norte", lat: -22.13, lng: -56.52, peso: 0.6 },
    ],
  },
  {
    nombre: "Concepción",
    region: "Oriental Norte",
    pesoLiquidos: 3.2,
    pesoGlp: 3.5,
    sesgoDiesel: 1.2,
    ciudades: [
      { nombre: "Concepción", lat: -23.41, lng: -57.42, peso: 1.8 },
      { nombre: "Horqueta", lat: -23.34, lng: -57.06, peso: 1.1 },
      { nombre: "Yby Yaú", lat: -22.97, lng: -56.54, peso: 0.8 },
    ],
  },
  {
    nombre: "Cordillera",
    region: "Metropolitana",
    pesoLiquidos: 3.6,
    pesoGlp: 4.3,
    sesgoDiesel: 0.95,
    ciudades: [
      { nombre: "Caacupé", lat: -25.386, lng: -57.14, peso: 1.6 },
      { nombre: "Tobatí", lat: -25.26, lng: -57.08, peso: 0.8 },
      { nombre: "Eusebio Ayala", lat: -25.39, lng: -56.97, peso: 0.8 },
      { nombre: "Arroyos y Esteros", lat: -25.06, lng: -57.09, peso: 0.6 },
    ],
  },
  {
    nombre: "Paraguarí",
    region: "Oriental Sur",
    pesoLiquidos: 2.9,
    pesoGlp: 3.4,
    sesgoDiesel: 1.05,
    ciudades: [
      { nombre: "Paraguarí", lat: -25.62, lng: -57.15, peso: 1 },
      { nombre: "Carapeguá", lat: -25.8, lng: -57.24, peso: 1.1 },
      { nombre: "Ybycuí", lat: -26.02, lng: -57.04, peso: 0.6 },
      { nombre: "Quiindy", lat: -25.97, lng: -57.26, peso: 0.7 },
    ],
  },
  {
    nombre: "Guairá",
    region: "Oriental Sur",
    pesoLiquidos: 2.3,
    pesoGlp: 3,
    sesgoDiesel: 1,
    ciudades: [
      { nombre: "Villarrica", lat: -25.75, lng: -56.43, peso: 1.8 },
      { nombre: "Independencia", lat: -25.71, lng: -56.25, peso: 0.7 },
      { nombre: "Paso Yobái", lat: -25.73, lng: -55.99, peso: 0.5 },
    ],
  },
  {
    nombre: "Misiones",
    region: "Oriental Sur",
    pesoLiquidos: 2.0,
    pesoGlp: 1.8,
    sesgoDiesel: 1.15,
    ciudades: [
      { nombre: "San Juan Bautista", lat: -26.67, lng: -57.15, peso: 0.9 },
      { nombre: "San Ignacio", lat: -26.89, lng: -57.03, peso: 0.9 },
      { nombre: "Ayolas", lat: -27.38, lng: -56.86, peso: 0.6 },
      { nombre: "Santa Rosa", lat: -26.87, lng: -56.85, peso: 0.6 },
    ],
  },
  {
    nombre: "Caazapá",
    region: "Oriental Sur",
    pesoLiquidos: 1.9,
    pesoGlp: 2.4,
    sesgoDiesel: 1.15,
    ciudades: [
      { nombre: "Caazapá", lat: -26.2, lng: -56.37, peso: 0.8 },
      { nombre: "San Juan Nepomuceno", lat: -26.11, lng: -55.94, peso: 0.8 },
      { nombre: "Yuty", lat: -26.53, lng: -56.25, peso: 0.5 },
    ],
  },
  {
    nombre: "Ñeembucú",
    region: "Oriental Sur",
    pesoLiquidos: 1.4,
    pesoGlp: 1.3,
    sesgoDiesel: 1.1,
    ciudades: [
      { nombre: "Pilar", lat: -26.86, lng: -58.29, peso: 1 },
      { nombre: "San Juan B. del Ñeembucú", lat: -26.66, lng: -57.94, peso: 0.4 },
      { nombre: "Alberdi", lat: -26.19, lng: -58.13, peso: 0.4 },
    ],
  },
  {
    nombre: "Alto Paraguay",
    region: "Chaco",
    pesoLiquidos: 0.6,
    pesoGlp: 0.2,
    sesgoDiesel: 1.5,
    ciudades: [
      { nombre: "Fuerte Olimpo", lat: -21.04, lng: -57.88, peso: 0.4 },
      { nombre: "Puerto Casado", lat: -22.29, lng: -57.94, peso: 0.4 },
    ],
  },
];

export const nombresDepartamentos = departamentos.map((d) => d.nombre);

export function buscarDepartamento(nombre: string): Departamento | undefined {
  const n = normalizar(nombre);
  return departamentos.find((d) => normalizar(d.nombre) === n);
}

export const ciudades = departamentos.flatMap((d) =>
  d.ciudades.map((c) => ({ ...c, depto: d.nombre })),
);

/** Rutas troncales aproximadas (polilíneas) para estimar tráfico en el evaluador de sitios. */
export const rutas: { nombre: string; puntos: [number, number][] }[] = [
  {
    nombre: "PY02 Asunción – Ciudad del Este",
    puntos: [
      [-25.3, -57.55],
      [-25.39, -57.14],
      [-25.45, -56.44],
      [-25.47, -56.02],
      [-25.37, -55.7],
      [-25.48, -54.8],
      [-25.51, -54.66],
    ],
  },
  {
    nombre: "PY01 Asunción – Encarnación",
    puntos: [
      [-25.34, -57.6],
      [-25.62, -57.15],
      [-25.8, -57.24],
      [-26.67, -57.15],
      [-26.89, -57.03],
      [-27.17, -56.25],
      [-27.32, -55.87],
    ],
  },
  {
    nombre: "PY08 Coronel Oviedo – Caazapá",
    puntos: [
      [-25.45, -56.44],
      [-25.75, -56.43],
      [-26.2, -56.37],
    ],
  },
  {
    nombre: "PY06 Encarnación – Ciudad del Este",
    puntos: [
      [-27.32, -55.87],
      [-27.08, -55.65],
      [-26.52, -55.27],
      [-25.79, -55.09],
      [-25.51, -54.66],
    ],
  },
  {
    nombre: "PY03 Asunción – San Estanislao – Yby Yaú",
    puntos: [
      [-25.17, -57.49],
      [-25.06, -57.09],
      [-24.66, -56.44],
      [-24.18, -56.56],
      [-23.8, -56.52],
      [-22.97, -56.54],
    ],
  },
  {
    nombre: "PY05 Concepción – Pedro Juan Caballero",
    puntos: [
      [-23.41, -57.42],
      [-23.34, -57.06],
      [-22.97, -56.54],
      [-22.56, -55.75],
    ],
  },
  {
    nombre: "PY10 Curuguaty – Salto del Guairá",
    puntos: [
      [-24.66, -56.44],
      [-24.47, -55.69],
      [-24.23, -54.76],
      [-24.06, -54.33],
    ],
  },
  {
    nombre: "PY09 Transchaco",
    puntos: [
      [-25.1, -57.52],
      [-24.97, -57.57],
      [-23.49, -58.79],
      [-22.93, -59.49],
      [-22.35, -60.03],
      [-22.03, -60.62],
    ],
  },
];

export function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
