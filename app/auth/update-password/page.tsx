"use client";

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, Save, Loader2, CheckCircle2, AlertCircle, KeyRound, LogOut } from 'lucide-react';

export default function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{msg: string, type: 'error' | 'success'} | null>(null);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);

    try {
      // 1. Actualizar la contraseña en Supabase
      const { error } = await supabase.auth.updateUser({ password: password });

      if (error) throw error;

      // 2. Mensaje de éxito
      setNotification({ 
        msg: "Contraseña actualizada. Cerrando sesión...", 
        type: 'success' 
      });
      
      // 3. CERRAR SESIÓN y REDIRIGIR AL LOGIN
      // Esperamos 2 segundos para que el usuario lea el mensaje
      setTimeout(async () => {
        await supabase.auth.signOut(); // Cerramos la sesión actual
        router.push('/'); // Enviamos al Login para que ingrese con la nueva clave
      }, 2000);

    } catch (error: any) {
      setNotification({ msg: error.message, type: 'error' });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF7ED] px-4 font-sans relative overflow-hidden">
        
        {/* Decoración de fondo */}
        <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-gradient-to-br from-orange-300/30 to-red-300/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-gradient-to-tr from-yellow-200/40 to-orange-200/40 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/80 backdrop-blur-xl border border-white/60 p-8 sm:p-10 rounded-[2.5rem] shadow-2xl w-full max-w-[420px] z-10 relative"
        >
            <div className="text-center mb-8">
                <div className="inline-flex p-4 bg-blue-50 rounded-full mb-4 text-blue-600 shadow-sm border border-blue-100">
                    <KeyRound className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Nueva Contraseña</h2>
                <p className="text-gray-500 mt-2 text-sm font-medium">Crea una clave segura para tu cuenta.</p>
            </div>

            {notification && (
                <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold animate-in fade-in slide-in-from-top-2 ${notification.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                    {notification.type === 'error' ? <AlertCircle className="w-5 h-5 flex-shrink-0"/> : <CheckCircle2 className="w-5 h-5 flex-shrink-0"/>}
                    {notification.msg}
                </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1 mb-1.5 block">Define tu nueva clave</label>
                    <div className="relative group">
                        <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all font-medium placeholder-gray-400"
                            required
                            minLength={6}
                        />
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    disabled={loading || notification?.type === 'success'}
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Guardar y Salir <LogOut className="w-5 h-5" /></>}
                </motion.button>
            </form>
        </motion.div>
    </div>
  );
}