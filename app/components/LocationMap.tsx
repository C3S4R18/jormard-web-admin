"use client";

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Check, Loader2, Plus, Minus } from 'lucide-react';

// --- COMPONENTE INTERNO: CONTROLA EL MAPA Y BOTONES ---
function MapContent({ onCenterChange }: { onCenterChange: (lat: number, lng: number) => void }) {
  const map = useMap();
  const [loadingLoc, setLoadingLoc] = useState(false);

  // 1. Detectar movimiento para actualizar coordenadas del centro
  useMapEvents({
    move: () => {
      const center = map.getCenter();
      onCenterChange(center.lat, center.lng);
    },
    // Eliminamos 'moveend' forzado para evitar el rebote del zoom
  });

  // 2. Función de ubicarme (Ahora dentro del contexto del mapa)
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Tu dispositivo no soporta GPS");
      return;
    }
    setLoadingLoc(true);
    
    // Intento 1: Alta precisión
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.flyTo([pos.coords.latitude, pos.coords.longitude], 17, { duration: 1.5 });
        setLoadingLoc(false);
      },
      (err) => {
        console.warn("GPS preciso falló, usando aproximado...");
        // Intento 2: Baja precisión (Wifi)
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                map.flyTo([pos.coords.latitude, pos.coords.longitude], 15, { duration: 1.5 });
                setLoadingLoc(false);
            },
            () => {
                alert("No pudimos acceder a tu ubicación. Revisa los permisos de Windows/Mac.");
                setLoadingLoc(false);
            },
            { enableHighAccuracy: false, timeout: 10000 }
        );
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  return (
    <>
      {/* Botones de Zoom Manual (Opcionales, pero útiles) */}
      <div className="absolute bottom-24 right-4 z-[400] flex flex-col gap-2">
         <button onClick={() => map.zoomIn()} className="bg-white p-2 rounded-xl shadow-lg text-gray-700 hover:text-orange-600 border border-gray-100"><Plus className="w-5 h-5"/></button>
         <button onClick={() => map.zoomOut()} className="bg-white p-2 rounded-xl shadow-lg text-gray-700 hover:text-orange-600 border border-gray-100"><Minus className="w-5 h-5"/></button>
      </div>

      {/* Botón Mi Ubicación */}
      <button 
        onClick={handleLocateMe}
        disabled={loadingLoc}
        className="absolute bottom-6 right-4 z-[400] bg-white p-3 rounded-2xl shadow-xl border border-gray-100 text-gray-700 hover:text-orange-600 active:scale-90 transition-all disabled:opacity-50"
      >
        {loadingLoc ? <Loader2 className="w-6 h-6 animate-spin text-orange-600"/> : <Navigation className="w-6 h-6" />}
      </button>
    </>
  );
}

interface LocationMapProps {
  onConfirm: (lat: number, lng: number) => void;
  onCancel: () => void;
}

export default function LocationMap({ onConfirm, onCancel }: LocationMapProps) {
  // Coordenada inicial (Por defecto Lima)
  const defaultCenter = { lat: -12.046374, lng: -77.042793 };
  
  // Estado para guardar la coordenada final elegida
  const [selectedPos, setSelectedPos] = useState(defaultCenter);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  if (!isMounted) return <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center text-white">Cargando mapa...</div>;

  return (
    <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white w-full h-[85vh] sm:h-[600px] sm:max-w-xl sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl flex flex-col relative animate-in slide-in-from-bottom-10 duration-300">
        
        {/* Header */}
        <div className="absolute top-4 left-4 right-4 z-[400] flex justify-between items-center pointer-events-none">
           <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg pointer-events-auto">
              <h3 className="font-bold text-gray-800 text-sm">Arrastra el mapa</h3>
           </div>
           <button onClick={onCancel} className="bg-white/90 p-2 rounded-full shadow-lg text-gray-500 hover:text-red-500 pointer-events-auto transition">
              <Navigation className="w-5 h-5 rotate-180" />
           </button>
        </div>

        {/* Mapa */}
        <div className="flex-1 relative">
          <MapContainer 
            center={[defaultCenter.lat, defaultCenter.lng]} 
            zoom={13} 
            zoomControl={false}
            scrollWheelZoom={true} // Permite zoom con rueda del ratón
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; CartoDB'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            
            {/* Contenido interno (Eventos y Botones) */}
            <MapContent onCenterChange={(lat, lng) => setSelectedPos({ lat, lng })} />
            
          </MapContainer>

          {/* PIN FIJO EN EL CENTRO DE LA PANTALLA */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[400] pointer-events-none flex flex-col items-center pb-8">
             <div className="relative">
                <MapPin className="w-10 h-10 text-orange-600 fill-orange-600 drop-shadow-2xl animate-bounce" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-1 bg-black/30 blur-sm rounded-full"></div>
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-white border-t border-gray-100 z-[401]">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-orange-50 p-2 rounded-full">
              <MapPin className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase">Ubicación seleccionada</p>
              <p className="text-sm font-medium text-gray-600">{selectedPos.lat.toFixed(4)}, {selectedPos.lng.toFixed(4)}</p>
            </div>
          </div>
          <button 
            onClick={() => onConfirm(selectedPos.lat, selectedPos.lng)}
            className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200 active:scale-95 flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" /> Confirmar Ubicación
          </button>
        </div>
      </div>
    </div>
  );
}