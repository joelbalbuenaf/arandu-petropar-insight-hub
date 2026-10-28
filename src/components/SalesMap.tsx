/// <reference types="google.maps" />
import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { ventasGeograficas } from "@/lib/petropar-data";

declare global { interface Window { petroparMapReady?: () => void } }
let loader: Promise<void> | undefined;
function loadMaps() {
  if (loader) return loader;
  loader = new Promise<void>((resolve, reject) => {
    if (typeof google !== "undefined" && google.maps?.Map) { resolve(); return; }
    const key = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"];
    const channel = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"];
    if (!key) { reject(new Error("Google Maps no está configurado.")); return; }
    window.petroparMapReady = () => resolve();
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async&callback=petroparMapReady&channel=${encodeURIComponent(channel ?? "")}`;
    script.async = true;
    script.onerror = () => reject(new Error("No se pudo cargar Google Maps."));
    document.head.appendChild(script);
  });
  return loader;
}
export function SalesMap({ selected, onSelect }: { selected: string; onSelect: (depto: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let disposed = false;
    const markers: google.maps.Marker[] = [];
    // Do not expose credential-bearing preview hostnames through Google's requests.
    if (location.hostname.includes("-devserver-") || location.hostname === "localhost") { setError("El mapa se muestra en el sitio publicado autorizado."); return; }
    loadMaps().then(() => {
      if (disposed || !ref.current) return;
      const map = new google.maps.Map(ref.current, { center: { lat: -24.7, lng: -57.7 }, zoom: 6, clickableIcons: false, mapTypeControl: false, streetViewControl: false });
      const bounds = new google.maps.LatLngBounds();
      const info = new google.maps.InfoWindow();
      ventasGeograficas.filter(d => selected === "Todos" || d.depto === selected).forEach(d => {
        const marker = new google.maps.Marker({ map, position: { lat: d.lat, lng: d.lng }, title: `${d.depto}: ${d.litros} ML`, label: { text: String(d.litros) } });
        markers.push(marker); bounds.extend({ lat: d.lat, lng: d.lng });
        marker.addListener("click", () => {
          const content = document.createElement("div");
          content.textContent = `${d.depto} · ${d.litros} ML · Meta ${d.meta} ML · ${((d.litros / d.meta) * 100).toFixed(1)}%`;
          info.setContent(content); info.open({ map, anchor: marker }); onSelect(d.depto);
        });
      });
      if (markers.length > 1) map.fitBounds(bounds, 50);
      else { map.setCenter(bounds.getCenter()); map.setZoom(9); }
    }).catch(e => { if (!disposed) setError(e.message); });
    return () => { disposed = true; markers.forEach(m => { google.maps.event.clearInstanceListeners(m); m.setMap(null); }); };
  }, [selected, onSelect]);
  return <div className="relative h-[420px] overflow-hidden rounded-lg border bg-muted"><div ref={ref} className="h-full w-full" aria-label="Mapa de ventas por departamento" />{error && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground"><MapPin className="size-10" /><p>{error}</p><p className="text-xs">Siete departamentos · ubicaciones representativas · datos ficticios</p></div>}</div>;
}