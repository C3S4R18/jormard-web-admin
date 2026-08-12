"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, Transition, Variants } from "framer-motion";
import {
  ArrowRight,
  Bell,
  Bike,
  CheckCircle2,
  Download,
  Fingerprint,
  Heart,
  MapPin,
  MessageCircle,
  Mic,
  Package,
  Phone,
  ReceiptText,
  Search,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Smartphone,
  Truck,
  Wallet,
  X,
} from "lucide-react";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.jormard.bodega&pcampaignid=web_share";
const WHATSAPP_URL = "https://wa.me/51961241085";

// Categorías reales del catálogo, con el número de productos que hay en cada una.
const CATEGORIAS = [
  { nombre: "Abarrotes", cantidad: 116, emoji: "🛒" },
  { nombre: "Bebidas", cantidad: 99, emoji: "🥤" },
  { nombre: "Cuidado personal", cantidad: 77, emoji: "🧴" },
  { nombre: "Aseo y limpieza", cantidad: 65, emoji: "🧽" },
  { nombre: "Licores", cantidad: 64, emoji: "🍷" },
  { nombre: "Snacks", cantidad: 50, emoji: "🍿" },
  { nombre: "Galletas", cantidad: 45, emoji: "🍪" },
  { nombre: "Caramelos", cantidad: 40, emoji: "🍬" },
  { nombre: "Lácteos", cantidad: 27, emoji: "🥛" },
  { nombre: "Chocolates", cantidad: 23, emoji: "🍫" },
  { nombre: "Útiles escolares", cantidad: 20, emoji: "✏️" },
  { nombre: "Mascotas", cantidad: 11, emoji: "🐶" },
];

const FUNCIONES = [
  {
    icon: Package,
    titulo: "Sigue tu pedido en vivo",
    desc: "Recibido, pagado, preparando y enviado. Ves en qué va sin llamar a nadie.",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    icon: Bell,
    titulo: "Te avisamos de todo",
    desc: "Una campana con las ofertas nuevas y cada cambio de tu pedido, agrupado y sin ruido.",
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
  {
    icon: ReceiptText,
    titulo: "Comprobante en PDF",
    desc: "Descarga el detalle de cada compra o compártelo por WhatsApp cuando lo necesites.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: Mic,
    titulo: "Busca hablando",
    desc: "¿Con las manos ocupadas? Dile lo que necesitas y aparece en pantalla.",
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
  {
    icon: Fingerprint,
    titulo: "Entra con tu huella",
    desc: "Sin escribir contraseñas cada vez. Tu sesión queda lista y protegida.",
    color: "text-sky-600",
    bg: "bg-sky-50",
  },
  {
    icon: Heart,
    titulo: "Guarda tus favoritos",
    desc: "Lo que compras siempre, a un toque. Y puedes repetir un pedido anterior completo.",
    color: "text-fuchsia-600",
    bg: "bg-fuchsia-50",
  },
];

export default function Home() {
  const [showPolicy, setShowPolicy] = useState(false);

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut" } },
  };

  const staggerContainer: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
  };

  const floatingPhone: Variants = {
    animate: {
      y: [0, -14, 0],
      transition: { duration: 6, repeat: Infinity, ease: "easeInOut" },
    },
  };

  const springTransition: Transition = { type: "spring", stiffness: 220, damping: 20 };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#FDFBF7] text-slate-900">
      {/* ── Fondo ── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 right-[-10%] h-[36rem] w-[36rem] rounded-full bg-orange-300/25 blur-[150px]" />
        <div className="absolute bottom-[-15%] left-[-12%] h-[30rem] w-[30rem] rounded-full bg-amber-300/20 blur-[130px]" />
        <div className="absolute left-1/2 top-1/4 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-rose-300/10 blur-[130px]" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] [background-size:60px_60px]" />
      </div>

      {/* ── Navbar ── */}
      <motion.nav
        initial={{ y: -70, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed left-0 top-0 z-50 flex w-full justify-center px-4 py-4"
      >
        <div className="flex w-full max-w-6xl items-center justify-between rounded-full border border-white/70 bg-white/75 px-4 py-2.5 shadow-[0_12px_40px_rgba(15,23,42,0.07)] backdrop-blur-2xl md:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 p-2.5 text-white shadow-lg shadow-orange-300/40">
              <Store className="h-5 w-5" />
            </div>
            <div className="leading-none">
              <span className="block text-[17px] font-black tracking-tight text-slate-900">
                Bodega Jormard
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                Ferreñafe
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 md:gap-3">
            <a
              href="#catalogo"
              className="hidden rounded-full px-4 py-2 text-sm font-bold text-slate-500 transition hover:bg-orange-50 hover:text-orange-600 md:inline-flex"
            >
              Catálogo
            </a>
            <a
              href="#app"
              className="hidden rounded-full px-4 py-2 text-sm font-bold text-slate-500 transition hover:bg-orange-50 hover:text-orange-600 md:inline-flex"
            >
              La app
            </a>
            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition hover:bg-black"
              >
                Ingresar <ArrowRight className="h-4 w-4" />
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ── */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center px-6 pb-20 pt-32 md:pt-40">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid w-full items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]"
        >
          <div className="text-center lg:text-left">
            <motion.div
              variants={fadeInUp}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 shadow-sm backdrop-blur-md"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700">
                Repartimos en Ferreñafe
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-[2.75rem] font-black leading-[1.02] tracking-[-0.035em] text-slate-950 md:text-[4.25rem]"
            >
              Tu bodega de siempre,
              <span className="mt-2 block bg-gradient-to-r from-orange-500 via-red-500 to-rose-500 bg-clip-text text-transparent">
                ahora a un toque.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="mx-auto mt-6 max-w-xl text-base font-medium leading-8 text-slate-500 md:text-lg lg:mx-0"
            >
              Abarrotes, bebidas, snacks y limpieza con entrega a tu casa o
              recojo en tienda. Paga con{" "}
              <span className="font-extrabold text-slate-800">
                Yape, Plin o efectivo
              </span>
              .
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="mt-9 flex flex-col items-center gap-3 sm:flex-row lg:items-start lg:justify-start"
            >
              <Link href="/login" className="w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: "0 24px 45px rgba(249,115,22,0.28)" }}
                  whileTap={{ scale: 0.96 }}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 px-8 py-4 text-[17px] font-extrabold text-white shadow-2xl shadow-orange-300/30"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Empezar a pedir
                </motion.button>
              </Link>

              <motion.a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/70 bg-white/85 px-6 py-3.5 font-extrabold text-slate-900 shadow-xl shadow-slate-200/50 backdrop-blur-xl sm:w-auto"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
                  <Download className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    Descargar
                  </p>
                  <p className="text-sm font-black text-slate-900">App en Google Play</p>
                </div>
              </motion.a>
            </motion.div>

            {/* Datos reales, nada inventado */}
            <motion.div
              variants={fadeInUp}
              className="mt-11 grid grid-cols-3 gap-3 border-t border-slate-200/70 pt-7"
            >
              {[
                { valor: "686", label: "productos" },
                { valor: "30–45", label: "min de entrega" },
                { valor: "3", label: "formas de pago" },
              ].map((item) => (
                <div key={item.label} className="text-center lg:text-left">
                  <p className="text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
                    {item.valor}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {item.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── Mockup: refleja la app de verdad ── */}
          <motion.div
            variants={floatingPhone}
            animate="animate"
            className="relative hidden items-center justify-center lg:flex"
          >
            <div className="absolute h-[520px] w-[520px] rounded-full bg-gradient-to-tr from-orange-200/50 via-rose-200/40 to-amber-200/40 blur-3xl" />

            <div className="relative z-10 h-[620px] w-[300px] overflow-hidden rounded-[3.2rem] border-[9px] border-slate-950 bg-white shadow-[0_45px_90px_-20px_rgba(15,23,42,0.45)]">
              <div className="absolute left-1/2 top-2.5 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-slate-950" />

              {/* Cabecera de la tienda */}
              <div className="bg-white px-4 pb-3 pt-9">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400">Hola, César 👋</p>
                    <p className="text-[15px] font-black text-slate-900">¿Qué deseas hoy?</p>
                  </div>
                  <div className="relative rounded-xl bg-slate-50 p-2">
                    <Bell className="h-4 w-4 text-slate-700" />
                    <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[7px] font-black text-white ring-2 ring-white">
                      2
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
                  <Search className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[11px] font-medium text-slate-400">
                    Buscar bebidas, snacks…
                  </span>
                  <Mic className="ml-auto h-3.5 w-3.5 text-orange-500" />
                </div>
              </div>

              {/* Seguimiento del pedido */}
              <div className="px-4 pb-3">
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3">
                  <div className="mb-2.5 flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-900">Pedido #14</span>
                    <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[7px] font-black tracking-wide text-white">
                      EN CAMINO
                    </span>
                  </div>
                  <div className="flex items-center">
                    {["Recibido", "Pagado", "Preparando", "Enviado"].map((paso, i) => (
                      <div key={paso} className="flex flex-1 flex-col items-center">
                        <div className="flex w-full items-center">
                          <div className={`h-0.5 flex-1 ${i === 0 ? "bg-transparent" : "bg-indigo-500"}`} />
                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded-full ${
                              i <= 2 ? "bg-indigo-600" : "bg-slate-200"
                            }`}
                          >
                            <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                          </div>
                          <div className={`h-0.5 flex-1 ${i === 3 ? "bg-transparent" : i < 2 ? "bg-indigo-500" : "bg-slate-200"}`} />
                        </div>
                        <span className="mt-1 text-[6.5px] font-bold text-slate-500">{paso}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Productos */}
              <div className="px-4">
                <div className="mb-2 flex gap-1.5">
                  {["Todos", "Ofertas", "Bebidas"].map((c, i) => (
                    <div
                      key={c}
                      className={`rounded-full px-2.5 py-1 text-[9px] font-black ${
                        i === 0 ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {c}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { n: "Chocolatada Bonlé", p: "2.20", d: null },
                    { n: "Gaseosa Inka Kola", p: "3.50", d: "-15%" },
                    { n: "Galleta Soda Field", p: "1.20", d: null },
                    { n: "Atún Florida", p: "5.90", d: "-10%" },
                  ].map((prod) => (
                    <div key={prod.n} className="relative rounded-2xl border border-slate-100 bg-white p-2 shadow-sm">
                      {prod.d && (
                        <span className="absolute left-1.5 top-1.5 z-10 rounded-full bg-rose-500 px-1.5 py-0.5 text-[6.5px] font-black text-white">
                          {prod.d}
                        </span>
                      )}
                      <div className="mb-1.5 h-14 rounded-xl bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50" />
                      <p className="truncate text-[8.5px] font-bold text-slate-700">{prod.n}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-900">S/ {prod.p}</span>
                        <div className="rounded-full bg-slate-950 p-1 text-white">
                          <ShoppingCart className="h-2 w-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Barra inferior */}
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-5 rounded-full border border-white/80 bg-white/95 px-5 py-2.5 shadow-2xl backdrop-blur-xl">
                <Store className="h-4 w-4 text-orange-500" />
                <Heart className="h-4 w-4 text-slate-300" />
                <ShoppingBag className="h-4 w-4 text-slate-300" />
                <Bell className="h-4 w-4 text-slate-300" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </header>

      {/* ── Franja de confianza ── */}
      <section className="relative z-10 border-y border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto grid max-w-6xl gap-3 px-6 py-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Truck, title: "Delivery a domicilio", desc: "En 30 a 45 minutos" },
            { icon: Store, title: "O recoge en tienda", desc: "Te avisamos al estar listo" },
            { icon: Wallet, title: "Yape, Plin o efectivo", desc: "Paga como prefieras" },
            { icon: Shield, title: "Tus datos protegidos", desc: "Solo lo necesario del pedido" },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-3.5 rounded-2xl border border-white/70 bg-white/70 p-4">
              <div className="rounded-xl bg-gradient-to-br from-orange-100 to-rose-100 p-2.5 text-orange-600">
                <item.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[15px] font-black leading-tight text-slate-900">{item.title}</p>
                <p className="text-[13px] font-medium text-slate-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Catálogo ── */}
      <section id="catalogo" className="relative z-10 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <span className="inline-flex rounded-full bg-orange-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-orange-600">
              El catálogo
            </span>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
              686 productos, ordenados
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-slate-500">
              Lo mismo que encuentras en el mostrador, pero con buscador, ofertas
              del día y tus favoritos guardados.
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
          >
            {CATEGORIAS.map((cat) => (
              <motion.div
                key={cat.nombre}
                variants={fadeInUp}
                whileHover={{ y: -6 }}
                transition={springTransition}
                className="group cursor-default rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.05)]"
              >
                <span className="text-3xl">{cat.emoji}</span>
                <p className="mt-3 text-[15px] font-black leading-tight text-slate-900">
                  {cat.nombre}
                </p>
                <p className="mt-0.5 text-xs font-semibold text-slate-400">
                  {cat.cantidad} productos
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Qué puedes hacer ── */}
      <section id="app" className="relative z-10 bg-white/70 py-24 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <span className="inline-flex rounded-full bg-indigo-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600">
              En la app y en la web
            </span>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
              Todo lo que puedes hacer
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-slate-500">
              Las mismas funciones en el celular y en la computadora. Empieza en
              una y sigue en la otra.
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
          >
            {FUNCIONES.map((f) => (
              <motion.div
                key={f.titulo}
                variants={fadeInUp}
                whileHover={{ y: -8 }}
                transition={springTransition}
                className="rounded-[1.75rem] border border-slate-100 bg-white p-7 shadow-[0_18px_60px_rgba(15,23,42,0.06)]"
              >
                <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${f.bg} ${f.color}`}>
                  <f.icon className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-black tracking-tight text-slate-950">{f.titulo}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-500">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Cómo funciona ── */}
      <section className="relative z-10 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <span className="inline-flex rounded-full bg-emerald-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600">
              Cómo funciona
            </span>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
              Tu pedido en 3 pasos
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Smartphone,
                n: "01",
                title: "Arma tu pedido",
                desc: "Busca por nombre o por voz, mira las ofertas del día y ve agregando al carrito.",
              },
              {
                icon: CheckCircle2,
                n: "02",
                title: "Elige y confirma",
                desc: "Delivery a tu dirección o recojo en tienda. Paga con Yape, Plin o en efectivo.",
              },
              {
                icon: Bike,
                n: "03",
                title: "Sigue la entrega",
                desc: "Te avisamos en cada paso hasta que llegue a tu puerta. Y queda tu comprobante.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.6 }}
                className="relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-8 shadow-[0_18px_60px_rgba(15,23,42,0.06)]"
              >
                <span className="absolute -right-2 -top-5 text-[6rem] font-black leading-none text-slate-50">
                  {item.n}
                </span>
                <div className="relative">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-200">
                    <item.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-black tracking-tight text-slate-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-500">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Descarga ── */}
      <section className="relative z-10 overflow-hidden bg-slate-950 py-20 text-white">
        <div className="absolute inset-0 opacity-[0.18] [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:26px_26px]" />
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-orange-500/20 blur-[100px]" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center justify-between gap-10 px-6 md:flex-row">
          <div className="max-w-xl text-center md:text-left">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-orange-300">
              <Smartphone className="h-4 w-4" />
              App para Android
            </div>
            <h2 className="text-3xl font-black tracking-tight md:text-[2.75rem] md:leading-[1.1]">
              Descárgala y pide más rápido.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              Notificaciones cuando avanza tu pedido, entrada con huella y tus
              favoritos siempre a mano.
            </p>
          </div>

          <motion.a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="group flex shrink-0 items-center gap-4 rounded-2xl bg-white px-7 py-4 font-extrabold text-slate-950 shadow-2xl"
          >
            <Download className="h-6 w-6 text-orange-500 transition group-hover:scale-110" />
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Disponible en
              </p>
              <p className="text-base font-black">Google Play</p>
            </div>
          </motion.a>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-orange-500 via-red-500 to-rose-500 p-10 text-white shadow-[0_30px_90px_rgba(249,115,22,0.25)] md:p-14">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="max-w-xl text-center md:text-left">
              <h2 className="text-3xl font-black tracking-tight md:text-[2.6rem] md:leading-[1.1]">
                ¿Te falta algo en casa?
              </h2>
              <p className="mt-4 text-white/85 md:text-lg">
                Haz tu pedido ahora y te lo llevamos. O escríbenos por WhatsApp
                si prefieres coordinarlo directo.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link href="/login" className="w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  className="w-full rounded-2xl bg-white px-7 py-4 font-extrabold text-slate-950 shadow-2xl"
                >
                  Pedir ahora
                </motion.button>
              </Link>
              <motion.a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                className="w-full rounded-2xl border border-white/30 bg-white/10 px-7 py-4 text-center font-extrabold text-white backdrop-blur-xl sm:w-auto"
              >
                WhatsApp
              </motion.a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-slate-200/70 bg-white/85 px-6 py-10 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 p-2 text-white">
              <Store className="h-4 w-4" />
            </div>
            <div>
              <p className="font-black text-slate-950">Bodega Jormard</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                © 2026 · NeyraDev
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 text-sm font-semibold text-slate-500 md:flex-row md:gap-6">
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Ferreñafe, Lambayeque
            </span>
            <a href="tel:961241085" className="flex items-center gap-2 transition hover:text-orange-600">
              <Phone className="h-4 w-4" /> 961 241 085
            </a>
          </div>

          <button
            onClick={() => setShowPolicy(true)}
            className="text-sm font-semibold text-slate-500 transition hover:text-orange-600"
          >
            Políticas de privacidad
          </button>
        </div>
      </footer>

      {/* ── WhatsApp ── */}
      <motion.a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full border-4 border-white bg-[#25D366] px-4 py-3 text-white shadow-[0_20px_45px_rgba(37,211,102,0.35)]"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="hidden pr-1 text-sm font-bold md:block">WhatsApp</span>
      </motion.a>

      {/* ── Modal de privacidad ── */}
      <AnimatePresence>
        {showPolicy && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPolicy(false)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 32, scale: 0.96 }}
              transition={{ duration: 0.26 }}
              className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-[0_35px_100px_rgba(15,23,42,0.28)]"
            >
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-orange-100 p-2.5 text-orange-600">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-950">
                      Políticas de privacidad
                    </h2>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Qué datos usamos y para qué
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPolicy(false)}
                  className="rounded-full p-2 transition hover:bg-slate-100"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <div className="space-y-6 overflow-y-auto p-8 text-sm leading-7 text-slate-600">
                <section>
                  <h3 className="mb-2 text-base font-black text-slate-950">
                    1. Qué información pedimos
                  </h3>
                  <p>
                    Solo lo necesario para completar tu pedido: nombre, teléfono,
                    correo y la dirección de entrega. Si pagas con Yape o Plin,
                    guardamos la captura del pago que tú subes.
                  </p>
                </section>

                <section>
                  <h3 className="mb-2 text-base font-black text-slate-950">
                    2. Para qué la usamos
                  </h3>
                  <p>
                    Para preparar y entregar tus pedidos, avisarte cuando cambian
                    de estado y emitir tu comprobante. Nada más.
                  </p>
                </section>

                <section>
                  <h3 className="mb-2 text-base font-black text-slate-950">
                    3. Con quién la compartimos
                  </h3>
                  <p>
                    Con nadie. No vendemos ni cedemos tus datos a terceros.
                  </p>
                </section>

                <section>
                  <h3 className="mb-2 text-base font-black text-slate-950">
                    4. Cómo eliminar tus datos
                  </h3>
                  <p>
                    Escríbenos por{" "}
                    <a
                      href={WHATSAPP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-emerald-600 underline"
                    >
                      WhatsApp al 961 241 085
                    </a>{" "}
                    y borramos tu cuenta y tu historial de pedidos.
                  </p>
                </section>
              </div>

              <div className="flex justify-end border-t border-slate-100 bg-slate-50 p-5">
                <button
                  onClick={() => setShowPolicy(false)}
                  className="rounded-xl bg-slate-950 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-black"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
