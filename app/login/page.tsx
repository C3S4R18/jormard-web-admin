"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Store, ArrowRight, ArrowLeft, Loader2, AlertCircle, User, Phone, Mail, Lock, MailCheck, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  // Estado para saber si está en modo Login o Registro
  const [isRegister, setIsRegister] = useState(false);
  // Estado para mostrar la pantalla de éxito tras registro
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Campos del formulario
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (isRegister) {
        // --- LÓGICA DE REGISTRO ---
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${location.origin}/auth/callback`,
            data: {
              full_name: fullName,
              phone: phone,
            },
          },
        });

        if (error) throw error;
        
        // CORRECCIÓN: En lugar de alert, activamos la vista de éxito
        setShowSuccess(true); 
        setFullName('');
        setPhone('');
        setPassword('');

      } else {
        // --- LÓGICA DE LOGIN ---
        const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        });
        
        if (authError) throw new Error("Correo o contraseña incorrectos, o cuenta no verificada.");

        if (user) {
          const { data: perfil, error: profileError } = await supabase
            .from('perfiles')
            .select('rol')
            .eq('id', user.id)
            .single();

          if (profileError) {
            router.push('/cliente/catalogo');
            return;
          }

          if (perfil?.rol === 'admin') {
            router.push('/admin/dashboard');
          } else {
            router.push('/cliente/catalogo');
          }
        }
      }
    } catch (error: any) {
      setErrorMsg(error.message || "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50 relative px-4 font-sans overflow-hidden">
      
      {/* --- FONDO DECORATIVO --- */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-orange-200/40 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-red-200/40 rounded-full blur-[100px]" />

      {/* --- BOTÓN REGRESAR AL INICIO --- */}
      <Link 
        href="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 bg-white/80 backdrop-blur-sm hover:bg-white text-orange-700 px-4 py-2 rounded-full shadow-sm transition-all hover:shadow-md font-medium text-sm group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="hidden sm:inline">Regresar al inicio</span>
        <span className="sm:hidden">Inicio</span>
      </Link>

      {/* --- TARJETA PRINCIPAL --- */}
      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white border border-orange-100 p-8 rounded-3xl shadow-xl w-full max-w-md z-10 relative overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {showSuccess ? (
            // --- VISTA DE ÉXITO (MODERNA) ---
            <motion.div
              key="success-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-4"
            >
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-75"></div>
                  <div className="relative bg-green-100 p-4 rounded-full">
                    <MailCheck className="w-12 h-12 text-green-600" />
                  </div>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Correo Enviado!</h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Hemos enviado un enlace de confirmación a <span className="font-semibold text-gray-800">{email}</span>. 
                <br />Por favor, revísalo para activar tu cuenta.
              </p>

              <div className="space-y-3">
                <a 
                  href="https://mail.google.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full bg-red-50 text-red-600 hover:bg-red-100 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors border border-red-100"
                >
                  <Mail className="w-5 h-5" />
                  Abrir Gmail
                  <ExternalLink className="w-4 h-4 opacity-50" />
                </a>

                <button
                  onClick={() => {
                    setShowSuccess(false);
                    setIsRegister(false); // Volver al login
                    setEmail(''); // Limpiar para que escriban de nuevo al loguearse
                  }}
                  className="w-full bg-white text-gray-600 hover:bg-gray-50 font-semibold py-3.5 rounded-xl border border-gray-200 transition-colors"
                >
                  Volver al Inicio de Sesión
                </button>
              </div>
            </motion.div>

          ) : (
            // --- VISTA FORMULARIO (LOGIN / REGISTRO) ---
            <motion.div
              key="form-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Encabezado */}
              <div className="text-center mb-8">
                <div className="inline-block p-3 bg-orange-100 rounded-2xl mb-4 text-orange-600">
                  <Store className="w-8 h-8" />
                </div>
                <motion.h2 
                  key={isRegister ? "reg-title" : "log-title"}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl font-extrabold text-gray-900"
                >
                  {isRegister ? "Crear una Cuenta" : "¡Hola Vecino!"}
                </motion.h2>
                <motion.p 
                   key={isRegister ? "reg-sub" : "log-sub"}
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   className="text-gray-500 mt-2"
                >
                  {isRegister ? "Únete a Bodega Jormard" : "Ingresa para hacer tu pedido"}
                </motion.p>
              </div>

              {/* Mensaje de Error */}
              <AnimatePresence>
                {errorMsg && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-sm"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {errorMsg}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-4">
                
                <AnimatePresence mode='popLayout'>
                  {isRegister && (
                    <>
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }} 
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                      >
                        <label className="text-sm font-semibold text-gray-700 ml-1">Nombre Completo</label>
                        <div className="relative mt-1">
                          <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                          <input 
                            type="text" 
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all placeholder-gray-400"
                            placeholder="Ej. Juan Pérez"
                            required={isRegister}
                          />
                        </div>
                      </motion.div>

                      <motion.div 
                        initial={{ opacity: 0, x: -20 }} 
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: 0.1 }}
                      >
                        <label className="text-sm font-semibold text-gray-700 ml-1">Teléfono</label>
                        <div className="relative mt-1">
                          <Phone className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                          <input 
                            type="tel" 
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all placeholder-gray-400"
                            placeholder="Ej. 999 999 999"
                            required={isRegister}
                          />
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

                <div>
                  <label className="text-sm font-semibold text-gray-700 ml-1">Correo Electrónico</label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all placeholder-gray-400"
                      placeholder="usuario@ejemplo.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 ml-1">Contraseña</label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-gray-50 text-gray-900 border border-gray-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all placeholder-gray-400"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-6 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-200 flex items-center justify-center gap-2 hover:shadow-orange-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {isRegister ? "Registrarse Gratis" : "Ingresar"}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Footer del Toggle */}
              <div className="mt-6 text-center pt-6 border-t border-gray-100">
                <p className="text-gray-500 text-sm">
                  {isRegister ? "¿Ya tienes una cuenta?" : "¿Eres nuevo en el barrio?"}
                </p>
                <button 
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setErrorMsg(null);
                  }}
                  className="text-orange-600 font-bold text-sm hover:text-orange-700 transition-colors mt-1"
                >
                  {isRegister ? "Inicia Sesión aquí" : "Crea tu cuenta aquí"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}