import { Check, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import logo from "@/assets/petropar-logo.png";
import hub from "@/assets/hub-demo.asset.json";
import { ventasMensuales } from "@/lib/petropar-data";
import { presentationSlides } from "@/lib/presentation-data";

function Layout({ index, children, dark = false }: { index: number; children: ReactNode; dark?: boolean }) {
  return <section className={`slide-content reference-slide ${dark ? "slide-dark" : ""}`} aria-label={presentationSlides[index]?.title}>
    <header className="slide-header"><span className="slide-kicker">{index === 0 ? "Propuesta para el directorio" : `${String(index).padStart(2, "0")} — ${presentationSlides[index]?.chapter}`}</span><img src={logo} alt="Petropar" /></header>
    {children}
    <footer className="slide-footer"><span>Petropar · Centro de Decisiones</span><span>Octubre 2026 <span className="slide-page">{index + 1} / 6</span></span></footer>
  </section>;
}

function EvidenceChart({ cover = false }: { cover?: boolean }) {
  return <div className={cover ? "reference-cover-chart" : "reference-evidence-chart"}>
    <div className="slide-chart-heading"><span className="slide-kicker">Diésel · evolución mensual</span><span className="slide-chrome">Ene–Sep 2026 · ejemplo</span></div>
    <svg viewBox="0 0 850 370" role="img" aria-label="Ventas de diésel de ejemplo, enero a septiembre de 2026">
      <g className="slide-chart-grid">{[60,160,260].map(y => <line x1="40" x2="810" y1={y} y2={y} key={y} />)}</g>
      <polyline className="slide-chart-line" points={ventasMensuales.map((v,i) => `${40 + i * 96},${310 - (v.diesel - 100) * 4.5}`).join(" ")} />
      <text x="40" y="345">Ene</text><text x="410" y="345">May</text><text x="765" y="345">Sep</text>
    </svg>
  </div>;
}

function LetterList({ items }: { items: string[] }) {
  return <div className="reference-letter-list">{items.map((text, i) => <div key={text}><span className="slide-kicker">{String.fromCharCode(65+i)}</span><p className="slide-body">{text}</p></div>)}</div>;
}

export function PetroparSlide({ index }: { index: number }) {
  if (index === 0) return <Layout index={0} dark>
    <div className="reference-cover-copy"><p className="slide-kicker text-slide-accent">Centro de Decisiones Petropar</p><h1 className="slide-title-lg">Decidir con datos,<br /><span className="text-slide-accent">a tiempo.</span></h1><p className="slide-body-lg">Tres pasos para transformar información<br />en decisiones y una mejor atención.</p></div>
    <EvidenceChart cover />
    <div className="reference-cover-steps slide-caption"><span><b>01</b> Información a tiempo</span><span><b>02</b> Anticipar</span><span><b>03</b> Atender</span></div>
  </Layout>;
  if (index === 1) return <Layout index={1}>
    <h1 className="slide-title slide-heading">El dato no debería llegar<br />después de la decisión.</h1>
    <p className="reference-timeline-label slide-caption">Un recorrido que queremos simplificar · escenario ilustrativo</p>
    <div className="reference-timeline">{[
      ["Pedido", "El directorio necesita ventas o stock."],
      ["Aclaración", "¿Qué período, producto y canal?"],
      ["Preparación", "El equipo reúne y cruza la información."],
      ["Decisión", "La respuesta debe llegar con contexto."],
    ].map(([label, text]) => <div key={label}><p className="slide-kicker">{label}</p><span className="reference-timeline-dot" /><p className="slide-body">{text}</p></div>)}</div>
    <div className="reference-problem-close"><h2 className="slide-subtitle">El equipo trabaja.<br /><span className="text-slide-muted">La información debe fluir mejor.</span></h2><p className="slide-body">Objetivo: menos idas y vueltas.<br />Medir el tiempo real en el piloto.</p></div>
  </Layout>;
  if (index === 2) return <Layout index={2} dark>
    <h1 className="slide-title slide-heading">Tres pasos.<br />Se avanza de a uno.</h1>
    <p className="reference-step-intro slide-body">Cada paso se apoya en el anterior.<br />Se amplía cuando demuestra valor.</p>
    <div className="reference-step-grid">{[
      { n: "01", tag: "Empezamos aquí", title: "Información a tiempo", text: "Hub Analítico, pedidos claros y un equipo preparado para usar los datos." },
      { n: "02", tag: "Avanzado", title: "Anticipar", text: "Alertas, pronósticos y simulaciones para preparar decisiones." },
      { n: "03", tag: "Opcional", title: "Atender", text: "Un asistente para clientes y operadores, con información aprobada." },
    ].map(({n,tag,title,text}, i) => <div key={n} className={`reference-step reference-step-${i}`}><div className="reference-step-top"><b>{n}</b><span className="slide-kicker">{tag}</span></div><div><h2 className="slide-subtitle">{title}</h2><p className="slide-body">{text}</p></div></div>)}</div>
  </Layout>;
  if (index === 3) return <Layout index={3}>
    <div className="reference-left-copy"><h1 className="slide-title">Cada pedido llega<br />completo y listo<br />para trabajar.</h1><LetterList items={["Aclara período, producto y destinatario.", "Ordena el pedido por área y prioridad.", "Reutiliza reportes del Hub Analítico."]} /><h2 className="slide-subtitle text-slide-positive">Menos vueltas.<br />Más información útil.</h2></div>
    <div className="reference-request-panel"><p className="slide-kicker">Pedido entrante · ejemplo propuesto</p><div className="reference-bubble slide-body">Necesito ventas por canal para el directorio.</div><div className="reference-bubble reference-bubble-accent slide-body">¿Ventas netas o brutas? ¿De qué período?</div><div className="reference-bubble slide-body">Netas, de septiembre de 2026.</div><div className="reference-request-fields">{[["Métrica", "Ventas netas"],["Corte", "Por canal"],["Período", "Septiembre 2026"]].map(([label,value]) => <div key={label}><Check /><span className="slide-caption">{label}</span><b className="slide-caption">{value}</b></div>)}</div><div className="reference-hub-proof"><img src={hub.url} alt="Prototipo real del Hub Analítico Petropar" /><div><p className="slide-body">Hub Analítico</p><p className="slide-caption">Una solución del paso 1.<br />Prototipo con datos de ejemplo.</p></div></div></div>
  </Layout>;
  if (index === 4) return <Layout index={4} dark>
    <h1 className="slide-title slide-heading">Qué pasó, por qué<br />y qué podemos hacer.</h1>
    <div className="reference-anticipate"><div><EvidenceChart /><div className="reference-alert"><p className="slide-kicker">De observar a anticipar</p><p className="slide-body">Proyectar cobertura y detectar<br />riesgos antes de comprar.</p></div><p className="slide-caption text-slide-muted">Gráfico de ejemplo · capacidades predictivas propuestas.</p></div><div className="reference-summary"><p className="slide-kicker">Informe para el directorio · propuesta</p>{[
      ["01", "Abastecimiento", "Proyectar demanda y días de cobertura."],
      ["02", "Pérdidas y red", "Detectar anomalías y caídas de volumen."],
      ["03", "Opciones de decisión", "Simular compras e impacto de precios."],
    ].map(([n,title,text]) => <div key={n}><span className="slide-kicker">{n}</span><div><h2 className="slide-body-lg">{title}</h2><p className="slide-body">{text}</p></div></div>)}<p className="slide-caption">La IA prepara opciones.<br />El directorio mantiene la decisión.</p></div></div>
  </Layout>;
  return <Layout index={5}>
    <div className="reference-left-copy"><p className="slide-kicker text-slide-positive">Etapa opcional</p><h1 className="slide-title">Sus clientes reciben<br />respuesta a<br />cualquier hora.</h1><LetterList items={["Responde con información oficial aprobada.", "Deriva a una persona cuando corresponde.", "Convierte consultas en señales para mejorar."]} /><p className="slide-caption text-slide-muted">Se activa solo si el directorio lo decide.<br />Asistente propuesto, todavía no implementado.</p></div>
    <div className="reference-service-panel"><p className="slide-kicker">Atención · ejemplo de conversación</p><div className="reference-bubble reference-service-question slide-body">¿Dónde encuentro una estación Petropar?</div><div className="reference-bubble reference-service-answer slide-body">¿En qué ciudad estás? Buscaré en el listado oficial aprobado.</div><div className="reference-bubble reference-service-question slide-body">Necesito revisar un pedido de mi empresa.</div><div className="reference-bubble reference-service-answer slide-body">Esa consulta requiere al equipo comercial. Puedo preparar la derivación con tu contexto.</div><div className="reference-service-handoff slide-kicker">Derivación a una persona <ArrowRight /></div><p className="slide-caption text-slide-muted">Clientes · operadores · consultas comerciales</p></div>
  </Layout>;
}
