"use client";

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Navigation, Check, Loader2, Plus, Minus, X, Search } from 'lucide-react';

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';

// La bodega está en Ferreñafe: el mapa arranca ahí, no en Lima.
const BODEGA = { lat: -6.639866, lng: -79.799463 };

interface LocationMapProps {
  onConfirm: (lat: number, lng: number, direccion?: string) => void;
  onCancel: () => void;
}

export default function LocationMap({ onConfirm, onCancel }: LocationMapProps) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<mapboxgl.Map | null>(null);

  const [pos, setPos] = useState(BODEGA);
  const [direccion, setDireccion] = useState('');
  const [buscandoDir, setBuscandoDir] = useState(false);
  const [ubicando, setUbicando] = useState(false);
  const [listo, setListo] = useState(false);

  // Buscador de direcciones
  const [consulta, setConsulta] = useState('');
  const [sugerencias, setSugerencias] = useState<any[]>([]);

  // ── Convierte coordenadas en una dirección legible ──
  const buscarDireccion = async (lat: number, lng: number) => {
    if (!TOKEN) return;
    setBuscandoDir(true);
    try {
      // Sin filtro de "types": en zonas rurales de Perú el filtro devuelve vacío.
      // Mapbox ya ordena del resultado más específico (calle) al más general (departamento).
      const r = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${TOKEN}&language=es`
      );
      const d = await r.json();
      setDireccion(d?.features?.[0]?.place_name ?? '');
    } catch {
      setDireccion('');
    } finally {
      setBuscandoDir(false);
    }
  };

  // ── Inicializa el mapa ──
  useEffect(() => {
    if (!contenedor.current || mapa.current || !TOKEN) return;
    mapboxgl.accessToken = TOKEN;

    const m = new mapboxgl.Map({
      container: contenedor.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [BODEGA.lng, BODEGA.lat],
      zoom: 15,
      attributionControl: false,
    });
    mapa.current = m;

    m.on('load', () => {
      setListo(true);
      buscarDireccion(BODEGA.lat, BODEGA.lng);
      // Marca de la bodega, como referencia
      const el = document.createElement('div');
      el.style.cssText = 'width:26px;height:26px;border-radius:50%;background:#0f172a;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px';
      el.textContent = '🏪';
      new mapboxgl.Marker(el).setLngLat([BODEGA.lng, BODEGA.lat])
        .setPopup(new mapboxgl.Popup({ offset: 18 }).setHTML('<b>Bodega Jormard</b>'))
        .addTo(m);
    });

    // El centro del mapa es la ubicación elegida
    m.on('move', () => {
      const c = m.getCenter();
      setPos({ lat: c.lat, lng: c.lng });
    });
    m.on('moveend', () => {
      const c = m.getCenter();
      buscarDireccion(c.lat, c.lng);
    });

    return () => { m.remove(); mapa.current = null; };
  }, []);

  // ── Mi ubicación ──
  const ubicarme = () => {
    if (!navigator.geolocation) return alert('Tu dispositivo no soporta GPS');
    setUbicando(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        mapa.current?.flyTo({ center: [p.coords.longitude, p.coords.latitude], zoom: 17, duration: 1500 });
        setUbicando(false);
      },
      () => {
        navigator.geolocation.getCurrentPosition(
          (p) => {
            mapa.current?.flyTo({ center: [p.coords.longitude, p.coords.latitude], zoom: 15, duration: 1500 });
            setUbicando(false);
          },
          () => { alert('No pudimos acceder a tu ubicación. Revisa los permisos.'); setUbicando(false); },
          { enableHighAccuracy: false, timeout: 10000 }
        );
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  // ── Buscador de direcciones ──
  useEffect(() => {
    if (consulta.trim().length < 3 || !TOKEN) { setSugerencias([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(consulta)}.json` +
          `?access_token=${TOKEN}&language=es&country=pe&limit=5&proximity=${BODEGA.lng},${BODEGA.lat}`
        );
        const d = await r.json();
        setSugerencias(d?.features ?? []);
      } catch { setSugerencias([]); }
    }, 350);
    return () => clearTimeout(t);
  }, [consulta]);

  const irA = (f: any) => {
    const [lng, lat] = f.center;
    mapa.current?.flyTo({ center: [lng, lat], zoom: 17, duration: 1200 });
    setConsulta(''); setSugerencias([]);
  };

  if (!TOKEN) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900/80 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-7 max-w-sm text-center">
          <p className="font-black text-slate-900">Mapa no disponible</p>
          <p className="text-sm text-slate-500 mt-2">Falta configurar la clave de Mapbox.</p>
          <button onClick={onCancel} className="mt-5 w-full py-3 rounded-xl bg-slate-900 text-white font-bold">Cerrar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white w-full h-[88vh] sm:h-[640px] sm:max-w-xl sm:rounded-[28px] rounded-t-[28px] overflow-hidden shadow-2xl flex flex-col relative">

        {/* Buscador + cerrar */}
        <div className="absolute top-4 left-4 right-4 z-[400] flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
              placeholder="Busca tu calle o referencia…"
              className="w-full bg-white/95 backdrop-blur shadow-lg rounded-2xl py-3 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-100"
            />
            {sugerencias.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
                {sugerencias.map((f) => (
                  <button key={f.id} onClick={() => irA(f)} className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700 leading-snug">{f.place_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={onCancel} className="bg-white/95 backdrop-blur w-11 h-11 rounded-2xl shadow-lg text-slate-500 hover:text-red-500 flex items-center justify-center transition flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mapa */}
        <div className="flex-1 relative">
          <div ref={contenedor} className="absolute inset-0" />

          {!listo && (
            <div className="absolute inset-0 bg-slate-50 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          )}

          {/* Pin fijo en el centro */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-[400] pointer-events-none flex flex-col items-center">
            <MapPin className="w-11 h-11 text-indigo-600 fill-indigo-600 drop-shadow-2xl" />
            <div className="w-3 h-1.5 bg-black/25 blur-[2px] rounded-full -mt-1" />
          </div>

          {/* Controles */}
          <div className="absolute bottom-5 right-4 z-[400] flex flex-col gap-2">
            <button onClick={() => mapa.current?.zoomIn()} className="bg-white w-10 h-10 rounded-xl shadow-lg text-slate-600 hover:text-indigo-600 flex items-center justify-center border border-slate-100"><Plus className="w-5 h-5" /></button>
            <button onClick={() => mapa.current?.zoomOut()} className="bg-white w-10 h-10 rounded-xl shadow-lg text-slate-600 hover:text-indigo-600 flex items-center justify-center border border-slate-100"><Minus className="w-5 h-5" /></button>
            <button onClick={ubicarme} disabled={ubicando} className="bg-white w-10 h-10 rounded-xl shadow-lg text-slate-600 hover:text-indigo-600 flex items-center justify-center border border-slate-100 disabled:opacity-50 mt-1">
              {ubicando ? <Loader2 className="w-5 h-5 animate-spin text-indigo-600" /> : <Navigation className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Footer con la dirección real */}
        <div className="p-5 bg-white border-t border-slate-100 z-[401]">
          <div className="flex items-start gap-3 mb-4">
            <div className="bg-indigo-50 p-2.5 rounded-2xl flex-shrink-0"><MapPin className="w-5 h-5 text-indigo-600" /></div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Entregar aquí</p>
              {buscandoDir ? (
                <p className="text-sm text-slate-400 font-medium mt-0.5">Buscando dirección…</p>
              ) : (
                <p className="text-sm font-bold text-slate-800 leading-snug mt-0.5 line-clamp-2">
                  {direccion || `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => onConfirm(pos.lat, pos.lng, direccion)}
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-indigo-600 transition-colors shadow-xl shadow-slate-200 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" /> Confirmar ubicación
          </button>
        </div>
      </div>
    </div>
  );
}
