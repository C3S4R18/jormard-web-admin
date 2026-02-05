"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Store, ArrowRight, ArrowLeft, Loader2, AlertCircle, User, Phone, Mail, Lock, MailCheck, ExternalLink, KeyRound, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

// Tipos de vista para manejar la navegación interna
type AuthView = 'login' | 'register' | 'forgot' | 'success_register' | 'success_reset';

export default function LoginPage() {
  // --- ESTADOS ---
  const [view, setView] = useState<AuthView>('login'); // Controla qué pantalla se ve
  
  // Campos del formulario
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // UI States
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{msg: string, type: 'error' | 'success'} | null>(null);
  
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // --- HANDLERS ---

  // 1. INICIAR SESIÓN
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);

    try {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw new Error("Correo o contraseña incorrectos.");

      if (user) {
        // Verificar rol
        const { data: perfil, error: profileError } = await supabase
          .from('perfiles')
          .select('rol')
          .eq('id', user.id)
          .single();

        if (profileError) {
          router.push('/cliente/catalogo');
        } else {
          router.push(perfil?.rol === 'admin' ? '/admin/dashboard' : '/cliente/catalogo');
        }
      }
    } catch (error: any) {
      setNotification({ msg: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 2. REGISTRO
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback`,
          data: { full_name: fullName, phone: phone },
        },
      });

      if (error) throw error;
      
      if (data.session) {
        router.push('/cliente/catalogo'); // Acceso directo si no requiere confirmación
      } else {
        setView('success_register'); // Mostrar pantalla de éxito
      }
    } catch (error: any) {
      setNotification({ msg: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 3. RECUPERAR CONTRASEÑA
  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);

    if (!email) {
        setNotification({ msg: "Ingresa tu correo para recuperar.", type: 'error' });
        setLoading(false);
        return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) throw error;
      
      setView('success_reset'); 

    } catch (error: any) {
      setNotification({ msg: error.message || "Error al enviar el correo.", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // --- RENDERIZADO ---

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF7ED] relative px-4 font-sans overflow-hidden selection:bg-orange-200">
      
      {/* --- FONDO MODERNO --- */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-gradient-to-br from-orange-300/30 to-red-300/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-gradient-to-tr from-yellow-200/40 to-orange-200/40 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
      </div>

      {/* --- BOTÓN REGRESAR --- */}
      <Link 
        href="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 bg-white/60 backdrop-blur-md hover:bg-white text-gray-700 px-5 py-2.5 rounded-2xl shadow-sm transition-all hover:shadow-md font-bold text-sm group border border-white/50"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Volver</span>
      </Link>

      {/* --- TARJETA PRINCIPAL (GLASSMORPHISM) --- */}
      <motion.div 
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-xl border border-white/60 p-8 sm:p-10 rounded-[2.5rem] shadow-2xl w-full max-w-[420px] z-10 relative overflow-hidden"
      >
        <AnimatePresence mode="wait">
          
          {/* VISTA 1: LOGIN */}
          {view === 'login' && (
            <motion.div key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{duration: 0.3}}>
              <div className="text-center mb-8">
                <div className="inline-flex p-4 bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl mb-5 shadow-lg shadow-orange-200 text-white transform rotate-3">
                  <Store className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">¡Hola de nuevo!</h2>
                <p className="text-gray-500 mt-2 font-medium">Ingresa a tu cuenta para pedir.</p>
              </div>

              {notification && (
                 <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold ${notification.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                    {notification.type === 'error' ? <AlertCircle className="w-5 h-5"/> : <CheckCircle2 className="w-5 h-5"/>}
                    {notification.msg}
                 </div>
              )}

              <form onSubmit={handleLogin} className="space-y-5">
                <InputGroup icon={<Mail/>} type="email" placeholder="tucorreo@ejemplo.com" value={email} onChange={setEmail} label="Correo Electrónico" />
                <div>
                   <div className="relative">
                      <InputGroup 
                          icon={<Lock/>} 
                          type={passwordVisible ? "text" : "password"} 
                          placeholder="••••••••" 
                          value={password} 
                          onChange={setPassword} 
                          label="Contraseña" 
                      />
                      {/* OJO ANIMADO */}
                      <button 
                        type="button"
                        onClick={() => setPasswordVisible(!passwordVisible)}
                        className="absolute right-4 top-[34px] text-gray-400 hover:text-orange-600 transition-colors focus:outline-none"
                      >
                          {passwordVisible ? (
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                          ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                          )}
                      </button>
                   </div>
                   <div className="flex justify-end mt-2">
                       <button type="button" onClick={() => setView('forgot')} className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline transition-colors">¿Olvidaste tu contraseña?</button>
                   </div>
                </div>

                <SubmitButton loading={loading} text="Ingresar" />
              </form>

              <div className="mt-8 text-center">
                <p className="text-gray-500 text-sm font-medium">¿Aún no tienes cuenta?</p>
                <button onClick={() => { setView('register'); setNotification(null); }} className="text-gray-900 font-black text-sm hover:text-orange-600 transition-colors mt-1">Regístrate Gratis</button>
              </div>
            </motion.div>
          )}

          {/* VISTA 2: REGISTRO */}
          {view === 'register' && (
            <motion.div key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{duration: 0.3}}>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Crear Cuenta</h2>
                <p className="text-gray-500 mt-2 font-medium">Únete a la familia Jormard.</p>
              </div>

              {notification && (
                 <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-sm font-bold">
                    <AlertCircle className="w-4 h-4" /> {notification.msg}
                 </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <InputGroup icon={<User/>} type="text" placeholder="Juan Pérez" value={fullName} onChange={setFullName} label="Nombre Completo" />
                <InputGroup icon={<Phone/>} type="tel" placeholder="999 999 999" value={phone} onChange={setPhone} label="Celular" />
                <InputGroup icon={<Mail/>} type="email" placeholder="tucorreo@ejemplo.com" value={email} onChange={setEmail} label="Correo" />
                
                {/* Password en Registro con Ojo */}
                <div className="relative">
                    <InputGroup 
                        icon={<Lock/>} 
                        type={passwordVisible ? "text" : "password"} 
                        placeholder="Crea una contraseña" 
                        value={password} 
                        onChange={setPassword} 
                        label="Contraseña" 
                    />
                    <button 
                        type="button"
                        onClick={() => setPasswordVisible(!passwordVisible)}
                        className="absolute right-4 top-[34px] text-gray-400 hover:text-orange-600 transition-colors focus:outline-none"
                    >
                        {passwordVisible ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                        )}
                    </button>
                </div>

                <SubmitButton loading={loading} text="Registrarme" />
              </form>

              <div className="mt-6 text-center">
                <button onClick={() => { setView('login'); setNotification(null); }} className="text-gray-500 font-bold text-sm hover:text-gray-900 transition-colors">Volver al Login</button>
              </div>
            </motion.div>
          )}

          {/* VISTA 3: RECUPERAR CONTRASEÑA */}
          {view === 'forgot' && (
            <motion.div key="forgot" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{duration: 0.3}}>
               <div className="text-center mb-8">
                <div className="inline-flex p-4 bg-blue-50 rounded-full mb-4 text-blue-600">
                  <KeyRound className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-gray-900">Recuperar Acceso</h2>
                <p className="text-gray-500 mt-2 text-sm leading-relaxed">No te preocupes. Escribe tu correo y te enviaremos un enlace mágico para volver a entrar.</p>
              </div>

              {notification && (
                 <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-sm font-bold">
                    <AlertCircle className="w-4 h-4" /> {notification.msg}
                 </div>
              )}

              <form onSubmit={handleRecover} className="space-y-6">
                <InputGroup icon={<Mail/>} type="email" placeholder="tucorreo@ejemplo.com" value={email} onChange={setEmail} label="Correo Electrónico" />
                <SubmitButton loading={loading} text="Enviar Enlace de Recuperación" />
              </form>

              <div className="mt-8 text-center">
                <button onClick={() => { setView('login'); setNotification(null); }} className="text-gray-500 font-bold text-sm hover:text-gray-900 transition-colors">Cancelar y volver</button>
              </div>
            </motion.div>
          )}

          {/* VISTA 4: ÉXITO REGISTRO */}
          {view === 'success_register' && (
             <SuccessScreen 
                title="¡Bienvenido!" 
                desc={`Hemos enviado un correo a ${email}. Por favor confirma tu cuenta para continuar.`}
                btnText="Volver al Login"
                onBtnClick={() => setView('login')}
             />
          )}

          {/* VISTA 5: ÉXITO RECUPERACIÓN */}
          {view === 'success_reset' && (
             <SuccessScreen 
                title="¡Correo Enviado!" 
                desc={`Revisa tu bandeja de entrada en ${email}. Te hemos enviado un enlace para restablecer tu contraseña.`}
                btnText="Entendido, volver"
                onBtnClick={() => setView('login')}
             />
          )}

        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// --- SUBCOMPONENTES REUTILIZABLES ---

// 1. Input Genérico con Estilo Moderno
const InputGroup = ({ icon, type, placeholder, value, onChange, label }: any) => (
    <div>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1 mb-1.5 block">{label}</label>
        <div className="relative group">
            <div className="absolute left-3 top-3.5 text-gray-400 group-focus-within:text-orange-500 transition-colors">{icon}</div>
            <input 
                type={type} 
                value={value} 
                onChange={(e) => onChange(e.target.value)} 
                className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 rounded-xl py-3 pl-10 pr-12 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all font-medium placeholder-gray-400"
                placeholder={placeholder}
                required
            />
        </div>
    </div>
);

// 2. Botón de Envío con Gradiente
const SubmitButton = ({ loading, text }: { loading: boolean, text: string }) => (
    <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        disabled={loading}
    >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{text} <ArrowRight className="w-5 h-5" /></>}
    </motion.button>
);

// 3. Pantalla de Éxito Genérica
const SuccessScreen = ({ title, desc, btnText, onBtnClick }: any) => (
    <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
        <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-75"></div>
            <div className="relative bg-green-100 p-5 rounded-full text-green-600"><MailCheck className="w-12 h-12" /></div>
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-500 mb-8 leading-relaxed font-medium">{desc}</p>
        
        <div className="space-y-3">
            <a href="https://mail.google.com/" target="_blank" className="w-full bg-red-50 text-red-600 hover:bg-red-100 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors border border-red-100">
                <Mail className="w-5 h-5" /> Abrir Gmail <ExternalLink className="w-4 h-4 opacity-50" />
            </a>
            <button onClick={onBtnClick} className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold py-3.5 rounded-xl transition-colors">
                {btnText}
            </button>
        </div>
    </motion.div>
);