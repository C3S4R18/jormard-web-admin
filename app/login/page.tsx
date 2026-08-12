"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import {
  ArrowRight, ArrowLeft, Loader2, AlertCircle, User, Phone, Mail, Lock,
  MailCheck, ExternalLink, KeyRound, CheckCircle2, Fingerprint, Store,
  Eye, EyeOff, Package, Wallet, Truck,
} from 'lucide-react';
import Link from 'next/link';
import { biometriaActiva, biometriaDisponible, entrarConBiometria, emailGuardado } from '../lib/biometric';

type AuthView = 'login' | 'register' | 'forgot' | 'success_register' | 'success_reset';

/** Fuerza de la contraseña: 0 a 4. Sirve para guiar, no para bloquear. */
function fuerzaPassword(pass: string) {
  if (!pass) return 0;
  let puntos = 0;
  if (pass.length >= 6) puntos++;
  if (pass.length >= 10) puntos++;
  if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) puntos++;
  if (/\d/.test(pass) || /[^A-Za-z0-9]/.test(pass)) puntos++;
  return Math.min(puntos, 4);
}

const NIVELES = [
  { txt: '', color: '' },
  { txt: 'Muy débil', color: 'bg-red-500' },
  { txt: 'Débil', color: 'bg-orange-500' },
  { txt: 'Buena', color: 'bg-yellow-500' },
  { txt: 'Fuerte', color: 'bg-emerald-500' },
];

export default function LoginPage() {
  const [view, setView] = useState<AuthView>('login');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [verPass, setVerPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ msg: string, type: 'error' | 'success' } | null>(null);

  const [huellaLista, setHuellaLista] = useState(false);
  const [huellaCargando, setHuellaCargando] = useState(false);
  const [correoHuella, setCorreoHuella] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fuerza = useMemo(() => fuerzaPassword(password), [password]);

  useEffect(() => {
    (async () => {
      if (biometriaActiva() && (await biometriaDisponible())) {
        setHuellaLista(true);
        setCorreoHuella(emailGuardado());
      }
    })();
  }, []);

  // ---- LÓGICA (sin cambios de comportamiento) ----

  const iniciarSesion = async (correo: string, clave: string) => {
    const { data: { user }, error } = await supabase.auth.signInWithPassword({ email: correo, password: clave });
    if (error) throw new Error("Correo o contraseña incorrectos.");
    if (user) {
      const { data: perfil, error: profileError } = await supabase
        .from('perfiles').select('rol').eq('id', user.id).single();
      if (profileError) router.push('/cliente/catalogo');
      else router.push(perfil?.rol === 'admin' ? '/admin/dashboard' : '/cliente/catalogo');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setNotification(null);
    try { await iniciarSesion(email, password); }
    catch (error: any) { setNotification({ msg: error.message, type: 'error' }); }
    finally { setLoading(false); }
  };

  const handleHuella = async () => {
    setHuellaCargando(true); setNotification(null);
    try {
      const cred = await entrarConBiometria();
      if (!cred) { setNotification({ msg: "No se pudo verificar tu huella.", type: 'error' }); return; }
      await iniciarSesion(cred.email, cred.password);
    } catch (error: any) {
      setNotification({ msg: error.message || "Error al entrar con huella.", type: 'error' });
    } finally { setHuellaCargando(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setNotification(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback`,
          data: { full_name: fullName, phone },
        },
      });
      if (error) throw error;
      if (data.session) router.push('/cliente/catalogo');
      else setView('success_register');
    } catch (error: any) {
      setNotification({ msg: error.message, type: 'error' });
    } finally { setLoading(false); }
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setNotification(null);
    if (!email) {
      setNotification({ msg: "Ingresa tu correo para recuperar.", type: 'error' });
      setLoading(false); return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setView('success_reset');
    } catch (error: any) {
      setNotification({ msg: error.message || "Error al enviar el correo.", type: 'error' });
    } finally { setLoading(false); }
  };

  const cambiarVista = (v: AuthView) => { setView(v); setNotification(null); };

  // ---- RENDER ----

  return (
    <div className="flex min-h-screen bg-white font-sans">

      {/* ══════════ PANEL DE MARCA (solo escritorio) ══════════ */}
      <aside className="relative hidden w-[46%] shrink-0 overflow-hidden bg-slate-950 lg:flex lg:flex-col">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-orange-500/25 blur-[110px]" />
        <div className="absolute -bottom-32 -right-20 h-[26rem] w-[26rem] rounded-full bg-rose-500/20 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.15] [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:26px_26px]" />

        <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
          <Link href="/" className="flex w-fit items-center gap-3 transition hover:opacity-80">
            <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 p-2.5 text-white shadow-lg shadow-orange-500/25">
              <Store className="h-5 w-5" />
            </div>
            <div className="leading-none">
              <span className="block text-[17px] font-black tracking-tight text-white">Bodega Jormard</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">Ferreñafe</span>
            </div>
          </Link>

          <div>
            <h2 className="max-w-md text-[2.6rem] font-black leading-[1.08] tracking-[-0.03em] text-white">
              Tu bodega de siempre,
              <span className="block bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent">
                ahora a un toque.
              </span>
            </h2>

            <div className="mt-10 space-y-5">
              {[
                { icon: Package, t: '686 productos', d: 'Abarrotes, bebidas, snacks y limpieza' },
                { icon: Truck, t: 'Delivery o recojo', d: 'A tu casa en 30 a 45 minutos' },
                { icon: Wallet, t: 'Yape, Plin o efectivo', d: 'Paga como te quede mejor' },
              ].map((item) => (
                <div key={item.t} className="flex items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-orange-400">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">{item.t}</p>
                    <p className="text-[13px] font-medium text-white/45">{item.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs font-medium text-white/30">© 2026 Bodega Jormard · NeyraDev</p>
        </div>
      </aside>

      {/* ══════════ PANEL DEL FORMULARIO ══════════ */}
      <main className="relative flex flex-1 flex-col">
        {/* Fondo suave solo en móvil */}
        <div className="pointer-events-none absolute inset-0 lg:hidden">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-200/40 blur-[90px]" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-rose-200/30 blur-[90px]" />
        </div>

        {/* Volver, solo móvil (en escritorio el logo del panel ya enlaza) */}
        <div className="relative z-10 p-6 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 transition hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
        </div>

        <div className="relative z-10 flex flex-1 items-center justify-center px-6 pb-12 lg:px-12">
          <div className="w-full max-w-[400px]">

            {/* Logo en móvil */}
            <Link href="/" className="mb-9 flex items-center justify-center gap-3 lg:hidden">
              <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 p-2.5 text-white shadow-lg shadow-orange-300/40">
                <Store className="h-5 w-5" />
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900">Bodega Jormard</span>
            </Link>

            <AnimatePresence mode="wait">

              {/* ─────── LOGIN ─────── */}
              {view === 'login' && (
                <motion.div key="login" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <h1 className="text-[2rem] font-black leading-tight tracking-tight text-slate-950">
                    Hola de nuevo 👋
                  </h1>
                  <p className="mt-2 font-medium text-slate-500">
                    Entra a tu cuenta para hacer tu pedido.
                  </p>

                  <Aviso notification={notification} />

                  <form onSubmit={handleLogin} className="mt-8 space-y-5">
                    <Campo icon={Mail} label="Correo electrónico" type="email" value={email} onChange={setEmail} placeholder="tucorreo@ejemplo.com" />

                    <div>
                      <CampoPassword label="Contraseña" value={password} onChange={setPassword} ver={verPass} setVer={setVerPass} placeholder="Tu contraseña" />
                      <div className="mt-2 flex justify-end">
                        <button type="button" onClick={() => cambiarVista('forgot')} className="text-xs font-bold text-orange-600 transition hover:text-orange-700 hover:underline">
                          ¿Olvidaste tu contraseña?
                        </button>
                      </div>
                    </div>

                    <BotonPrincipal loading={loading} texto="Ingresar" />
                  </form>

                  {huellaLista && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
                      <Separador />
                      <motion.button
                        type="button" onClick={handleHuella} disabled={huellaCargando}
                        whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.98 }}
                        className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-slate-200 bg-white py-3.5 font-black text-slate-900 transition hover:border-orange-300 hover:bg-orange-50/50 disabled:opacity-60"
                      >
                        {huellaCargando
                          ? <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                          : <span className="relative flex">
                              <span className="absolute inset-0 animate-ping rounded-full bg-orange-400/30" />
                              <Fingerprint className="relative h-5 w-5 text-orange-500" />
                            </span>}
                        Entrar con huella
                      </motion.button>
                      {correoHuella && <p className="mt-2 text-center text-xs font-medium text-slate-400">{correoHuella}</p>}
                    </motion.div>
                  )}

                  <p className="mt-9 text-center text-sm font-medium text-slate-500">
                    ¿Aún no tienes cuenta?{' '}
                    <button onClick={() => cambiarVista('register')} className="font-black text-slate-900 transition hover:text-orange-600">
                      Créala gratis
                    </button>
                  </p>
                </motion.div>
              )}

              {/* ─────── REGISTRO ─────── */}
              {view === 'register' && (
                <motion.div key="register" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <h1 className="text-[2rem] font-black leading-tight tracking-tight text-slate-950">
                    Crea tu cuenta
                  </h1>
                  <p className="mt-2 font-medium text-slate-500">
                    Un minuto y ya puedes pedir.
                  </p>

                  <Aviso notification={notification} />

                  <form onSubmit={handleRegister} className="mt-8 space-y-4">
                    <Campo icon={User} label="Nombre completo" type="text" value={fullName} onChange={setFullName} placeholder="Juan Pérez" />
                    <Campo icon={Phone} label="Celular" type="tel" value={phone} onChange={setPhone} placeholder="999 999 999" />
                    <Campo icon={Mail} label="Correo electrónico" type="email" value={email} onChange={setEmail} placeholder="tucorreo@ejemplo.com" />

                    <div>
                      <CampoPassword label="Contraseña" value={password} onChange={setPassword} ver={verPass} setVer={setVerPass} placeholder="Mínimo 6 caracteres" />
                      {password && (
                        <div className="mt-2.5">
                          <div className="flex gap-1.5">
                            {[1, 2, 3, 4].map(n => (
                              <div key={n} className={`h-1 flex-1 rounded-full transition-colors ${n <= fuerza ? NIVELES[fuerza].color : 'bg-slate-200'}`} />
                            ))}
                          </div>
                          <p className="mt-1.5 text-[11px] font-bold text-slate-400">
                            Seguridad: <span className="text-slate-600">{NIVELES[fuerza].txt}</span>
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      <BotonPrincipal loading={loading} texto="Crear mi cuenta" />
                    </div>
                  </form>

                  <p className="mt-7 text-center text-sm font-medium text-slate-500">
                    ¿Ya tienes cuenta?{' '}
                    <button onClick={() => cambiarVista('login')} className="font-black text-slate-900 transition hover:text-orange-600">
                      Inicia sesión
                    </button>
                  </p>
                </motion.div>
              )}

              {/* ─────── RECUPERAR ─────── */}
              {view === 'forgot' && (
                <motion.div key="forgot" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <KeyRound className="h-7 w-7" />
                  </div>
                  <h1 className="text-[2rem] font-black leading-tight tracking-tight text-slate-950">
                    Recuperar acceso
                  </h1>
                  <p className="mt-2 font-medium leading-relaxed text-slate-500">
                    Escribe tu correo y te enviamos un enlace para crear una contraseña nueva.
                  </p>

                  <Aviso notification={notification} />

                  <form onSubmit={handleRecover} className="mt-8 space-y-5">
                    <Campo icon={Mail} label="Correo electrónico" type="email" value={email} onChange={setEmail} placeholder="tucorreo@ejemplo.com" />
                    <BotonPrincipal loading={loading} texto="Enviar enlace" />
                  </form>

                  <button onClick={() => cambiarVista('login')} className="mt-7 flex w-full items-center justify-center gap-2 text-sm font-bold text-slate-400 transition hover:text-slate-900">
                    <ArrowLeft className="h-4 w-4" /> Volver a iniciar sesión
                  </button>
                </motion.div>
              )}

              {/* ─────── ÉXITOS ─────── */}
              {view === 'success_register' && (
                <PantallaExito
                  titulo="¡Ya casi!"
                  desc={`Enviamos un correo a ${email}. Confirma tu cuenta desde ahí y podrás entrar.`}
                  textoBtn="Volver a iniciar sesión"
                  onBtn={() => cambiarVista('login')}
                />
              )}

              {view === 'success_reset' && (
                <PantallaExito
                  titulo="Correo enviado"
                  desc={`Revisa tu bandeja en ${email}. Dentro está el enlace para poner una contraseña nueva.`}
                  textoBtn="Entendido, volver"
                  onBtn={() => cambiarVista('login')}
                />
              )}

            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// PIEZAS DEL FORMULARIO
// ══════════════════════════════════════════════════════════

const Campo = ({ icon: Icon, label, type, value, onChange, placeholder }: {
  icon: any; label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder: string;
}) => (
  <div>
    <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-400">{label}</label>
    <div className="group relative">
      <Icon className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-orange-500" />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/60 py-3.5 pl-12 pr-4 font-semibold text-slate-900 outline-none transition placeholder:font-medium placeholder:text-slate-300 focus:border-orange-400 focus:bg-white"
      />
    </div>
  </div>
);

const CampoPassword = ({ label, value, onChange, ver, setVer, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  ver: boolean; setVer: (v: boolean) => void; placeholder: string;
}) => (
  <div>
    <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-400">{label}</label>
    <div className="group relative">
      <Lock className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-orange-500" />
      <input
        type={ver ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/60 py-3.5 pl-12 pr-12 font-semibold text-slate-900 outline-none transition placeholder:font-medium placeholder:text-slate-300 focus:border-orange-400 focus:bg-white"
      />
      <button
        type="button"
        onClick={() => setVer(!ver)}
        aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-300 transition hover:bg-slate-100 hover:text-slate-600"
      >
        {ver ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
      </button>
    </div>
  </div>
);

const BotonPrincipal = ({ loading, texto }: { loading: boolean; texto: string }) => (
  <motion.button
    whileHover={{ scale: 1.015 }}
    whileTap={{ scale: 0.98 }}
    disabled={loading}
    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 py-4 font-black text-white shadow-xl shadow-slate-900/15 transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
  >
    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>{texto} <ArrowRight className="h-[18px] w-[18px]" /></>}
  </motion.button>
);

const Aviso = ({ notification }: { notification: { msg: string, type: 'error' | 'success' } | null }) => (
  <AnimatePresence>
    {notification && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="overflow-hidden"
      >
        <div className={`mt-6 flex items-start gap-3 rounded-2xl border p-4 text-sm font-bold ${
          notification.type === 'error'
            ? 'border-red-100 bg-red-50 text-red-600'
            : 'border-emerald-100 bg-emerald-50 text-emerald-600'
        }`}>
          {notification.type === 'error'
            ? <AlertCircle className="mt-0.5 h-[18px] w-[18px] shrink-0" />
            : <CheckCircle2 className="mt-0.5 h-[18px] w-[18px] shrink-0" />}
          <span className="leading-snug">{notification.msg}</span>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

const Separador = () => (
  <div className="mb-5 flex items-center gap-3">
    <div className="h-px flex-1 bg-slate-200" />
    <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">o</span>
    <div className="h-px flex-1 bg-slate-200" />
  </div>
);

const PantallaExito = ({ titulo, desc, textoBtn, onBtn }: {
  titulo: string; desc: string; textoBtn: string; onBtn: () => void;
}) => (
  <motion.div key="exito" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
    <div className="relative mx-auto mb-7 inline-block">
      <div className="absolute inset-0 animate-ping rounded-full bg-emerald-100 opacity-75" />
      <div className="relative rounded-full bg-emerald-50 p-5 text-emerald-600">
        <MailCheck className="h-11 w-11" />
      </div>
    </div>
    <h1 className="text-[1.75rem] font-black tracking-tight text-slate-950">{titulo}</h1>
    <p className="mx-auto mt-3 max-w-sm font-medium leading-relaxed text-slate-500">{desc}</p>

    <div className="mt-9 space-y-3">
      <a
        href="https://mail.google.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white py-3.5 font-black text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
      >
        <Mail className="h-[18px] w-[18px]" /> Abrir Gmail
        <ExternalLink className="h-4 w-4 opacity-40" />
      </a>
      <button
        onClick={onBtn}
        className="w-full rounded-2xl bg-slate-950 py-3.5 font-black text-white transition hover:bg-black"
      >
        {textoBtn}
      </button>
    </div>
  </motion.div>
);
