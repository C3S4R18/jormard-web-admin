"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, Store, Phone, MapPin, Clock, ArrowRight, 
  MessageCircle, Smartphone, Bike, CheckCircle2 
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-orange-100">
      
      {/* --- NAVBAR SIMPLE --- */}
      <nav className="fixed w-full z-40 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 py-3">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 text-orange-600">
            <Store className="w-6 h-6"/>
            <span className="font-extrabold text-xl tracking-tight text-gray-900">Bodega Jormard</span>
          </div>
          <Link href="/login">
            <button className="bg-gray-900 text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-100">
              Entrar
            </button>
          </Link>
        </div>
      </nav>

      {/* --- HERO SECTION (Portada) --- */}
      <header className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider"
          >
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/> Abierto ahora
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight"
          >
            Tus compras del día, <br/>
            <span className="text-orange-600">sin salir de casa.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-lg text-gray-500 mb-10 max-w-xl mx-auto"
          >
            Abarrotes, bebidas y antojos al precio de siempre. 
            Pide desde tu celular y paga con Yape contra entrega.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/login" className="w-full sm:w-auto">
              <button className="w-full px-8 py-4 bg-orange-600 text-white rounded-xl font-bold text-lg hover:bg-orange-700 transition shadow-xl shadow-orange-200 flex items-center justify-center gap-2">
                <ShoppingCart className="w-5 h-5"/> Ver Productos
              </button>
            </Link>
          </motion.div>

        </div>
      </header>

      {/* --- CÓMO FUNCIONA (Súper simple) --- */}
      <section className="py-12 bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-3 gap-8">
           
           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-6 h-6"/>
              </div>
              <h3 className="font-bold text-lg mb-1">1. Tú pides</h3>
              <p className="text-sm text-gray-500">Elige tus productos en la web.</p>
           </div>

           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6"/>
              </div>
              <h3 className="font-bold text-lg mb-1">2. Tú confirmas</h3>
              <p className="text-sm text-gray-500">Paga con Yape o Plin rápido.</p>
           </div>

           <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bike className="w-6 h-6"/>
              </div>
              <h3 className="font-bold text-lg mb-1">3. Nosotros llevamos</h3>
              <p className="text-sm text-gray-500">Te lo dejamos en la puerta.</p>
           </div>

        </div>
      </section>

      {/* --- FOOTER SIMPLE --- */}
      <footer className="py-12 px-6 bg-white text-center">
        <div className="max-w-md mx-auto space-y-4">
           <h4 className="font-bold text-gray-900">Bodega Jormard</h4>
           <div className="flex flex-col gap-2 text-sm text-gray-500">
              <p className="flex items-center justify-center gap-2"><MapPin className="w-4 h-4"/> Av. Augusto B. Leguia 851 - Ferreñafe</p>
              <p className="flex items-center justify-center gap-2"><Phone className="w-4 h-4"/> +51 961 241 085</p>
              <p className="flex items-center justify-center gap-2"><Clock className="w-4 h-4"/> Lun-Dom: 7am - 11pm</p>
           </div>
           <p className="text-xs text-gray-400 pt-8">© 2026 Jormard & NeyraDev.</p>
        </div>
      </footer>

      {/* --- BOTÓN FLOTANTE WHATSAPP (Útil de verdad) --- */}
      <a 
        href="https://wa.me/51961241085" // Reemplaza con tu número real
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-lg shadow-green-200 hover:scale-110 transition-transform z-50 flex items-center gap-2"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="font-bold text-sm hidden md:block">¿Consultas?</span>
      </a>

    </div>
  );
}