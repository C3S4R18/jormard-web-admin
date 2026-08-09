"use client";

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Wifi, WifiOff } from 'lucide-react';

/**
 * Registra el service worker, ofrece instalar la app y avisa cuando no hay internet.
 */
export default function PwaManager() {
  const [instalable, setInstalable] = useState<any>(null);
  const [mostrarBanner, setMostrarBanner] = useState(false);
  const [sinConexion, setSinConexion] = useState(false);

  useEffect(() => {
    // 1) Service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // 2) Aviso para instalar
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstalable(e);
      const pospuesto = localStorage.getItem('pwa_pospuesto');
      const yaInstalada = window.matchMedia('(display-mode: standalone)').matches;
      if (!pospuesto && !yaInstalada) setTimeout(() => setMostrarBanner(true), 8000);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);

    // 3) Estado de conexión
    const online = () => setSinConexion(false);
    const offline = () => setSinConexion(true);
    setSinConexion(!navigator.onLine);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, []);

  const instalar = async () => {
    if (!instalable) return;
    instalable.prompt();
    await instalable.userChoice;
    setInstalable(null);
    setMostrarBanner(false);
  };

  const posponer = () => {
    localStorage.setItem('pwa_pospuesto', '1');
    setMostrarBanner(false);
  };

  return (
    <>
      {/* Sin internet */}
      <AnimatePresence>
        {sinConexion && (
          <motion.div
            initial={{ y: -60 }} animate={{ y: 0 }} exit={{ y: -60 }}
            className="fixed top-0 left-0 right-0 z-[300] bg-slate-900 text-white py-2.5 px-4 flex items-center justify-center gap-2 text-sm font-bold shadow-lg"
          >
            <WifiOff className="w-4 h-4" /> Sin conexión — mostrando lo último guardado
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instalar app */}
      <AnimatePresence>
        {mostrarBanner && instalable && (
          <motion.div
            initial={{ y: 120, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 120, opacity: 0 }}
            transition={{ type: 'spring', damping: 22 }}
            className="fixed bottom-5 left-4 right-4 md:left-auto md:right-6 md:w-[380px] z-[250] bg-white rounded-[24px] shadow-2xl border border-slate-100 p-5"
          >
            <button onClick={posponer} className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-slate-100 text-slate-400">
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-4">
              <img src="/icon-192.png" alt="Jormard" className="w-14 h-14 rounded-2xl shadow-md flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-black text-slate-900 leading-tight">Instala Bodega Jormard</p>
                <p className="text-xs text-slate-500 mt-0.5">Ábrela como app, más rápido y sin navegador.</p>
              </div>
            </div>
            <button
              onClick={instalar}
              className="mt-4 w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-indigo-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-slate-200 transition active:scale-[0.98]"
            >
              <Download className="w-4 h-4" /> Instalar app
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
