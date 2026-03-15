"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, Transition, Variants } from "framer-motion";
import {
  ArrowRight,
  Bike,
  CheckCircle2,
  Clock3,
  Download,
  MapPin,
  MessageCircle,
  Phone,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
  Store,
  Smartphone,
  Truck,
  Wallet,
  X,
  Zap,
} from "lucide-react";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.jormard.bodega&pcampaignid=web_share";

export default function Home() {
  const [showPolicy, setShowPolicy] = useState(false);

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 32 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: "easeOut" },
    },
  };

  const staggerContainer: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  const floatingPhone: Variants = {
    animate: {
      y: [0, -12, 0],
      rotate: [0, -1, 0],
      transition: {
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const badgeFloat: Variants = {
    animate: {
      y: [0, -8, 0],
      transition: {
        duration: 3.4,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const springTransition: Transition = {
    type: "spring",
    stiffness: 220,
    damping: 18,
  };

  const cardHover = {
    whileHover: { y: -8, scale: 1.015 },
    transition: springTransition,
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#fffaf5] text-slate-900">
      {/* Fondo premium */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.12),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(244,63,94,0.10),transparent_22%),radial-gradient(circle_at_20%_85%,rgba(250,204,21,0.08),transparent_25%)]" />
        <div className="absolute -top-32 right-[-8%] h-[34rem] w-[34rem] rounded-full bg-orange-300/20 blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[-10%] h-[28rem] w-[28rem] rounded-full bg-yellow-300/20 blur-[120px]" />
        <div className="absolute left-1/2 top-1/3 h-[22rem] w-[22rem] -translate-x-1/2 rounded-full bg-rose-300/10 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] [background-size:56px_56px]" />
      </div>

      {/* Navbar */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="fixed left-0 top-0 z-50 flex w-full justify-center px-4 py-5"
      >
        <div className="flex w-full max-w-7xl items-center justify-between rounded-full border border-white/70 bg-white/70 px-4 py-3 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur-2xl md:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 p-2.5 text-white shadow-lg shadow-orange-300/40">
              <Store className="h-5 w-5" />
            </div>

            <div className="leading-none">
              <span className="block text-lg font-black tracking-tight text-slate-900">
                Bodega Jormard
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Delivery App
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => setShowPolicy(true)}
              className="hidden rounded-full px-4 py-2 text-sm font-bold text-slate-500 transition hover:bg-orange-50 hover:text-orange-600 md:inline-flex"
            >
              Seguridad
            </button>

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

      {/* Hero */}
      <header className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center px-6 pb-16 pt-32 md:pt-36">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid w-full items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]"
        >
          {/* Texto */}
          <div className="text-center lg:text-left">
            <motion.div
              variants={fadeInUp}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-200 bg-white/80 px-4 py-2 shadow-sm backdrop-blur-md"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
              </span>
              <span className="text-xs font-black uppercase tracking-[0.22em] text-green-700">
                Ya disponible en Google Play
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.04em] text-slate-950 md:text-7xl"
            >
              Tu bodega favorita,
              <span className="mt-2 block bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent">
                ahora más rápida, elegante y premium.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="mx-auto mt-6 max-w-2xl text-base font-medium leading-8 text-slate-500 md:text-xl lg:mx-0"
            >
              Pide abarrotes, bebidas y snacks con una experiencia visual moderna.
              Compra desde la web o la app y paga con{" "}
              <span className="font-extrabold text-slate-800">
                Yape, Plin o efectivo
              </span>
              .
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="mt-8 flex flex-col items-center gap-4 sm:flex-row lg:items-start lg:justify-start"
            >
              <Link href="/login" className="w-full sm:w-auto">
                <motion.button
                  whileHover={{
                    scale: 1.03,
                    boxShadow: "0 24px 45px rgba(249,115,22,0.28)",
                  }}
                  whileTap={{ scale: 0.96 }}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 px-8 py-4 text-lg font-extrabold text-white shadow-2xl shadow-orange-300/30"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Pedir por la web
                </motion.button>
              </Link>

              <motion.a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/70 bg-white/85 px-6 py-4 text-sm font-extrabold text-slate-900 shadow-xl shadow-slate-200/50 backdrop-blur-xl sm:w-auto"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 via-cyan-400 to-blue-500 text-white shadow-md">
                  <Download className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Descargar
                  </p>
                  <p className="text-sm font-black text-slate-900">
                    App en Google Play
                  </p>
                </div>
              </motion.a>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
            >
              {[
                {
                  icon: <Truck className="h-4 w-4" />,
                  label: "Delivery rápido",
                  bg: "bg-green-50",
                  color: "text-green-700",
                },
                {
                  icon: <Shield className="h-4 w-4" />,
                  label: "Compra segura",
                  bg: "bg-blue-50",
                  color: "text-blue-700",
                },
                {
                  icon: <Wallet className="h-4 w-4" />,
                  label: "Pagos simples",
                  bg: "bg-orange-50",
                  color: "text-orange-700",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-2 rounded-full border border-white/60 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] shadow-sm backdrop-blur-md ${item.bg} ${item.color}`}
                >
                  {item.icon}
                  {item.label}
                </div>
              ))}
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3"
            >
              {[
                { value: "15 min", label: "Entrega promedio" },
                { value: "4.9★", label: "Calificación" },
                { value: "24/7", label: "Pedidos por WhatsApp" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-3xl border border-white/60 bg-white/70 p-5 shadow-[0_10px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl"
                >
                  <p className="text-2xl font-black tracking-tight text-slate-950">
                    {item.value}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {item.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Mockup */}
          <motion.div
            variants={floatingPhone}
            animate="animate"
            className="relative hidden items-center justify-center lg:flex"
          >
            <div className="absolute h-[540px] w-[540px] rounded-full bg-gradient-to-tr from-orange-200/50 via-pink-200/40 to-yellow-200/40 blur-3xl" />

            <motion.div
              variants={badgeFloat}
              animate="animate"
              className="absolute left-0 top-16 z-20 rounded-3xl border border-white/80 bg-white/80 p-4 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-orange-100 p-3 text-orange-600">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">
                    Pedido instantáneo
                  </p>
                  <p className="text-xs font-semibold text-slate-500">
                    Confirmación rápida
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={badgeFloat}
              animate="animate"
              transition={{ delay: 0.8 }}
              className="absolute -right-3 top-32 z-20 rounded-3xl border border-white/80 bg-white/85 p-4 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-yellow-100 p-3 text-yellow-600">
                  <Star className="h-5 w-5 fill-yellow-500" />
                </div>
                <div>
                  <p className="text-lg font-black leading-none text-slate-950">
                    4.9
                  </p>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    Rating
                  </p>
                </div>
              </div>
            </motion.div>

            <div className="relative z-10 h-[640px] w-[320px] overflow-hidden rounded-[3.4rem] border-[10px] border-slate-950 bg-slate-950 shadow-[0_45px_90px_-20px_rgba(15,23,42,0.45)]">
              <div className="absolute left-1/2 top-3 h-6 w-28 -translate-x-1/2 rounded-full bg-slate-900" />

              <div className="h-full w-full bg-[linear-gradient(180deg,#ffffff_0%,#fffaf5_100%)]">
                <div className="flex items-center justify-between px-5 pb-2 pt-4 text-[11px] font-black text-slate-500">
                  <span>9:41</span>
                  <span>5G • 100%</span>
                </div>

                <div className="px-4 pb-5">
                  <div className="mb-4 rounded-[1.8rem] bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 p-5 text-white shadow-xl shadow-orange-200">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="rounded-2xl bg-white/20 p-2">
                        <Store className="h-5 w-5" />
                      </div>
                      <div className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]">
                        Promo
                      </div>
                    </div>

                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">
                      Bodega Jormard
                    </p>
                    <h3 className="mt-1 text-2xl font-black leading-tight">
                      Compra fácil,
                      <br />
                      recibe rápido.
                    </h3>
                  </div>

                  <div className="mb-4 flex items-center gap-2 overflow-hidden rounded-2xl border border-orange-100 bg-white px-4 py-3 shadow-sm">
                    <ShoppingBag className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-semibold text-slate-400">
                      Busca tus productos...
                    </span>
                  </div>

                  <div className="mb-4 flex gap-2">
                    {["Ofertas", "Bebidas", "Snacks"].map((item, i) => (
                      <div
                        key={item}
                        className={`rounded-full px-4 py-2 text-xs font-black ${
                          i === 0
                            ? "bg-slate-950 text-white"
                            : "bg-white text-slate-600 shadow-sm"
                        }`}
                      >
                        {item}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((item) => (
                      <div
                        key={item}
                        className="rounded-3xl border border-slate-100 bg-white p-3 shadow-sm"
                      >
                        <div className="mb-3 h-24 rounded-2xl bg-gradient-to-br from-orange-100 via-rose-50 to-yellow-100" />
                        <div className="mb-2 h-3 w-20 rounded-full bg-slate-200" />
                        <div className="mb-3 h-2 w-14 rounded-full bg-slate-100" />
                        <div className="flex items-center justify-between">
                          <div className="h-4 w-10 rounded-full bg-orange-300" />
                          <div className="rounded-full bg-slate-950 p-2 text-white">
                            <ShoppingCart className="h-3 w-3" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-6 rounded-full border border-white/80 bg-white/90 px-6 py-3 shadow-2xl backdrop-blur-xl">
                  <Store className="h-5 w-5 text-orange-500" />
                  <ShoppingCart className="h-5 w-5 text-slate-800" />
                  <Phone className="h-5 w-5 text-slate-800" />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </header>

      {/* Barra premium */}
      <section className="relative z-10 border-y border-white/50 bg-white/65 backdrop-blur-xl">
        <div className="mx-auto grid max-w-7xl gap-4 px-6 py-6 md:grid-cols-4">
          {[
            {
              icon: <Clock3 className="h-5 w-5" />,
              title: "Entrega veloz",
              desc: "Pedidos listos en minutos",
            },
            {
              icon: <Shield className="h-5 w-5" />,
              title: "Mayor confianza",
              desc: "Tus datos protegidos",
            },
            {
              icon: <Wallet className="h-5 w-5" />,
              title: "Pagos fáciles",
              desc: "Yape, Plin y efectivo",
            },
            {
              icon: <Sparkles className="h-5 w-5" />,
              title: "Experiencia premium",
              desc: "Diseño elegante y moderno",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-4 rounded-3xl border border-white/70 bg-white/70 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.05)]"
            >
              <div className="rounded-2xl bg-gradient-to-br from-orange-100 to-rose-100 p-3 text-orange-600">
                {item.icon}
              </div>
              <div>
                <p className="font-black text-slate-900">{item.title}</p>
                <p className="text-sm font-medium text-slate-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* App download */}
      <section
        id="descarga"
        className="relative z-10 overflow-hidden bg-slate-950 py-20 text-white"
      >
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-6 md:flex-row">
          <div className="max-w-2xl text-center md:text-left">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.25em] text-orange-300">
              <Smartphone className="h-4 w-4" />
              App oficial
            </div>
            <h2 className="text-3xl font-black tracking-tight md:text-5xl">
              Descarga la app y compra más rápido.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-300 md:text-lg">
              Accede a promociones, seguimiento de pedidos y una experiencia
              mucho más fluida desde tu celular.
            </p>
          </div>

          <motion.a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{
              scale: 1.04,
              boxShadow: "0 20px 45px rgba(255,255,255,0.12)",
            }}
            whileTap={{ scale: 0.96 }}
            className="group flex items-center gap-3 rounded-2xl bg-white px-7 py-4 font-extrabold text-slate-950 shadow-2xl"
          >
            <Download className="h-5 w-5 text-orange-500 transition group-hover:scale-110" />
            Instalar desde Google Play
          </motion.a>
        </div>
      </section>

      {/* Pasos */}
      <section className="relative z-10 bg-white/70 py-24 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <span className="inline-flex rounded-full bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-orange-600">
              Cómo funciona
            </span>
            <h3 className="mt-4 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
              Tu pedido en 3 pasos
            </h3>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-500 md:text-lg">
              Un flujo rápido, claro y visual para que todo se sienta moderno.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: <Smartphone className="h-8 w-8" />,
                title: "1. Explora",
                desc: "Navega productos con una experiencia más limpia, visual y rápida.",
                bg: "from-blue-50 to-cyan-50",
                color: "text-blue-600",
              },
              {
                icon: <CheckCircle2 className="h-8 w-8" />,
                title: "2. Confirma",
                desc: "Selecciona tu pedido y valida tus datos de forma sencilla.",
                bg: "from-violet-50 to-fuchsia-50",
                color: "text-violet-600",
              },
              {
                icon: <Bike className="h-8 w-8" />,
                title: "3. Recibe",
                desc: "Te llevamos la compra hasta tu ubicación con mayor comodidad.",
                bg: "from-green-50 to-emerald-50",
                color: "text-green-600",
              },
            ].map((item) => (
              <motion.div
                key={item.title}
                whileHover={cardHover.whileHover}
                transition={cardHover.transition}
                className="group relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-8 shadow-[0_18px_60px_rgba(15,23,42,0.06)]"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500" />
                <div
                  className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${item.bg} ${item.color} transition group-hover:scale-110`}
                >
                  {item.icon}
                </div>
                <h4 className="text-2xl font-black tracking-tight text-slate-950">
                  {item.title}
                </h4>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="relative z-10 px-6 py-24">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] border border-white/60 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 p-10 text-white shadow-[0_30px_90px_rgba(249,115,22,0.25)] md:p-14">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="max-w-2xl text-center md:text-left">
              <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.22em]">
                Bodega Jormard
              </span>
              <h3 className="mt-4 text-3xl font-black tracking-tight md:text-5xl">
                Pide fácil. Pide rápido. Pide premium.
              </h3>
              <p className="mt-4 text-white/85 md:text-lg">
                Una landing más visual, más animada y con mejor presencia para tu
                app y tu negocio.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/login">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  className="rounded-2xl bg-white px-7 py-4 font-extrabold text-slate-950 shadow-2xl"
                >
                  Entrar al sistema
                </motion.button>
              </Link>

              <motion.a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                className="rounded-2xl border border-white/30 bg-white/10 px-7 py-4 font-extrabold text-white backdrop-blur-xl"
              >
                Descargar app
              </motion.a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200/70 bg-white/85 px-6 py-10 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 p-2 text-white">
              <Store className="h-4 w-4" />
            </div>
            <div>
              <p className="font-black text-slate-950">Bodega Jormard</p>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                © 2026
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 text-sm font-semibold text-slate-500 md:flex-row md:gap-6">
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> Ferreñafe
            </span>
            <span className="flex items-center gap-2">
              <Phone className="h-4 w-4" /> 961 241 085
            </span>
          </div>

          <div className="flex items-center gap-5 text-sm font-semibold text-slate-500">
            <button
              onClick={() => setShowPolicy(true)}
              className="transition hover:text-orange-600"
            >
              Privacidad
            </button>
            <span>Diseño premium</span>
          </div>
        </div>
      </footer>

      {/* WhatsApp */}
      <motion.a
        href="https://wa.me/51961241085"
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="group fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full border-4 border-white bg-[#25D366] px-4 py-3 text-white shadow-[0_20px_45px_rgba(37,211,102,0.35)]"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="hidden pr-1 text-sm font-bold md:block">WhatsApp</span>
      </motion.a>

      {/* Modal */}
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
              initial={{ opacity: 0, y: 35, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 35, scale: 0.96 }}
              transition={{ duration: 0.28 }}
              className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-[0_35px_100px_rgba(15,23,42,0.28)]"
            >
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 p-6 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-orange-100 p-2.5 text-orange-600">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-950">
                      Políticas de Privacidad
                    </h2>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Seguridad y confianza
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
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-blue-800">
                  <strong>Nota:</strong> Cumplimos con buenas prácticas de
                  seguridad para proteger la información del usuario.
                </div>

                <section>
                  <h3 className="mb-2 text-base font-black text-slate-950">
                    1. Información que recolectamos
                  </h3>
                  <p>
                    Solo solicitamos los datos necesarios para completar tu
                    pedido: nombre, teléfono y dirección de entrega.
                  </p>
                </section>

                <section>
                  <h3 className="mb-2 text-base font-black text-slate-950">
                    2. Uso de los datos
                  </h3>
                  <p>
                    Utilizamos tu información únicamente para gestionar pedidos,
                    coordinar entregas y mejorar la experiencia del servicio.
                  </p>
                </section>

                <section>
                  <h3 className="mb-2 text-base font-black text-slate-950">
                    3. Eliminación de datos
                  </h3>
                  <p>
                    No compartimos tus datos con terceros. Si deseas eliminar tu
                    información, puedes escribir a{" "}
                    <span className="font-bold text-slate-900">
                      soporte@bodegajormard.com
                    </span>
                    .
                  </p>
                </section>
              </div>

              <div className="flex justify-end border-t border-slate-100 bg-slate-50 p-5">
                <button
                  onClick={() => setShowPolicy(false)}
                  className="rounded-xl bg-slate-950 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-black"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}