"use client";

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  ShoppingCart, Store, Phone, MapPin, Clock, ArrowRight, 
  MessageCircle, Smartphone, Bike, CheckCircle2, Shield, X, Download, Star
} from 'lucide-react';

export default function Home() {
  const [showPolicy, setShowPolicy] = useState(false);

  // --- VARIANTES DE ANIMACIÓN (TIPADAS) ---
  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
        opacity: 1, 
        y: 0, 
        transition: { type: "spring", stiffness: 50 } 
    }
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: { 
        opacity: 1, 
        transition: { staggerChildren: 0.2 } 
    }
  };

  const floating: Variants = {
    animate: {
      y: [0, -15, 0],
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF7] font-sans text-gray-900 selection:bg-orange-200 overflow-x-hidden relative flex flex-col">
      
      {/* --- FONDO AMBIENTAL MEJORADO --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[900px] h-[900px] bg-gradient-to-b from-orange-100/40 to-transparent rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-yellow-100/30 rounded-full blur-[150px]" />
      </div>

      {/* --- NAVBAR FLOTANTE --- */}
      <motion.nav 
        initial={{ y: -100 }} animate={{ y: 0 }} transition={{ type: "spring", stiffness: 50 }}
        className="fixed w-full z-50 top-0 left-0 px-4 py-6 flex justify-center"
      >
        <div className="w-full max-w-6xl flex justify-between items-center bg-white/80 backdrop-blur-xl border border-white/60 px-6 py-3 rounded-full shadow-xl shadow-gray-200/40">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 p-2 rounded-xl text-white shadow-md">
                <Store className="w-5 h-5"/>
            </div>
            <div>
                <span className="font-black text-lg tracking-tight text-gray-900 block leading-none">Bodega Jormard</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={() => setShowPolicy(true)} className="hidden md:flex text-xs font-bold text-gray-500 hover:text-orange-600 px-2 py-2 transition-colors">
               Seguridad
            </button>
            <Link href="/login">
                <motion.button 
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className="bg-gray-900 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-black transition-all shadow-md flex items-center gap-2"
                >
                Ingresar <ArrowRight className="w-4 h-4" />
                </motion.button>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* --- HERO SECTION (CENTRALIZADO Y EQUILIBRADO) --- */}
      <header className="relative w-full max-w-7xl mx-auto px-6 pt-32 pb-10 md:pt-40 md:pb-20 z-10 flex-grow flex items-center">
        <motion.div 
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
        >
          
          {/* COLUMNA IZQUIERDA: TEXTO */}
          <div className="text-center lg:text-left space-y-8">
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-green-100 shadow-sm text-green-700 text-xs font-black uppercase tracking-wider mx-auto lg:mx-0">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                ¡Ya estamos en Android! 🤖
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tighter text-gray-900">
                Tu bodega favorita, <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-500">ahora en tu bolsillo.</span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="text-lg md:text-xl text-gray-500 max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium">
                Pide abarrotes, bebidas y snacks al toque. Precios de tienda, comodidad de delivery. Paga con <b>Yape, Plin o Efectivo</b>.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center">
                <Link href="/login" className="w-full sm:w-auto">
                    <motion.button 
                        whileHover={{ scale: 1.05, boxShadow: "0 20px 30px -10px rgba(249, 115, 22, 0.3)" }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl font-bold text-lg transition-all shadow-xl shadow-orange-100 flex items-center justify-center gap-3"
                    >
                        <ShoppingCart className="w-5 h-5"/> Pedir Web
                    </motion.button>
                </Link>

                <motion.a 
                    href="#" 
                    whileHover={{ scale: 1.05, boxShadow: "0 10px 20px -5px rgba(0, 0, 0, 0.1)" }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full sm:w-auto px-6 py-3.5 bg-white text-gray-900 border border-gray-200 rounded-2xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-3 group"
                >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Google Play" className="h-8 group-hover:opacity-80 transition-opacity" />
                </motion.a>
            </motion.div>

            <motion.div variants={fadeInUp} className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-xs font-bold text-gray-400 uppercase tracking-widest">
                <span className="flex items-center gap-2"><div className="p-1 bg-green-100 rounded-full"><CheckCircle2 className="w-3 h-3 text-green-600"/></div> Delivery Rápido</span>
                <span className="flex items-center gap-2"><div className="p-1 bg-blue-100 rounded-full"><Shield className="w-3 h-3 text-blue-600"/></div> Compra Segura</span>
            </motion.div>
          </div>

          {/* COLUMNA DERECHA: CELULAR FLOTANTE (Centrado) */}
          <motion.div 
            variants={floating} 
            animate="animate"
            className="hidden lg:flex justify-center items-center relative"
          >
             {/* Círculo decorativo detrás del celular */}
             <div className="absolute w-[500px] h-[500px] bg-gradient-to-tr from-orange-200/50 to-pink-200/50 rounded-full blur-3xl -z-10 animate-pulse" />

             <div className="relative w-[300px] h-[600px] bg-gray-900 rounded-[3rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] border-[8px] border-gray-900 overflow-hidden ring-1 ring-gray-900/50">
                {/* Pantalla Simulada */}
                <div className="absolute inset-0 bg-white flex flex-col">
                    <div className="h-8 bg-gray-50 border-b flex items-center px-5 justify-between">
                        <span className="text-[10px] font-bold text-gray-500">9:41</span>
                        <div className="flex gap-1.5"><div className="w-10 h-3 bg-black rounded-full opacity-10"></div></div>
                    </div>
                    {/* Header App */}
                    <div className="px-5 pt-4 pb-2">
                        <div className="flex justify-between items-center mb-4">
                            <div className="w-8 h-8 bg-orange-100 rounded-full"></div>
                            <div className="w-8 h-8 bg-gray-100 rounded-full"></div>
                        </div>
                        <div className="h-24 w-full bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl mb-6 shadow-lg shadow-orange-200 p-4 flex flex-col justify-center">
                            <div className="w-16 h-2 bg-white/30 rounded mb-2"></div>
                            <div className="w-32 h-4 bg-white rounded"></div>
                        </div>
                        {/* Grid Productos */}
                        <div className="grid grid-cols-2 gap-3">
                            {[1,2,3,4].map(i => (
                                <div key={i} className="bg-white rounded-xl border border-gray-100 p-2 shadow-sm">
                                    <div className="h-20 bg-gray-50 rounded-lg mb-2"></div>
                                    <div className="h-2 w-16 bg-gray-200 rounded mb-1"></div>
                                    <div className="h-3 w-10 bg-orange-200 rounded"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* FAB */}
                    <div className="absolute bottom-5 right-5 bg-black text-white p-3.5 rounded-full shadow-xl">
                        <ShoppingCart size={20} />
                    </div>
                </div>
             </div>

             {/* Badge flotante de Calificación */}
             <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                className="absolute top-32 -right-0 lg:-right-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white"
             >
                 <div className="flex items-center gap-3">
                     <div className="bg-yellow-100 p-2 rounded-full"><Star className="w-5 h-5 text-yellow-600 fill-yellow-600"/></div>
                     <div>
                         <p className="font-black text-lg leading-none">4.9</p>
                         <p className="text-[10px] text-gray-400 font-bold uppercase">Calificación</p>
                     </div>
                 </div>
             </motion.div>
          </motion.div>

        </motion.div>
      </header>

      {/* --- SECCIÓN DESCARGA (Barra Inferior) --- */}
      <section className="bg-gray-900 text-white py-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
          <div className="max-w-6xl mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left flex items-center gap-4">
                  <div className="hidden md:flex bg-white/10 p-3 rounded-2xl"><Smartphone className="w-8 h-8 text-orange-400"/></div>
                  <div>
                    <h3 className="text-2xl font-bold mb-1">Descarga la App Oficial</h3>
                    <p className="text-gray-400 text-sm max-w-md">Ofertas exclusivas y seguimiento en tiempo real solo en la app.</p>
                  </div>
              </div>
              <button className="bg-white hover:bg-gray-100 text-gray-900 px-6 py-3 rounded-xl flex items-center gap-3 transition-all font-bold shadow-lg shadow-white/10 group">
                  <Download className="w-5 h-5 group-hover:scale-110 transition-transform"/> 
                  <span className="text-sm">Instalar desde Google Play</span>
              </button>
          </div>
      </section>

      {/* --- CÓMO FUNCIONA --- */}
      <section className="py-24 bg-white relative z-10">
        <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
                <span className="text-orange-600 font-bold text-xs uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full">Proceso Simple</span>
                <h3 className="text-4xl font-black text-gray-900 mt-3">Tu pedido en 3 pasos</h3>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {[
                    { icon: <Smartphone className="w-8 h-8"/>, title: "1. Pides", desc: "Elige tus productos en la Web o App.", color: "text-blue-600", bg: "bg-blue-50" },
                    { icon: <CheckCircle2 className="w-8 h-8"/>, title: "2. Confirmamos", desc: "Preparamos tu orden al instante.", color: "text-purple-600", bg: "bg-purple-50" },
                    { icon: <Bike className="w-8 h-8"/>, title: "3. Recibes", desc: "Te lo llevamos volando. Pagas al recibir.", color: "text-green-600", bg: "bg-green-50" }
                ].map((item, idx) => (
                    <motion.div 
                        key={idx}
                        whileHover={{ y: -5 }}
                        className="bg-gray-50/50 p-8 rounded-3xl border border-gray-100 hover:border-orange-100 hover:shadow-lg transition-all text-center group"
                    >
                        <div className={`w-16 h-16 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                            {item.icon}
                        </div>
                        <h3 className="font-bold text-xl mb-2 text-gray-900">{item.title}</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                    </motion.div>
                ))}
            </div>
        </div>
      </section>

      {/* --- FOOTER COMPACTO --- */}
      <footer className="py-12 px-6 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-gray-500">
           <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-gray-900"/>
                <span className="font-bold text-gray-900">Bodega Jormard</span>
           </div>
           
           <div className="flex gap-6">
              <span className="flex items-center gap-2"><MapPin className="w-4 h-4"/> Ferreñafe</span>
              <span className="flex items-center gap-2"><Phone className="w-4 h-4"/> 961 241 085</span>
           </div>

           <div className="flex gap-4">
              <button onClick={() => setShowPolicy(true)} className="hover:text-orange-600 transition-colors">Privacidad</button>
              <span>© 2026 Jormard</span>
           </div>
        </div>
      </footer>

      {/* --- BOTÓN FLOTANTE WHATSAPP --- */}
      <motion.a 
        href="https://wa.me/51961241085" 
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 right-6 bg-[#25D366] text-white p-3.5 rounded-full shadow-2xl shadow-green-200 z-50 flex items-center gap-2 group cursor-pointer border-4 border-white"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="font-bold text-sm hidden group-hover:block pr-1">WhatsApp</span>
      </motion.a>

      {/* --- MODAL DE POLÍTICAS DE PRIVACIDAD --- */}
      <AnimatePresence>
        {showPolicy && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setShowPolicy(false)}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                />
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 50 }} 
                    animate={{ scale: 1, opacity: 1, y: 0 }} 
                    exit={{ scale: 0.9, opacity: 0, y: 50 }}
                    className="bg-white w-full max-w-2xl max-h-[85vh] rounded-[2rem] shadow-2xl relative z-10 overflow-hidden flex flex-col border border-white/20"
                >
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <div className="bg-orange-100 p-2 rounded-xl text-orange-600"><Shield className="w-5 h-5"/></div>
                            <h2 className="text-lg font-black text-gray-900">Políticas de Privacidad</h2>
                        </div>
                        <button onClick={() => setShowPolicy(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500"/></button>
                    </div>
                    
                    <div className="p-8 overflow-y-auto custom-scrollbar space-y-6 text-gray-600 text-sm leading-relaxed bg-white">
                        <p className="bg-blue-50 p-4 rounded-xl text-blue-800 text-xs font-medium border border-blue-100">
                            <strong>Nota:</strong> Cumplimos con los estándares de seguridad de Google Play.
                        </p>
                        <section>
                            <h3 className="font-bold text-gray-900 mb-2">1. Información que recolectamos</h3>
                            <p>Solo lo necesario para tu pedido: Nombre, teléfono y dirección.</p>
                        </section>
                        <section>
                            <h3 className="font-bold text-gray-900 mb-2">2. Uso de datos</h3>
                            <p>Exclusivamente para gestionar entregas y mejorar el servicio. No compartimos datos con terceros.</p>
                        </section>
                        <section>
                            <h3 className="font-bold text-gray-900 mb-2">3. Eliminación</h3>
                            <p>Puedes pedir borrar tus datos escribiendo a soporte@bodegajormard.com.</p>
                        </section>
                    </div>

                    <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end">
                        <button onClick={() => setShowPolicy(false)} className="bg-gray-900 text-white font-bold py-2.5 px-6 rounded-xl hover:bg-black transition-colors text-sm">Cerrar</button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

    </div>
  );
}