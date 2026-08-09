"use client";

import { useEffect, useState } from 'react';
import { use } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Loader2, ShoppingCart, Store, Zap } from 'lucide-react';

const PLAY_STORE = "https://play.google.com/store/apps/details?id=com.jormard.bodega";
const PACKAGE = "com.jormard.bodega";

interface Producto {
  id: number; nombre: string; precio: number; imagen_url: string; categoria: string;
  oferta_activa: boolean; precio_oferta?: number; stock: number;
}

/**
 * Página puente de un producto compartido.
 * - Si el visitante tiene la app: se abre directamente en ese producto.
 * - Si no la tiene: lo mandamos a Play Store para que la instale.
 * - En escritorio: mostramos el producto y el enlace a la tienda.
 */
export default function ProductoCompartido({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [producto, setProducto] = useState<Producto | null>(null);
  const [cargando, setCargando] = useState(true);
  const [esAndroid, setEsAndroid] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const android = /android/i.test(navigator.userAgent);
    setEsAndroid(android);

    // Trae el producto para mostrar una vista previa bonita
    (async () => {
      const { data } = await supabase.from('productos').select('*').eq('id', Number(id)).maybeSingle();
      if (data) setProducto(data as Producto);
      setCargando(false);
    })();

    // En Android intentamos abrir la app; si no está instalada, Chrome usa el fallback a Play Store
    if (android) {
      const t = setTimeout(() => {
        window.location.href =
          `intent://producto/${id}#Intent;scheme=jormard;package=${PACKAGE};` +
          `S.browser_fallback_url=${encodeURIComponent(PLAY_STORE)};end`;
      }, 900);
      return () => clearTimeout(t);
    }
  }, [id]);

  const enOferta = producto?.oferta_activa && producto?.precio_oferta;
  const precio = enOferta ? producto!.precio_oferta! : producto?.precio ?? 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-indigo-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">

          <div className="h-64 bg-slate-50 flex items-center justify-center relative">
            {cargando ? (
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            ) : producto?.imagen_url ? (
              <img src={producto.imagen_url} alt={producto.nombre} className="w-full h-full object-contain p-6" />
            ) : (
              <Store className="w-16 h-16 text-slate-200" />
            )}
            {enOferta && (
              <span className="absolute top-4 left-4 bg-gradient-to-r from-orange-500 to-rose-500 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-white" /> OFERTA
              </span>
            )}
          </div>

          <div className="p-7">
            {producto ? (
              <>
                <p className="text-[11px] font-black text-indigo-500 uppercase tracking-wider mb-1.5">{producto.categoria}</p>
                <h1 className="text-2xl font-black text-slate-900 leading-tight">{producto.nombre}</h1>
                <div className="flex items-end gap-3 mt-3">
                  <span className={`text-3xl font-black ${enOferta ? 'text-orange-600' : 'text-slate-900'}`}>
                    S/ {precio.toFixed(2)}
                  </span>
                  {enOferta && (
                    <span className="text-base text-slate-400 line-through mb-1">S/ {producto.precio.toFixed(2)}</span>
                  )}
                </div>
              </>
            ) : !cargando ? (
              <h1 className="text-xl font-black text-slate-900">Producto no disponible</h1>
            ) : null}

            <p className="text-sm text-slate-500 mt-5 leading-relaxed">
              {esAndroid
                ? "Abriendo la app de Bodega Jormard…"
                : "Descarga la app de Bodega Jormard para pedir este producto a tu casa."}
            </p>

            <a
              href={PLAY_STORE}
              className="mt-5 w-full py-4 rounded-2xl bg-slate-900 hover:bg-indigo-600 text-white font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-slate-200 transition active:scale-[0.98]"
            >
              <ShoppingCart className="w-5 h-5" /> Abrir en la app
            </a>

            <a href="/" className="mt-3 w-full py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition text-sm">
              Ir a la tienda web
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-5 font-medium">Bodega Jormard · Ferreñafe</p>
      </div>
    </main>
  );
}
