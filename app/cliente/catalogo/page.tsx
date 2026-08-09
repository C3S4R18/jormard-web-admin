"use client";

import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { 
  Search, ShoppingCart, LogOut, Store, Plus, Minus, X, 
  Trash2, MapPin, Bike, CheckCircle2, ArrowRight, 
  Clock, Package, Loader2, Zap, LocateFixed, Map as MapIcon,
  Image as ImageIcon, ChevronDown, ChevronUp, Banknote, Smartphone, 
  Upload, MessageCircle, Copy, Menu, User, Settings, HelpCircle, Info, Camera, Edit2, PlayCircle,
  ChevronLeft, ChevronRight, Heart, Home, Star, LayoutGrid, Trophy, Flag, Check,
  Wallet, Truck, BadgeCheck, ReceiptText, RotateCcw, ArrowUpDown, Sparkles, Flame, Megaphone
} from 'lucide-react';

const LocationMap = dynamic(() => import('@/app/components/LocationMap'), { 
  ssr: false,
  loading: () => <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 text-white backdrop-blur-md"><Loader2 className="animate-spin w-10 h-10"/></div>
});

// --- TIPOS ---
interface Producto { id: number; nombre: string; precio: number; stock: number; imagen_url: string; categoria: string; oferta_activa: boolean; precio_oferta?: number; hora_inicio?: string; hora_fin?: string; created_at?: string; ventas?: number; }
interface CartItem extends Producto { cantidad: number; precioFinal: number; }
interface Pedido { id: number; created_at: string; total: number; estado: 'pendiente' | 'pagado' | 'preparando' | 'atendido' | 'cancelado'; items: CartItem[]; tipo_entrega: 'delivery' | 'recojo'; direccion?: string; metodo_pago?: string; comprobante_url?: string; }
interface AppConfig { banner_activo: boolean; banner_titulo: string; banner_subtitulo: string; banner_color: string; }
interface UserAddress { id: number; alias: string; direccion: string; }

const isOfferActive = (prod: Producto): boolean => {
  if (!prod.oferta_activa || !prod.precio_oferta) return false;
  if (!prod.hora_inicio || !prod.hora_fin) return true;
  const now = new Date(); const cm = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = prod.hora_inicio.split(':').map(Number);
  const [eh, em] = prod.hora_fin.split(':').map(Number);
  return cm >= (sh * 60 + sm) && cm <= (eh * 60 + em);
};

// ══════════════════════════════════════════════════════════
// HELPERS DE PAGO
// ══════════════════════════════════════════════════════════
const getPaymentConfig = (method: string | undefined) => {
  switch (method) {
    case 'yape': return { label: 'Yape', icon: <Smartphone className="w-4 h-4" />, color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' };
    case 'plin': return { label: 'Plin', icon: <Wallet className="w-4 h-4" />, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' };
    default: return { label: 'Efectivo', icon: <Banknote className="w-4 h-4" />, color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' };
  }
};

const getStatusConfig = (estado: string) => {
  switch (estado) {
    case 'pendiente': return { label: 'Pendiente', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500', Icon: Clock };
    case 'pagado': return { label: 'Pagado', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200', dot: 'bg-indigo-500', Icon: Banknote };
    case 'preparando': return { label: 'Preparando', color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200', dot: 'bg-sky-500', Icon: Package };
    case 'atendido': return { label: 'Entregado', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', Icon: CheckCircle2 };
    case 'cancelado': return { label: 'Cancelado', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500', Icon: X };
    default: return { label: estado, color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200', dot: 'bg-slate-500', Icon: Clock };
  }
};

// ══════════════════════════════════════════════════════════
// UI COMPONENTS
// ══════════════════════════════════════════════════════════
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error' | 'offer', onClose: () => void }) => (
  <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }}
    className={`fixed bottom-24 left-1/2 -translate-x-1/2 md:bottom-10 md:left-10 md:translate-x-0 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 backdrop-blur-xl border ${type === 'success' ? 'bg-slate-900/95 text-white border-slate-800' : type === 'offer' ? 'bg-orange-600/95 text-white border-orange-500' : 'bg-red-500/95 text-white border-red-400'}`}>
    <div className={`p-2 rounded-full ${type === 'success' ? 'bg-green-500/20' : type === 'offer' ? 'bg-yellow-400/20' : 'bg-red-900/20'}`}>
      {type === 'success' ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : type === 'offer' ? <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300 animate-pulse" /> : <X className="w-5 h-5" />}
    </div>
    <span className="font-bold text-sm">{message}</span>
  </motion.div>
);

const Confetti = () => { const c = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6']; return (<div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">{[...Array(50)].map((_, i) => (<motion.div key={i} initial={{ y: -20, x: Math.random()*100+'vw', opacity: 1, rotate: 0 }} animate={{ y: '100vh', x: (Math.random()-0.5)*200+'px', opacity: 0, rotate: 360 }} transition={{ duration: Math.random()*2+2, delay: Math.random()*0.5 }} className="absolute w-3 h-3 rounded-sm" style={{ backgroundColor: c[i%c.length] }} />))}</div>); };

// ══════════════════════════════════════════════════════════
// TARJETA DE PEDIDO MEJORADA
// ══════════════════════════════════════════════════════════
// Seguimiento del pedido: Recibido → Pagado → Preparando → Enviado/Entregado
const OrderTracker = ({ order }: { order: Pedido }) => {
  const estado = (order.estado || '').toLowerCase().trim();
  const isPickup = order.tipo_entrega === 'recojo';

  if (estado === 'cancelado') {
    return (
      <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl p-3.5">
        <X className="w-5 h-5 text-red-500" />
        <span className="font-bold text-sm text-red-600">Pedido cancelado</span>
      </div>
    );
  }

  const steps = [
    { label: 'Recibido', Icon: ReceiptText },
    { label: 'Pagado', Icon: Banknote },
    { label: 'Preparando', Icon: Package },
    { label: isPickup ? 'Listo' : 'Enviado', Icon: isPickup ? Store : Truck },
  ];
  const current = estado === 'pendiente' ? 0
    : estado === 'pagado' ? 1
    : estado === 'preparando' ? 2
    : ['atendido', 'entregado', 'enviado', 'completado'].includes(estado) ? 3
    : 0;

  return (
    <div className="flex items-start">
      {steps.map((s, i) => {
        const done = i <= current;
        const StepIcon = i < current ? CheckCircle2 : s.Icon;
        return (
          <div key={s.label} className="flex-1 flex flex-col items-center">
            <div className="flex items-center w-full">
              <div className={`h-1 flex-1 rounded-full ${i === 0 ? 'bg-transparent' : current >= i ? 'bg-indigo-500' : 'bg-slate-200'}`} />
              <motion.div
                initial={false}
                animate={{ scale: i === current ? [1, 1.15, 1] : 1 }}
                transition={{ duration: 0.6, repeat: i === current ? Infinity : 0, repeatDelay: 1 }}
                className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${done ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-200' : 'bg-slate-200 text-slate-400'}`}
              >
                <StepIcon className="w-4 h-4" />
              </motion.div>
              <div className={`h-1 flex-1 rounded-full ${i === steps.length - 1 ? 'bg-transparent' : current > i ? 'bg-indigo-500' : 'bg-slate-200'}`} />
            </div>
            <span className={`mt-2 text-[10px] text-center leading-tight ${done ? 'font-black text-indigo-600' : 'font-bold text-slate-400'}`}>{s.label}</span>
          </div>
        );
      })}
    </div>
  );
};

// Visor de imagen en modal (no abre pestaña nueva)
const ImageLightbox = ({ url, onClose }: { url: string, onClose: () => void }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        onClick={(e) => e.stopPropagation()} className="relative max-w-2xl w-full">
        <div className="flex justify-end mb-3">
          <button onClick={onClose} className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full backdrop-blur-sm transition"><X className="w-5 h-5" /></button>
        </div>
        <img src={url} alt="Comprobante" className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl bg-white" />
      </motion.div>
    </motion.div>
  );
};

const OrderCard = ({ order, onReorder }: { order: Pedido, onReorder?: (o: Pedido) => void }) => {
  const [expanded, setExpanded] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const status = getStatusConfig(order.estado);
  const payment = getPaymentConfig(order.metodo_pago);
  const StatusIcon = status.Icon;

  return (
    <motion.div layout className="bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-hidden mb-4 hover:shadow-md transition-shadow">
      {/* Barra de color superior */}
      <div className="h-1.5 w-full" style={{ background: order.estado === 'pendiente' ? 'linear-gradient(90deg, #F59E0B, #EF4444)' : order.estado === 'pagado' ? 'linear-gradient(90deg, #6366F1, #8B5CF6)' : order.estado === 'preparando' ? 'linear-gradient(90deg, #0EA5E9, #6366F1)' : order.estado === 'atendido' ? 'linear-gradient(90deg, #10B981, #059669)' : '#EF4444' }} />
      
      <div onClick={() => setExpanded(!expanded)} className="p-5 cursor-pointer">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${order.tipo_entrega === 'delivery' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
              {order.tipo_entrega === 'delivery' ? <Truck className="w-6 h-6"/> : <Store className="w-6 h-6"/>}
            </div>
            <div>
              <h4 className="font-black text-slate-900 text-lg">Pedido #{order.id}</h4>
              <p className="text-xs text-slate-400 font-medium">{new Date(order.created_at).toLocaleDateString('es-PE')} • {new Date(order.created_at).toLocaleTimeString('es-PE', {hour: '2-digit', minute:'2-digit'})}</p>
            </div>
          </div>
          <div className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 ${status.bg} ${status.color} ${status.border} border`}>
            <span className={`w-2 h-2 rounded-full ${status.dot} animate-pulse`} />
            {status.label}
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${payment.bg} ${payment.color}`}>{payment.icon} {payment.label}</span>
            <span className="text-sm text-slate-400 font-medium">{order.items.length} productos</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-900 text-xl">S/ {order.total.toFixed(2)}</span>
            <motion.div animate={{ rotate: expanded ? 180 : 0 }} className="bg-slate-100 p-1 rounded-full"><ChevronDown className="w-4 h-4 text-slate-600"/></motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-slate-100 bg-slate-50/50">
            <div className="p-5 space-y-4">
              <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Seguimiento</p>
              <div className="bg-white p-4 rounded-2xl border border-slate-100"><OrderTracker order={order} /></div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-wider pt-1">Detalle</p>
              <div className="space-y-2">
                {order.items.map((item, idx) => {
                  // Pedidos antiguos podían venir sin "cantidad"
                  const qty = Number(item.cantidad ?? 1) || 1;
                  const price = Number(item.precio ?? 0) || 0;
                  return (
                    <div key={idx} className="flex justify-between text-sm items-center bg-white p-3 rounded-xl border border-slate-100">
                      <span className="text-slate-700 font-medium"><span className="font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md mr-2">{qty}x</span> {item.nombre}</span>
                      <span className="font-bold text-slate-900 tabular-nums">S/ {(price * qty).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Pago</p>
                  <div className={`flex items-center gap-2 font-bold text-sm ${payment.color}`}>{payment.icon} {payment.label}</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Entrega</p>
                  <div className="flex items-center gap-2 font-bold text-slate-700 text-sm truncate">
                    <MapPin className="w-4 h-4 text-red-500 flex-shrink-0"/>
                    <span className="truncate">{order.tipo_entrega === 'delivery' ? (order.direccion || 'Delivery') : 'Recojo en Tienda'}</span>
                  </div>
                </div>
              </div>
              {order.comprobante_url && (
                <button onClick={(e) => { e.stopPropagation(); setLightbox(order.comprobante_url!); }} className="w-full py-3 bg-white border border-indigo-100 text-indigo-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-50 transition">
                  <ImageIcon className="w-4 h-4"/> Ver Comprobante
                </button>
              )}
              {onReorder && (
                <button onClick={(e) => { e.stopPropagation(); onReorder(order); }} className="w-full py-3.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-100 transition active:scale-[0.98]">
                  <RotateCcw className="w-4 h-4"/> Volver a pedir
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {lightbox && <ImageLightbox url={lightbox} onClose={() => setLightbox(null)} />}
      </AnimatePresence>
    </motion.div>
  );
};

// ══════════════════════════════════════════════════════════
// CARRUSEL DE DESCUBRIMIENTO (Ofertas / Nuevos / Más vendidos)
// ══════════════════════════════════════════════════════════
const DiscoveryRow = ({ title, subtitle, Icon, accent, iconBg, items, badge, badgeBg, onOpen, onAdd, highlight = false }: {
  title: string; subtitle?: string; Icon: any; accent: string; iconBg: string;
  items: Producto[]; badge: string; badgeBg: string;
  onOpen: (p: Producto) => void; onAdd: (p: Producto) => void; highlight?: boolean;
}) => {
  const scroller = useRef<HTMLDivElement>(null);
  const scrollBy = (dir: number) => scroller.current?.scrollBy({ left: dir * 400, behavior: 'smooth' });

  return (
    <section className={`mb-10 ${highlight ? 'bg-gradient-to-br from-orange-50 to-rose-50 border border-orange-100 rounded-[28px] p-5 sm:p-6' : ''}`}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl ${iconBg}`}><Icon className={`w-5 h-5 ${accent}`} /></div>
          <div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">{title}</h3>
            {subtitle && <p className="text-xs font-medium text-slate-400 mt-1">{subtitle}</p>}
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <button onClick={() => scrollBy(-1)} className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-300 transition active:scale-90"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => scrollBy(1)} className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-300 transition active:scale-90"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      <div ref={scroller} className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide scroll-smooth snap-x">
        {items.map(prod => {
          const offer = isOfferActive(prod);
          const price = (offer && prod.precio_oferta) ? prod.precio_oferta : prod.precio;
          const dcto = offer && prod.precio_oferta && prod.precio > 0 ? Math.round(((prod.precio - prod.precio_oferta) / prod.precio) * 100) : 0;
          return (
            <motion.div key={prod.id} whileHover={{ y: -6 }}
              className="bg-white rounded-[22px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all w-[168px] flex-shrink-0 overflow-hidden cursor-pointer group snap-start"
              onClick={() => onOpen(prod)}>
              <div className="h-[140px] bg-slate-50/70 relative flex items-center justify-center">
                {prod.imagen_url
                  ? <img src={prod.imagen_url} alt={prod.nombre} className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110" onError={(e) => e.currentTarget.style.display = 'none'} />
                  : <ImageIcon className="w-10 h-10 text-slate-200" />}
                <span className={`absolute top-2.5 left-2.5 ${badgeBg} text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-sm tracking-wide`}>{badge}</span>
                {dcto > 0 && <span className="absolute top-2.5 right-2.5 bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-sm">-{dcto}%</span>}
              </div>
              <div className="p-3.5">
                <p className="font-bold text-slate-900 text-xs line-clamp-2 min-h-[32px] leading-snug">{prod.nombre}</p>
                <div className="flex items-end justify-between mt-2.5">
                  <div className="min-w-0">
                    {offer && prod.precio_oferta && <p className="text-[10px] text-slate-400 line-through leading-none mb-0.5">S/ {prod.precio.toFixed(2)}</p>}
                    <p className={`font-black text-base leading-none ${offer ? 'text-orange-600' : 'text-slate-900'}`}>S/ {price.toFixed(2)}</p>
                  </div>
                  <motion.button whileTap={{ scale: 0.85 }} onClick={(e) => { e.stopPropagation(); onAdd(prod); }}
                    className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white flex items-center justify-center shadow-md transition-colors flex-shrink-0">
                    <Plus className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

// ══════════════════════════════════════════════════════════
// SECCIÓN DE PAGO WALLET (Yape/Plin)
// ══════════════════════════════════════════════════════════
const WalletPaymentWeb = ({ name, color, voucherFile, onUpload, onCopyNumber }: {
  name: string; color: string; voucherFile: File | null; onUpload: () => void; onCopyNumber: () => void;
}) => (
  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
    className={`rounded-2xl p-5 border shadow-inner ${color === 'purple' ? 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-100' : 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-100'}`}
  >
    <div className="text-center mb-4">
      <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${color === 'purple' ? 'text-purple-400' : 'text-emerald-400'}`}>Número {name}</p>
      <div onClick={onCopyNumber} className="bg-white border border-slate-100 rounded-xl py-3 px-6 inline-flex items-center gap-3 cursor-pointer hover:shadow-md transition active:scale-95">
        <span className="text-2xl font-black text-slate-800 tracking-wider font-mono">961 241 085</span>
        <Copy className={`w-4 h-4 ${color === 'purple' ? 'text-purple-500' : 'text-emerald-500'}`}/>
      </div>
      <p className="text-[10px] text-slate-400 mt-2">Titular: Bodega Jormard</p>
    </div>
    <div onClick={onUpload} className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-white transition gap-3 h-44 relative overflow-hidden group ${color === 'purple' ? 'border-purple-300 bg-white/60' : 'border-emerald-300 bg-white/60'}`}>
      {voucherFile ? (
        <img src={URL.createObjectURL(voucherFile)} className="absolute inset-0 w-full h-full object-contain p-2" />
      ) : (
        <div className="flex flex-col items-center">
          <div className={`p-3 rounded-full mb-2 group-hover:scale-110 transition ${color === 'purple' ? 'bg-purple-100' : 'bg-emerald-100'}`}>
            <Upload className={`w-6 h-6 ${color === 'purple' ? 'text-purple-600' : 'text-emerald-600'}`}/>
          </div>
          <p className="text-sm font-bold text-slate-700">Subir Captura de Pago</p>
          <p className="text-xs text-slate-400">Click para seleccionar</p>
        </div>
      )}
    </div>
  </motion.div>
);

// ══════════════════════════════════════════════════════════
// FAQ ITEM
// ══════════════════════════════════════════════════════════
const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all hover:border-slate-300">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex justify-between items-center p-5 text-left font-bold text-slate-800 text-sm">{question}<motion.div animate={{ rotate: expanded ? 180 : 0 }}><ChevronDown className="w-5 h-5 text-slate-400"/></motion.div></button>
      <AnimatePresence>{expanded && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}><div className="px-5 pb-5 text-sm text-slate-500 leading-relaxed font-medium">{answer}</div></motion.div>)}</AnimatePresence>
    </div>
  );
};

// ══════════════════════════════════════════════════════════
// TOUR GUIDE
// ══════════════════════════════════════════════════════════
const TourGuide = ({ isOpen, onClose, setCurrentView, setIsCartOpen }: { isOpen: boolean; onClose: () => void; setCurrentView: (view: any) => void; setIsCartOpen: (open: boolean) => void; }) => {
  const [step, setStep] = useState(0); const [targetRect, setTargetRect] = useState<DOMRect | null>(null); const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({}); const [showConfetti, setShowConfetti] = useState(false);
  const steps = [ { title: "👋 ¡Bienvenido!", desc: "Tu nueva Bodega Digital. Vamos a dar un tour.", targetId: null, view: 'store' }, { title: "🔍 Buscador", desc: "Encuentra tus antojos al instante.", targetId: 'tour-search', mobileId: 'tour-search-mobile', view: 'store' }, { title: "🏷️ Categorías", desc: "Navega entre secciones.", targetId: 'tour-categories', view: 'store' }, { title: "❤️ Favoritos", desc: "Guarda tus productos preferidos.", targetId: 'nav-favorites', mobileId: 'nav-favorites-mobile', view: 'favorites' }, { title: "📦 Pedidos", desc: "Estado de tus compras en tiempo real.", targetId: 'nav-orders', mobileId: 'nav-orders-mobile', view: 'orders' }, { title: "🛒 Canasta", desc: "Aquí ves el total a pagar.", targetId: 'tour-cart', mobileId: 'tour-cart-mobile', view: 'store', action: () => setIsCartOpen(true) }, { title: "🎉 ¡Listo!", desc: "Ya eres experto. ¡A comprar!", targetId: null, view: 'store' } ];
  useEffect(() => { const s = steps[step]; if (s.view) setCurrentView(s.view); if (s.action) setTimeout(() => s.action && s.action(), 300); else if (step !== 5) setIsCartOpen(false); }, [step]);
  const updatePosition = () => { setTimeout(() => { const s = steps[step]; let el: HTMLElement | null = null; if (s.targetId) { el = document.getElementById(s.targetId); if (el && window.getComputedStyle(el).display === 'none' && s.mobileId) el = document.getElementById(s.mobileId); } if (!el && s.mobileId) el = document.getElementById(s.mobileId); if (el) { const r = el.getBoundingClientRect(); setTargetRect(r); const below = window.innerHeight - r.bottom > 250; setTooltipStyle({ top: below ? `${r.bottom + 20}px` : 'auto', bottom: !below ? `${window.innerHeight - r.top + 20}px` : 'auto', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '350px' }); } else { setTargetRect(null); setTooltipStyle({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: '400px' }); } }, 400); };
  useLayoutEffect(() => { if (isOpen) { const t = setTimeout(updatePosition, 400); window.addEventListener('resize', updatePosition); return () => { window.removeEventListener('resize', updatePosition); clearTimeout(t); }; } }, [step, isOpen]);
  const handleNext = () => { if (step < steps.length - 1) setStep(step + 1); else { setShowConfetti(true); setTimeout(() => { onClose(); setShowConfetti(false); }, 4000); } };
  if (!isOpen && !showConfetti) return null;
  return (<>{showConfetti && <Confetti />}{isOpen && (<div className="fixed inset-0 z-[100] overflow-hidden font-sans"><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(3px)', clipPath: targetRect ? `polygon(0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%, ${targetRect.left}px ${targetRect.top}px, ${targetRect.right}px ${targetRect.top}px, ${targetRect.right}px ${targetRect.bottom}px, ${targetRect.left}px ${targetRect.bottom}px, ${targetRect.left}px ${targetRect.top}px)` : undefined }} />{targetRect && <motion.div layoutId="tour-ring" className="absolute border-4 border-indigo-500 rounded-xl shadow-[0_0_30px_rgba(99,102,241,0.6)]" style={{ top: targetRect.top-8, left: targetRect.left-8, width: targetRect.width+16, height: targetRect.height+16 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />}<motion.div key={step} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute bg-white p-6 rounded-3xl shadow-2xl z-[101] border border-slate-100" style={tooltipStyle}><div className="flex justify-between items-start mb-4"><div className="bg-indigo-100 p-2.5 rounded-2xl text-indigo-600">{step === steps.length-1 ? <Trophy size={24}/> : <Flag size={24}/>}</div><span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{step+1}/{steps.length}</span></div><h3 className="text-xl font-black text-slate-900 mb-2">{steps[step].title}</h3><p className="text-slate-500 text-sm leading-relaxed mb-6 font-medium">{steps[step].desc}</p><div className="flex justify-between items-center"><button onClick={onClose} className="text-slate-400 font-bold text-xs">Saltar</button><button onClick={handleNext} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-600 transition shadow-lg shadow-indigo-200 flex items-center gap-2 active:scale-95">{step === steps.length-1 ? '¡Finalizar!' : 'Siguiente'} <ArrowRight size={16}/></button></div></motion.div></div>)}</>);
};

// ══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════
export default function ClientCatalog() {
  const [products, setProducts] = useState<Producto[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Producto[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [myOrders, setMyOrders] = useState<Pedido[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userData, setUserData] = useState<{nombre: string, telefono: string, avatar_url?: string} | null>(null);
  const ITEMS_PER_PAGE = 25;
  const [currentPage, setCurrentPage] = useState(1);
  const [currentView, setCurrentView] = useState<'store' | 'favorites' | 'orders' | 'profile' | 'support' | 'settings' | 'about'>('store');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const [orderSuccessId, setOrderSuccessId] = useState<number | null>(null);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error' | 'offer'} | null>(null);
  const [showTour, setShowTour] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [showSaveAddress, setShowSaveAddress] = useState(false);
  const [newAddressAlias, setNewAddressAlias] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  // Descubrimiento: orden, filtro de ofertas y banner dinámico
  const [sortOption, setSortOption] = useState<'recomendado' | 'precio_asc' | 'precio_desc' | 'nuevos' | 'vendidos'>('recomendado');
  const [soloOfertas, setSoloOfertas] = useState(false);
  const [bannerCfg, setBannerCfg] = useState<AppConfig | null>(null);
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'recojo'>('delivery');
  const [address, setAddress] = useState('');
  
  // PAGOS: efectivo, yape, plin
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'yape' | 'plin'>('efectivo');
  const [voucherFile, setVoucherFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const showToast = (msg: string, type: 'success' | 'error' | 'offer') => { setToast({ msg, type }); const audio = new Audio(type === 'error' ? '/notification.mp3' : '/pop.mp3'); if (type === 'success') audio.volume = 0.6; audio.play().catch(() => {}); setTimeout(() => setToast(null), 4000); };

  // --- INIT & REALTIME ---
  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);
      const meta = user.user_metadata;
      setUserData({ nombre: meta.full_name || 'Cliente', telefono: meta.phone || '', avatar_url: meta.avatar_url });
      setEditName(meta.full_name || ''); setEditPhone(meta.phone || '');
      Promise.all([fetchMyOrders(user.id), fetchFavorites(user.id), fetchAddresses(user.id), fetchProducts()]);
      const hasSeenTour = localStorage.getItem('hasSeenTour');
      if (!hasSeenTour) setTimeout(() => setShowTour(true), 1500);
      const ordersSub = supabase.channel('mis-pedidos-rt').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `user_id=eq.${user.id}` }, (p) => { const n = p.new as Pedido; setMyOrders(prev => prev.map(o => o.id === n.id ? n : o)); showToast(`Pedido #${n.id}: ${n.estado.toUpperCase()}`, 'success'); new Audio('/notification.mp3').play().catch(()=>{}); }).subscribe();
      const productsSub = supabase.channel('productos-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, (p) => { if (p.eventType === 'INSERT') setProducts(prev => [p.new as Producto, ...prev]); else if (p.eventType === 'UPDATE') { const u = p.new as Producto; setProducts(prev => prev.map(pr => pr.id === u.id ? u : pr)); } else if (p.eventType === 'DELETE') setProducts(prev => prev.filter(pr => pr.id !== p.old.id)); }).subscribe();
      return () => { supabase.removeChannel(ordersSub); supabase.removeChannel(productsSub); };
    };
    initData();
  }, [router]);

  const closeTour = () => { setShowTour(false); localStorage.setItem('hasSeenTour', 'true'); };
  const fetchProducts = async () => { const { data } = await supabase.from('productos').select('*').order('id', { ascending: false }); if (data) { setProducts(data); setFilteredProducts(data); } setLoading(false); };
  const fetchMyOrders = async (uid: string) => { const { data } = await supabase.from('pedidos').select('*').eq('user_id', uid).order('created_at', { ascending: false }); if (data) setMyOrders(data); };
  const fetchFavorites = async (uid: string) => { const { data } = await supabase.from('favoritos').select('producto_id').eq('user_id', uid); if (data) setFavorites(data.map(f => f.producto_id)); };
  const fetchAddresses = async (uid: string) => { const { data } = await supabase.from('user_addresses').select('*').eq('user_id', uid); if (data) setSavedAddresses(data); };

  const toggleFavorite = async (prodId: number) => { if (!userId) return; const isFav = favorites.includes(prodId); setFavorites(prev => isFav ? prev.filter(id => id !== prodId) : [...prev, prodId]); if (isFav) { await supabase.from('favoritos').delete().match({ user_id: userId, producto_id: prodId }); showToast("Eliminado de favoritos", 'error'); } else { await supabase.from('favoritos').insert({ user_id: userId, producto_id: prodId }); showToast("Agregado a favoritos", 'success'); } };

  const addToCart = (product: Producto) => { if (product.stock <= 0) return showToast("Agotado", 'error'); const cq = cart.find(i => i.id === product.id)?.cantidad || 0; if (cq >= product.stock) return showToast(`Solo quedan ${product.stock}`, 'error'); const active = isOfferActive(product); const fp = (active && product.precio_oferta) ? product.precio_oferta : product.precio; setCart(prev => { const ex = prev.find(i => i.id === product.id); if (ex) return prev.map(i => i.id === product.id ? { ...i, cantidad: i.cantidad + 1, precioFinal: fp } : i); return [...prev, { ...product, cantidad: 1, precioFinal: fp }]; }); showToast(`Agregaste ${product.nombre}`, 'success'); };

  const updateQuantity = (id: number, delta: number) => { const p = products.find(pr => pr.id === id); if (!p) return; setCart(prev => prev.map(i => { if (i.id === id) { const nq = i.cantidad + delta; if (nq > p.stock) { showToast(`Solo quedan ${p.stock}`, 'error'); return i; } return nq > 0 ? { ...i, cantidad: nq } : i; } return i; })); };
  const removeFromCart = (id: number) => setCart(prev => prev.filter(i => i.id !== id));

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file || !userId) return; setAvatarUploading(true); try { const fn = `avatars/${userId}_${Date.now()}.${file.name.split('.').pop()}`; await supabase.storage.from('perfiles').upload(fn, file, { upsert: true }); const { data } = supabase.storage.from('perfiles').getPublicUrl(fn); await supabase.auth.updateUser({ data: { avatar_url: data.publicUrl } }); setUserData(prev => prev ? ({ ...prev, avatar_url: data.publicUrl }) : null); showToast("Foto actualizada", 'success'); } catch (e: any) { showToast("Error: " + e.message, 'error'); } finally { setAvatarUploading(false); } };
  const handleSaveProfile = async () => { if (!editName.trim()) return showToast("Nombre obligatorio", 'error'); try { await supabase.auth.updateUser({ data: { full_name: editName, phone: editPhone } }); setUserData(prev => prev ? ({ ...prev, nombre: editName, telefono: editPhone }) : null); setIsEditingProfile(false); showToast("Perfil actualizado", 'success'); } catch (e: any) { showToast(e.message, 'error'); } };
  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/'); };

  useEffect(() => {
    let r = [...products];
    if (selectedCategory !== 'Todos') r = r.filter(p => p.categoria === selectedCategory);
    if (searchTerm) r = r.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    if (soloOfertas) r = r.filter(p => isOfferActive(p));
    if (sortOption === 'precio_asc') r.sort((a, b) => a.precio - b.precio);
    else if (sortOption === 'precio_desc') r.sort((a, b) => b.precio - a.precio);
    else if (sortOption === 'nuevos') r.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    else if (sortOption === 'vendidos') r.sort((a, b) => (b.ventas || 0) - (a.ventas || 0));
    setFilteredProducts(r); setCurrentPage(1);
  }, [searchTerm, selectedCategory, products, sortOption, soloOfertas]);

  // Carruseles de descubrimiento
  const topSellers = products.filter(p => (p.ventas || 0) > 0 && p.stock > 0).sort((a, b) => (b.ventas || 0) - (a.ventas || 0)).slice(0, 12);
  const newestProducts = products.filter(p => p.stock > 0).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')).slice(0, 12);
  const flashOffers = products.filter(p => isOfferActive(p) && p.stock > 0).slice(0, 12);
  const showDiscovery = !searchTerm && selectedCategory === 'Todos' && !soloOfertas;

  // Banner dinámico (con realtime)
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('app_config').select('*').eq('id', 1).maybeSingle();
      if (data) setBannerCfg(data as AppConfig);
    };
    load();
    const ch = supabase.channel('app-config-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'app_config' }, () => load()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Volver a pedir
  const handleReorder = (order: Pedido) => {
    let added = 0;
    const next = [...cart];
    order.items.forEach(item => {
      const prod = products.find(p => p.id === item.id);
      if (!prod || prod.stock <= 0) return;
      const active = isOfferActive(prod);
      const fp = (active && prod.precio_oferta) ? prod.precio_oferta : prod.precio;
      const idx = next.findIndex(i => i.id === prod.id);
      if (idx >= 0) next[idx] = { ...next[idx], cantidad: Math.min(next[idx].cantidad + item.cantidad, prod.stock), precioFinal: fp };
      else next.push({ ...prod, cantidad: Math.min(item.cantidad, prod.stock), precioFinal: fp });
      added++;
    });
    if (added === 0) return showToast("Esos productos ya no están disponibles", 'error');
    setCart(next); setCurrentView('store'); setIsCartOpen(true);
    showToast("Productos agregados al carrito 🛒", 'success');
  };

  // --- CARRITO PERSISTENTE + RECORDATORIO DE ABANDONO ---
  useEffect(() => {
    try {
      const saved = localStorage.getItem('jormard_cart');
      if (saved) { const parsed = JSON.parse(saved); if (Array.isArray(parsed) && parsed.length) setCart(parsed); }
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem('jormard_cart', JSON.stringify(cart)); } catch {}
  }, [cart]);

  // Si hay productos en la canasta y el usuario se queda inactivo, recordárselo
  useEffect(() => {
    if (cart.length === 0 || isCheckoutOpen) return;
    const t = setTimeout(() => {
      const count = cart.reduce((a, i) => a + i.cantidad, 0);
      showToast(`Tienes ${count} producto(s) esperando en tu canasta 🛒`, 'offer');
    }, 120000); // 2 minutos de inactividad en el carrito
    return () => clearTimeout(t);
  }, [cart, isCheckoutOpen]);

  const fetchAddressFromCoords = async (lat: number, lng: number) => { setGpsLoading(true); try { const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`, { headers: { 'User-Agent': 'BodegaJormardApp/1.0' } }); const data = await res.json(); setAddress(data?.display_name?.split(',').slice(0, 3).join(',') || `${lat}, ${lng}`); showToast("¡Ubicación detectada!", 'success'); } catch { showToast("Error GPS", 'error'); } finally { setGpsLoading(false); } };
  const handleUseCurrentLocation = () => { if (!navigator.geolocation) return showToast("GPS no soportado", 'error'); setGpsLoading(true); navigator.geolocation.getCurrentPosition(pos => fetchAddressFromCoords(pos.coords.latitude, pos.coords.longitude), () => { setGpsLoading(false); showToast("No se pudo obtener ubicación", 'error'); }, { enableHighAccuracy: true, timeout: 5000 }); };

  const totalCartPrice = cart.reduce((acc, i) => acc + (i.precioFinal * i.cantidad), 0);
  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.categoria)))].sort();

  // --- CHECKOUT ---
  const handlePlaceOrder = async () => {
    if (deliveryType === 'delivery' && !address) return showToast("Falta dirección", 'error');
    if (!userData?.nombre) return showToast("Error de usuario", 'error');

    try {
      setLoading(true);
      if (deliveryType === 'delivery' && showSaveAddress && newAddressAlias && userId) {
        try { await supabase.from('user_addresses').insert({ user_id: userId, alias: newAddressAlias, direccion: address }); fetchAddresses(userId); } catch {}
      }
      let uploadedUrl: string | null = null;
      if ((paymentMethod === 'yape' || paymentMethod === 'plin') && voucherFile) {
        const fn = `${userId}/${Date.now()}_voucher.${voucherFile.name.split('.').pop()}`;
        await supabase.storage.from('comprobantes').upload(fn, voucherFile);
        const { data } = supabase.storage.from('comprobantes').getPublicUrl(fn);
        uploadedUrl = data.publicUrl;
      }
      const { data, error } = await supabase.from('pedidos').insert([{
        user_id: userId, cliente_nombre: userData.nombre, cliente_telefono: userData.telefono,
        tipo_entrega: deliveryType, direccion: deliveryType === 'delivery' ? address : 'Recojo en tienda',
        items: cart.map(i => ({...i, precio: i.precioFinal})),
        total: totalCartPrice + (deliveryType === 'delivery' ? 2 : 0),
        estado: 'pendiente', metodo_pago: paymentMethod, comprobante_url: uploadedUrl
      }]).select().single();
      if (error) throw error;
      setOrderSuccessId(data.id); setCart([]); try { localStorage.removeItem('jormard_cart'); } catch {}
      if (userId) fetchMyOrders(userId);
    } catch (e: any) { showToast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const closeSuccessModal = () => { setOrderSuccessId(null); setIsCheckoutOpen(false); setIsCartOpen(false); setCurrentView('orders'); setVoucherFile(null); };

  // --- RENDER CONTENT ---
  const renderContent = () => {
    const indexLast = currentPage * ITEMS_PER_PAGE;
    const indexFirst = indexLast - ITEMS_PER_PAGE;
    const productsToShow = currentView === 'favorites' ? products.filter(p => favorites.includes(p.id)) : filteredProducts;
    const currentProducts = productsToShow.slice(indexFirst, indexLast);
    const totalPages = Math.ceil(productsToShow.length / ITEMS_PER_PAGE);

    if (currentView === 'store' || currentView === 'favorites') {
      return (<>
        {/* Banner dinámico controlado desde el admin */}
        {currentView === 'store' && showDiscovery && bannerCfg?.banner_activo && bannerCfg.banner_titulo && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[24px] p-6 mb-6 shadow-lg"
            style={{ background: `linear-gradient(90deg, ${bannerCfg.banner_color}, ${bannerCfg.banner_color}bb)` }}>
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full" />
            <div className="absolute -right-4 bottom-0 opacity-20"><Megaphone className="w-24 h-24 text-white" /></div>
            <div className="relative z-10">
              <p className="text-white font-black text-xl sm:text-2xl leading-tight">{bannerCfg.banner_titulo}</p>
              {bannerCfg.banner_subtitulo && <p className="text-white/85 font-medium mt-1">{bannerCfg.banner_subtitulo}</p>}
            </div>
          </motion.div>
        )}

        {/* Carruseles de descubrimiento */}
        {currentView === 'store' && showDiscovery && flashOffers.length > 0 && (
          <DiscoveryRow title="Ofertas Relámpago" subtitle="¡Por tiempo limitado!" Icon={Zap} accent="text-orange-500 fill-orange-500" iconBg="bg-white shadow-sm"
            items={flashOffers} badge="OFERTA" badgeBg="bg-gradient-to-r from-orange-500 to-rose-500" onOpen={setSelectedProduct} onAdd={addToCart} highlight />
        )}
        {currentView === 'store' && showDiscovery && topSellers.length > 0 && (
          <DiscoveryRow title="Más vendidos" subtitle="Lo que más piden nuestros clientes" Icon={Flame} accent="text-orange-500" iconBg="bg-orange-50"
            items={topSellers} badge="TOP" badgeBg="bg-orange-500" onOpen={setSelectedProduct} onAdd={addToCart} />
        )}
        {currentView === 'store' && showDiscovery && newestProducts.length > 0 && (
          <DiscoveryRow title="Nuevos" subtitle="Recién llegados a la bodega" Icon={Sparkles} accent="text-indigo-500" iconBg="bg-indigo-50"
            items={newestProducts} badge="NUEVO" badgeBg="bg-indigo-500" onOpen={setSelectedProduct} onAdd={addToCart} />
        )}

        {/* Encabezado del catálogo + categorías + orden (agrupado) */}
        {currentView === 'store' && (
          <div className="mb-6 pt-2 border-t border-slate-200/70">
            <div className="flex items-end justify-between gap-4 mb-4 pt-6">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                  {selectedCategory === 'Todos' ? 'Todos los productos' : selectedCategory}
                </h3>
                <p className="text-xs font-medium text-slate-400 mt-1.5">{productsToShow.length} productos disponibles</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setSoloOfertas(v => !v)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all shadow-sm ${soloOfertas ? 'bg-orange-500 text-white border-orange-500 shadow-orange-200' : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300'}`}>
                  <Zap className={`w-3.5 h-3.5 ${soloOfertas ? 'fill-white' : ''}`} /> Ofertas
                </motion.button>
                <div className="relative">
                  <ArrowUpDown className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select value={sortOption} onChange={e => setSortOption(e.target.value as any)}
                    className="appearance-none bg-white border border-slate-200 rounded-xl pl-10 pr-9 py-2.5 text-xs font-bold text-slate-600 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
                    <option value="recomendado">Recomendado</option>
                    <option value="precio_asc">Menor precio</option>
                    <option value="precio_desc">Mayor precio</option>
                    <option value="nuevos">Nuevos</option>
                    <option value="vendidos">Más vendidos</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>
            <div id="tour-categories" className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide w-full">
              {categories.map(cat => (<motion.button whileTap={{ scale: 0.95 }} key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-sm ${selectedCategory === cat ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'}`}>{cat}</motion.button>))}
            </div>
          </div>
        )}
        {currentView === 'favorites' && productsToShow.length === 0 && (<div className="text-center py-32 opacity-50 flex flex-col items-center"><Heart className="w-24 h-24 mb-6 text-slate-200"/><p className="font-bold text-xl text-slate-400">Aún no tienes favoritos</p></div>)}
        {loading ? (<div className="flex flex-col items-center justify-center py-32 gap-6"><Loader2 className="animate-spin text-indigo-600 w-12 h-12"/><p className="text-slate-400 font-bold text-sm animate-pulse tracking-widest">CARGANDO...</p></div>) : (<>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 pb-20">
            <AnimatePresence mode='popLayout'>
              {currentProducts.map(prod => { const activeOffer = isOfferActive(prod); const isFav = favorites.includes(prod.id); const oos = prod.stock <= 0; return (
                <motion.div key={prod.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ y: -8 }} className={`bg-white rounded-[24px] p-3 sm:p-4 shadow-sm border border-slate-100 hover:shadow-xl hover:border-indigo-100 transition-all group relative flex flex-col justify-between h-full ${oos ? 'opacity-60 grayscale' : ''}`}>
                  <div className="aspect-square bg-slate-50 rounded-2xl mb-4 overflow-hidden relative cursor-pointer group-hover:bg-indigo-50/30 transition-colors" onClick={() => setSelectedProduct(prod)}>
                    <div className="absolute inset-0 flex items-center justify-center z-0"><ImageIcon className="text-slate-200 w-12 h-12" /></div>
                    {prod.imagen_url && <img src={prod.imagen_url} alt={prod.nombre} className="w-full h-full object-contain p-3 relative z-10 transition-transform duration-700 group-hover:scale-105" onError={(e) => e.currentTarget.style.display='none'} />}
                    {oos && (<div className="absolute inset-0 z-30 bg-white/60 flex items-center justify-center backdrop-blur-[1px]"><span className="bg-slate-900 text-white font-black px-4 py-1.5 rounded-xl text-xs tracking-widest shadow-lg">AGOTADO</span></div>)}
                    {!oos && prod.stock < 5 && <span className="absolute bottom-2 left-2 z-20 bg-red-500/90 text-white text-[10px] font-black px-2.5 py-1 rounded-lg">¡Últimos {prod.stock}!</span>}
                    {activeOffer && !oos && (<div className="absolute top-2 left-2 z-20 bg-orange-500 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1"><Zap className="w-3 h-3 fill-white"/> OFERTA</div>)}
                    <button onClick={(e) => {e.stopPropagation(); toggleFavorite(prod.id)}} className="absolute top-2 right-2 z-30 p-2 rounded-full bg-white/80 hover:bg-white shadow-sm transition-transform active:scale-90 hover:shadow-md"><Heart className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} /></button>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 line-clamp-1">{prod.categoria}</p>
                    <h3 onClick={() => setSelectedProduct(prod)} className="font-bold text-slate-800 text-sm sm:text-base leading-tight mb-3 line-clamp-2 cursor-pointer hover:text-indigo-600 transition-colors h-10">{prod.nombre}</h3>
                    <div className="flex items-end justify-between mt-auto">
                      <div className="flex flex-col">{activeOffer && prod.precio_oferta ? (<><span className="text-xs text-slate-400 line-through">S/ {prod.precio.toFixed(2)}</span><span className="text-lg font-black text-orange-600">S/ {prod.precio_oferta.toFixed(2)}</span></>) : (<span className="text-lg font-black text-slate-900">S/ {prod.precio.toFixed(2)}</span>)}</div>
                      <motion.button whileTap={{ scale: 0.9 }} disabled={oos} onClick={() => addToCart(prod)} className={`w-10 h-10 rounded-xl shadow-md flex items-center justify-center transition-all ${oos ? 'bg-slate-100 cursor-not-allowed text-slate-300' : 'bg-slate-900 text-white hover:bg-indigo-600'}`}>{oos ? <X className="w-5 h-5"/> : <Plus className="w-5 h-5" />}</motion.button>
                    </div>
                  </div>
                </motion.div>
              ); })}
            </AnimatePresence>
          </div>
          {productsToShow.length > ITEMS_PER_PAGE && (<div className="flex justify-center items-center gap-4 pb-32"><button onClick={() => setCurrentPage(p => Math.max(p-1, 1))} disabled={currentPage === 1} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm disabled:opacity-50"><ChevronLeft className="w-5 h-5 text-slate-600"/></button><span className="text-sm font-bold text-slate-600 bg-white px-4 py-2 rounded-xl border shadow-sm">Página {currentPage} de {totalPages}</span><button onClick={() => setCurrentPage(p => Math.min(p+1, totalPages))} disabled={currentPage === totalPages} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm disabled:opacity-50"><ChevronRight className="w-5 h-5 text-slate-600"/></button></div>)}
        </>)}
      </>);
    }
    switch (currentView) {
      case 'orders': return (<div className="max-w-2xl mx-auto pb-32"><div className="flex items-center gap-3 mb-8"><div className="p-3 bg-indigo-50 rounded-2xl"><Clock className="w-6 h-6 text-indigo-600"/></div><h2 className="text-3xl font-black text-slate-900">Mis Pedidos</h2></div>{myOrders.length === 0 ? (<div className="text-center py-32 opacity-50 flex flex-col items-center"><Package className="w-24 h-24 mb-6 text-slate-200"/><p className="font-bold text-xl text-slate-400">Aún no tienes pedidos</p><button onClick={()=>setCurrentView('store')} className="mt-4 text-indigo-600 font-bold hover:underline">Ir a comprar</button></div>) : myOrders.map(o => (<OrderCard key={o.id} order={o} onReorder={handleReorder} />))}</div>);
      case 'profile': return (<div className="max-w-lg mx-auto pb-32"><div className="flex items-center gap-3 mb-8"><div className="p-3 bg-indigo-50 rounded-2xl"><User className="w-6 h-6 text-indigo-600"/></div><h2 className="text-3xl font-black text-slate-900">Mi Perfil</h2></div><div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"><div className="h-40 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 relative overflow-hidden"><div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div></div><div className="px-8 pb-8 relative"><div className="w-28 h-28 rounded-full bg-white p-1.5 absolute -top-14 left-1/2 -translate-x-1/2 shadow-xl group cursor-pointer" onClick={() => avatarInputRef.current?.click()}><div className="w-full h-full rounded-full bg-slate-100 overflow-hidden relative border-4 border-white">{avatarUploading ? (<div className="absolute inset-0 flex items-center justify-center bg-black/30"><Loader2 className="w-8 h-8 text-white animate-spin"/></div>) : userData?.avatar_url ? (<img src={userData.avatar_url} className="w-full h-full object-cover"/>) : (<div className="w-full h-full flex items-center justify-center text-4xl font-black text-slate-300">{userData?.nombre.charAt(0)}</div>)}<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"><Camera className="w-8 h-8 text-white"/></div></div><input type="file" ref={avatarInputRef} hidden accept="image/*" onChange={handleAvatarUpload} /></div><div className="mt-16 text-center mb-8"><h3 className="text-2xl font-black text-slate-900">{userData?.nombre}</h3><p className="text-sm font-medium text-slate-500">{userData?.telefono || 'Sin teléfono'}</p></div><div className="space-y-4">{isEditingProfile ? (<div className="space-y-5 bg-slate-50 p-6 rounded-2xl border border-slate-100"><div><label className="text-xs font-bold text-slate-400 uppercase ml-1">Nombre</label><input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-white border-slate-200 rounded-xl p-3.5 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700"/></div><div><label className="text-xs font-bold text-slate-400 uppercase ml-1">Celular</label><input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full bg-white border-slate-200 rounded-xl p-3.5 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700"/></div><div className="flex gap-3 pt-2"><button onClick={() => setIsEditingProfile(false)} className="flex-1 py-3.5 rounded-xl bg-white border border-slate-200 font-bold text-slate-600">Cancelar</button><button onClick={handleSaveProfile} className="flex-1 py-3.5 rounded-xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-200">Guardar</button></div></div>) : (<><div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-4 border border-slate-100"><div className="p-3 bg-white rounded-xl shadow-sm text-indigo-500"><User className="w-5 h-5"/></div><div><p className="text-[10px] text-slate-400 font-bold uppercase">Nombre</p><p className="font-bold text-slate-900">{userData?.nombre}</p></div></div><div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-4 border border-slate-100"><div className="p-3 bg-white rounded-xl shadow-sm text-indigo-500"><Smartphone className="w-5 h-5"/></div><div><p className="text-[10px] text-slate-400 font-bold uppercase">Celular</p><p className="font-bold text-slate-900">{userData?.telefono || 'No registrado'}</p></div></div><button onClick={() => setIsEditingProfile(true)} className="w-full py-4 mt-2 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-slate-200 active:scale-95"><Edit2 className="w-4 h-4"/> Editar</button></>)}</div></div></div></div>);
      case 'support': return (<div className="max-w-lg mx-auto pb-32"><div className="flex items-center gap-3 mb-8"><div className="p-3 bg-green-50 rounded-2xl"><HelpCircle className="w-6 h-6 text-green-600"/></div><h2 className="text-3xl font-black text-slate-900">Ayuda y Soporte</h2></div><div className="space-y-6"><div className="bg-gradient-to-br from-green-500 to-emerald-600 p-8 rounded-[32px] shadow-lg shadow-green-200 text-center text-white relative overflow-hidden"><div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -mr-10 -mt-10"></div><div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><MessageCircle className="w-10 h-10 text-white"/></div><h3 className="font-black text-2xl mb-2">¿Necesitas ayuda?</h3><p className="text-green-100 text-sm mb-8">Nuestro equipo está listo por WhatsApp.</p><div className="flex gap-4"><button onClick={() => window.open(`https://api.whatsapp.com/send?phone=51961241085&text=Hola,%20tengo%20una%20consulta`, '_blank')} className="flex-1 py-4 bg-white text-green-600 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg"><MessageCircle className="w-5 h-5"/> WhatsApp</button><button onClick={() => window.open('tel:961241085')} className="flex-1 py-4 bg-black/20 text-white rounded-xl font-bold flex items-center justify-center gap-2 backdrop-blur-md"><Smartphone className="w-5 h-5"/> Llamar</button></div></div><div><h3 className="font-black text-slate-900 mb-4 ml-1 text-lg">Preguntas Frecuentes</h3><div className="space-y-3"><FAQItem question="¿Cuál es el tiempo de entrega?" answer="30 a 45 minutos dependiendo de la zona." /><FAQItem question="¿Métodos de pago?" answer="Efectivo, Yape, Plin y Tarjeta de débito/crédito." /><FAQItem question="¿Puedo cancelar mi pedido?" answer="Solo si el estado es 'Pendiente'. Si ya está en camino, contáctanos." /></div></div></div></div>);
      case 'settings': return (<div className="max-w-lg mx-auto pb-32"><div className="flex items-center gap-3 mb-8"><div className="p-3 bg-slate-100 rounded-2xl"><Settings className="w-6 h-6 text-slate-700"/></div><h2 className="text-3xl font-black text-slate-900">Configuración</h2></div><div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-2"><div className="p-4 flex justify-between items-center hover:bg-slate-50 rounded-2xl transition cursor-pointer"><div><p className="font-bold text-slate-800">Notificaciones</p><p className="text-xs text-slate-500">Recibir alertas de pedidos</p></div><div className="w-12 h-7 bg-green-500 rounded-full relative"><div className="w-5 h-5 bg-white rounded-full absolute right-1 top-1 shadow-sm"></div></div></div><div className="p-4 flex justify-between items-center hover:bg-slate-50 rounded-2xl transition cursor-pointer"><div><p className="font-bold text-slate-800">Sonidos</p><p className="text-xs text-slate-500">Efectos de sonido</p></div><div className="w-12 h-7 bg-green-500 rounded-full relative"><div className="w-5 h-5 bg-white rounded-full absolute right-1 top-1 shadow-sm"></div></div></div><div className="p-4 hover:bg-red-50 rounded-2xl transition cursor-pointer"><button onClick={() => showToast("Caché limpiada", 'success')} className="text-red-500 font-bold text-sm flex items-center gap-3 w-full"><Trash2 className="w-5 h-5"/> Borrar caché</button></div></div></div>);
      case 'about': return (<div className="max-w-lg mx-auto pb-32 text-center pt-10"><div className="bg-white p-12 rounded-[40px] shadow-xl shadow-slate-200 border border-slate-100 inline-block mb-10 relative overflow-hidden"><div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 via-pink-500 to-indigo-500"></div><div className="bg-slate-50 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner"><Store className="w-12 h-12 text-slate-900"/></div><h1 className="text-3xl font-black text-slate-900 mb-1">Bodega Jormard</h1><p className="text-slate-500">Tu tienda en el bolsillo</p><span className="inline-block mt-6 px-4 py-1.5 bg-slate-100 rounded-full text-xs font-bold text-slate-600">v2.5.0</span></div><button onClick={() => window.open('https://bodega-jormard.vercel.app', '_blank')} className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl mb-8 hover:bg-indigo-600 shadow-xl shadow-slate-200 active:scale-95">Visitar Sitio Web</button><p className="text-xs text-slate-400">© 2026 Jormard Inc.</p></div>);
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-200">
      <AnimatePresence>{showTour && <TourGuide isOpen={showTour} onClose={closeTour} setCurrentView={setCurrentView} setIsCartOpen={setIsCartOpen} />}</AnimatePresence>
      {isMapOpen && <LocationMap onConfirm={(lat: number, lng: number) => { setIsMapOpen(false); fetchAddressFromCoords(lat, lng); }} onCancel={() => setIsMapOpen(false)} />}
      <AnimatePresence>{toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>

      {/* MODAL DETALLE PRODUCTO */}
      <AnimatePresence>{selectedProduct && (<div className="fixed inset-0 z-[80] flex items-center justify-center p-4"><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedProduct(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" /><motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[32px] w-full max-w-md overflow-hidden relative z-10 shadow-2xl"><button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 bg-white/80 backdrop-blur-md p-2 rounded-full z-20 hover:bg-white shadow-sm"><X className="w-6 h-6 text-slate-700"/></button><div className="h-72 sm:h-80 bg-slate-100 relative group">{selectedProduct.imagen_url ? <img src={selectedProduct.imagen_url} className="w-full h-full object-contain p-6 transition-transform duration-700 group-hover:scale-105"/> : <div className="flex items-center justify-center h-full"><ImageIcon className="w-20 h-20 text-slate-300"/></div>}{isOfferActive(selectedProduct) && <div className="absolute bottom-4 left-4 bg-orange-500 text-white font-black px-4 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 text-xs"><Zap className="w-4 h-4 fill-white"/> OFERTA</div>}</div><div className="p-8"><div className="flex justify-between items-start mb-4"><div><p className="text-xs font-bold text-indigo-500 uppercase mb-1 tracking-wider">{selectedProduct.categoria}</p><h2 className="text-3xl font-black text-slate-900 leading-tight">{selectedProduct.nombre}</h2></div><div className="text-right">{isOfferActive(selectedProduct) && selectedProduct.precio_oferta ? (<><p className="text-sm text-slate-400 line-through">S/ {selectedProduct.precio.toFixed(2)}</p><p className="text-3xl font-black text-orange-600">S/ {selectedProduct.precio_oferta.toFixed(2)}</p></>) : <p className="text-3xl font-black text-slate-900">S/ {selectedProduct.precio.toFixed(2)}</p>}</div></div><div className="flex items-center gap-3 mb-8"><div className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 ${selectedProduct.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}><div className={`w-2 h-2 rounded-full ${selectedProduct.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>{selectedProduct.stock > 0 ? `Stock: ${selectedProduct.stock}` : 'Agotado'}</div></div><button onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }} disabled={selectedProduct.stock <= 0} className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 active:scale-95 shadow-xl ${selectedProduct.stock > 0 ? 'bg-slate-900 text-white hover:bg-indigo-600 shadow-indigo-200' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}>{selectedProduct.stock > 0 ? <><ShoppingCart className="w-5 h-5"/> Agregar</> : 'No Disponible'}</button></div></motion.div></div>)}</AnimatePresence>

      {/* SIDEBAR MOBILE */}
      <AnimatePresence>{isMenuOpen && (<><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMenuOpen(false)} className="fixed inset-0 bg-slate-900/60 z-40 backdrop-blur-sm lg:hidden" /><motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} className="fixed left-0 top-0 h-full w-[300px] bg-white z-50 shadow-2xl flex flex-col lg:hidden rounded-r-[32px]"><div className="p-8 bg-slate-900 text-white relative overflow-hidden"><div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-3xl -mr-10 -mt-10 opacity-50"></div><div className="flex items-center gap-4 mb-4 relative z-10"><div className="w-14 h-14 rounded-full bg-white p-1 shadow-lg"><div className="w-full h-full rounded-full bg-slate-100 overflow-hidden flex items-center justify-center">{userData?.avatar_url ? <img src={userData.avatar_url} className="w-full h-full object-cover"/> : <span className="font-black text-2xl text-slate-900">{userData?.nombre.charAt(0)}</span>}</div></div><div><h3 className="font-bold text-lg leading-tight">{userData?.nombre}</h3><p className="text-xs text-slate-400">Cliente VIP</p></div></div></div><nav className="flex-1 p-6 space-y-2 overflow-y-auto"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 ml-2">Menú</p><button id="nav-store-mobile" onClick={() => { setCurrentView('store'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold ${currentView === 'store' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}><Store className="w-5 h-5"/> Tienda</button><button id="nav-favorites-mobile" onClick={() => { setCurrentView('favorites'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold ${currentView === 'favorites' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}><Heart className="w-5 h-5"/> Favoritos</button><button id="nav-orders-mobile" onClick={() => { setCurrentView('orders'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold ${currentView === 'orders' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}><Clock className="w-5 h-5"/> Pedidos</button><button id="nav-profile-mobile" onClick={() => { setCurrentView('profile'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold ${currentView === 'profile' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}><User className="w-5 h-5"/> Perfil</button><div className="my-6 border-t border-slate-100"></div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 ml-2">Otros</p><button onClick={() => { setCurrentView('settings'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold ${currentView === 'settings' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}><Settings className="w-5 h-5"/> Ajustes</button><button onClick={() => { setCurrentView('support'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold ${currentView === 'support' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}><HelpCircle className="w-5 h-5"/> Ayuda</button><button onClick={() => { setIsMenuOpen(false); setShowTour(true); }} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold text-slate-600 hover:bg-slate-50"><PlayCircle className="w-5 h-5"/> Tutorial</button></nav><div className="p-6 border-t border-slate-100"><button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-red-50 text-red-600 font-bold hover:bg-red-100"><LogOut className="w-5 h-5"/> Cerrar Sesión</button></div></motion.div></>)}</AnimatePresence>

      <div className="lg:flex">
        {/* SIDEBAR DESKTOP */}
        <aside className="hidden lg:flex w-72 h-screen sticky top-0 bg-white border-r border-slate-100 flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
          <div className="p-8 flex items-center gap-3"><div className="bg-slate-900 p-2 rounded-xl text-white shadow-lg"><Store className="w-6 h-6"/></div><span className="font-black text-2xl tracking-tight text-slate-900">Jormard</span></div>
          <nav className="flex-1 px-4 space-y-1"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-4 mt-4">Principal</p><button id="nav-store" onClick={() => setCurrentView('store')} className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold transition-all ${currentView === 'store' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-50'}`}><Store className="w-5 h-5"/> Tienda</button><button id="nav-favorites" onClick={() => setCurrentView('favorites')} className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold transition-all ${currentView === 'favorites' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-50'}`}><Heart className="w-5 h-5"/> Favoritos</button><button id="nav-orders" onClick={() => setCurrentView('orders')} className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold transition-all ${currentView === 'orders' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-50'}`}><Clock className="w-5 h-5"/> Pedidos</button><button id="nav-profile" onClick={() => setCurrentView('profile')} className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold transition-all ${currentView === 'profile' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-50'}`}><User className="w-5 h-5"/> Perfil</button><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-4 mt-8">Preferencias</p><button onClick={() => setCurrentView('settings')} className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold transition-all ${currentView === 'settings' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-50'}`}><Settings className="w-5 h-5"/> Ajustes</button><button onClick={() => setCurrentView('support')} className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold transition-all ${currentView === 'support' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-50'}`}><HelpCircle className="w-5 h-5"/> Soporte</button><button onClick={() => setShowTour(true)} className="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold text-slate-500 hover:bg-slate-50"><PlayCircle className="w-5 h-5"/> Tutorial</button></nav>
          <div className="p-4 border-t border-slate-100 mx-4 mb-4"><div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-2xl border border-slate-100"><div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-sm">{userData?.avatar_url ? <img src={userData.avatar_url} className="w-full h-full object-cover"/> : <span className="font-black text-slate-900">{userData?.nombre.charAt(0)}</span>}</div><div className="flex-1 min-w-0"><p className="font-bold text-sm truncate text-slate-900">{userData?.nombre}</p><p className="text-xs text-slate-500 truncate">Cliente</p></div></div><button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition text-sm"><LogOut className="w-4 h-4"/> Cerrar Sesión</button></div>
        </aside>

        <div className="flex-1 min-h-screen relative">
          <nav className="bg-white/80 backdrop-blur-xl sticky top-0 z-30 border-b border-slate-100 px-5 py-4 flex lg:hidden items-center justify-between"><div className="flex items-center gap-4"><button onClick={() => setIsMenuOpen(true)} className="p-2 -ml-2 text-slate-700 hover:bg-slate-100 rounded-xl"><Menu className="w-6 h-6"/></button><h1 className="font-black text-xl text-slate-900 tracking-tight">{currentView === 'store' ? 'Jormard' : currentView === 'orders' ? 'Pedidos' : 'Bodega'}</h1></div><button id="tour-cart-mobile" onClick={() => setIsCartOpen(true)} className="relative p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl group"><ShoppingCart className="w-5 h-5 text-slate-700 group-hover:text-indigo-600" />{cart.length > 0 && (<span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md ring-2 ring-white">{cart.reduce((a, i) => a + i.cantidad, 0)}</span>)}</button></nav>
          <div className="hidden lg:flex sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-10 py-5 justify-between items-center"><div><h2 className="text-3xl font-black text-slate-900 tracking-tight">{currentView === 'store' ? 'Tienda' : currentView === 'orders' ? 'Historial' : currentView === 'favorites' ? 'Favoritos' : 'Cuenta'}</h2><p className="text-slate-400 text-sm font-medium">{currentView === 'store' ? 'Explora nuestros productos' : 'Tu cuenta'}</p></div><div className="flex items-center gap-6">{currentView === 'store' && (<div id="tour-search" className="relative group w-96"><Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500" /><input type="text" placeholder="¿Qué se te antoja?" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none"/></div>)}<button id="tour-cart" onClick={() => setIsCartOpen(true)} className="relative px-5 py-3 bg-slate-900 hover:bg-indigo-600 rounded-2xl group transition-all flex items-center gap-3 shadow-lg shadow-slate-200 hover:shadow-indigo-200 active:scale-95"><ShoppingCart className="w-5 h-5 text-white" /><span className="font-bold text-sm text-white">S/ {totalCartPrice.toFixed(2)}</span>{cart.length > 0 && (<span className="bg-white text-slate-900 text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full">{cart.reduce((a, i) => a + i.cantidad, 0)}</span>)}</button></div></div>
          <main className="p-5 sm:p-10 max-w-[1600px] mx-auto min-h-[calc(100vh-80px)]">{currentView === 'store' && (<div id="tour-search-mobile" className="lg:hidden mb-6 relative"><Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" /><input type="text" placeholder="Buscar productos..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-white shadow-sm border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-base font-medium focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none"/></div>)}{renderContent()}</main>
        </div>
      </div>

      {/* CART SIDEBAR */}
      <AnimatePresence>{isCartOpen && (<><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="fixed inset-0 bg-slate-900/40 z-50 backdrop-blur-sm" /><motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-white z-[60] shadow-2xl flex flex-col rounded-l-[32px]"><div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50"><div><h2 className="text-2xl font-black text-slate-900">Mi Canasta</h2><p className="text-slate-500 text-sm font-medium">{cart.length} productos</p></div><button onClick={() => setIsCartOpen(false)} className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-full shadow-sm"><X className="w-6 h-6 text-slate-700" /></button></div><div className="flex-1 overflow-y-auto p-8 space-y-5">{cart.length === 0 ? (<div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-6"><div className="bg-slate-50 p-8 rounded-full border border-slate-100 shadow-sm"><ShoppingCart className="w-16 h-16 text-slate-300"/></div><div className="text-center"><p className="font-bold text-xl text-slate-900">Tu canasta está vacía</p><p className="text-sm mt-2">Agrega productos desde la tienda.</p></div><button onClick={() => setIsCartOpen(false)} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700">Explorar</button></div>) : cart.map(item => (<motion.div layout key={item.id} className="flex gap-5 items-center bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"><div className="w-24 h-24 rounded-xl bg-slate-50 relative overflow-hidden flex-shrink-0 border border-slate-100">{item.imagen_url ? <img src={item.imagen_url} className="w-full h-full object-cover" onError={e => e.currentTarget.style.display='none'} /> : <div className="absolute inset-0 flex items-center justify-center"><ImageIcon className="w-8 h-8 text-slate-300"/></div>}</div><div className="flex-1 min-w-0"><p className="text-[10px] font-bold text-indigo-500 uppercase mb-1">{item.categoria}</p><h4 className="font-bold text-slate-900 line-clamp-1 text-lg">{item.nombre}</h4><p className="text-slate-900 font-black mt-1 text-lg">S/ {(item.precioFinal * item.cantidad).toFixed(2)}</p></div><div className="flex flex-col items-center gap-1 bg-slate-50 rounded-xl p-1 border border-slate-100"><button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 bg-white shadow-sm rounded-lg hover:text-indigo-600 flex items-center justify-center border border-slate-100"><Plus className="w-4 h-4" /></button><span className="text-sm font-black w-6 text-center py-1">{item.cantidad}</span><button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 bg-white shadow-sm rounded-lg hover:text-indigo-600 flex items-center justify-center border border-slate-100"><Minus className="w-4 h-4" /></button></div><button onClick={() => removeFromCart(item.id)} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl"><Trash2 className="w-5 h-5" /></button></motion.div>))}</div>{cart.length > 0 && (<div className="p-8 bg-white border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-10"><div className="flex justify-between items-center mb-6"><span className="text-slate-500 font-medium">Total</span><span className="text-3xl font-black text-slate-900">S/ {totalCartPrice.toFixed(2)}</span></div><button onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }} className="w-full bg-slate-900 text-white font-bold py-5 rounded-2xl hover:bg-indigo-600 shadow-xl shadow-slate-200 active:scale-95 flex justify-center items-center gap-3 text-lg">Pagar <ArrowRight className="w-6 h-6"/></button></div>)}</motion.div></>)}</AnimatePresence>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* CHECKOUT MODAL (3 PAGOS: EFECTIVO, YAPE, PLIN) */}
      {/* ══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCheckoutOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] relative z-10 max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
              
              {!orderSuccessId ? (<>
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/80"><h2 className="text-2xl font-black text-slate-900">Finalizar Compra</h2><button onClick={() => setIsCheckoutOpen(false)} className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-100"><X className="w-5 h-5 text-slate-500"/></button></div>
                
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                  {/* ENTREGA */}
                  <section>
                    <div className="flex items-center gap-2 mb-4"><div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">1</div><h3 className="font-bold text-slate-800 text-lg">Tipo de Entrega</h3></div>
                    <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => setDeliveryType('delivery')} className={`p-4 rounded-2xl flex flex-col items-center gap-2 font-bold text-sm transition-all border-2 ${deliveryType === 'delivery' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}><Truck className="w-6 h-6" /> Delivery (S/ 2.00)</button>
                      <button onClick={() => setDeliveryType('recojo')} className={`p-4 rounded-2xl flex flex-col items-center gap-2 font-bold text-sm transition-all border-2 ${deliveryType === 'recojo' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}><Store className="w-6 h-6" /> Recojo en Tienda</button>
                    </div>
                    <AnimatePresence>{deliveryType === 'delivery' && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 space-y-4">
                      {savedAddresses.length > 0 && (<div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">{savedAddresses.map(addr => (<button key={addr.id} onClick={() => setAddress(addr.direccion)} className={`px-4 py-2 rounded-xl border text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all ${address === addr.direccion ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}><Home className="w-3 h-3"/> {addr.alias}</button>))}</div>)}
                      <div className="relative group"><div className="absolute left-4 top-4 bg-slate-100 p-2 rounded-lg"><MapPin className="w-5 h-5 text-slate-500"/></div><textarea placeholder="Dirección exacta..." value={address} onChange={e => setAddress(e.target.value)} className={`w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-16 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 font-medium min-h-[80px] resize-none ${gpsLoading ? 'opacity-50' : ''}`} disabled={gpsLoading}/>{gpsLoading && <div className="absolute right-4 top-4"><Loader2 className="w-5 h-5 animate-spin text-indigo-500"/></div>}</div>
                      <div className="flex gap-3"><button onClick={handleUseCurrentLocation} className="flex-1 py-3 bg-indigo-50 text-indigo-700 font-bold rounded-xl text-sm hover:bg-indigo-100 border border-indigo-100 flex justify-center gap-2 items-center"><LocateFixed className="w-4 h-4" /> GPS</button><button onClick={() => setIsMapOpen(true)} className="flex-1 py-3 bg-white text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-50 border border-slate-200 flex justify-center gap-2 items-center"><MapIcon className="w-4 h-4" /> Mapa</button></div>
                      {address && !savedAddresses.find(a => a.direccion === address) && (<div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100"><label className="flex items-center gap-3 text-sm font-bold text-slate-700 cursor-pointer mb-2"><div className={`w-5 h-5 rounded border flex items-center justify-center ${showSaveAddress ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>{showSaveAddress && <Check className="w-3 h-3 text-white"/>}</div><input type="checkbox" checked={showSaveAddress} onChange={e => setShowSaveAddress(e.target.checked)} className="hidden"/>Guardar dirección</label>{showSaveAddress && (<input type="text" placeholder="Ej: Casa, Oficina..." value={newAddressAlias} onChange={e => setNewAddressAlias(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500"/>)}</div>)}
                    </motion.div>)}</AnimatePresence>
                  </section>

                  {/* PAGO: EFECTIVO, YAPE, PLIN */}
                  <section>
                    <div className="flex items-center gap-2 mb-4 border-t border-slate-100 pt-6"><div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">2</div><h3 className="font-bold text-slate-800 text-lg">Método de Pago</h3></div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      {[
                        { key: 'efectivo', label: '💵 Efectivo', sub: 'Contra entrega', color: 'green' },
                        { key: 'yape', label: '💜 Yape', sub: 'Billetera BCP', color: 'purple' },
                        { key: 'plin', label: '💚 Plin', sub: 'Interbank, BBVA', color: 'emerald' },
                      ].map(m => (
                        <button key={m.key} onClick={() => setPaymentMethod(m.key as any)} className={`p-3.5 rounded-2xl text-left transition-all border-2 ${paymentMethod === m.key ? `bg-${m.color}-50 border-${m.color}-500 text-${m.color}-700` : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}>
                          <span className="text-sm font-bold block">{m.label}</span>
                          <span className="text-[10px] text-slate-400">{m.sub}</span>
                        </button>
                      ))}
                    </div>

                    {/* Yape */}
                    <AnimatePresence>
                      {paymentMethod === 'yape' && (
                        <WalletPaymentWeb name="Yape" color="purple" voucherFile={voucherFile} onUpload={() => fileInputRef.current?.click()} onCopyNumber={() => { navigator.clipboard.writeText("961241085"); showToast("Copiado", 'success'); }} />
                      )}
                    </AnimatePresence>

                    {/* Plin */}
                    <AnimatePresence>
                      {paymentMethod === 'plin' && (
                        <WalletPaymentWeb name="Plin" color="emerald" voucherFile={voucherFile} onUpload={() => fileInputRef.current?.click()} onCopyNumber={() => { navigator.clipboard.writeText("961241085"); showToast("Copiado", 'success'); }} />
                      )}
                    </AnimatePresence>

                    <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={e => setVoucherFile(e.target.files?.[0] || null)}/>
                  </section>
                </div>

                {/* TOTALES Y BOTÓN */}
                <div className="p-6 border-t border-slate-100 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-20">
                  <div className="flex justify-between items-center mb-2 text-sm text-slate-500"><span>Subtotal</span><span>S/ {totalCartPrice.toFixed(2)}</span></div>
                  {deliveryType === 'delivery' && <div className="flex justify-between items-center mb-4 text-sm text-slate-500"><span>Envío</span><span>S/ 2.00</span></div>}
                  <div className="flex justify-between items-center mb-6"><span className="text-lg font-bold text-slate-900">Total</span><span className="text-3xl font-black text-slate-900">S/ {(totalCartPrice + (deliveryType === 'delivery' ? 2 : 0)).toFixed(2)}</span></div>
                  <button onClick={handlePlaceOrder} disabled={loading} className="w-full bg-slate-900 text-white font-bold py-5 rounded-2xl shadow-xl hover:bg-indigo-600 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 text-lg">
                    {loading ? <Loader2 className="animate-spin w-6 h-6"/> : <>{paymentMethod === 'yape' ? 'Confirmar Yape' : paymentMethod === 'plin' ? 'Confirmar Plin' : 'Confirmar Pedido'} <CheckCircle2 className="w-6 h-6" /></>}
                  </button>
                </div>
              </>) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 10 }} className="w-32 h-32 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-8 shadow-inner"><CheckCircle2 className="w-16 h-16" /></motion.div>
                  <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">¡Pedido Exitoso!</h2>
                  <p className="text-slate-500 mb-8 text-lg">Pedido <span className="font-bold text-slate-900">#{orderSuccessId}</span> recibido.</p>
                  {(paymentMethod === 'yape' || paymentMethod === 'plin') && !voucherFile && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 mb-8 text-left w-full">
                      <p className="text-sm font-bold text-yellow-800 mb-2 flex items-center gap-2"><Info className="w-4 h-4"/> Falta comprobante</p>
                      <p className="text-xs text-yellow-700 mb-4">Envía la captura por WhatsApp.</p>
                      <button onClick={() => window.open(`https://api.whatsapp.com/send?phone=51961241085&text=Hola,%20adjunto%20comprobante%20pedido%20%23${orderSuccessId}`, '_blank')} className="w-full py-3.5 bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-green-600 shadow-lg shadow-green-200"><MessageCircle className="w-5 h-5"/> WhatsApp</button>
                    </div>
                  )}
                  <button onClick={closeSuccessModal} className="w-full bg-slate-100 text-slate-900 font-bold py-4 rounded-2xl hover:bg-slate-200">Ver mis pedidos</button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}