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
  Tags, Bot, MessageSquare, Sparkles, Trophy, Download, FileUp
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
  estado: 'pendiente' | 'pagado' | 'atendido' | 'cancelado';
  comprobante_url?: string;
  metodo_pago?: string;
}

// --- COMPONENTES UI ---
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

const StatCard = ({ title, value, icon, color, subtext }: { title: string, value: string, icon: any, color: string, subtext?: string }) => (
  <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-lg flex items-center justify-between group transition-all relative overflow-hidden">
    <div className={`absolute right-0 top-0 p-12 opacity-5 rounded-bl-full ${color.replace('text-', 'bg-')}`}></div>
    <div className="relative z-10">
      <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{title}</p>
      <h3 className="text-4xl font-black text-slate-900">{value}</h3>
      {subtext && <p className={`text-sm font-bold mt-2 ${color} flex items-center gap-1`}>{subtext}</p>}
    </div>
    <div className={`p-4 rounded-2xl ${color.replace('text-', 'bg-').replace('600', '50')} ${color} relative z-10 shadow-sm`}>
      {icon}
    </div>
  </motion.div>
);

// --- EFECTO CONFETI ---
const Confetti = () => {
    const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];
    return (
        <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
            {[...Array(50)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ y: -20, x: Math.random() * 100 + 'vw', opacity: 1, rotate: 0 }}
                    animate={{ y: '100vh', x: (Math.random() - 0.5) * 200 + 'px', opacity: 0, rotate: 360 }}
                    transition={{ duration: Math.random() * 2 + 2, delay: Math.random() * 0.5, ease: 'linear' }}
                    className="absolute w-3 h-3 rounded-sm"
                    style={{ backgroundColor: colors[i % colors.length] }}
                />
            ))}
        </div>
    );
};

// --- CHATBOT JORMARD 2.0 ---
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
            setMessages([{
                id: 1,
                text: "¡Hola Jefe! 👋 Soy tu asistente Jormard. ¿Qué deseas revisar hoy?",
                sender: 'bot',
                timestamp: new Date()
            }]);
        }
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleAction = (action: 'stock' | 'orders' | 'summary') => {
        const userMsg: Message = { id: Date.now(), text: action === 'stock' ? "Revisar Stock" : action === 'orders' ? "Ver Pedidos" : "Resumen del día", sender: 'user', timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);

        setTimeout(() => {
            let botResponse: React.ReactNode;
            if (action === 'stock') {
                if (criticalStockItems.length === 0 && lowStockItems.length === 0) {
                    botResponse = "✅ Todo excelente. No hay productos agotados ni con stock bajo.";
                } else {
                    botResponse = (
                        <div className="space-y-2">
                            <p>He encontrado algunos detalles en el almacén:</p>
                            {criticalStockItems.length > 0 && (
                                <div className="bg-red-50 p-2 rounded-lg border border-red-100 text-red-800 text-sm">
                                    <strong>🚨 {criticalStockItems.length} Agotados:</strong>
                                    <ul className="list-disc pl-4 mt-1">{criticalStockItems.slice(0, 3).map(p => <li key={p.id}>{p.nombre}</li>)}</ul>
                                    {criticalStockItems.length > 3 && <span>...y otros.</span>}
                                </div>
                            )}
                            {lowStockItems.length > 0 && (
                                <div className="bg-orange-50 p-2 rounded-lg border border-orange-100 text-orange-800 text-sm">
                                    <strong>⚠️ {lowStockItems.length} Por acabarse:</strong>
                                    <ul className="list-disc pl-4 mt-1">{lowStockItems.slice(0, 3).map(p => <li key={p.id}>{p.nombre} ({p.stock})</li>)}</ul>
                                </div>
                            )}
                        </div>
                    );
                }
            } else if (action === 'orders') {
                if (pendingOrders.length === 0) {
                    botResponse = "👍 No tienes pedidos pendientes. ¡Estamos al día!";
                } else {
                    botResponse = (
                        <div>
                            <p>Hay <b>{pendingOrders.length} pedidos</b> esperando atención.</p>
                            <p className="text-xs text-gray-500 mt-1">Revisa la pestaña de pedidos para confirmarlos.</p>
                        </div>
                    );
                }
            } else {
                const totalSales = orders.filter(o => o.estado === 'atendido').reduce((acc, curr) => acc + curr.total, 0);
                botResponse = `💰 Hoy has vendido S/ ${totalSales.toFixed(2)}. Tienes ${products.length} productos activos en catálogo.`;
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
                        <div className="bg-slate-900 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="relative"><div className="bg-indigo-500 p-2 rounded-xl text-white"><Bot size={24} /></div><span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-slate-900 rounded-full"></span></div>
                                <div><h4 className="font-bold text-white text-base">Asistente Jormard</h4><p className="text-xs text-slate-400">IA de Inventario</p></div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition"><X size={20}/></button>
                        </div>
                        <div className="flex-1 bg-slate-50 p-4 overflow-y-auto space-y-4">
                            {messages.map((msg) => (
                                <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none'}`}>{msg.text}</div>
                                </motion.div>
                            ))}
                            {isTyping && (<div className="flex justify-start"><div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-bl-none flex gap-1 items-center"><span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span><span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span><span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span></div></div>)}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="p-4 bg-white border-t border-slate-100">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Acciones Rápidas</p>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => handleAction('stock')} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1"><AlertTriangle size={12}/> Revisar Stock</button>
                                <button onClick={() => handleAction('orders')} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1"><ShoppingBag size={12}/> Pedidos</button>
                                <button onClick={() => handleAction('summary')} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1"><BarChart3 size={12}/> Resumen</button>
                            </div>
                        </div>
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

// --- TOUR GUIDE MEJORADO (CON NAVEGACIÓN Y CONFETI) ---
const TourGuide = ({ isOpen, onClose, setView }: { isOpen: boolean, onClose: () => void, setView: (view: any) => void }) => {
    const [step, setStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
    const [showConfetti, setShowConfetti] = useState(false);

    // Definición de pasos con la vista requerida
    const steps = [
        { 
            title: "👋 Bienvenido Jefe", 
            desc: "Este es tu panel de control profesional. Vamos a dar un paseo rápido.",
            targetId: null,
            view: 'dashboard'
        },
        { 
            title: "1. Resumen (Dashboard)", 
            desc: "Aquí ves tus ventas del día, pedidos pendientes y alertas de stock de un vistazo.",
            targetId: 'nav-dashboard',
            mobileId: 'nav-dashboard-mobile',
            view: 'dashboard'
        },
        { 
            title: "2. Pedidos", 
            desc: "Aquí recibes las compras. ¡Vamos a ver la pantalla de pedidos!",
            targetId: 'nav-orders',
            mobileId: 'nav-orders-mobile',
            view: 'orders' // Cambia la vista automáticamente
        },
        {
            title: "Lista de Pedidos",
            desc: "Aquí aparecerán las tarjetas de pedidos. Podrás ver si pagaron con Yape o Efectivo.",
            targetId: null, // General focus
            view: 'orders'
        },
        { 
            title: "3. Inventario", 
            desc: "Ahora vamos a la sección más importante: Tus Productos.",
            targetId: 'nav-inventory',
            mobileId: 'nav-inventory-mobile',
            view: 'inventory' // Cambia la vista automáticamente
        },
        {
            title: "Crear/Editar Producto",
            desc: "Usa este formulario. Escribe el Nombre, Precio y Stock para agregar algo nuevo.",
            targetId: 'tour-form-basic',
            view: 'inventory'
        },
        {
            title: "¡Ofertas Flash!",
            desc: "Activa 'Oferta Flash' para poner un precio rebajado con hora de inicio y fin. ¡Atrae clientes!",
            targetId: 'tour-form-offer',
            view: 'inventory'
        },
        {
            title: "Foto del Producto",
            desc: "Sube una imagen real aquí. Los productos con foto se venden un 50% más.",
            targetId: 'tour-form-image',
            view: 'inventory'
        },
        {
            title: "Carga Masiva (Excel)",
            desc: "Si tienes cientos de productos, no los subas uno por uno. Descarga la plantilla, llénala y súbela aquí.",
            targetId: 'tour-excel-actions',
            view: 'inventory'
        },
        { 
            title: "4. Clientes", 
            desc: "Finalmente, aquí verás tu base de datos de clientes frecuentes.",
            targetId: 'nav-customers',
            mobileId: 'nav-customers-mobile',
            view: 'customers' // Cambia la vista automáticamente
        },
        {
            title: "¡Todo Listo!",
            desc: "Ya eres un experto. ¡A vender se ha dicho!",
            targetId: null,
            view: 'dashboard'
        }
    ];

    // Efecto para cambiar de vista cuando cambia el paso
    useEffect(() => {
        const currentStepConfig = steps[step];
        if (currentStepConfig.view) {
            setView(currentStepConfig.view);
        }
    }, [step]);

    // Calcular posición del tooltip
    const updatePosition = () => {
        const currentStep = steps[step];
        let el: HTMLElement | null = null; 
        
        // Esperar un poco a que la vista cambie y el DOM se renderice
        setTimeout(() => {
            if (currentStep.targetId) {
                el = document.getElementById(currentStep.targetId);
                // Si está oculto (mobile), buscar el ID móvil
                if (el && window.getComputedStyle(el).display === 'none' && currentStep.mobileId) {
                    el = document.getElementById(currentStep.mobileId);
                }
            }
            // Fallback directo a mobileId si no hay targetId
            if (!el && currentStep.mobileId) {
                 el = document.getElementById(currentStep.mobileId);
            }

            if (el) {
                const rect = el.getBoundingClientRect();
                setTargetRect(rect);
                
                const isSidebar = rect.height > window.innerHeight * 0.8 || rect.left < 100; 
                
                if (isSidebar) {
                    setTooltipStyle({ top: `${rect.top + 20}px`, left: `${rect.right + 25}px` });
                } else {
                    const spaceBelow = window.innerHeight - rect.bottom;
                    const showBelow = spaceBelow > 250;
                    setTooltipStyle({
                        top: showBelow ? `${rect.bottom + 20}px` : 'auto',
                        bottom: !showBelow ? `${window.innerHeight - rect.top + 20}px` : 'auto',
                        left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '380px'
                    });
                }
            } else {
                setTargetRect(null);
                setTooltipStyle({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: '420px' });
            }
        }, 300); // Delay para permitir renderizado de la nueva vista
    };

    useLayoutEffect(() => {
        if (isOpen) {
            updatePosition();
            window.addEventListener('resize', updatePosition);
            return () => window.removeEventListener('resize', updatePosition);
        }
    }, [step, isOpen]);

    const handleNext = () => { 
        if (step < steps.length - 1) {
            setStep(step + 1); 
        } else {
            // FIN DEL TOUR
            setShowConfetti(true);
            setTimeout(() => {
                onClose();
                setShowConfetti(false);
            }, 4000);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {showConfetti && <Confetti />}
            <div className="fixed inset-0 z-[120] overflow-hidden">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 transition-all duration-500 ease-in-out"
                    style={{ background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', clipPath: targetRect ? `polygon(0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%, ${targetRect.left}px ${targetRect.top}px, ${targetRect.right}px ${targetRect.top}px, ${targetRect.right}px ${targetRect.bottom}px, ${targetRect.left}px ${targetRect.bottom}px, ${targetRect.left}px ${targetRect.top}px)` : undefined }}
                />
                {targetRect && <motion.div layoutId="tour-ring" className="absolute border-4 border-indigo-500 rounded-xl shadow-[0_0_30px_rgba(99,102,241,0.6)]" style={{ top: targetRect.top - 8, left: targetRect.left - 8, width: targetRect.width + 16, height: targetRect.height + 16 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />}
                
                <motion.div key={step} initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="absolute bg-white p-6 rounded-3xl shadow-2xl border border-slate-100" style={tooltipStyle}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-indigo-100 p-2.5 rounded-2xl text-indigo-600">
                             {step === steps.length - 1 ? <Trophy size={24} /> : <Flag size={24}/>}
                        </div>
                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{step + 1} / {steps.length}</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">{steps[step].title}</h3>
                    <p className="text-slate-500 text-base leading-relaxed mb-8">{steps[step].desc}</p>
                    <div className="flex justify-between items-center">
                        <button onClick={onClose} className="text-slate-400 font-bold text-sm hover:text-slate-600 transition">Omitir</button>
                        <button onClick={handleNext} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 transform active:scale-95">
                            {step === steps.length - 1 ? '¡Finalizar!' : 'Siguiente'} <ArrowRight size={18}/>
                        </button>
                    </div>
                </motion.div>
            </div>
        </>
    );
};

export default function AdminDashboard() {
  // --- ESTADOS ---
  const [currentView, setCurrentView] = useState<'dashboard' | 'orders' | 'inventory' | 'customers'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false); 
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);
  
  // NUEVO: Estado para categorías dinámicas
  const [dynamicCategories, setDynamicCategories] = useState<string[]>([]);

  // Filtros
  const [orderSearch, setOrderSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  // Data
  const [products, setProducts] = useState<Producto[]>([]);
  const [orders, setOrders] = useState<Pedido[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Pedido | null>(null);
  
  // Estado para EDICIÓN
  const [editingId, setEditingId] = useState<number | null>(null);
  const formTopRef = useRef<HTMLDivElement>(null); 

  // Formulario Producto
  const [newProduct, setNewProduct] = useState({ 
    nombre: '', precio: '', stock: '', imagen_url: '', categoria: '',
    oferta_activa: false, precio_oferta: '', hora_inicio: '07:00', hora_fin: '22:00'
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const showToast = (msg: string, type: 'success'|'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const playNotificationSound = () => {
    const audio = new Audio('/notification.mp3');
    audio.play().catch((error) => console.warn("Sonido bloqueado", error));
  };

  // --- GOOGLE MAPS ---
  const handleOpenMap = (address: string) => {
    if (!address) return showToast("No hay dirección registrada", 'error');
    const url = `http://googleusercontent.com/maps.google.com/?q=${encodeURIComponent(address)}`;
    window.open(url, '_blank');
  };

  // --- EFECTOS ---
  useEffect(() => {
    fetchData();
    const hasSeenAdminTour = localStorage.getItem('hasSeenAdminTour');
    if (!hasSeenAdminTour) setTimeout(() => setShowGuide(true), 1500);

    const channel = supabase
      .channel('admin-dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newOrder = payload.new as Pedido;
          setOrders((prev) => [newOrder, ...prev]);
          showToast(`¡Nuevo pedido de ${newOrder.cliente_nombre}!`, 'success');
          playNotificationSound();
        } 
        else if (payload.eventType === 'UPDATE') {
          const updatedOrder = payload.new as Pedido;
          setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
          setSelectedOrder(prev => (prev && prev.id === updatedOrder.id ? updatedOrder : prev));
        }
        else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old.id; 
          setOrders((prev) => prev.filter((o) => o.id !== deletedId));
          setSelectedOrder(prev => (prev && prev.id === deletedId ? null : prev));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, (payload) => {
         if (payload.eventType === 'INSERT') setProducts(prev => [payload.new as Producto, ...prev]);
         else if (payload.eventType === 'UPDATE') setProducts(prev => prev.map(p => p.id === (payload.new as Producto).id ? payload.new as Producto : p));
         else if (payload.eventType === 'DELETE') setProducts(prev => prev.filter(p => p.id !== (payload.old as Producto).id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const closeTour = () => {
      setShowGuide(false);
      localStorage.setItem('hasSeenAdminTour', 'true');
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchProducts(), fetchOrders(), fetchCategories()]);
    setLoading(false);
  };

  // NUEVO: Cargar categorías desde BD
  const fetchCategories = async () => {
    const { data } = await supabase.from('categorias').select('nombre').order('nombre');
    if (data) {
        setDynamicCategories(data.map(c => c.nombre));
    }
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from('productos').select('*').order('id', { ascending: false });
    if (data) setProducts(data);
  };

  const fetchOrders = async () => {
    const { data } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data);
  };

  // --- MANEJO DE IMÁGENES ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploadingImage(true);
    const file = e.target.files[0];
    const filePath = `${Date.now()}.${file.name.split('.').pop()}`;
    try {
      await supabase.storage.from('productos').upload(filePath, file);
      const { data } = supabase.storage.from('productos').getPublicUrl(filePath);
      setNewProduct({ ...newProduct, imagen_url: data.publicUrl });
      showToast("Imagen subida correctamente", 'success');
    } catch { showToast("Error subiendo imagen", 'error'); } 
    finally { setUploadingImage(false); }
  };

  // --- MANEJO DE PRODUCTOS ---
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newProduct.nombre || !newProduct.precio) return showToast("Faltan datos obligatorios", 'error');
    
    const productData = {
      nombre: newProduct.nombre,
      precio: parseFloat(newProduct.precio),
      stock: parseInt(newProduct.stock),
      imagen_url: newProduct.imagen_url || '/placeholder.png',
      categoria: newProduct.categoria || 'Abarrotes',
      oferta_activa: newProduct.oferta_activa,
      precio_oferta: newProduct.oferta_activa ? parseFloat(newProduct.precio_oferta) : null,
      hora_inicio: newProduct.oferta_activa ? newProduct.hora_inicio : null,
      hora_fin: newProduct.oferta_activa ? newProduct.hora_fin : null
    };

    let error;
    if (editingId) {
        const res = await supabase.from('productos').update(productData).eq('id', editingId);
        error = res.error;
    } else {
        const res = await supabase.from('productos').insert([productData]);
        error = res.error;
    }

    if(error) { showToast("Error al guardar: " + error.message, 'error'); } 
    else {
        showToast(editingId ? "Producto actualizado" : "Producto creado", 'success');
        resetForm();
    }
  };

  const handleEditClick = (p: Producto) => {
      setNewProduct({
          nombre: p.nombre,
          precio: p.precio.toString(),
          stock: p.stock.toString(),
          imagen_url: p.imagen_url,
          categoria: p.categoria,
          oferta_activa: p.oferta_activa,
          precio_oferta: p.precio_oferta ? p.precio_oferta.toString() : '',
          hora_inicio: p.hora_inicio ? p.hora_inicio.slice(0, 5) : '07:00',
          hora_fin: p.hora_fin ? p.hora_fin.slice(0, 5) : '22:00'
      });
      setEditingId(p.id);
      formTopRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const resetForm = () => {
      setNewProduct({ 
        nombre: '', precio: '', stock: '', imagen_url: '', categoria: '',
        oferta_activa: false, precio_oferta: '', hora_inicio: '07:00', hora_fin: '22:00'
      });
      setEditingId(null);
  };

  const handleDeleteProduct = async (id: number) => {
    if (confirm('¿Borrar producto permanentemente?')) {
      await supabase.from('productos').delete().eq('id', id);
      showToast("Producto eliminado", 'success');
      if(editingId === id) resetForm(); 
    }
  };
  
  // --- EXCEL LOGIC ---
  const handleDownloadTemplate = () => {
    const templateData = [
      { Nombre: "Coca Cola 3L", Precio: 12.50, Stock: 50, Categoria: "Bebidas", Imagen: "https://ejemplo.com/foto.jpg" },
      { Nombre: "Galletas Soda", Precio: 4.20, Stock: 20, Categoria: "Galletas", Imagen: "" }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla Productos");
    XLSX.writeFile(wb, "Plantilla_Carga_Masiva.xlsx");
    showToast("Plantilla descargada", 'success');
  };

  // --- NUEVA FUNCIÓN: EXPORTAR INVENTARIO COMPLETO ---
  const handleExportInventory = () => {
    if (products.length === 0) return showToast("No hay productos para exportar", 'error');

    // 1. Mapear productos al formato de Excel (Compatible con la importación)
    const dataToExport = products.map(p => ({
        Nombre: p.nombre,
        Precio: p.precio,
        Stock: p.stock,
        Categoria: p.categoria,
        Imagen: p.imagen_url || '',
        // Opcional: Incluir datos de oferta si quieres guardarlos
        Oferta_Activa: p.oferta_activa ? "SI" : "NO",
        Precio_Oferta: p.precio_oferta || 0
    }));

    // 2. Crear hoja de cálculo
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario Completo");

    // 3. Descargar archivo
    XLSX.writeFile(wb, `Inventario_Jormard_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast("Inventario exportado correctamente", 'success');
  };

  // NUEVO: Lógica mejorada para Excel (Crea categorías y normaliza texto)
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const reader = new FileReader();
    
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        
        // A. Recolectar categorías
        const potentialCategories = new Set<string>();
        
        const formatted = data.map((row: any) => {
          // Normalizar texto (Primera mayúscula, resto minúscula)
          const rawCategory = (row.categoria || row.Categoria || 'Otros').toString().trim();
          const normalizedCategory = rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1).toLowerCase();
          
          potentialCategories.add(normalizedCategory);

          return {
            nombre: row.nombre || row.Nombre,
            precio: parseFloat(row.precio || row.Precio || 0),
            stock: parseInt(row.stock || row.Stock || 0),
            categoria: normalizedCategory, // Usamos la normalizada
            imagen_url: row.imagen_url || row.Imagen || row.imagen || '/placeholder.png'
          };
        });

        // B. Detectar categorías NUEVAS
        const currentCatsLower = dynamicCategories.map(c => c.toLowerCase());
        const newCategoriesToInsert = Array.from(potentialCategories).filter(
          cat => !currentCatsLower.includes(cat.toLowerCase())
        );

        // C. Insertar nuevas categorías en Supabase
        if (newCategoriesToInsert.length > 0) {
          const catsPayload = newCategoriesToInsert.map(nombre => ({ nombre }));
          const { error: catError } = await supabase.from('categorias').insert(catsPayload);
          
          if (catError) console.error("Error creando categorías:", catError);
          else {
            showToast(`✨ Se crearon ${newCategoriesToInsert.length} categorías nuevas`, 'success');
            await fetchCategories(); // Recargar la lista inmediatamente
          }
        }
        
        // D. Guardar productos
        const { error } = await supabase.from('productos').upsert(formatted, { onConflict: 'nombre' });
        
        if (error) throw error;
        showToast(`Procesados ${formatted.length} productos correctamente`, 'success');
        fetchProducts();
        
        if (excelInputRef.current) excelInputRef.current.value = '';

      } catch (error: any) { 
        showToast("Error: " + error.message, 'error'); 
        if (excelInputRef.current) excelInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(e.target.files[0]);
  };

  // --- ORDERS LOGIC ---
  const handleUpdateOrderStatus = async (id: number, status: 'pagado' | 'atendido' | 'cancelado') => {
    const { error } = await supabase.from('pedidos').update({ estado: status }).eq('id', id);
    if (error) return showToast("Error al actualizar", 'error');
    
    setOrders(prev => prev.map(o => o.id === id ? { ...o, estado: status } : o));
    if (selectedOrder) setSelectedOrder({ ...selectedOrder, estado: status });

    if (status === 'atendido' || status === 'cancelado') {
      showToast(status === 'atendido' ? "¡Pedido Completado!" : "Pedido Cancelado", status === 'atendido' ? 'success' : 'error');
      setTimeout(() => setSelectedOrder(null), 300);
    } else {
      showToast("Pago Confirmado", 'success');
    }
  };

  const handleDeleteOrder = async (id: number) => {
    if (!confirm('🛑 ¿Estás seguro de ELIMINAR este pedido definitivamente?')) return;
    try {
      const { error } = await supabase.from('pedidos').delete().eq('id', id);
      if (error) throw error;
      setOrders(prev => prev.filter(o => o.id !== id));
      setSelectedOrder(null);
      showToast("Pedido eliminado correctamente", 'success');
    } catch (error: any) { showToast("Error al eliminar: " + error.message, 'error'); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copiado al portapapeles", 'success');
  };

  // --- MÉTRICAS ---
  const totalVentas = orders.filter(o => o.estado === 'atendido').reduce((acc, o) => acc + o.total, 0);
  const pendientes = orders.filter(o => o.estado === 'pendiente').length;
  const lowStock = products.filter(p => p.stock < 5).length;
  
  // --- LOGICA DE CLIENTES ---
  const uniqueCustomers = Array.from(new Set(orders.map(o => o.cliente_nombre)))
    .map(name => {
        const customerOrders = orders.filter(o => o.cliente_nombre === name);
        const sortedOrders = customerOrders.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return {
            name,
            phone: customerOrders[0].cliente_telefono,
            totalSpent: customerOrders.reduce((acc, curr) => acc + (curr.estado === 'atendido' ? curr.total : 0), 0),
            orderCount: customerOrders.length,
            lastOrder: sortedOrders[0].created_at
        }
    })
    .sort((a,b) => b.totalSpent - a.totalSpent);

  const filteredCustomers = uniqueCustomers.filter(c => 
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
      c.phone.includes(customerSearch)
  );

  const getAvatarColor = (name: string) => {
    const colors = ['bg-red-100 text-red-600', 'bg-blue-100 text-blue-600', 'bg-green-100 text-green-600', 'bg-yellow-100 text-yellow-600', 'bg-purple-100 text-purple-600', 'bg-pink-100 text-pink-600'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  // --- LÓGICA DE AGRUPACIÓN DE INVENTARIO ---
  const getGroupedProducts = () => {
      const filtered = products.filter(p => p.nombre.toLowerCase().includes(productSearch.toLowerCase()));
      const groups: Record<string, Producto[]> = {};
      
      filtered.forEach(p => {
          const cat = p.categoria || 'Otros';
          if (!groups[cat]) groups[cat] = [];
          groups[cat].push(p);
      });
      return Object.keys(groups).sort().reduce((obj, key) => { obj[key] = groups[key]; return obj; }, {} as Record<string, Producto[]>);
  };
  const groupedProducts = getGroupedProducts();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex selection:bg-indigo-200">
      
      <AnimatePresence>
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        {showGuide && <TourGuide isOpen={showGuide} onClose={closeTour} setView={setCurrentView} />}
      </AnimatePresence>
      
      {/* BOT ASISTENTE DE INVENTARIO */}
      <InventoryBot products={products} orders={orders} />

      {/* --- SIDEBAR DESKTOP --- */}
      <aside id="admin-sidebar" className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col fixed h-full z-20 shadow-sm">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
              <div className="bg-slate-900 p-2 rounded-xl text-white shadow-lg"><LayoutDashboard className="w-6 h-6"/></div>
              <div>
                  <span className="font-black text-xl tracking-tight block leading-none">Jormard</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin Panel</span>
              </div>
          </div>
          <nav className="flex-1 p-4 space-y-1">
              <button id="nav-dashboard" onClick={() => setCurrentView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all ${currentView === 'dashboard' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}><BarChart3 className="w-5 h-5"/> Resumen</button>
              <button id="nav-orders" onClick={() => setCurrentView('orders')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all ${currentView === 'orders' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
                  <ShoppingBag className="w-5 h-5"/> Pedidos 
                  {pendientes > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">{pendientes}</span>}
              </button>
              <button id="nav-inventory" onClick={() => setCurrentView('inventory')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all ${currentView === 'inventory' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}><Package className="w-5 h-5"/> Inventario</button>
              <button id="nav-customers" onClick={() => setCurrentView('customers')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all ${currentView === 'customers' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}><Users className="w-5 h-5"/> Clientes</button>
          </nav>
          <div className="p-4 border-t border-slate-100 space-y-2">
             <button onClick={() => setShowGuide(true)} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-500 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition"><HelpCircle className="w-4 h-4"/> Tutorial</button>
             <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:text-red-600 rounded-xl hover:bg-red-50 transition"><LogOut className="w-4 h-4"/> Salir</button>
          </div>
      </aside>

      {/* --- SIDEBAR MOBILE (DRAWER) --- */}
      <AnimatePresence>
         {isMobileMenuOpen && (
             <>
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"/>
                <motion.div initial={{x:'-100%'}} animate={{x:0}} exit={{x:'-100%'}} className="fixed left-0 top-0 h-full w-[280px] bg-white z-50 shadow-2xl flex flex-col lg:hidden">
                    <div className="p-6 bg-slate-900 text-white flex items-center gap-3">
                        <LayoutDashboard className="w-6 h-6"/> <span className="font-black text-xl">Panel Jefe</span>
                    </div>
                    <nav className="flex-1 p-4 space-y-1">
                        <button id="nav-dashboard-mobile" onClick={() => { setCurrentView('dashboard'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold ${currentView === 'dashboard' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'}`}><BarChart3 className="w-5 h-5"/> Resumen</button>
                        <button id="nav-orders-mobile" onClick={() => { setCurrentView('orders'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold ${currentView === 'orders' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'}`}><ShoppingBag className="w-5 h-5"/> Pedidos</button>
                        <button id="nav-inventory-mobile" onClick={() => { setCurrentView('inventory'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold ${currentView === 'inventory' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'}`}><Package className="w-5 h-5"/> Inventario</button>
                        <button id="nav-customers-mobile" onClick={() => { setCurrentView('customers'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold ${currentView === 'customers' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'}`}><Users className="w-5 h-5"/> Clientes</button>
                    </nav>
                    <div className="p-4">
                        <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100"><LogOut className="w-5 h-5"/> Salir</button>
                    </div>
                </motion.div>
             </>
         )}
      </AnimatePresence>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="flex-1 lg:ml-64 p-4 sm:p-8 max-w-[1920px] mx-auto w-full">
         {/* Top Bar Mobile */}
         <div className="lg:hidden flex items-center justify-between mb-6">
             <div className="flex items-center gap-3">
                 <button id="admin-menu-btn" onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-white rounded-xl shadow-sm border border-slate-200"><Menu className="w-6 h-6 text-slate-700"/></button>
                 <span className="font-extrabold text-lg text-slate-900">Bodega Jormard</span>
             </div>
             <button onClick={() => { playNotificationSound(); showToast("Sonido OK 🔊", 'success'); }} className="p-2 bg-white rounded-full shadow-sm"><Volume2 className="w-5 h-5 text-slate-400"/></button>
         </div>

         {/* Vista: Dashboard */}
         {currentView === 'dashboard' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                     <div>
                         <h1 className="text-4xl font-black text-slate-900 tracking-tight">Buenos días, Jefe 👋</h1>
                         <p className="text-slate-500 font-medium mt-1">Aquí tienes el resumen de hoy.</p>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => { playNotificationSound(); showToast("Sonido OK", 'success'); }} className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 shadow-sm"><Volume2 className="w-4 h-4"/> Probar Sonido</button>
                     </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Ventas Totales" value={`S/ ${totalVentas.toFixed(2)}`} icon={<TrendingUp className="w-8 h-8 text-emerald-600"/>} color="text-emerald-600" subtext="Ingresos netos"/>
                    <StatCard title="Pedidos Pendientes" value={`${pendientes}`} icon={<Bell className="w-8 h-8 text-orange-600"/>} color="text-orange-600" subtext="Requieren atención"/>
                    <StatCard title="Inventario Bajo" value={`${lowStock}`} icon={<AlertTriangle className="w-8 h-8 text-red-600"/>} color="text-red-600" subtext="Productos < 5 un."/>
                    <StatCard title="Clientes Totales" value={`${uniqueCustomers.length}`} icon={<Users className="w-8 h-8 text-blue-600"/>} color="text-blue-600" subtext="Registrados"/>
                 </div>

                 <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                     <h3 className="text-xl font-bold text-slate-900 mb-6">Últimos Pedidos</h3>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="text-slate-400 font-bold uppercase text-xs border-b border-slate-100">
                                <tr><th className="pb-4 pl-2">ID</th><th className="pb-4">Cliente</th><th className="pb-4">Monto</th><th className="pb-4">Estado</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {orders.slice(0, 5).map(o => (
                                    <tr key={o.id} className="group hover:bg-slate-50 transition cursor-pointer" onClick={() => {setSelectedOrder(o); setCurrentView('orders')}}>
                                            <td className="py-4 pl-2 font-bold text-slate-600">#{o.id}</td>
                                            <td className="py-4 font-medium text-slate-900">{o.cliente_nombre}</td>
                                            <td className="py-4 font-black text-slate-900">S/ {o.total.toFixed(2)}</td>
                                            <td className="py-4"><span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${o.estado === 'pendiente' ? 'bg-orange-100 text-orange-700' : o.estado === 'pagado' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>{o.estado.toUpperCase()}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     </div>
                     <button onClick={() => setCurrentView('orders')} className="w-full mt-6 py-4 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition flex items-center justify-center gap-2 border border-slate-100">Ver todos los pedidos <ArrowRight className="w-4 h-4"/></button>
                 </div>
             </div>
         )}

         {/* Vista: Pedidos */}
         {currentView === 'orders' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h2 className="text-3xl font-black text-slate-900">Gestión de Pedidos</h2>
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400"/>
                        <input type="text" placeholder="Buscar cliente..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)} className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full shadow-sm font-medium"/>
                    </div>
                </div>

                {loading ? <div className="text-center py-20"><Loader2 className="animate-spin w-12 h-12 mx-auto text-slate-300"/></div> : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <AnimatePresence>
                    {orders
                      .filter(o => o.cliente_nombre.toLowerCase().includes(orderSearch.toLowerCase()))
                      .map((order) => (
                      <motion.div 
                        key={order.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className={`bg-white border rounded-3xl p-6 shadow-sm relative overflow-hidden cursor-pointer hover:shadow-xl transition-all group ${order.estado === 'pendiente' ? 'border-l-8 border-l-orange-400' : ''} ${order.estado === 'pagado' ? 'border-l-8 border-l-purple-500 bg-purple-50/10' : ''} ${order.estado === 'atendido' ? 'opacity-70 border-slate-200 grayscale-[0.3]' : ''}`}
                        onClick={() => setSelectedOrder(order)}
                      >
                        {order.estado === 'pendiente' && <div className="absolute top-0 right-0 bg-orange-400 text-white text-[10px] font-black px-4 py-1.5 rounded-bl-2xl shadow-sm tracking-wider">POR PAGAR</div>}
                        {order.estado === 'pagado' && <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-black px-4 py-1.5 rounded-bl-2xl shadow-sm flex gap-1 items-center tracking-wider"><CheckCircle2 className="w-3 h-3"/> LISTO</div>}
                        
                        {order.comprobante_url && order.estado === 'pendiente' && (
                            <div className="absolute top-10 right-4 animate-pulse">
                                <div className="bg-purple-100 text-purple-700 p-2 rounded-full shadow-sm border border-purple-200"><Paperclip className="w-5 h-5" /></div>
                            </div>
                        )}

                        <div className="mb-4 pl-2">
                            <h3 className="font-bold text-slate-900 text-xl group-hover:text-indigo-600 transition-colors mb-1">{order.cliente_nombre}</h3>
                            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(order.created_at).toLocaleString()}</div>
                        </div>

                        <div className="flex justify-between items-end pl-2 pt-4 border-t border-slate-100">
                            <div className="flex flex-col gap-1">
                                <span className="bg-slate-100 px-3 py-1 rounded-lg text-slate-600 text-xs font-bold w-fit">{order.items.length} items</span>
                                {order.metodo_pago === 'yape' ? <span className="text-purple-600 font-black text-xs uppercase flex items-center gap-1"><Zap size={12}/> Yape</span> : <span className="text-green-600 font-black text-xs uppercase flex items-center gap-1"><Banknote size={12}/> Efectivo</span>}
                            </div>
                            <div className="text-2xl font-black text-slate-900">S/ {order.total.toFixed(2)}</div>
                        </div>
                      </motion.div>
                    ))}
                    </AnimatePresence>
                  </div>
                )}
             </div>
         )}

         {/* Vista: Inventario (MODIFICADA: 2 Columnas MAX) */}
         {currentView === 'inventory' && (
             <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom-4">
                 {/* COLUMNA 1: FORMULARIO */}
                 <div className="lg:col-span-1" ref={formTopRef}>
                     <div className={`bg-white p-6 rounded-3xl shadow-sm border sticky top-24 transition-colors ${editingId ? 'border-orange-400 ring-4 ring-orange-50' : 'border-slate-200'}`}>
                         <h2 className="text-xl font-black flex items-center gap-2 mb-6 text-slate-900">{editingId ? <Pencil className="w-6 h-6 text-orange-600"/> : <Plus className="w-6 h-6 text-indigo-600"/>} {editingId ? "Editar Producto" : "Nuevo Producto"}</h2>
                         <form onSubmit={handleSaveProduct} className="space-y-5">
                             <div className="space-y-1.5" id="tour-form-basic">
                                 <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Nombre</label>
                                 <input type="text" id="tour-product-name" value={newProduct.nombre} onChange={e => setNewProduct({...newProduct, nombre: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-700" placeholder="Ej. Coca Cola 3L"/>
                             </div>
                             <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Precio</label>
                                    <input type="number" step="0.10" id="tour-product-price" value={newProduct.precio} onChange={e => setNewProduct({...newProduct, precio: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700" placeholder="0.00" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Stock</label>
                                    <input type="number" id="tour-product-stock" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700" placeholder="0" />
                                </div>
                             </div>
                             <div id="tour-form-offer" className={`border-2 rounded-2xl p-4 transition-all ${newProduct.oferta_activa ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-100'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 cursor-pointer select-none"><Zap className={`w-4 h-4 ${newProduct.oferta_activa ? 'text-orange-500 fill-orange-500' : 'text-slate-300'}`} /> Oferta Flash</label>
                                    <div onClick={() => setNewProduct({...newProduct, oferta_activa: !newProduct.oferta_activa})} className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors ${newProduct.oferta_activa ? 'bg-orange-500' : 'bg-slate-200'}`}>
                                            <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${newProduct.oferta_activa ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </div>
                                </div>
                                {newProduct.oferta_activa && (
                                    <motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} className="space-y-3 pt-2">
                                            <input type="number" step="0.10" placeholder="Precio Oferta" value={newProduct.precio_oferta} onChange={e => setNewProduct({...newProduct, precio_oferta: e.target.value})} className="w-full p-2 bg-white border-2 border-orange-100 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-sm font-bold text-orange-600" />
                                            <div className="grid grid-cols-2 gap-2">
                                                <input type="time" value={newProduct.hora_inicio} onChange={e => setNewProduct({...newProduct, hora_inicio: e.target.value})} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium" />
                                                <input type="time" value={newProduct.hora_fin} onChange={e => setNewProduct({...newProduct, hora_fin: e.target.value})} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium" />
                                            </div>
                                    </motion.div>
                                )}
                             </div>
                             <div className="space-y-1.5">
                                 <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Categoría</label>
                                 <select value={newProduct.categoria} onChange={e => setNewProduct({...newProduct, categoria: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700">
                                     <option value="">Seleccionar...</option>
                                     {dynamicCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                 </select>
                             </div>
                             <div id="tour-form-image" onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-300 p-8 rounded-2xl text-center cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 transition-all group bg-slate-50">
                                {uploadingImage ? <Loader2 className="animate-spin mx-auto text-indigo-500"/> : (newProduct.imagen_url ? <img src={newProduct.imagen_url} className="h-32 w-full object-contain rounded-lg"/> : <div className="text-slate-400 text-sm font-bold group-hover:text-indigo-500"><Upload className="w-8 h-8 mx-auto mb-2 text-slate-300 group-hover:text-indigo-400"/>Subir Foto</div>)}
                             </div>
                             <input type="file" ref={fileInputRef} hidden onChange={handleImageUpload} />
                             
                             <div className="flex gap-3 pt-2">
                                 {editingId && <button type="button" onClick={resetForm} className="flex-1 bg-white border-2 border-slate-200 text-slate-600 font-bold py-4 rounded-xl hover:bg-slate-50 transition">Cancelar</button>}
                                 <button type="submit" className={`flex-1 text-white font-bold py-4 rounded-xl shadow-xl transition-all active:scale-95 ${editingId ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-200' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-300'}`}>{editingId ? "Actualizar Producto" : "Guardar Producto"}</button>
                             </div>
                         </form>
                         
                         {!editingId && (
                             <div id="tour-excel-actions" className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 gap-3">
                                 <button onClick={handleDownloadTemplate} className="bg-white border-2 border-slate-100 text-slate-600 font-bold py-3 rounded-xl text-xs hover:border-slate-300 flex items-center justify-center gap-2"><FileDown size={16}/> Plantilla</button>
                                 <button id="tour-excel-btn" onClick={() => excelInputRef.current?.click()} className="bg-green-50 border-2 border-green-100 text-green-700 font-bold py-3 rounded-xl text-xs hover:bg-green-100 flex items-center justify-center gap-2"><FileUp size={16}/> Importar</button>
                                 <input type="file" ref={excelInputRef} hidden accept=".xlsx" onChange={handleExcelUpload} />
                                 {/* BOTÓN EXPORTAR INVENTARIO */}
                                 <button onClick={handleExportInventory} className="col-span-2 bg-indigo-50 border-2 border-indigo-100 text-indigo-700 font-bold py-3 rounded-xl text-xs hover:bg-indigo-100 flex items-center justify-center gap-2"><Download size={16}/> Exportar Todo</button>
                             </div>
                         )}
                     </div>
                 </div>

                 <div className="lg:col-span-3 space-y-8">
                     <div className="relative">
                        <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400"/>
                        <input type="text" placeholder="Buscar producto por nombre..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl w-full text-base font-medium focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"/>
                     </div>
                     
                     {/* INVENTARIO: 2 COLUMNAS PARA MEJOR VISIBILIDAD */}
                     <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                       {Object.entries(groupedProducts).map(([categoria, prods]) => {
                           if (prods.length === 0) return null;
                           return (
                             <div key={categoria} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col h-full">
                                 <div className="flex items-center gap-3 mb-6 pb-2 border-b border-slate-50">
                                     <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600"><Tags className="w-5 h-5"/></div>
                                     <h3 className="font-black text-slate-800 text-xl uppercase tracking-tight">{categoria} <span className="text-slate-400 text-sm font-bold ml-2 bg-slate-100 px-2 py-0.5 rounded-full">{prods.length}</span></h3>
                                 </div>
                                 
                                 <div className="flex-1 space-y-4 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                                     <AnimatePresence>
                                     {prods.map(p => (
                                         <motion.div key={p.id} layout initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-lg ${editingId === p.id ? 'border-orange-400 bg-orange-50 ring-1 ring-orange-200' : 'border-slate-100 bg-white hover:border-indigo-100'}`}>
                                             <div className="w-16 h-16 bg-slate-50 rounded-2xl flex-shrink-0 relative overflow-hidden border border-slate-100">
                                                 <img src={p.imagen_url} className="w-full h-full object-cover" onError={(e) => (e.target as HTMLImageElement).src = '/placeholder.png'} />
                                                 {p.oferta_activa && <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center backdrop-blur-[1px]"><Zap className="w-6 h-6 text-white drop-shadow-md"/></div>}
                                             </div>
                                             <div className="flex-1 min-w-0">
                                                 <h4 className="font-bold text-slate-900 text-lg truncate" title={p.nombre}>{p.nombre}</h4>
                                                 <div className="flex justify-between items-end mt-2">
                                                     <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${p.stock < 5 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>Stock: {p.stock}</span>
                                                     <div className="text-right">
                                                         {p.oferta_activa ? <><span className="block text-xs text-slate-400 line-through font-bold">S/ {p.precio.toFixed(2)}</span><span className="font-black text-orange-600 text-xl">S/ {p.precio_oferta?.toFixed(2)}</span></> : <span className="font-black text-slate-900 text-xl">S/ {p.precio.toFixed(2)}</span>}
                                                     </div>
                                                 </div>
                                             </div>
                                             <div className="flex flex-col gap-2">
                                                 <button onClick={() => handleEditClick(p)} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-colors"><Pencil size={18}/></button>
                                                 <button onClick={() => handleDeleteProduct(p.id)} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"><Trash2 size={18}/></button>
                                             </div>
                                         </motion.div>
                                     ))}
                                     </AnimatePresence>
                                 </div>
                             </div>
                           );
                       })}
                     </div>

                     {Object.keys(groupedProducts).length === 0 && (
                         <div className="text-center py-32 opacity-40">
                             <Package className="w-24 h-24 mx-auto mb-6 text-slate-300"/>
                             <p className="text-xl font-bold text-slate-400">No hay productos que coincidan.</p>
                         </div>
                     )}
                 </div>
             </div>
         )}

         {/* Vista: Clientes */}
         {currentView === 'customers' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                 <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                     <h2 className="text-3xl font-black text-slate-900">Cartera de Clientes</h2>
                     <div className="relative w-full sm:w-96">
                         <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400"/>
                         <input type="text" placeholder="Buscar cliente por nombre o teléfono..." value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} className="pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-base font-medium focus:ring-2 focus:ring-indigo-500 outline-none w-full shadow-sm"/>
                     </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                     {filteredCustomers.length === 0 ? (
                         <div className="col-span-full text-center py-32 opacity-40">
                             <Users className="w-24 h-24 mx-auto mb-6 text-slate-300"/>
                             <p className="text-xl font-bold text-slate-400">No se encontraron clientes.</p>
                         </div>
                     ) : (
                         filteredCustomers.map((customer, idx) => (
                             <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} transition={{delay: idx*0.05}} key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col gap-5 relative overflow-hidden">
                                 <div className={`absolute top-0 right-0 p-8 rounded-bl-3xl opacity-10 ${getAvatarColor(customer.name).replace('text', 'bg')}`}></div>
                                 
                                 <div className="flex items-center gap-4 relative z-10">
                                     <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm ${getAvatarColor(customer.name)}`}>
                                         {customer.name.charAt(0)}
                                     </div>
                                     <div className="overflow-hidden">
                                         <h3 className="font-bold text-slate-900 text-lg truncate" title={customer.name}>{customer.name}</h3>
                                         <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5 mt-1"><Phone className="w-3.5 h-3.5"/> {customer.phone}</p>
                                     </div>
                                 </div>
                                 
                                 <div className="grid grid-cols-2 gap-3 text-center bg-slate-50 rounded-2xl p-3 border border-slate-100">
                                     <div>
                                         <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Pedidos</p>
                                         <p className="font-black text-xl text-slate-900">{customer.orderCount}</p>
                                     </div>
                                     <div>
                                         <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Gastado</p>
                                         <p className="font-black text-xl text-emerald-600">S/ {customer.totalSpent.toFixed(2)}</p>
                                     </div>
                                 </div>

                                 <div className="flex justify-between items-center text-xs text-slate-400 border-t border-slate-50 pt-4">
                                     <span className="flex items-center gap-1.5 font-bold uppercase tracking-wide"><Calendar className="w-3.5 h-3.5"/> Último pedido</span>
                                     <span className="font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{new Date(customer.lastOrder).toLocaleDateString()}</span>
                                 </div>
                             </motion.div>
                         ))
                     )}
                 </div>
             </div>
         )}
      </main>

      {/* --- MODAL DETALLE PEDIDO --- */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md" onClick={() => setSelectedOrder(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="bg-white w-full max-w-lg rounded-[2rem] overflow-hidden shadow-2xl relative border border-white/20" onClick={e => e.stopPropagation()}>
                
                <div className={`p-8 text-white flex justify-between items-start ${selectedOrder.estado === 'pendiente' ? 'bg-slate-900' : selectedOrder.estado === 'pagado' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-3xl font-black tracking-tight">Pedido #{selectedOrder.id}</h2>
                      <button onClick={() => copyToClipboard(`Pedido #${selectedOrder.id}`)} className="bg-white/10 p-1.5 rounded-lg hover:bg-white/20 transition"><Copy className="w-4 h-4"/></button>
                    </div>
                    <p className="text-white/80 text-sm font-bold flex items-center gap-2"><Clock className="w-4 h-4"/> {new Date(selectedOrder.created_at).toLocaleString()}</p>
                  </div>
                  <button onClick={() => setSelectedOrder(null)} className="bg-white/10 p-2.5 rounded-full hover:bg-white/20 transition"><X className="w-6 h-6 text-white"/></button>
                </div>
                
                <div className="p-8 max-h-[60vh] overflow-y-auto bg-slate-50">
                    {/* EVIDENCIA DE PAGO */}
                    {selectedOrder.metodo_pago === 'yape' && selectedOrder.comprobante_url && (
                        <div className="mb-8 bg-white border border-indigo-100 rounded-3xl p-5 flex items-center gap-5 relative overflow-hidden shadow-sm">
                           <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-black px-4 py-1.5 rounded-bl-2xl z-10 tracking-widest">EVIDENCIA</div>
                           <div className="h-24 w-24 rounded-2xl bg-slate-200 flex-shrink-0 overflow-hidden cursor-pointer shadow-inner border border-slate-100" onClick={() => window.open(selectedOrder.comprobante_url, '_blank')}>
                              <img src={selectedOrder.comprobante_url} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                           </div>
                           <div className="flex-1">
                               <p className="text-sm font-black text-indigo-900 uppercase mb-2">Pago con Yape/Plin</p>
                               <button onClick={() => window.open(selectedOrder.comprobante_url, '_blank')} className="text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-100 transition-colors w-fit">
                                  <Eye className="w-4 h-4"/> Ver Comprobante
                               </button>
                           </div>
                        </div>
                    )}

                    {selectedOrder.metodo_pago === 'yape' && !selectedOrder.comprobante_url && (
                        <div className="mb-8 bg-orange-50 border border-orange-200 rounded-3xl p-5 flex items-center gap-4">
                           <div className="bg-orange-100 p-3 rounded-full"><AlertTriangle className="w-6 h-6 text-orange-600"/></div>
                           <div><p className="text-sm font-black text-orange-900 uppercase">Sin Evidencia</p><p className="text-sm text-orange-800 font-medium">El cliente no subió foto. Verifica su Yape manualmente.</p></div>
                        </div>
                    )}

                    <div className="bg-white border border-slate-200 p-6 rounded-3xl mb-8 space-y-5 shadow-sm">
                      <div className="flex items-start gap-4">
                          <div className="bg-slate-100 p-3 rounded-2xl"><Users className="w-5 h-5 text-slate-700"/></div>
                          <div><p className="text-xs text-slate-400 font-black uppercase tracking-wider">Cliente</p><p className="font-bold text-slate-900 text-lg">{selectedOrder.cliente_nombre}</p></div>
                      </div>
                      <div className="flex items-start gap-4">
                          <div className="bg-slate-100 p-3 rounded-2xl"><MapPin className="w-5 h-5 text-slate-700"/></div>
                          <div className="flex-1">
                            <p className="text-xs text-slate-400 font-black uppercase tracking-wider">Dirección</p>
                            <p className="font-medium text-slate-700 text-base break-words mt-0.5">{selectedOrder.tipo_entrega === 'delivery' ? selectedOrder.direccion : 'Recojo en Tienda'}</p>
                            {selectedOrder.tipo_entrega === 'delivery' && (
                                <button onClick={() => handleOpenMap(selectedOrder.direccion)} className="mt-3 text-xs flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-bold hover:bg-blue-100 transition-colors border border-blue-100 w-fit">
                                    <Map className="w-4 h-4" /> Ver en Google Maps <ExternalLink className="w-3 h-3"/>
                                </button>
                            )}
                          </div>
                      </div>
                      <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <span className="font-black text-indigo-600 text-lg tracking-wide">{selectedOrder.cliente_telefono}</span>
                          <button onClick={() => copyToClipboard(selectedOrder.cliente_telefono)} className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1.5"><Copy className="w-4 h-4"/> COPIAR</button>
                      </div>
                    </div>

                    <div className="space-y-4">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Productos ({selectedOrder.items.length})</p>
                        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                            {selectedOrder.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition">
                                <div className="flex items-center gap-4">
                                    <span className="bg-slate-900 text-white font-black w-8 h-8 flex items-center justify-center rounded-lg text-sm">{item.cantidad}</span>
                                    <span className="font-bold text-slate-700">{item.nombre}</span>
                                </div>
                                <span className="font-black text-slate-900">S/ {(item.precio * item.cantidad).toFixed(2)}</span>
                            </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-8 pt-6 border-t-2 border-slate-200">
                        <div className="flex flex-col"><span className="text-slate-500 font-bold text-sm">Total a cobrar</span><span className="text-xs text-slate-400 uppercase font-black tracking-wider">{selectedOrder.metodo_pago === 'yape' ? 'Vía Yape/Plin' : 'En Efectivo'}</span></div>
                        <span className="text-4xl font-black text-slate-900 tracking-tight">S/ {selectedOrder.total.toFixed(2)}</span>
                    </div>
                </div>

                <div className="p-8 bg-white border-t border-slate-100">
                  {selectedOrder.estado === 'pendiente' && (
                    <div className="flex gap-4">
                      <button onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'cancelado')} className="flex-1 py-4 rounded-2xl border-2 border-slate-200 font-bold text-slate-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all text-sm">Cancelar Pedido</button>
                      <button onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'pagado')} className="flex-[2] py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-200 flex items-center justify-center gap-2 transform active:scale-95 transition-all text-sm uppercase tracking-wide"><Banknote className="w-5 h-5" /> Confirmar Pago</button>
                    </div>
                  )}
                  {selectedOrder.estado === 'pagado' && (
                    <button onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'atendido')} className="w-full py-5 rounded-2xl bg-emerald-500 text-white font-black hover:bg-emerald-600 shadow-xl shadow-emerald-200 flex items-center justify-center gap-3 transform active:scale-95 transition-all text-lg uppercase tracking-wide"><CheckCircle2 className="w-6 h-6" /> {selectedOrder.tipo_entrega === 'delivery' ? 'Marcar como Enviado' : 'Marcar como Entregado'}</button>
                  )}
                  <div className="mt-6 text-center">
                    <button onClick={() => handleDeleteOrder(selectedOrder.id)} className="text-red-400 font-bold text-xs hover:text-red-600 flex items-center justify-center gap-2 mx-auto hover:bg-red-50 px-4 py-2 rounded-xl transition"><Trash2 className="w-4 h-4" /> Eliminar Definitivamente</button>
                  </div>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}