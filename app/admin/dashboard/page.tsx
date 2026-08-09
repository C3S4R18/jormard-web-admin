"use client";

import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import * as XLSX from 'xlsx';
import { 
  Plus, Trash2, BarChart3, Upload, FileSpreadsheet, X, Loader2, Menu, Clock, 
  CheckCircle2, MapPin, Eye, Banknote, Search, AlertTriangle, 
  TrendingUp, Copy, Bell, LogOut, Volume2, Zap, Timer, Pencil, XCircle,
  Map, ExternalLink, HelpCircle, FileDown, ChevronRight, Flag, Image as ImageIcon, 
  Paperclip, Users, Settings, Package, ShoppingBag, ArrowRight, LayoutDashboard, Phone, Calendar,
  Tags, Bot, MessageSquare, Sparkles, Trophy, Download, FileUp, CheckSquare, Square, FolderInput, Check, Megaphone,
  Wallet, ArrowUpRight, ReceiptText, CircleDollarSign, Smartphone, BadgeCheck, Truck, Store
} from 'lucide-react';

// --- IMPORTACIÓN DINÁMICA DEL MAPA ---
const LocationMap = dynamic(() => import('@/app/components/LocationMap'), { 
  ssr: false,
  loading: () => <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 text-white backdrop-blur-sm"><Loader2 className="animate-spin mr-2"/> Cargando mapa...</div>
});

// --- TIPOS ---
interface Producto {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  imagen_url: string;
  categoria: string;
  oferta_activa: boolean;
  precio_oferta?: number;
  hora_inicio?: string;
  hora_fin?: string;
}

interface PedidoItem {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
}

interface Pedido {
  id: number;
  created_at: string;
  cliente_nombre: string;
  cliente_telefono: string;
  tipo_entrega: 'delivery' | 'recojo';
  direccion: string;
  items: PedidoItem[];
  total: number;
  estado: 'pendiente' | 'pagado' | 'preparando' | 'atendido' | 'cancelado';
  comprobante_url?: string;
  metodo_pago?: string;
  user_id?: string;
  culqi_charge_id?: string;
}

// ══════════════════════════════════════════════════════════
// HELPERS DE PAGO (NUEVO)
// ══════════════════════════════════════════════════════════
const getPaymentConfig = (method: string | undefined) => {
  switch (method) {
    case 'yape':
      return { label: 'Yape', icon: <Smartphone className="w-4 h-4" />, color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700', accent: 'purple' };
    case 'plin':
      return { label: 'Plin', icon: <Wallet className="w-4 h-4" />, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', accent: 'emerald' };
    default:
      return { label: 'Efectivo', icon: <Banknote className="w-4 h-4" />, color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-700', accent: 'green' };
  }
};

const getStatusConfig = (estado: string) => {
  switch (estado) {
    case 'pendiente':
      return { label: 'Pendiente', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500' };
    case 'pagado':
      return { label: 'Pagado', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200', dot: 'bg-indigo-500' };
    case 'preparando':
      return { label: 'Preparando', color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200', dot: 'bg-sky-500' };
    case 'atendido':
      return { label: 'Entregado', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' };
    case 'cancelado':
      return { label: 'Cancelado', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500' };
    default:
      return { label: estado, color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200', dot: 'bg-slate-500' };
  }
};

// ══════════════════════════════════════════════════════════
// COMPONENTES UI MEJORADOS
// ══════════════════════════════════════════════════════════
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }}
    className={`fixed bottom-10 right-10 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md border ${
      type === 'success' ? 'bg-slate-900 text-white border-slate-700' : 'bg-red-600 text-white border-red-500'
    }`}
  >
    {type === 'success' ? <CheckCircle2 className="w-6 h-6 text-green-400" /> : <X className="w-6 h-6" />}
    <span className="font-bold text-base">{message}</span>
  </motion.div>
);

// NUEVO: StatCard rediseñada con mini gráfico
const StatCard = ({ title, value, icon, color, bgGradient, subtext, trend }: { 
  title: string, value: string, icon: any, color: string, bgGradient: string, subtext?: string, trend?: string 
}) => (
  <motion.div whileHover={{ y: -4, scale: 1.01 }} className={`relative overflow-hidden p-6 rounded-[1.5rem] border border-white/20 shadow-lg ${bgGradient}`}>
    <div className="absolute -right-4 -top-4 opacity-10">
      <div className="w-32 h-32">{icon}</div>
    </div>
    <div className="relative z-10">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">{icon}</div>
        <p className="text-white/70 text-xs font-bold uppercase tracking-wider">{title}</p>
      </div>
      <h3 className="text-3xl font-black text-white tracking-tight">{value}</h3>
      {subtext && (
        <div className="flex items-center gap-2 mt-2">
          {trend && <ArrowUpRight className="w-4 h-4 text-white/60" />}
          <p className="text-sm font-bold text-white/60">{subtext}</p>
        </div>
      )}
    </div>
  </motion.div>
);

// NUEVO: Payment Breakdown Mini Card
const PaymentBreakdown = ({ orders }: { orders: Pedido[] }) => {
  const completed = orders.filter(o => o.estado === 'atendido' || o.estado === 'pagado');
  const methods = ['efectivo', 'yape', 'plin'];
  
  const data = methods.map(m => {
    const methodOrders = completed.filter(o => (o.metodo_pago || 'efectivo') === m);
    const total = methodOrders.reduce((acc, o) => acc + o.total, 0);
    const config = getPaymentConfig(m);
    return { ...config, count: methodOrders.length, total };
  });

  const maxTotal = Math.max(...data.map(d => d.total), 1);

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-black text-slate-900">Ingresos por Método</h3>
        <CircleDollarSign className="w-5 h-5 text-slate-300" />
      </div>
      <div className="space-y-4">
        {data.map((d, i) => (
          <div key={i} className="group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${d.bg} ${d.color}`}>{d.icon}</div>
                <span className="text-sm font-bold text-slate-700">{d.label}</span>
                <span className="text-xs text-slate-400 font-medium">({d.count} pedidos)</span>
              </div>
              <span className="text-sm font-black text-slate-900">S/ {d.total.toFixed(2)}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${(d.total / maxTotal) * 100}%` }} 
                transition={{ duration: 0.8, delay: i * 0.1 }}
                className={`h-full rounded-full ${d.bg.replace('50', '500').replace('bg-', 'bg-')}`}
                style={{ 
                  background: d.accent === 'purple' ? '#7C3AED' : d.accent === 'emerald' ? '#10B981' : d.accent === 'blue' ? '#3B82F6' : '#22C55E' 
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════
// TARJETA DE PEDIDO MODERNA (Reemplaza la anterior)
// ══════════════════════════════════════════════════════════
const OrderCard = ({ order, onClick }: { order: Pedido, onClick: () => void }) => {
  const payment = getPaymentConfig(order.metodo_pago);
  const status = getStatusConfig(order.estado);
  const isUrgent = order.estado === 'pendiente';
  const hasProof = order.comprobante_url && (order.metodo_pago === 'yape' || order.metodo_pago === 'plin');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={`relative bg-white rounded-[1.5rem] border overflow-hidden cursor-pointer transition-all group
        ${isUrgent ? 'border-amber-200 shadow-lg shadow-amber-50 hover:shadow-xl hover:shadow-amber-100' : 'border-slate-100 shadow-sm hover:shadow-xl'}
        ${order.estado === 'atendido' ? 'opacity-75' : ''}
        ${order.estado === 'cancelado' ? 'opacity-50 grayscale-[0.3]' : ''}
      `}
    >
      {/* Barra superior de estado */}
      <div className={`h-1.5 w-full ${status.dot.replace('bg-', 'bg-')}`} 
        style={{ background: order.estado === 'pendiente' ? 'linear-gradient(90deg, #F59E0B, #EF4444)' :
          order.estado === 'pagado' ? 'linear-gradient(90deg, #6366F1, #8B5CF6)' :
          order.estado === 'preparando' ? 'linear-gradient(90deg, #0EA5E9, #6366F1)' :
          order.estado === 'atendido' ? 'linear-gradient(90deg, #10B981, #059669)' :
          '#EF4444'
        }}
      />

      <div className="p-5">
        {/* Header: Cliente + Estado */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-black text-slate-900 text-lg truncate group-hover:text-indigo-600 transition-colors">
                {order.cliente_nombre}
              </h3>
              {hasProof && (
                <div className="bg-purple-100 p-1 rounded-md animate-pulse">
                  <Paperclip className="w-3 h-3 text-purple-600" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(order.created_at).toLocaleString('es-PE', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</span>
              <span className="flex items-center gap-1">
                {order.tipo_entrega === 'delivery' ? <Truck className="w-3 h-3" /> : <Store className="w-3 h-3" />}
                {order.tipo_entrega === 'delivery' ? 'Delivery' : 'Recojo'}
              </span>
            </div>
          </div>
          
          {/* Badge de estado */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${status.bg} ${status.color} ${status.border} border`}>
            <span className={`w-2 h-2 rounded-full ${status.dot} animate-pulse`} />
            {status.label}
          </div>
        </div>

        {/* Items preview */}
        <div className="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            {order.items.slice(0, 3).map((item, idx) => (
              <span key={idx} className="text-xs bg-white px-2.5 py-1 rounded-lg text-slate-600 font-medium border border-slate-100 shadow-sm">
                {Number(item.cantidad ?? 1) || 1}x {item.nombre.length > 15 ? item.nombre.slice(0, 15) + '...' : item.nombre}
              </span>
            ))}
            {order.items.length > 3 && (
              <span className="text-xs text-slate-400 font-bold">+{order.items.length - 3} más</span>
            )}
          </div>
        </div>

        {/* Footer: Pago + Total */}
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ${payment.bg} ${payment.color} ${payment.border} border`}>
            {payment.icon}
            {payment.label}
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-slate-900 tracking-tight">S/ {order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ══════════════════════════════════════════════════════════
// MODAL DE DETALLE DE PEDIDO (REDISEÑADO)
// ══════════════════════════════════════════════════════════
const OrderDetailModal = ({ order, onClose, onUpdateStatus, onDelete, onCopy, onOpenMap }: {
  order: Pedido,
  onClose: () => void,
  onUpdateStatus: (id: number, status: 'pagado' | 'preparando' | 'atendido' | 'cancelado', userId?: string) => void,
  onDelete: (id: number) => void,
  onCopy: (text: string) => void,
  onOpenMap: (address: string) => void
}) => {
  const payment = getPaymentConfig(order.metodo_pago);
  const status = getStatusConfig(order.estado);
  const [lightbox, setLightbox] = useState<string | null>(null);

  // Gradiente del header según estado
  const headerBg = order.estado === 'pendiente' ? 'from-slate-900 to-slate-800' :
    order.estado === 'pagado' ? 'from-indigo-600 to-violet-600' :
    order.estado === 'preparando' ? 'from-sky-600 to-indigo-600' :
    order.estado === 'atendido' ? 'from-emerald-600 to-teal-600' :
    'from-red-600 to-red-500';

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white w-full max-w-lg rounded-[2rem] overflow-hidden shadow-2xl" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header con gradiente */}
        <div className={`bg-gradient-to-r ${headerBg} p-6 text-white relative overflow-hidden`}>
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full" />
          <div className="absolute -right-2 -bottom-6 w-24 h-24 bg-white/5 rounded-full" />
          
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ReceiptText className="w-5 h-5 text-white/60" />
                <span className="text-white/60 text-sm font-bold">Pedido</span>
              </div>
              <h2 className="text-4xl font-black tracking-tighter">#{order.id}</h2>
              <p className="text-white/60 text-sm font-medium mt-2 flex items-center gap-2">
                <Clock className="w-4 h-4" /> {new Date(order.created_at).toLocaleString('es-PE')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => onCopy(`Pedido #${order.id}`)} className="bg-white/10 p-2 rounded-xl hover:bg-white/20 transition"><Copy className="w-4 h-4" /></button>
              <button onClick={onClose} className="bg-white/10 p-2.5 rounded-xl hover:bg-white/20 transition"><X className="w-5 h-5" /></button>
            </div>
          </div>

          {/* Badges de pago y entrega */}
          <div className="flex gap-2 mt-4 relative z-10">
            <div className="bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
              {payment.icon} {payment.label}
            </div>
            <div className="bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
              {order.tipo_entrega === 'delivery' ? <Truck className="w-4 h-4" /> : <Store className="w-4 h-4" />}
              {order.tipo_entrega === 'delivery' ? 'Delivery' : 'Recojo en Tienda'}
            </div>
          </div>
        </div>

        {/* Cuerpo */}
        <div className="p-6 max-h-[55vh] overflow-y-auto bg-slate-50 space-y-5">
          
          {/* Evidencia de Pago (Yape/Plin) */}
          {(order.metodo_pago === 'yape' || order.metodo_pago === 'plin') && (
            <div className={`rounded-2xl border-2 border-dashed p-4 ${
              order.comprobante_url ? `${payment.border} ${payment.bg}` : 'border-amber-200 bg-amber-50'
            }`}>
              {order.comprobante_url ? (
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-xl bg-white overflow-hidden cursor-pointer shadow-sm border border-white" onClick={() => setLightbox(order.comprobante_url!)}>
                    <img src={order.comprobante_url} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <BadgeCheck className={`w-5 h-5 ${payment.color}`} />
                      <p className={`text-sm font-black ${payment.color}`}>Comprobante {payment.label}</p>
                    </div>
                    <button onClick={() => setLightbox(order.comprobante_url!)} className={`text-xs ${payment.bg} ${payment.color} ${payment.border} border px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 hover:opacity-80 transition`}>
                      <Eye className="w-3.5 h-3.5" /> Ver imagen completa
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                  <div>
                    <p className="text-sm font-black text-amber-800">Sin comprobante</p>
                    <p className="text-xs text-amber-600">El cliente no subió captura. Verifica manualmente.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Info del cliente */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl">
                {order.cliente_nombre.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-900 text-lg">{order.cliente_nombre}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm text-indigo-600 font-bold">{order.cliente_telefono}</span>
                  <button onClick={() => onCopy(order.cliente_telefono)} className="text-slate-300 hover:text-slate-500"><Copy className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
            
            {order.tipo_entrega === 'delivery' && (
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-slate-600 font-medium flex-1">{order.direccion}</p>
                </div>
                <button onClick={() => onOpenMap(order.direccion)} className="mt-2 text-xs flex items-center gap-1.5 text-blue-600 font-bold hover:text-blue-700 transition">
                  <Map className="w-3.5 h-3.5" /> Abrir en Google Maps <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            )}
            {order.tipo_entrega === 'recojo' && (
              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-bold text-emerald-700">Recojo en Bodega Jormard</span>
              </div>
            )}
          </div>

          {/* Lista de productos */}
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 pl-1">
              Productos ({order.items.length})
            </p>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              {order.items.map((item, idx) => {
                // Pedidos antiguos podían venir sin "cantidad" (default omitido al serializar)
                const qty = Number(item.cantidad ?? 1) || 1;
                const price = Number(item.precio ?? 0) || 0;
                return (
                  <div key={idx} className="flex justify-between items-center p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition">
                    <div className="flex items-center gap-3">
                      <span className="bg-slate-900 text-white font-black w-8 h-8 flex items-center justify-center rounded-xl text-sm shadow-sm">{qty}</span>
                      <span className="font-bold text-slate-700">{item.nombre}</span>
                    </div>
                    <span className="font-black text-slate-900 tabular-nums">S/ {(price * qty).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Total */}
          <div className="bg-slate-900 rounded-2xl p-5 flex items-center justify-between text-white">
            <div>
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Total a cobrar</span>
              <span className="text-slate-400 text-xs font-medium flex items-center gap-1 mt-0.5">{payment.icon} Vía {payment.label}</span>
            </div>
            <span className="text-4xl font-black tracking-tight">S/ {order.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Acciones */}
        <div className="p-6 bg-white border-t border-slate-100">
          {order.estado === 'pendiente' && (
            <div className="flex gap-3">
              <button onClick={() => onUpdateStatus(order.id, 'cancelado', order.user_id)} className="flex-1 py-4 rounded-2xl border-2 border-slate-200 font-bold text-slate-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all text-sm">
                Cancelar
              </button>
              <button onClick={() => onUpdateStatus(order.id, 'pagado', order.user_id)} className="flex-[2] py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-200 flex items-center justify-center gap-2 active:scale-[0.98] transition-all text-sm uppercase tracking-wide">
                <Banknote className="w-5 h-5" /> Confirmar Pago
              </button>
            </div>
          )}
          {order.estado === 'pagado' && (
            <button onClick={() => onUpdateStatus(order.id, 'preparando', order.user_id)} className="w-full py-5 rounded-2xl bg-sky-500 text-white font-black hover:bg-sky-600 shadow-xl shadow-sky-200 flex items-center justify-center gap-3 active:scale-[0.98] transition-all text-lg uppercase tracking-wide">
              <Package className="w-6 h-6" /> Marcar como Preparando
            </button>
          )}
          {order.estado === 'preparando' && (
            <button onClick={() => onUpdateStatus(order.id, 'atendido', order.user_id)} className="w-full py-5 rounded-2xl bg-emerald-500 text-white font-black hover:bg-emerald-600 shadow-xl shadow-emerald-200 flex items-center justify-center gap-3 active:scale-[0.98] transition-all text-lg uppercase tracking-wide">
              <CheckCircle2 className="w-6 h-6" /> {order.tipo_entrega === 'delivery' ? 'Marcar como Enviado' : 'Marcar como Entregado'}
            </button>
          )}
          <div className="mt-4 text-center">
            <button onClick={() => onDelete(order.id)} className="text-red-400 font-bold text-xs hover:text-red-600 flex items-center justify-center gap-1.5 mx-auto hover:bg-red-50 px-4 py-2 rounded-xl transition">
              <Trash2 className="w-3.5 h-3.5" /> Eliminar Pedido
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {lightbox && <ImageLightbox url={lightbox} onClose={() => setLightbox(null)} />}
      </AnimatePresence>
    </div>
  );
};

// ══════════════════════════════════════════════════════════
// FILTROS DE PEDIDOS (NUEVO)
// ══════════════════════════════════════════════════════════
const OrderFilters = ({ activeFilter, onFilterChange, orders }: {
  activeFilter: string, 
  onFilterChange: (f: string) => void,
  orders: Pedido[]
}) => {
  const filters = [
    { key: 'todos', label: 'Todos', count: orders.length },
    { key: 'pendiente', label: 'Pendientes', count: orders.filter(o => o.estado === 'pendiente').length },
    { key: 'pagado', label: 'Pagados', count: orders.filter(o => o.estado === 'pagado').length },
    { key: 'preparando', label: 'Preparando', count: orders.filter(o => o.estado === 'preparando').length },
    { key: 'atendido', label: 'Entregados', count: orders.filter(o => o.estado === 'atendido').length },
    { key: 'cancelado', label: 'Cancelados', count: orders.filter(o => o.estado === 'cancelado').length },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {filters.map(f => (
        <button
          key={f.key}
          onClick={() => onFilterChange(f.key)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${
            activeFilter === f.key 
              ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-300' 
              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
          }`}
        >
          {f.label}
          {f.count > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
              activeFilter === f.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {f.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

// ══════════════════════════════════════════════════════════
// EFECTO CONFETI (sin cambios)
// ══════════════════════════════════════════════════════════
const Confetti = () => {
    const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];
    return (
        <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
            {[...Array(50)].map((_, i) => (
                <motion.div key={i} initial={{ y: -20, x: Math.random() * 100 + 'vw', opacity: 1, rotate: 0 }} animate={{ y: '100vh', x: (Math.random() - 0.5) * 200 + 'px', opacity: 0, rotate: 360 }} transition={{ duration: Math.random() * 2 + 2, delay: Math.random() * 0.5, ease: 'linear' }} className="absolute w-3 h-3 rounded-sm" style={{ backgroundColor: colors[i % colors.length] }} />
            ))}
        </div>
    );
};

// ══════════════════════════════════════════════════════════
// CHATBOT (sin cambios significativos, solo mantener)
// ══════════════════════════════════════════════════════════
interface Message {
    id: number;
    text: string | React.ReactNode;
    sender: 'bot' | 'user';
    timestamp: Date;
}

const InventoryBot = ({ products, orders }: { products: Producto[], orders: Pedido[] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const lowStockItems = products.filter(p => p.stock < 10 && p.stock > 0);
    const criticalStockItems = products.filter(p => p.stock === 0);
    const pendingOrders = orders.filter(o => o.estado === 'pendiente');

    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{ id: 1, text: "¡Hola Jefe! 👋 Soy tu asistente Jormard. ¿Qué deseas revisar hoy?", sender: 'bot', timestamp: new Date() }]);
        }
    }, []);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

    const handleAction = (action: 'stock' | 'orders' | 'summary') => {
        const userMsg: Message = { id: Date.now(), text: action === 'stock' ? "Revisar Stock" : action === 'orders' ? "Ver Pedidos" : "Resumen del día", sender: 'user', timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);
        setTimeout(() => {
            let botResponse: React.ReactNode;
            if (action === 'stock') {
                if (criticalStockItems.length === 0 && lowStockItems.length === 0) botResponse = "✅ Todo excelente. No hay productos agotados ni con stock bajo.";
                else botResponse = (<div className="space-y-2"><p>He encontrado algunos detalles:</p>{criticalStockItems.length > 0 && <div className="bg-red-50 p-2 rounded-lg border border-red-100 text-red-800 text-sm"><strong>🚨 {criticalStockItems.length} Agotados:</strong><ul className="list-disc pl-4 mt-1">{criticalStockItems.slice(0, 3).map(p => <li key={p.id}>{p.nombre}</li>)}</ul></div>}{lowStockItems.length > 0 && <div className="bg-orange-50 p-2 rounded-lg border border-orange-100 text-orange-800 text-sm"><strong>⚠️ {lowStockItems.length} Por acabarse:</strong><ul className="list-disc pl-4 mt-1">{lowStockItems.slice(0, 3).map(p => <li key={p.id}>{p.nombre} ({p.stock})</li>)}</ul></div>}</div>);
            } else if (action === 'orders') {
                botResponse = pendingOrders.length === 0 ? "👍 No tienes pedidos pendientes. ¡Estamos al día!" : <div><p>Hay <b>{pendingOrders.length} pedidos</b> esperando atención.</p></div>;
            } else {
                const totalSales = orders.filter(o => o.estado === 'atendido').reduce((acc, curr) => acc + curr.total, 0);
                botResponse = `💰 Hoy has vendido S/ ${totalSales.toFixed(2)}. Tienes ${products.length} productos activos.`;
            }
            setMessages(prev => [...prev, { id: Date.now() + 1, text: botResponse, sender: 'bot', timestamp: new Date() }]);
            setIsTyping(false);
        }, 1000);
    };

    return (
        <div className="fixed bottom-6 right-6 z-[90] flex flex-col items-end gap-4 font-sans">
            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-80 sm:w-96 mb-2 overflow-hidden flex flex-col h-[500px]">
                        <div className="bg-slate-900 p-4 flex items-center justify-between"><div className="flex items-center gap-3"><div className="relative"><div className="bg-indigo-500 p-2 rounded-xl text-white"><Bot size={24} /></div><span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-slate-900 rounded-full"></span></div><div><h4 className="font-bold text-white text-base">Asistente Jormard</h4><p className="text-xs text-slate-400">IA de Inventario</p></div></div><button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition"><X size={20}/></button></div>
                        <div className="flex-1 bg-slate-50 p-4 overflow-y-auto space-y-4">{messages.map((msg) => (<motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'}`}>{msg.text}</div></motion.div>))}{isTyping && (<div className="flex justify-start"><div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-bl-none flex gap-1 items-center"><span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span><span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span><span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span></div></div>)}<div ref={messagesEndRef} /></div>
                        <div className="p-4 bg-white border-t border-slate-100"><p className="text-xs font-bold text-slate-400 uppercase mb-2">Acciones Rápidas</p><div className="flex flex-wrap gap-2"><button onClick={() => handleAction('stock')} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1"><AlertTriangle size={12}/> Stock</button><button onClick={() => handleAction('orders')} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1"><ShoppingBag size={12}/> Pedidos</button><button onClick={() => handleAction('summary')} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1"><BarChart3 size={12}/> Resumen</button></div></div>
                    </motion.div>
                )}
            </AnimatePresence>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsOpen(!isOpen)} className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-2xl shadow-indigo-300 flex items-center justify-center relative z-50 transition-colors">
                {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
                {(lowStockItems.length > 0 || pendingOrders.length > 0) && (<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white animate-pulse">!</span>)}
            </motion.button>
        </div>
    );
};

// ══════════════════════════════════════════════════════════
// TOUR GUIDE (sin cambios, se mantiene igual)
// ══════════════════════════════════════════════════════════
const TourGuide = ({ isOpen, onClose, setView }: { isOpen: boolean, onClose: () => void, setView: (view: any) => void }) => {
    const [step, setStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
    const [showConfetti, setShowConfetti] = useState(false);
    const steps = [
        { title: "👋 Bienvenido Jefe", desc: "Este es tu panel de control profesional. Vamos a dar un paseo rápido.", targetId: null, view: 'dashboard' },
        { title: "1. Resumen (Dashboard)", desc: "Aquí ves tus ventas del día, pedidos pendientes y alertas de stock.", targetId: 'nav-dashboard', mobileId: 'nav-dashboard-mobile', view: 'dashboard' },
        { title: "2. Pedidos", desc: "Aquí recibes las compras. ¡Vamos a ver la pantalla de pedidos!", targetId: 'nav-orders', mobileId: 'nav-orders-mobile', view: 'orders' },
        { title: "3. Inventario", desc: "La sección más importante: Tus Productos.", targetId: 'nav-inventory', mobileId: 'nav-inventory-mobile', view: 'inventory' },
        { title: "4. Clientes", desc: "Aquí verás tu base de datos de clientes frecuentes.", targetId: 'nav-customers', mobileId: 'nav-customers-mobile', view: 'customers' },
        { title: "¡Todo Listo!", desc: "Ya eres un experto. ¡A vender se ha dicho!", targetId: null, view: 'dashboard' }
    ];
    useEffect(() => { if (steps[step].view) setView(steps[step].view); }, [step]);
    const updatePosition = () => { setTimeout(() => { const currentStep = steps[step]; let el: HTMLElement | null = null; if (currentStep.targetId) { el = document.getElementById(currentStep.targetId); if (el && window.getComputedStyle(el).display === 'none' && currentStep.mobileId) el = document.getElementById(currentStep.mobileId); } if (!el && currentStep.mobileId) el = document.getElementById(currentStep.mobileId); if (el) { const rect = el.getBoundingClientRect(); setTargetRect(rect); const isSidebar = rect.height > window.innerHeight * 0.8 || rect.left < 100; if (isSidebar) setTooltipStyle({ top: `${rect.top + 20}px`, left: `${rect.right + 25}px` }); else { const showBelow = window.innerHeight - rect.bottom > 250; setTooltipStyle({ top: showBelow ? `${rect.bottom + 20}px` : 'auto', bottom: !showBelow ? `${window.innerHeight - rect.top + 20}px` : 'auto', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '380px' }); } } else { setTargetRect(null); setTooltipStyle({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: '420px' }); } }, 300); };
    useLayoutEffect(() => { if (isOpen) { updatePosition(); window.addEventListener('resize', updatePosition); return () => window.removeEventListener('resize', updatePosition); } }, [step, isOpen]);
    const handleNext = () => { if (step < steps.length - 1) setStep(step + 1); else { setShowConfetti(true); setTimeout(() => { onClose(); setShowConfetti(false); }, 4000); } };
    if (!isOpen) return null;
    return (<>{showConfetti && <Confetti />}<div className="fixed inset-0 z-[120] overflow-hidden"><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0" style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', clipPath: targetRect ? `polygon(0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%, ${targetRect.left}px ${targetRect.top}px, ${targetRect.right}px ${targetRect.top}px, ${targetRect.right}px ${targetRect.bottom}px, ${targetRect.left}px ${targetRect.bottom}px, ${targetRect.left}px ${targetRect.top}px)` : undefined }} />{targetRect && <motion.div layoutId="tour-ring" className="absolute border-4 border-indigo-500 rounded-xl shadow-[0_0_30px_rgba(99,102,241,0.6)]" style={{ top: targetRect.top - 8, left: targetRect.left - 8, width: targetRect.width + 16, height: targetRect.height + 16 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />}<motion.div key={step} initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="absolute bg-white p-6 rounded-3xl shadow-2xl border border-slate-100" style={tooltipStyle}><div className="flex justify-between items-start mb-4"><div className="bg-indigo-100 p-2.5 rounded-2xl text-indigo-600">{step === steps.length - 1 ? <Trophy size={24} /> : <Flag size={24}/>}</div><span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{step + 1} / {steps.length}</span></div><h3 className="text-2xl font-black text-slate-900 mb-3">{steps[step].title}</h3><p className="text-slate-500 text-base leading-relaxed mb-8">{steps[step].desc}</p><div className="flex justify-between items-center"><button onClick={onClose} className="text-slate-400 font-bold text-sm hover:text-slate-600">Omitir</button><button onClick={handleNext} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center gap-2 active:scale-95">{step === steps.length - 1 ? '¡Finalizar!' : 'Siguiente'} <ArrowRight size={18}/></button></div></motion.div></div></>);
};

// ══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL - AdminDashboard
// ══════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════
// VISOR DE IMAGEN (modal, no abre pestaña nueva)
// ══════════════════════════════════════════════════════════
const ImageLightbox = ({ url, onClose }: { url: string, onClose: () => void }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
        onClick={(e) => e.stopPropagation()} className="relative max-w-3xl w-full">
        <div className="flex justify-end gap-2 mb-3">
          <a href={url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
            className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full backdrop-blur-sm transition" title="Abrir original">
            <ExternalLink className="w-5 h-5" />
          </a>
          <button onClick={onClose} className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-full backdrop-blur-sm transition" title="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>
        <img src={url} alt="Comprobante" className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl bg-white" />
      </motion.div>
    </motion.div>
  );
};

// ══════════════════════════════════════════════════════════
// EDITOR DE BANNER DE LA APP (dinámico)
// ══════════════════════════════════════════════════════════
const BannerEditor = ({ supabase, showToast }: { supabase: any, showToast: (m: string, t: 'success' | 'error') => void }) => {
  const [cfg, setCfg] = useState({ banner_activo: false, banner_titulo: '', banner_subtitulo: '', banner_color: '#6366F1' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('app_config').select('*').eq('id', 1).maybeSingle();
      if (data) setCfg({
        banner_activo: data.banner_activo ?? false,
        banner_titulo: data.banner_titulo ?? '',
        banner_subtitulo: data.banner_subtitulo ?? '',
        banner_color: data.banner_color ?? '#6366F1',
      });
    })();
  }, [supabase]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('app_config').update({
      banner_activo: cfg.banner_activo,
      banner_titulo: cfg.banner_titulo,
      banner_subtitulo: cfg.banner_subtitulo,
      banner_color: cfg.banner_color,
    }).eq('id', 1);
    setSaving(false);
    if (error) showToast('Error al guardar: ' + error.message, 'error');
    else showToast('Banner actualizado ✓', 'success');
  };

  const colors = ['#6366F1', '#E11D48', '#059669', '#EA580C', '#0EA5E9', '#DB2777', '#0F172A', '#F59E0B'];

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 p-2.5 rounded-2xl text-indigo-600"><Megaphone className="w-5 h-5" /></div>
          <div>
            <h3 className="font-black text-slate-900 text-lg leading-tight">Banner de la App</h3>
            <p className="text-xs text-slate-400 font-medium">Aparece arriba en la tienda del cliente</p>
          </div>
        </div>
        <button onClick={() => setCfg({ ...cfg, banner_activo: !cfg.banner_activo })} className={`relative w-14 h-8 rounded-full transition-colors flex-shrink-0 ${cfg.banner_activo ? 'bg-indigo-600' : 'bg-slate-200'}`}>
          <span className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${cfg.banner_activo ? 'translate-x-6' : ''}`} />
        </button>
      </div>

      <div className="rounded-2xl p-5 mb-5 relative overflow-hidden shadow-inner" style={{ background: `linear-gradient(90deg, ${cfg.banner_color}, ${cfg.banner_color}cc)` }}>
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full" />
        <p className="text-white font-black text-lg relative z-10">{cfg.banner_titulo || 'Título del banner'}</p>
        <p className="text-white/80 text-sm relative z-10">{cfg.banner_subtitulo || 'Subtítulo opcional'}</p>
      </div>

      <div className="space-y-3">
        <input value={cfg.banner_titulo} onChange={e => setCfg({ ...cfg, banner_titulo: e.target.value })} placeholder="Título (ej. ¡Delivery gratis hoy!)" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-700" />
        <input value={cfg.banner_subtitulo} onChange={e => setCfg({ ...cfg, banner_subtitulo: e.target.value })} placeholder="Subtítulo (opcional)" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700" />
        <div className="flex items-center gap-2.5 flex-wrap py-1">
          {colors.map(c => (
            <button key={c} onClick={() => setCfg({ ...cfg, banner_color: c })} className={`w-8 h-8 rounded-full border-2 transition-transform ${cfg.banner_color === c ? 'border-slate-900 scale-110' : 'border-white shadow-sm'}`} style={{ background: c }} />
          ))}
        </div>
        <button onClick={save} disabled={saving} className="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2">
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Guardar banner</>}
        </button>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  // --- ESTADOS (mismos que tenías) ---
  const [currentView, setCurrentView] = useState<'dashboard' | 'orders' | 'inventory' | 'customers'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);
  const [dynamicCategories, setDynamicCategories] = useState<string[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [bulkCategory, setBulkCategory] = useState('');
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerTitle, setOfferTitle] = useState('¡Nuevas Ofertas Relámpago! ⚡');
  const [offerBody, setOfferBody] = useState('Aprovecha nuestros descuentos por tiempo limitado en la Bodega. ¡Corre que se acaban!');
  const [sendingOffers, setSendingOffers] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('todos'); // NUEVO
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [products, setProducts] = useState<Producto[]>([]);
  const [orders, setOrders] = useState<Pedido[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Pedido | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const formTopRef = useRef<HTMLDivElement>(null);
  const [newProduct, setNewProduct] = useState({ nombre: '', precio: '', stock: '', imagen_url: '', categoria: '', oferta_activa: false, precio_oferta: '', hora_inicio: '07:00', hora_fin: '22:00' });
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const showToast = (msg: string, type: 'success'|'error') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };
  const playNotificationSound = () => { const audio = new Audio('/notification.mp3'); audio.play().catch(() => {}); };
  const handleOpenMap = (address: string) => { if (!address) return showToast("No hay dirección", 'error'); window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank'); };
  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); showToast("Copiado", 'success'); };

  // --- EFECTOS (mismos) ---
  useEffect(() => {
    fetchData();
    const hasSeenAdminTour = localStorage.getItem('hasSeenAdminTour');
    if (!hasSeenAdminTour) setTimeout(() => setShowGuide(true), 1500);
    const channel = supabase.channel('admin-dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, (payload) => {
        if (payload.eventType === 'INSERT') { const n = payload.new as Pedido; setOrders(prev => [n, ...prev]); showToast(`¡Nuevo pedido de ${n.cliente_nombre}!`, 'success'); playNotificationSound(); }
        else if (payload.eventType === 'UPDATE') { const u = payload.new as Pedido; setOrders(prev => prev.map(o => o.id === u.id ? u : o)); setSelectedOrder(prev => prev && prev.id === u.id ? u : prev); }
        else if (payload.eventType === 'DELETE') { const d = payload.old.id; setOrders(prev => prev.filter(o => o.id !== d)); setSelectedOrder(prev => prev && prev.id === d ? null : prev); }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, (payload) => {
        if (payload.eventType === 'INSERT') setProducts(prev => [payload.new as Producto, ...prev]);
        else if (payload.eventType === 'UPDATE') setProducts(prev => prev.map(p => p.id === (payload.new as Producto).id ? payload.new as Producto : p));
        else if (payload.eventType === 'DELETE') setProducts(prev => prev.filter(p => p.id !== (payload.old as Producto).id));
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => { setSelectedProductIds([]); }, [currentView]);
  const closeTour = () => { setShowGuide(false); localStorage.setItem('hasSeenAdminTour', 'true'); };

  const fetchData = async () => { setLoading(true); await Promise.all([fetchProducts(), fetchOrders(), fetchCategories()]); setLoading(false); };
  const fetchCategories = async () => { const { data } = await supabase.from('categorias').select('nombre').order('nombre'); if (data) setDynamicCategories(data.map(c => c.nombre)); };
  
  const syncCategoriesWithProducts = async (currentProducts: Producto[]) => {
    const { data: dbCats } = await supabase.from('categorias').select('nombre');
    const existingNames = new Set(dbCats?.map(c => c.nombre.toLowerCase()) || []);
    const productsCats = new Set(currentProducts.map(p => p.categoria));
    const newCats: string[] = [];
    productsCats.forEach(cat => { if (cat && !existingNames.has(cat.toLowerCase())) newCats.push(cat); });
    if (newCats.length > 0) {
      const { error } = await supabase.from('categorias').insert(newCats.map(nombre => ({ nombre })));
      if (!error) { await fetchCategories(); showToast(`Se agregaron ${newCats.length} categorías nuevas`, 'success'); }
    }
  };

  const fetchProducts = async () => { const { data } = await supabase.from('productos').select('*').order('id', { ascending: false }); if (data) { setProducts(data); syncCategoriesWithProducts(data); } };
  const fetchOrders = async () => { const { data } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false }); if (data) setOrders(data); };

  // Notificaciones globales
  const handleSendGlobalOffer = async () => {
    if (!offerTitle || !offerBody) return showToast("Llena el título y el mensaje", "error");
    setSendingOffers(true);
    try {
      const { data: tokens } = await supabase.from('fcm_tokens').select('token');
      if (!tokens || tokens.length === 0) { showToast("No hay clientes registrados", "error"); setSendingOffers(false); return; }
      let sentCount = 0;
      for (const t of tokens) { try { await fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: t.token, title: offerTitle, body: offerBody }) }); sentCount++; } catch (e) {} }
      showToast(`¡Enviado a ${sentCount} clientes! 🚀`, "success");
      setShowOfferModal(false);
    } catch { showToast("Error enviando notificaciones", "error"); }
    setSendingOffers(false);
  };

  // Selección múltiple
  const toggleSelectProduct = (id: number) => { setSelectedProductIds(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]); };
  const handleBulkDelete = async () => { if (!confirm(`¿ELIMINAR ${selectedProductIds.length} productos?`)) return; const { error } = await supabase.from('productos').delete().in('id', selectedProductIds); if (!error) { showToast(`Eliminados ${selectedProductIds.length} productos`, 'success'); setSelectedProductIds([]); fetchProducts(); } else showToast("Error", 'error'); };
  const handleBulkCategoryUpdate = async () => { if (!bulkCategory) return showToast("Selecciona categoría", 'error'); const { error } = await supabase.from('productos').update({ categoria: bulkCategory }).in('id', selectedProductIds); if (!error) { showToast(`Actualizados ${selectedProductIds.length} productos`, 'success'); setSelectedProductIds([]); setBulkCategory(''); fetchProducts(); } else showToast("Error", 'error'); };

  // Imágenes
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { if (!e.target.files?.[0]) return; setUploadingImage(true); const file = e.target.files[0]; const filePath = `${Date.now()}.${file.name.split('.').pop()}`; try { await supabase.storage.from('productos').upload(filePath, file); const { data } = supabase.storage.from('productos').getPublicUrl(filePath); setNewProduct({ ...newProduct, imagen_url: data.publicUrl }); showToast("Imagen subida", 'success'); } catch { showToast("Error", 'error'); } finally { setUploadingImage(false); } };

  // Productos CRUD
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.nombre || !newProduct.precio) return showToast("Faltan datos", 'error');
    const productData = { nombre: newProduct.nombre, precio: parseFloat(newProduct.precio), stock: parseInt(newProduct.stock), imagen_url: newProduct.imagen_url || '/placeholder.png', categoria: newProduct.categoria || 'Abarrotes', oferta_activa: newProduct.oferta_activa, precio_oferta: newProduct.oferta_activa ? parseFloat(newProduct.precio_oferta) : null, hora_inicio: newProduct.oferta_activa ? newProduct.hora_inicio : null, hora_fin: newProduct.oferta_activa ? newProduct.hora_fin : null };
    // ¿Se está ACTIVANDO la oferta ahora? (antes estaba apagada o es producto nuevo)
    const previo = editingId ? products.find(p => p.id === editingId) : null;
    const ofertaRecienActivada = productData.oferta_activa && !previo?.oferta_activa;

    const { error } = editingId ? await supabase.from('productos').update(productData).eq('id', editingId) : await supabase.from('productos').insert([productData]);
    if (error) showToast("Error: " + error.message, 'error');
    else {
      showToast(editingId ? "Actualizado" : "Creado", 'success');
      resetForm();
      if (ofertaRecienActivada) notificarOferta(productData.nombre, productData.precio, productData.precio_oferta);
    }
  };

  // Push automático a todos los clientes cuando se activa una oferta
  const notificarOferta = async (nombre: string, precio: number, precioOferta: number | null) => {
    try {
      const { data: tokens } = await supabase.from('fcm_tokens').select('token');
      if (!tokens || tokens.length === 0) return;
      const dcto = precioOferta && precio > 0 ? Math.round(((precio - precioOferta) / precio) * 100) : 0;
      const title = dcto > 0 ? `⚡ ${nombre} con ${dcto}% de descuento` : `⚡ ¡Oferta en ${nombre}!`;
      const body = precioOferta ? `Ahora a S/ ${precioOferta.toFixed(2)} (antes S/ ${precio.toFixed(2)}). ¡Aprovecha!` : '¡Aprovecha esta oferta por tiempo limitado!';
      await Promise.allSettled(tokens.map((t: any) =>
        fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: t.token, title, body }) })
      ));
      showToast(`Oferta notificada a ${tokens.length} clientes ⚡`, 'success');
    } catch {}
  };
  const handleEditClick = (p: Producto) => { setNewProduct({ nombre: p.nombre, precio: p.precio.toString(), stock: p.stock.toString(), imagen_url: p.imagen_url, categoria: p.categoria, oferta_activa: p.oferta_activa, precio_oferta: p.precio_oferta ? p.precio_oferta.toString() : '', hora_inicio: p.hora_inicio ? p.hora_inicio.slice(0, 5) : '07:00', hora_fin: p.hora_fin ? p.hora_fin.slice(0, 5) : '22:00' }); setEditingId(p.id); formTopRef.current?.scrollIntoView({ behavior: 'smooth' }); };
  const resetForm = () => { setNewProduct({ nombre: '', precio: '', stock: '', imagen_url: '', categoria: '', oferta_activa: false, precio_oferta: '', hora_inicio: '07:00', hora_fin: '22:00' }); setEditingId(null); };
  const handleDeleteProduct = async (id: number) => { if (confirm('¿Borrar permanentemente?')) { await supabase.from('productos').delete().eq('id', id); showToast("Eliminado", 'success'); if (editingId === id) resetForm(); } };

  // Excel
  const handleDownloadTemplate = () => { const d = [{ Nombre: "Coca Cola 3L", Precio: 12.50, Stock: 50, Categoria: "Bebidas", Imagen: "" }]; const ws = XLSX.utils.json_to_sheet(d); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Plantilla"); XLSX.writeFile(wb, "Plantilla_Carga_Masiva.xlsx"); showToast("Descargada", 'success'); };
  const handleExportInventory = () => { if (products.length === 0) return showToast("No hay productos", 'error'); const d = products.map(p => ({ Nombre: p.nombre, Precio: p.precio, Stock: p.stock, Categoria: p.categoria, Imagen: p.imagen_url || '', Oferta: p.oferta_activa ? "SI" : "NO", Precio_Oferta: p.precio_oferta || 0 })); const ws = XLSX.utils.json_to_sheet(d); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Inventario"); XLSX.writeFile(wb, `Inventario_${new Date().toISOString().split('T')[0]}.xlsx`); showToast("Exportado", 'success'); };
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => { if (!e.target.files?.[0]) return; const reader = new FileReader(); reader.onload = async (evt) => { try { const wb = XLSX.read(evt.target?.result, { type: 'binary' }); const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]); const cats = new Set<string>(); const formatted = data.map((row: any) => { const cat = (row.categoria || row.Categoria || 'Otros').toString().trim(); const norm = cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase(); cats.add(norm); return { nombre: row.nombre || row.Nombre, precio: parseFloat(row.precio || row.Precio || 0), stock: parseInt(row.stock || row.Stock || 0), categoria: norm, imagen_url: row.imagen_url || row.Imagen || '/placeholder.png' }; }); const currentLower = dynamicCategories.map(c => c.toLowerCase()); const newCats = Array.from(cats).filter(c => !currentLower.includes(c.toLowerCase())); if (newCats.length > 0) { await supabase.from('categorias').insert(newCats.map(n => ({ nombre: n }))); await fetchCategories(); } const { error } = await supabase.from('productos').upsert(formatted, { onConflict: 'nombre' }); if (error) throw error; showToast(`${formatted.length} productos procesados`, 'success'); fetchProducts(); } catch (error: any) { showToast("Error: " + error.message, 'error'); } if (excelInputRef.current) excelInputRef.current.value = ''; }; reader.readAsBinaryString(e.target.files[0]); };

  // Pedidos
  const handleUpdateOrderStatus = async (id: number, status: 'pagado' | 'preparando' | 'atendido' | 'cancelado', userId?: string) => {
    const { error } = await supabase.from('pedidos').update({ estado: status }).eq('id', id);
    if (error) return showToast("Error", 'error');
    setOrders(prev => prev.map(o => o.id === id ? { ...o, estado: status } : o));
    if (selectedOrder) setSelectedOrder({ ...selectedOrder, estado: status });
    if (status === 'atendido' || status === 'cancelado') { showToast(status === 'atendido' ? "¡Completado!" : "Cancelado", status === 'atendido' ? 'success' : 'error'); setTimeout(() => setSelectedOrder(null), 300); }
    else showToast("Pago Confirmado", 'success');
    if (userId) { try { const { data: tokenData } = await supabase.from('fcm_tokens').select('token').eq('user_id', userId).single(); if (tokenData?.token) { let title = "Actualización de Pedido 📦", body = `Tu pedido #${id}: ${status.toUpperCase()}`; if (status === 'atendido') { title = "¡Tu pedido está listo! 🎉"; body = "Ya puedes recogerlo o está en camino."; } else if (status === 'pagado') { title = "¡Pago Confirmado! 💸"; body = "Empezaremos a preparar tu pedido."; } await fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: tokenData.token, title, body }) }); } } catch {} }
  };
  const handleDeleteOrder = async (id: number) => { if (!confirm('¿ELIMINAR este pedido?')) return; const { error } = await supabase.from('pedidos').delete().eq('id', id); if (!error) { setOrders(prev => prev.filter(o => o.id !== id)); setSelectedOrder(null); showToast("Eliminado", 'success'); } else showToast("Error", 'error'); };

  // Métricas
  const totalVentas = orders.filter(o => o.estado === 'atendido').reduce((acc, o) => acc + o.total, 0);
  const pendientes = orders.filter(o => o.estado === 'pendiente').length;
  const lowStock = products.filter(p => p.stock < 5).length;
  const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).length;

  // Clientes
  const uniqueCustomers = Array.from(new Set(orders.map(o => o.cliente_nombre))).map(name => { const co = orders.filter(o => o.cliente_nombre === name); const sorted = co.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); return { name, phone: co[0].cliente_telefono, totalSpent: co.reduce((acc, c) => acc + (c.estado === 'atendido' ? c.total : 0), 0), orderCount: co.length, lastOrder: sorted[0].created_at }; }).sort((a,b) => b.totalSpent - a.totalSpent);
  const filteredCustomers = uniqueCustomers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch));
  const getAvatarColor = (name: string) => { const colors = ['bg-red-100 text-red-600', 'bg-blue-100 text-blue-600', 'bg-green-100 text-green-600', 'bg-yellow-100 text-yellow-600', 'bg-purple-100 text-purple-600', 'bg-pink-100 text-pink-600']; let hash = 0; for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash); return colors[Math.abs(hash) % colors.length]; };

  // Inventario agrupado
  const getGroupedProducts = () => { const f = products.filter(p => p.nombre.toLowerCase().includes(productSearch.toLowerCase())); const g: Record<string, Producto[]> = {}; f.forEach(p => { const c = p.categoria || 'Otros'; if (!g[c]) g[c] = []; g[c].push(p); }); return Object.keys(g).sort().reduce((o, k) => { o[k] = g[k]; return o; }, {} as Record<string, Producto[]>); };
  const groupedProducts = getGroupedProducts();

  // Filtrado de pedidos
  const filteredOrders = orders.filter(o => {
    const matchSearch = o.cliente_nombre.toLowerCase().includes(orderSearch.toLowerCase());
    const matchStatus = orderStatusFilter === 'todos' || o.estado === orderStatusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex selection:bg-indigo-200">
      <AnimatePresence>
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        {showGuide && <TourGuide isOpen={showGuide} onClose={closeTour} setView={setCurrentView} />}
      </AnimatePresence>
      <InventoryBot products={products} orders={orders} />

      {/* SIDEBAR DESKTOP */}
      <aside className="hidden lg:flex w-64 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 flex-col fixed h-full z-20 shadow-2xl">
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-900/40"><LayoutDashboard className="w-6 h-6"/></div>
          <div><span className="font-black text-xl tracking-tight block leading-none text-white">Jormard</span><span className="text-[10px] font-bold text-indigo-300/70 uppercase tracking-widest">Admin Panel</span></div>
        </div>
        <nav className="flex-1 p-4 space-y-1.5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-4 pt-1 pb-1">Principal</p>
          <button id="nav-dashboard" onClick={() => setCurrentView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all ${currentView === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><BarChart3 className="w-5 h-5"/> Resumen</button>
          <button id="nav-orders" onClick={() => setCurrentView('orders')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all ${currentView === 'orders' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><ShoppingBag className="w-5 h-5"/> Pedidos {pendientes > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse">{pendientes}</span>}</button>
          <button id="nav-inventory" onClick={() => setCurrentView('inventory')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all ${currentView === 'inventory' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><Package className="w-5 h-5"/> Inventario</button>
          <button id="nav-customers" onClick={() => setCurrentView('customers')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all ${currentView === 'customers' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><Users className="w-5 h-5"/> Clientes</button>
        </nav>
        <div className="p-4 border-t border-white/5 space-y-1">
          <button onClick={() => setShowGuide(true)} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition"><HelpCircle className="w-4 h-4"/> Tutorial</button>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-400 rounded-xl hover:bg-red-500/10 transition"><LogOut className="w-4 h-4"/> Salir</button>
        </div>
      </aside>

      {/* SIDEBAR MOBILE */}
      <AnimatePresence>
        {isMobileMenuOpen && (<><motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"/><motion.div initial={{x:'-100%'}} animate={{x:0}} exit={{x:'-100%'}} className="fixed left-0 top-0 h-full w-[280px] bg-gradient-to-b from-slate-900 to-slate-950 z-50 shadow-2xl flex flex-col lg:hidden"><div className="p-6 border-b border-white/5 text-white flex items-center gap-3"><div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2 rounded-xl"><LayoutDashboard className="w-5 h-5"/></div> <span className="font-black text-xl">Panel Jefe</span></div><nav className="flex-1 p-4 space-y-1"><button id="nav-dashboard-mobile" onClick={() => { setCurrentView('dashboard'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold ${currentView === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><BarChart3 className="w-5 h-5"/> Resumen</button><button id="nav-orders-mobile" onClick={() => { setCurrentView('orders'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold ${currentView === 'orders' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><ShoppingBag className="w-5 h-5"/> Pedidos</button><button id="nav-inventory-mobile" onClick={() => { setCurrentView('inventory'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold ${currentView === 'inventory' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><Package className="w-5 h-5"/> Inventario</button><button id="nav-customers-mobile" onClick={() => { setCurrentView('customers'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold ${currentView === 'customers' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><Users className="w-5 h-5"/> Clientes</button></nav><div className="p-4"><button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 font-bold hover:bg-red-500/20 transition"><LogOut className="w-5 h-5"/> Salir</button></div></motion.div></>)}
      </AnimatePresence>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 lg:ml-64 p-4 sm:p-8 max-w-[1920px] mx-auto w-full">
        {/* Top Bar Mobile */}
        <div className="lg:hidden flex items-center justify-between mb-6">
          <div className="flex items-center gap-3"><button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-white rounded-xl shadow-sm border border-slate-200"><Menu className="w-6 h-6 text-slate-700"/></button><span className="font-extrabold text-lg text-slate-900">Bodega Jormard</span></div>
          <button onClick={() => setShowOfferModal(true)} className="p-2 bg-orange-500 rounded-full shadow-sm text-white"><Megaphone className="w-5 h-5"/></button>
        </div>

        {/* ═══════════ DASHBOARD ═══════════ */}
        {currentView === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div><h1 className="text-4xl font-black text-slate-900 tracking-tight">Buenos días, Jefe 👋</h1><p className="text-slate-500 font-medium mt-1">Aquí tienes el resumen de hoy.</p></div>
              <div className="flex gap-2">
                <button onClick={() => setShowOfferModal(true)} className="hidden sm:flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 shadow-sm transition active:scale-95"><Megaphone className="w-4 h-4"/> Notificar Ofertas</button>
                <button onClick={() => { playNotificationSound(); showToast("Sonido OK", 'success'); }} className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 shadow-sm"><Volume2 className="w-4 h-4"/> Probar Sonido</button>
              </div>
            </div>

            {/* STATS con gradientes modernos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatCard title="Ventas Totales" value={`S/ ${totalVentas.toFixed(2)}`} icon={<TrendingUp className="w-7 h-7 text-white" />} bgGradient="bg-gradient-to-br from-emerald-500 to-teal-600" subtext="Ingresos netos" trend="up" color={''} />
              <StatCard title="Pendientes" value={`${pendientes}`} icon={<Bell className="w-7 h-7 text-white" />} bgGradient="bg-gradient-to-br from-amber-500 to-orange-600" subtext="Requieren atención" color={''} />
              <StatCard title="Stock Bajo" value={`${lowStock}`} icon={<AlertTriangle className="w-7 h-7 text-white" />} bgGradient="bg-gradient-to-br from-red-500 to-rose-600" subtext="Productos < 5 un." color={''} />
              <StatCard title="Pedidos Hoy" value={`${todayOrders}`} icon={<ShoppingBag className="w-7 h-7 text-white" />} bgGradient="bg-gradient-to-br from-indigo-500 to-violet-600" subtext={`${uniqueCustomers.length} clientes`} color={''} />
            </div>

            {/* Banner de la app + Breakdown de pagos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BannerEditor supabase={supabase} showToast={showToast} />
              <PaymentBreakdown orders={orders} />
            </div>

            {/* Últimos pedidos */}
            <div>
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-slate-900">Últimos Pedidos</h3>
                  <button onClick={() => setCurrentView('orders')} className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">Ver todos <ArrowRight className="w-4 h-4" /></button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-slate-400 font-bold uppercase text-xs border-b border-slate-100"><tr><th className="pb-4 pl-2">#</th><th className="pb-4">Cliente</th><th className="pb-4">Pago</th><th className="pb-4">Monto</th><th className="pb-4">Estado</th></tr></thead>
                    <tbody className="divide-y divide-slate-50">
                      {orders.slice(0, 6).map(o => {
                        const pay = getPaymentConfig(o.metodo_pago);
                        const st = getStatusConfig(o.estado);
                        return (
                          <tr key={o.id} className="group hover:bg-slate-50 transition cursor-pointer" onClick={() => { setSelectedOrder(o); setCurrentView('orders'); }}>
                            <td className="py-3.5 pl-2 font-bold text-slate-500">#{o.id}</td>
                            <td className="py-3.5 font-bold text-slate-900">{o.cliente_nombre}</td>
                            <td className="py-3.5"><span className={`flex items-center gap-1.5 text-xs font-bold ${pay.color}`}>{pay.icon}{pay.label}</span></td>
                            <td className="py-3.5 font-black text-slate-900 tabular-nums">S/ {o.total.toFixed(2)}</td>
                            <td className="py-3.5"><span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${st.bg} ${st.color}`}>{st.label}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ PEDIDOS ═══════════ */}
        {currentView === 'orders' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-3xl font-black text-slate-900">Gestión de Pedidos</h2>
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400"/>
                  <input type="text" placeholder="Buscar cliente..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)} className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full shadow-sm font-medium"/>
                </div>
              </div>
              
              {/* NUEVO: Filtros de estado */}
              <OrderFilters activeFilter={orderStatusFilter} onFilterChange={setOrderStatusFilter} orders={orders} />
            </div>

            {loading ? <div className="text-center py-20"><Loader2 className="animate-spin w-12 h-12 mx-auto text-slate-300"/></div> : (
              filteredOrders.length === 0 ? (
                <div className="text-center py-32 opacity-40"><ShoppingBag className="w-24 h-24 mx-auto mb-6 text-slate-300"/><p className="text-xl font-bold text-slate-400">No hay pedidos que mostrar.</p></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  <AnimatePresence>
                    {filteredOrders.map(order => (
                      <OrderCard key={order.id} order={order} onClick={() => setSelectedOrder(order)} />
                    ))}
                  </AnimatePresence>
                </div>
              )
            )}
          </div>
        )}

        {/* ═══════════ INVENTARIO (mismo que tenías, sin cambios) ═══════════ */}
        {currentView === 'inventory' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-4 relative pb-20">
            <div className="lg:col-span-1" ref={formTopRef}>
              <div className={`bg-white p-6 rounded-3xl shadow-sm border sticky top-24 transition-colors ${editingId ? 'border-orange-400 ring-4 ring-orange-50' : 'border-slate-200'}`}>
                <h2 className="text-xl font-black flex items-center gap-2 mb-6 text-slate-900">{editingId ? <Pencil className="w-6 h-6 text-orange-600"/> : <Plus className="w-6 h-6 text-indigo-600"/>} {editingId ? "Editar Producto" : "Nuevo Producto"}</h2>
                <form onSubmit={handleSaveProduct} className="space-y-5">
                  <div className="space-y-1.5"><label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Nombre</label><input type="text" value={newProduct.nombre} onChange={e => setNewProduct({...newProduct, nombre: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700" placeholder="Ej. Coca Cola 3L"/></div>
                  <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Precio</label><input type="number" step="0.10" value={newProduct.precio} onChange={e => setNewProduct({...newProduct, precio: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700" placeholder="0.00" /></div><div className="space-y-1.5"><label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Stock</label><input type="number" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700" placeholder="0" /></div></div>
                  <div className={`border-2 rounded-2xl p-4 transition-all ${newProduct.oferta_activa ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-100'}`}><div className="flex items-center justify-between mb-2"><label className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 cursor-pointer select-none"><Zap className={`w-4 h-4 ${newProduct.oferta_activa ? 'text-orange-500 fill-orange-500' : 'text-slate-300'}`} /> Oferta Flash</label><div onClick={() => setNewProduct({...newProduct, oferta_activa: !newProduct.oferta_activa})} className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors ${newProduct.oferta_activa ? 'bg-orange-500' : 'bg-slate-200'}`}><div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${newProduct.oferta_activa ? 'translate-x-5' : 'translate-x-0'}`} /></div></div>{newProduct.oferta_activa && (<motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} className="space-y-3 pt-2"><input type="number" step="0.10" placeholder="Precio Oferta" value={newProduct.precio_oferta} onChange={e => setNewProduct({...newProduct, precio_oferta: e.target.value})} className="w-full p-2 bg-white border-2 border-orange-100 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-sm font-bold text-orange-600" /><div className="grid grid-cols-2 gap-2"><input type="time" value={newProduct.hora_inicio} onChange={e => setNewProduct({...newProduct, hora_inicio: e.target.value})} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs" /><input type="time" value={newProduct.hora_fin} onChange={e => setNewProduct({...newProduct, hora_fin: e.target.value})} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs" /></div></motion.div>)}</div>
                  <div className="space-y-1.5"><label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Categoría</label><select value={newProduct.categoria} onChange={e => setNewProduct({...newProduct, categoria: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"><option value="">Seleccionar...</option>{dynamicCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                  <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-300 p-8 rounded-2xl text-center cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 transition-all group bg-slate-50">{uploadingImage ? <Loader2 className="animate-spin mx-auto text-indigo-500"/> : (newProduct.imagen_url ? <img src={newProduct.imagen_url} className="h-32 w-full object-contain rounded-lg"/> : <div className="text-slate-400 text-sm font-bold group-hover:text-indigo-500"><Upload className="w-8 h-8 mx-auto mb-2 text-slate-300 group-hover:text-indigo-400"/>Subir Foto</div>)}</div>
                  <input type="file" ref={fileInputRef} hidden onChange={handleImageUpload} />
                  <div className="flex gap-3 pt-2">{editingId && <button type="button" onClick={resetForm} className="flex-1 bg-white border-2 border-slate-200 text-slate-600 font-bold py-4 rounded-xl hover:bg-slate-50">Cancelar</button>}<button type="submit" className={`flex-1 text-white font-bold py-4 rounded-xl shadow-xl active:scale-95 transition-all ${editingId ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-200' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-300'}`}>{editingId ? "Actualizar" : "Guardar"}</button></div>
                </form>
                {!editingId && (<div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 gap-3"><button onClick={handleDownloadTemplate} className="bg-white border-2 border-slate-100 text-slate-600 font-bold py-3 rounded-xl text-xs hover:border-slate-300 flex items-center justify-center gap-2"><FileDown size={16}/> Plantilla</button><button onClick={() => excelInputRef.current?.click()} className="bg-green-50 border-2 border-green-100 text-green-700 font-bold py-3 rounded-xl text-xs hover:bg-green-100 flex items-center justify-center gap-2"><FileUp size={16}/> Importar</button><input type="file" ref={excelInputRef} hidden accept=".xlsx" onChange={handleExcelUpload} /><button onClick={handleExportInventory} className="col-span-2 bg-indigo-50 border-2 border-indigo-100 text-indigo-700 font-bold py-3 rounded-xl text-xs hover:bg-indigo-100 flex items-center justify-center gap-2"><Download size={16}/> Exportar Todo</button></div>)}
              </div>
            </div>
            <div className="lg:col-span-3 space-y-8">
              <div className="flex gap-4 items-center"><div className="relative flex-1"><Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400"/><input type="text" placeholder="Buscar producto..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl w-full text-base font-medium focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"/></div></div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">{Object.entries(groupedProducts).map(([cat, prods]) => { if (prods.length === 0) return null; const catIds = prods.map(p => p.id); const isAll = catIds.length > 0 && catIds.every(id => selectedProductIds.includes(id)); const hasSome = catIds.some(id => selectedProductIds.includes(id)); const toggleCat = () => { if (isAll) setSelectedProductIds(prev => prev.filter(id => !catIds.includes(id))); else setSelectedProductIds(prev => [...prev, ...catIds.filter(id => !prev.includes(id))]); }; return (<div key={cat} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col h-full"><div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-50"><div className="flex items-center gap-3"><div className="bg-indigo-50 p-2 rounded-xl text-indigo-600"><Tags className="w-5 h-5"/></div><h3 className="font-black text-slate-800 text-xl uppercase tracking-tight">{cat} <span className="text-slate-400 text-sm font-bold ml-2 bg-slate-100 px-2 py-0.5 rounded-full">{prods.length}</span></h3></div><button onClick={toggleCat} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${isAll ? 'bg-indigo-600 text-white border-indigo-600' : hasSome ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-300'}`}>{isAll ? <CheckSquare size={14} /> : <Square size={14} />}{isAll ? 'Todos' : 'Seleccionar'}</button></div><div className="flex-1 space-y-4 overflow-y-auto max-h-[500px] pr-2"><AnimatePresence>{prods.map(p => (<motion.div key={p.id} layout initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-lg relative overflow-hidden group ${selectedProductIds.includes(p.id) ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-200' : editingId === p.id ? 'border-orange-400 bg-orange-50' : 'border-slate-100 bg-white hover:border-indigo-100'}`}><div onClick={(e) => { e.stopPropagation(); toggleSelectProduct(p.id); }} className="absolute top-0 left-0 p-2 z-10"><div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${selectedProductIds.includes(p.id) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300 group-hover:border-indigo-300'}`}>{selectedProductIds.includes(p.id) && <Check size={12} className="text-white" strokeWidth={4} />}</div></div><div className="w-16 h-16 bg-slate-50 rounded-2xl flex-shrink-0 relative overflow-hidden border border-slate-100 ml-2"><img src={p.imagen_url} className="w-full h-full object-cover" onError={(e) => (e.target as HTMLImageElement).src = '/placeholder.png'} />{p.oferta_activa && <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center backdrop-blur-[1px]"><Zap className="w-6 h-6 text-white drop-shadow-md"/></div>}</div><div className="flex-1 min-w-0" onClick={() => handleEditClick(p)}><h4 className="font-bold text-slate-900 text-lg truncate" title={p.nombre}>{p.nombre}</h4><div className="flex justify-between items-end mt-2"><span className={`text-xs font-black px-2.5 py-1 rounded-lg ${p.stock < 5 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>Stock: {p.stock}</span><div className="text-right">{p.oferta_activa ? <><span className="block text-xs text-slate-400 line-through font-bold">S/ {p.precio.toFixed(2)}</span><span className="font-black text-orange-600 text-xl">S/ {p.precio_oferta?.toFixed(2)}</span></> : <span className="font-black text-slate-900 text-xl">S/ {p.precio.toFixed(2)}</span>}</div></div></div><div className="flex flex-col gap-2"><button onClick={(e) => { e.stopPropagation(); handleEditClick(p); }} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-colors"><Pencil size={18}/></button><button onClick={(e) => { e.stopPropagation(); handleDeleteProduct(p.id); }} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"><Trash2 size={18}/></button></div></motion.div>))}</AnimatePresence></div></div>); })}</div>
              {Object.keys(groupedProducts).length === 0 && <div className="text-center py-32 opacity-40"><Package className="w-24 h-24 mx-auto mb-6 text-slate-300"/><p className="text-xl font-bold text-slate-400">No hay productos.</p></div>}
              <AnimatePresence>{selectedProductIds.length > 0 && (<motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-32 z-[80] bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center gap-4 border border-slate-700 w-[90%] max-w-2xl lg:w-auto"><div className="flex items-center gap-3 pr-4 border-b sm:border-b-0 sm:border-r border-slate-700 pb-2 sm:pb-0 w-full sm:w-auto justify-between sm:justify-start"><span className="font-black text-lg">{selectedProductIds.length}</span><span className="text-xs uppercase text-slate-400 font-bold tracking-wider">Seleccionados</span><button onClick={() => setSelectedProductIds([])} className="text-slate-400 hover:text-white"><X size={18}/></button></div><div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto"><div className="flex items-center gap-2 bg-slate-800 p-1 rounded-xl w-full sm:w-auto"><select value={bulkCategory} onChange={e => setBulkCategory(e.target.value)} className="bg-transparent text-white text-sm font-bold outline-none px-3 py-2 w-full sm:w-40"><option value="" className="text-slate-900">Mover a...</option>{dynamicCategories.map(c => <option key={c} value={c} className="text-slate-900">{c}</option>)}</select><button onClick={handleBulkCategoryUpdate} className="bg-indigo-600 hover:bg-indigo-500 p-2 rounded-lg transition"><FolderInput size={18}/></button></div><button onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition w-full sm:w-auto"><Trash2 size={18}/> Eliminar</button></div></motion.div>)}</AnimatePresence>
            </div>
          </div>
        )}

        {/* ═══════════ CLIENTES (mismo) ═══════════ */}
        {currentView === 'customers' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6"><h2 className="text-3xl font-black text-slate-900">Cartera de Clientes</h2><div className="relative w-full sm:w-96"><Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400"/><input type="text" placeholder="Buscar cliente..." value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} className="pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-base font-medium focus:ring-2 focus:ring-indigo-500 outline-none w-full shadow-sm"/></div></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{filteredCustomers.length === 0 ? <div className="col-span-full text-center py-32 opacity-40"><Users className="w-24 h-24 mx-auto mb-6 text-slate-300"/><p className="text-xl font-bold text-slate-400">No se encontraron clientes.</p></div> : filteredCustomers.map((customer, idx) => (<motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} transition={{delay: idx*0.05}} key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col gap-5 relative overflow-hidden"><div className={`absolute top-0 right-0 p-8 rounded-bl-3xl opacity-10 ${getAvatarColor(customer.name).replace('text', 'bg')}`}></div><div className="flex items-center gap-4 relative z-10"><div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm ${getAvatarColor(customer.name)}`}>{customer.name.charAt(0)}</div><div className="overflow-hidden"><h3 className="font-bold text-slate-900 text-lg truncate" title={customer.name}>{customer.name}</h3><p className="text-sm text-slate-500 font-medium flex items-center gap-1.5 mt-1"><Phone className="w-3.5 h-3.5"/> {customer.phone}</p></div></div><div className="grid grid-cols-2 gap-3 text-center bg-slate-50 rounded-2xl p-3 border border-slate-100"><div><p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Pedidos</p><p className="font-black text-xl text-slate-900">{customer.orderCount}</p></div><div><p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Gastado</p><p className="font-black text-xl text-emerald-600">S/ {customer.totalSpent.toFixed(2)}</p></div></div><div className="flex justify-between items-center text-xs text-slate-400 border-t border-slate-50 pt-4"><span className="flex items-center gap-1.5 font-bold uppercase tracking-wide"><Calendar className="w-3.5 h-3.5"/> Último pedido</span><span className="font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{new Date(customer.lastOrder).toLocaleDateString()}</span></div></motion.div>))}</div>
          </div>
        )}
      </main>

      {/* MODAL DETALLE PEDIDO */}
      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailModal 
            order={selectedOrder} 
            onClose={() => setSelectedOrder(null)}
            onUpdateStatus={handleUpdateOrderStatus}
            onDelete={handleDeleteOrder}
            onCopy={copyToClipboard}
            onOpenMap={handleOpenMap}
          />
        )}
      </AnimatePresence>

      {/* MODAL NOTIFICACIONES GLOBALES */}
      <AnimatePresence>
        {showOfferModal && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md" onClick={() => !sendingOffers && setShowOfferModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-8 text-white flex justify-between items-start"><div><h2 className="text-2xl font-black tracking-tight flex items-center gap-2"><Megaphone className="w-6 h-6"/> Enviar Notificación</h2><p className="text-orange-100 font-medium mt-1 text-sm">Avisarás a todos tus clientes.</p></div><button onClick={() => !sendingOffers && setShowOfferModal(false)} className="bg-white/10 p-2.5 rounded-full hover:bg-white/20"><X className="w-5 h-5 text-white"/></button></div>
              <div className="p-6 space-y-4 bg-slate-50"><div className="space-y-1.5"><label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Título</label><input type="text" value={offerTitle} onChange={e => setOfferTitle(e.target.value)} disabled={sendingOffers} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-700" /></div><div className="space-y-1.5"><label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Mensaje</label><textarea value={offerBody} onChange={e => setOfferBody(e.target.value)} disabled={sendingOffers} rows={3} className="w-full p-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-medium text-slate-700 resize-none" /></div></div>
              <div className="p-6 bg-white border-t border-slate-100 flex gap-3"><button onClick={() => setShowOfferModal(false)} disabled={sendingOffers} className="flex-1 py-4 rounded-xl border border-slate-200 font-bold text-slate-500 hover:bg-slate-50 text-sm disabled:opacity-50">Cancelar</button><button onClick={handleSendGlobalOffer} disabled={sendingOffers} className="flex-1 py-4 rounded-xl bg-orange-500 text-white font-black hover:bg-orange-600 shadow-xl shadow-orange-200 flex items-center justify-center gap-2 active:scale-95 text-sm disabled:opacity-50">{sendingOffers ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Zap className="w-4 h-4"/> Enviar a Todos</>}</button></div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}