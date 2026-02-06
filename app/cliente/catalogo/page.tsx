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
  ChevronLeft, ChevronRight, Heart, Home, Star, LayoutGrid, Trophy, Flag, Check
} from 'lucide-react';

// --- IMPORTACIÓN DINÁMICA DEL MAPA ---
const LocationMap = dynamic(() => import('@/app/components/LocationMap'), { 
  ssr: false,
  loading: () => <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 text-white backdrop-blur-md"><div className="flex flex-col items-center"><Loader2 className="animate-spin mr-2 w-10 h-10"/><p className="mt-2 font-bold">Cargando mapa...</p></div></div>
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

interface CartItem extends Producto {
  cantidad: number;
  precioFinal: number;
}

interface Pedido {
  id: number;
  created_at: string;
  total: number;
  estado: 'pendiente' | 'pagado' | 'atendido' | 'cancelado';
  items: CartItem[];
  tipo_entrega: 'delivery' | 'recojo';
  direccion?: string;
  metodo_pago?: string;
  comprobante_url?: string;
}

interface UserAddress {
    id: number;
    alias: string;
    direccion: string;
}

// --- HELPER: VERIFICAR OFERTA ---
const isOfferActive = (prod: Producto): boolean => {
  if (!prod.oferta_activa || !prod.precio_oferta) return false;
  if (!prod.hora_inicio || !prod.hora_fin) return true;
  
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = prod.hora_inicio.split(':').map(Number);
  const [endH, endM] = prod.hora_fin.split(':').map(Number);
  return currentMinutes >= (startH * 60 + startM) && currentMinutes <= (endH * 60 + endM);
};

// --- COMPONENTE TOAST ANIMADO ---
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error' | 'offer', onClose: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: 50, scale: 0.9 }} 
    animate={{ opacity: 1, y: 0, scale: 1 }} 
    exit={{ opacity: 0, y: 20, scale: 0.9 }}
    className={`fixed bottom-24 left-1/2 -translate-x-1/2 md:bottom-10 md:left-10 md:translate-x-0 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 backdrop-blur-xl border ${
      type === 'success' ? 'bg-slate-900/95 text-white border-slate-800' : 
      type === 'offer' ? 'bg-orange-600/95 text-white border-orange-500' :
      'bg-red-500/95 text-white border-red-400'
    }`}
  >
    <div className={`p-2 rounded-full ${type === 'success' ? 'bg-green-500/20' : type === 'offer' ? 'bg-yellow-400/20' : 'bg-red-900/20'}`}>
        {type === 'success' ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : type === 'offer' ? <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300 animate-pulse" /> : <X className="w-5 h-5" />}
    </div>
    <span className="font-bold text-sm tracking-wide">{message}</span>
  </motion.div>
);

// --- COMPONENTE CONFETI ---
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

// --- COMPONENTE TOUR GUIDE (CORREGIDO TIPOS) ---
const TourGuide = ({ isOpen, onClose, setCurrentView, setIsCartOpen }: { 
    isOpen: boolean; 
    onClose: () => void;
    // Aquí definimos los tipos que faltaban para arreglar el error TS2322
    setCurrentView: (view: any) => void;
    setIsCartOpen: (open: boolean) => void;
}) => {
    const [step, setStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
    const [showConfetti, setShowConfetti] = useState(false);

    const steps = [
        { 
            title: "👋 ¡Bienvenido querido usuario!", 
            desc: "Te presento tu nueva Bodega Digital. Vamos a dar un paseo rápido.",
            targetId: null,
            view: 'store'
        },
        { 
            title: "🔍 Buscador Inteligente", 
            desc: "Escribe aquí para encontrar tus antojos al instante. ¡Es súper rápido!",
            targetId: 'tour-search',
            mobileId: 'tour-search-mobile',
            view: 'store'
        },
        { 
            title: "🏷️ Categorías", 
            desc: "Navega rápidamente entre nuestras secciones.",
            targetId: 'tour-categories',
            mobileId: 'tour-categories',
            view: 'store' 
        },
        { 
            title: "❤️ Favoritos", 
            desc: "Guarda los productos que más compras.",
            targetId: 'nav-favorites', 
            mobileId: 'nav-favorites-mobile',
            view: 'favorites' 
        },
        { 
            title: "📦 Pedidos", 
            desc: "Revisa el estado de tus compras en tiempo real.",
            targetId: 'nav-orders', 
            mobileId: 'nav-orders-mobile',
            view: 'orders' 
        },
        { 
            title: "👤 Perfil", 
            desc: "Mantén tus datos y foto actualizados.",
            targetId: 'nav-profile', 
            mobileId: 'nav-profile-mobile',
            view: 'profile' 
        },
        { 
            title: "🛒 Tu Canasta", 
            desc: "Aquí verás el total a pagar. ¡Vamos a abrirla!",
            targetId: 'tour-cart',
            mobileId: 'tour-cart-mobile',
            view: 'store', 
            action: () => setIsCartOpen(true) 
        },
        { 
            title: "🎉 ¡Todo Listo!", 
            desc: "Ya eres un experto. ¡Disfruta comprando!",
            targetId: null,
            view: 'store'
        }
    ];

    // Efecto para cambiar vista y ejecutar acciones
    useEffect(() => {
        const currentStepConfig = steps[step];
        if (currentStepConfig.view) {
            setCurrentView(currentStepConfig.view);
        }
        if (currentStepConfig.action) {
            setTimeout(() => currentStepConfig.action && currentStepConfig.action(), 300);
        } else {
             if(step !== 6) setIsCartOpen(false);
        }
    }, [step]);

    const updatePosition = () => {
        const currentStep = steps[step];
        let el = null;
        
        if (currentStep.targetId) {
            el = document.getElementById(currentStep.targetId);
            if (el && window.getComputedStyle(el).display === 'none' && currentStep.mobileId) {
                el = document.getElementById(currentStep.mobileId);
            }
        }
        if (!el && currentStep.mobileId) el = document.getElementById(currentStep.mobileId);

        if (el) {
            const rect = el.getBoundingClientRect();
            setTargetRect(rect);
            const isSidebar = rect.left < 300 && rect.width > 150; 
            
            if (isSidebar) {
                setTooltipStyle({
                    top: `${rect.top}px`,
                    left: `${rect.right + 20}px`,
                    transform: 'translateY(-10%)',
                    width: '300px'
                });
            } else {
                const spaceBelow = window.innerHeight - rect.bottom;
                const showBelow = spaceBelow > 250;
                setTooltipStyle({
                    top: showBelow ? `${rect.bottom + 20}px` : 'auto',
                    bottom: !showBelow ? `${window.innerHeight - rect.top + 20}px` : 'auto',
                    left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '350px'
                });
            }
        } else {
            setTargetRect(null);
            setTooltipStyle({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: '400px' });
        }
    };

    useLayoutEffect(() => {
        if (isOpen) {
            const timer = setTimeout(updatePosition, 400); 
            window.addEventListener('resize', updatePosition);
            return () => { window.removeEventListener('resize', updatePosition); clearTimeout(timer); }
        }
    }, [step, isOpen]);

    const handleNext = () => { 
        if (step < steps.length - 1) {
            setStep(step + 1); 
        } else {
            setShowConfetti(true);
            setTimeout(() => { onClose(); setShowConfetti(false); }, 4000);
        }
    };

    if (!isOpen && !showConfetti) return null;

    return (
        <>
            {showConfetti && <Confetti />}
            {isOpen && (
            <div className="fixed inset-0 z-[100] overflow-hidden font-sans">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 transition-all duration-500 ease-in-out"
                    style={{
                        background: 'rgba(0,0,0,0.7)',
                        backdropFilter: 'blur(3px)',
                        clipPath: targetRect ? `polygon(0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%, ${targetRect.left}px ${targetRect.top}px, ${targetRect.right}px ${targetRect.top}px, ${targetRect.right}px ${targetRect.bottom}px, ${targetRect.left}px ${targetRect.bottom}px, ${targetRect.left}px ${targetRect.top}px)` : undefined
                    }}
                />
                {targetRect && (
                    <motion.div layoutId="tour-ring" className="absolute border-4 border-indigo-500 rounded-xl shadow-[0_0_30px_rgba(99,102,241,0.6)]"
                        style={{ top: targetRect.top - 8, left: targetRect.left - 8, width: targetRect.width + 16, height: targetRect.height + 16, borderRadius: '16px' }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                )}
                <motion.div key={step} initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute bg-white p-6 rounded-3xl shadow-2xl z-[101] border border-slate-100" style={tooltipStyle}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-indigo-100 p-2.5 rounded-2xl text-indigo-600 shadow-sm">
                            {step === steps.length - 1 ? <Trophy size={24}/> : <Flag size={24}/>}
                        </div>
                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{step + 1} / {steps.length}</span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">{steps[step].title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed mb-6 font-medium">{steps[step].desc}</p>
                    <div className="flex justify-between items-center">
                        <button onClick={onClose} className="text-slate-400 font-bold text-xs hover:text-slate-600 transition">Saltar</button>
                        <button onClick={handleNext} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 transform active:scale-95">
                            {step === steps.length - 1 ? '¡Finalizar!' : 'Siguiente'} <ArrowRight size={16}/>
                        </button>
                    </div>
                </motion.div>
            </div>
            )}
        </>
    );
};

// --- COMPONENTE: TARJETA DE PEDIDO ---
const OrderCard = ({ order }: { order: Pedido }) => {
  const [expanded, setExpanded] = useState(false);
  const statusConfig = { 
      pendiente: { color: 'bg-orange-100 text-orange-700', label: 'Pendiente', icon: Clock }, 
      pagado: { color: 'bg-purple-100 text-purple-700', label: 'Pagado', icon: Banknote }, 
      atendido: { color: 'bg-emerald-100 text-emerald-700', label: 'Completado', icon: CheckCircle2 }, 
      cancelado: { color: 'bg-red-100 text-red-700', label: 'Cancelado', icon: X } 
  };
  const StatusIcon = statusConfig[order.estado].icon;

  return (
    <motion.div layout className="bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-hidden mb-4 hover:shadow-md transition-shadow">
      <div onClick={() => setExpanded(!expanded)} className="p-5 cursor-pointer bg-white">
        <div className="flex justify-between items-start mb-4">
             <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${order.tipo_entrega === 'delivery' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                    {order.tipo_entrega === 'delivery' ? <Bike className="w-6 h-6"/> : <Store className="w-6 h-6"/>}
                </div>
                <div>
                    <h4 className="font-black text-slate-900 text-lg">Pedido #{order.id}</h4>
                    <p className="text-xs text-slate-400 font-bold">{new Date(order.created_at).toLocaleDateString()} • {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
             </div>
             <div className={`px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 ${statusConfig[order.estado].color}`}>
                 <StatusIcon className="w-3 h-3"/> {statusConfig[order.estado].label.toUpperCase()}
             </div>
        </div>
        
        <div className="flex justify-between items-center mt-2">
            <span className="text-sm font-bold text-slate-500">{order.items.length} productos</span>
            <div className="flex items-center gap-2">
                <span className="font-black text-slate-900 text-xl">S/ {order.total.toFixed(2)}</span>
                <motion.div animate={{ rotate: expanded ? 180 : 0 }} className="bg-slate-100 p-1 rounded-full"><ChevronDown className="w-4 h-4 text-slate-600"/></motion.div>
            </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-slate-100 bg-slate-50/50">
                <div className="p-5">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Detalle de Compra</p>
                    <div className="space-y-3 mb-5">
                        {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm items-center bg-white p-3 rounded-xl border border-slate-100">
                                <span className="text-slate-700 font-medium"><span className="font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md mr-2">{item.cantidad}x</span> {item.nombre}</span>
                                <span className="font-bold text-slate-900">S/ {(item.precio * item.cantidad).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                         <div className="bg-white p-3 rounded-xl border border-slate-100">
                             <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Método de Pago</p>
                             <div className="flex items-center gap-2 font-bold text-slate-700 text-sm">
                                 {order.metodo_pago === 'yape' ? <Smartphone className="w-4 h-4 text-purple-600"/> : <Banknote className="w-4 h-4 text-green-600"/>}
                                 {order.metodo_pago === 'yape' ? 'Yape/Plin' : 'Efectivo'}
                             </div>
                         </div>
                         <div className="bg-white p-3 rounded-xl border border-slate-100">
                             <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Entrega</p>
                             <div className="flex items-center gap-2 font-bold text-slate-700 text-sm truncate">
                                 <MapPin className="w-4 h-4 text-red-500"/>
                                 <span className="truncate">{order.direccion || 'Tienda'}</span>
                             </div>
                         </div>
                    </div>
                    {order.comprobante_url && (
                        <button onClick={() => window.open(order.comprobante_url, '_blank')} className="w-full mt-4 py-3 bg-white border border-indigo-100 text-indigo-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-50 transition">
                            <ImageIcon className="w-4 h-4"/> Ver Comprobante de Pago
                        </button>
                    )}
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// --- FAQ ITEM ---
const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
    const [expanded, setExpanded] = useState(false);
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all hover:border-slate-300">
            <button onClick={() => setExpanded(!expanded)} className="w-full flex justify-between items-center p-5 text-left font-bold text-slate-800 text-sm">
                {question}
                <motion.div animate={{ rotate: expanded ? 180 : 0 }}><ChevronDown className="w-5 h-5 text-slate-400"/></motion.div>
            </button>
            <AnimatePresence>
                {expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                         <div className="px-5 pb-5 text-sm text-slate-500 leading-relaxed font-medium">{answer}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default function ClientCatalog() {
  // Datos
  const [products, setProducts] = useState<Producto[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Producto[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [myOrders, setMyOrders] = useState<Pedido[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);

  const [userId, setUserId] = useState<string | null>(null);
  const [userData, setUserData] = useState<{nombre: string, telefono: string, avatar_url?: string} | null>(null);
  
  // Paginación
  const ITEMS_PER_PAGE = 25;
  const [currentPage, setCurrentPage] = useState(1);
  
  // UI States
  const [currentView, setCurrentView] = useState<'store' | 'favorites' | 'orders' | 'profile' | 'support' | 'settings' | 'about'>('store');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);

  const [orderSuccessId, setOrderSuccessId] = useState<number | null>(null);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error' | 'offer'} | null>(null);
  const [showTour, setShowTour] = useState(false);

  // Estados Geolocalización
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [showSaveAddress, setShowSaveAddress] = useState(false);
  const [newAddressAlias, setNewAddressAlias] = useState('');

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  // Datos Pedido
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'recojo'>('delivery');
  const [address, setAddress] = useState('');
  
  // Datos Pago
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'yape'>('efectivo');
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const showToast = (msg: string, type: 'success' | 'error' | 'offer') => {
    setToast({ msg, type });
    const soundFile = (type === 'success' || type === 'offer') ? '/pop.mp3' : '/notification.mp3';
    const audio = new Audio(soundFile);
    if (type === 'success') audio.volume = 0.6;
    audio.play().catch(() => {});
    setTimeout(() => setToast(null), 4000);
  };

  // --- INIT & REALTIME SYNC ---
  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);
      
      const meta = user.user_metadata;
      setUserData({ 
          nombre: meta.full_name || 'Cliente', 
          telefono: meta.phone || '', 
          avatar_url: meta.avatar_url 
      });
      setEditName(meta.full_name || '');
      setEditPhone(meta.phone || '');

      Promise.all([
          fetchMyOrders(user.id),
          fetchFavorites(user.id),
          fetchAddresses(user.id),
          fetchProducts()
      ]);
      
      const hasSeenTour = localStorage.getItem('hasSeenTour');
      if (!hasSeenTour) setTimeout(() => setShowTour(true), 1500); 
      
      // REALTIME: PEDIDOS (UPDATE)
      const ordersSub = supabase.channel('mis-pedidos-realtime')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `user_id=eq.${user.id}` }, (payload) => {
           const newOrder = payload.new as Pedido;
           setMyOrders((prev) => prev.map((order) => order.id === newOrder.id ? newOrder : order));
           showToast(`Pedido #${newOrder.id}: ${newOrder.estado.toUpperCase()}`, 'success');
           const audio = new Audio('/notification.mp3'); audio.play().catch(()=>{});
        }).subscribe();

      // REALTIME: PRODUCTOS (INSERT, UPDATE, DELETE)
      const productsSub = supabase.channel('productos-stock-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, (payload) => {
            if (payload.eventType === 'INSERT') {
                setProducts(prev => [payload.new as Producto, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
                const updatedProd = payload.new as Producto;
                setProducts(prev => prev.map(p => p.id === updatedProd.id ? updatedProd : p));
            } else if (payload.eventType === 'DELETE') {
                setProducts(prev => prev.filter(p => p.id !== payload.old.id));
            }
        }).subscribe();

        return () => {
            supabase.removeChannel(ordersSub);
            supabase.removeChannel(productsSub);
        }
    };
    initData();
  }, [router]);

  const closeTour = () => { setShowTour(false); localStorage.setItem('hasSeenTour', 'true'); };

  const fetchProducts = async () => {
    const { data } = await supabase.from('productos').select('*').order('id', { ascending: false });
    if (data) { setProducts(data); setFilteredProducts(data); }
    setLoading(false);
  };

  const fetchMyOrders = async (uid: string) => {
    const { data } = await supabase.from('pedidos').select('*').eq('user_id', uid).order('created_at', { ascending: false });
    if (data) setMyOrders(data);
  };

  const fetchFavorites = async (uid: string) => {
      const { data } = await supabase.from('favoritos').select('producto_id').eq('user_id', uid);
      if (data) setFavorites(data.map(f => f.producto_id));
  };

  const fetchAddresses = async (uid: string) => {
      const { data } = await supabase.from('user_addresses').select('*').eq('user_id', uid);
      if (data) setSavedAddresses(data);
  };

  // --- LOGIC ---
  const toggleFavorite = async (prodId: number) => {
      if (!userId) return;
      const isFav = favorites.includes(prodId);
      setFavorites(prev => isFav ? prev.filter(id => id !== prodId) : [...prev, prodId]);

      if (isFav) {
          await supabase.from('favoritos').delete().match({ user_id: userId, producto_id: prodId });
          showToast("Eliminado de favoritos", 'error');
      } else {
          await supabase.from('favoritos').insert({ user_id: userId, producto_id: prodId }); 
          showToast("Agregado a favoritos", 'success');
      }
  };

  const addToCart = (product: Producto) => {
    if (product.stock <= 0) return showToast("Producto agotado", 'error');
    const currentInCart = cart.find(item => item.id === product.id)?.cantidad || 0;
    if (currentInCart >= product.stock) return showToast(`Solo quedan ${product.stock} unidades`, 'error');

    const active = isOfferActive(product);
    const finalPrice = (active && product.precio_oferta) ? product.precio_oferta : product.precio;
    
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, cantidad: item.cantidad + 1, precioFinal: finalPrice } : item);
      return [...prev, { ...product, cantidad: 1, precioFinal: finalPrice }];
    });
    showToast(`Agregaste ${product.nombre}`, 'success');
  };

  const updateQuantity = (id: number, delta: number) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    setCart(prev => prev.map(item => {
        if (item.id === id) {
            const newQty = item.cantidad + delta;
            if (newQty > product.stock) {
                showToast(`Solo quedan ${product.stock} unidades`, 'error');
                return item;
            }
            return newQty > 0 ? { ...item, cantidad: newQty } : item;
        }
        return item;
    }));
  };

  const removeFromCart = (id: number) => setCart(prev => prev.filter(item => item.id !== id));

  // --- PROFILE LOGIC ---
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !userId) return;

      setAvatarUploading(true);
      try {
          const fileName = `avatars/${userId}_${Date.now()}.${file.name.split('.').pop()}`;
          const { error: uploadError } = await supabase.storage.from('perfiles').upload(fileName, file, { upsert: true });
          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage.from('perfiles').getPublicUrl(fileName);
          const newAvatarUrl = urlData.publicUrl;

          const { error: updateError } = await supabase.auth.updateUser({
              data: { avatar_url: newAvatarUrl }
          });
          if (updateError) throw updateError;

          setUserData(prev => prev ? ({ ...prev, avatar_url: newAvatarUrl }) : null);
          showToast("Foto de perfil actualizada", 'success');

      } catch (error: any) {
          showToast("Error al subir foto: " + error.message, 'error');
      } finally {
          setAvatarUploading(false);
      }
  };

  const handleSaveProfile = async () => {
      if(!editName.trim()) return showToast("El nombre es obligatorio", 'error');
      try {
          const { error } = await supabase.auth.updateUser({
              data: { full_name: editName, phone: editPhone }
          });
          if (error) throw error;
          
          setUserData(prev => prev ? ({...prev, nombre: editName, telefono: editPhone}) : null);
          setIsEditingProfile(false);
          showToast("Perfil actualizado", 'success');
      } catch (error: any) {
          showToast(error.message, 'error');
      }
  };

  // --- LOGOUT ---
  const handleLogout = async () => {
      await supabase.auth.signOut();
      router.push('/'); 
  };

  // --- GEOLOCALIZACIÓN Y FILTROS ---
  useEffect(() => {
    let result = [...products];
    if (selectedCategory !== 'Todos') result = result.filter(p => p.categoria === selectedCategory);
    if (searchTerm) result = result.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredProducts(result);
    setCurrentPage(1); 
  }, [searchTerm, selectedCategory, products]);

  const fetchAddressFromCoords = async (lat: number, lng: number) => {
    setGpsLoading(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, { headers: { 'User-Agent': 'BodegaJormardApp/1.0' } });
      const data = await response.json();
      if (data && data.display_name) {
        setAddress(data.display_name.split(',').slice(0, 3).join(','));
        showToast("¡Ubicación detectada!", 'success');
      } else { setAddress(`${lat}, ${lng}`); }
    } catch { showToast("Error al obtener dirección", 'error'); } 
    finally { setGpsLoading(false); }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return showToast("GPS no soportado", 'error');
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
        (pos) => fetchAddressFromCoords(pos.coords.latitude, pos.coords.longitude),
        () => { setGpsLoading(false); showToast("No se pudo obtener ubicación GPS", 'error'); },
        { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const totalCartPrice = cart.reduce((acc, item) => acc + (item.precioFinal * item.cantidad), 0);
  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.categoria)))].sort();

  // --- CHECKOUT ---
  const handlePlaceOrder = async () => {
    if (deliveryType === 'delivery' && !address) return showToast("Falta la dirección", 'error');
    if (!userData?.nombre) return showToast("Error de usuario.", 'error');

    try {
      setLoading(true);
      
      if (deliveryType === 'delivery' && showSaveAddress && newAddressAlias && userId) {
          try {
              await supabase.from('user_addresses').insert({
                  user_id: userId,
                  alias: newAddressAlias,
                  direccion: address
              });
              fetchAddresses(userId);
          } catch (e: any) { e.printStackTrace() } 
      }

      let uploadedUrl: string | null = null;
      if (paymentMethod === 'yape' && voucherFile) {
         const fileName = `${userId}/${Date.now()}_voucher.${voucherFile.name.split('.').pop()}`;
         const { error: uploadError } = await supabase.storage.from('comprobantes').upload(fileName, voucherFile);
         if (uploadError) throw uploadError;
         const { data } = supabase.storage.from('comprobantes').getPublicUrl(fileName);
         uploadedUrl = data.publicUrl;
      }

      const { data, error } = await supabase.from('pedidos').insert([{
        user_id: userId,
        cliente_nombre: userData.nombre,
        cliente_telefono: userData.telefono,
        tipo_entrega: deliveryType,
        direccion: deliveryType === 'delivery' ? address : 'Recojo en tienda',
        items: cart.map(i => ({...i, precio: i.precioFinal})),
        total: totalCartPrice + (deliveryType === 'delivery' ? 2 : 0),
        estado: 'pendiente',
        metodo_pago: paymentMethod,
        comprobante_url: uploadedUrl
      }]).select().single();

      if (error) throw error;
      setOrderSuccessId(data.id);
      setCart([]);
      if(userId) fetchMyOrders(userId);

    } catch (error: any) { showToast(error.message, 'error'); } 
    finally { setLoading(false); }
  };

  const closeSuccessModal = () => {
    setOrderSuccessId(null);
    setIsCheckoutOpen(false);
    setIsCartOpen(false);
    setCurrentView('orders'); 
    setVoucherFile(null);
  };

  // --- RENDER CONTENT ---
  const renderContent = () => {
      const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
      const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
      
      const productsToShow = currentView === 'favorites' 
          ? products.filter(p => favorites.includes(p.id)) 
          : filteredProducts;

      const currentProducts = productsToShow.slice(indexOfFirstItem, indexOfLastItem);
      const totalPages = Math.ceil(productsToShow.length / ITEMS_PER_PAGE);

      if (currentView === 'store' || currentView === 'favorites') {
          return (
              <>
                  {currentView === 'store' && (
                      <div id="tour-categories" className="flex gap-2 overflow-x-auto pb-4 pt-2 scrollbar-hide w-full mb-2 sticky top-[65px] z-20 bg-slate-50/95 backdrop-blur-md">
                        {categories.map((cat) => (
                          <motion.button whileTap={{ scale: 0.95 }} key={cat} onClick={() => setSelectedCategory(cat)} className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-sm ${selectedCategory === cat ? 'bg-slate-900 text-white shadow-md ring-2 ring-slate-900 ring-offset-1' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'}`}>{cat}</motion.button>
                        ))}
                      </div>
                  )}

                  {currentView === 'favorites' && productsToShow.length === 0 && (
                      <div className="text-center py-32 opacity-50 flex flex-col items-center animate-in fade-in zoom-in"><Heart className="w-24 h-24 mb-6 text-slate-200"/> <p className="font-bold text-xl text-slate-400">Aún no tienes favoritos</p><p className="text-sm text-slate-300 mt-2">Guarda lo que te gusta para después</p></div>
                  )}

                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-6"><Loader2 className="animate-spin text-indigo-600 w-12 h-12"/><p className="text-slate-400 font-bold text-sm animate-pulse tracking-widest">CARGANDO TIENDA...</p></div>
                  ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 pb-20">
                          <AnimatePresence mode='popLayout'>
                            {currentProducts.map((prod) => {
                              const activeOffer = isOfferActive(prod);
                              const isFav = favorites.includes(prod.id);
                              const outOfStock = prod.stock <= 0;

                              return (
                              <motion.div key={prod.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ y: -8 }} className={`bg-white rounded-[24px] p-3 sm:p-4 shadow-sm border border-slate-100 hover:shadow-xl hover:border-indigo-100 transition-all group relative flex flex-col justify-between h-full ${outOfStock ? 'opacity-60 grayscale' : ''}`}>
                                
                                <div className="aspect-square bg-slate-50 rounded-2xl mb-4 overflow-hidden relative cursor-pointer group-hover:bg-indigo-50/30 transition-colors" onClick={() => setSelectedProduct(prod)}>
                                  <div className="absolute inset-0 flex items-center justify-center z-0"><ImageIcon className="text-slate-200 w-12 h-12" /></div>
                                  {prod.imagen_url && <img src={prod.imagen_url} alt={prod.nombre} className="w-full h-full object-cover relative z-10 transition-transform duration-700 group-hover:scale-110" onError={(e) => e.currentTarget.style.display = 'none'} />}
                                  
                                  {outOfStock && (
                                      <div className="absolute inset-0 z-30 bg-white/60 flex items-center justify-center backdrop-blur-[1px]">
                                          <span className="bg-slate-900 text-white font-black px-4 py-1.5 rounded-xl text-xs tracking-widest shadow-lg">AGOTADO</span>
                                      </div>
                                  )}

                                  {!outOfStock && prod.stock < 5 && <span className="absolute bottom-2 left-2 z-20 bg-red-500/90 text-white text-[10px] font-black px-2.5 py-1 rounded-lg backdrop-blur-sm shadow-sm">¡Últimos {prod.stock}!</span>}
                                  {activeOffer && !outOfStock && (<div className="absolute top-2 left-2 z-20 bg-orange-500 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1"><Zap className="w-3 h-3 fill-white"/> OFERTA</div>)}
                                  
                                  <button onClick={(e) => {e.stopPropagation(); toggleFavorite(prod.id)}} className="absolute top-2 right-2 z-30 p-2 rounded-full bg-white/80 hover:bg-white shadow-sm transition-transform active:scale-90 hover:shadow-md">
                                      <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} />
                                  </button>
                                </div>

                                <div>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 line-clamp-1">{prod.categoria}</p>
                                  <h3 onClick={() => setSelectedProduct(prod)} className="font-bold text-slate-800 text-sm sm:text-base leading-tight mb-3 line-clamp-2 cursor-pointer hover:text-indigo-600 transition-colors h-10">{prod.nombre}</h3>
                                  <div className="flex items-end justify-between mt-auto">
                                    <div className="flex flex-col">
                                        {activeOffer && prod.precio_oferta ? (
                                          <><span className="text-xs text-slate-400 line-through font-medium">S/ {prod.precio.toFixed(2)}</span><span className="text-lg font-black text-orange-600">S/ {prod.precio_oferta.toFixed(2)}</span></>
                                        ) : (<span className="text-lg font-black text-slate-900">S/ {prod.precio.toFixed(2)}</span>)}
                                    </div>
                                    <motion.button 
                                        whileTap={{ scale: 0.9 }} 
                                        disabled={outOfStock}
                                        onClick={() => addToCart(prod)} 
                                        className={`w-10 h-10 rounded-xl shadow-md flex items-center justify-center transition-all ${outOfStock ? 'bg-slate-100 cursor-not-allowed text-slate-300' : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-indigo-100'}`}
                                    >
                                        {outOfStock ? <X className="w-5 h-5"/> : <Plus className="w-5 h-5" />}
                                    </motion.button>
                                  </div>
                                </div>
                              </motion.div>
                            )})}
                          </AnimatePresence>
                        </div>

                        {productsToShow.length > ITEMS_PER_PAGE && (
                            <div className="flex justify-center items-center gap-4 pb-32">
                                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft className="w-5 h-5 text-slate-600"/></button>
                                <span className="text-sm font-bold text-slate-600 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">Página {currentPage} de {totalPages}</span>
                                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronRight className="w-5 h-5 text-slate-600"/></button>
                            </div>
                        )}
                    </>
                  )}
              </>
          );
      }
      switch (currentView) {
          case 'orders':
              return (
                  <div className="max-w-2xl mx-auto pb-32">
                      <div className="flex items-center gap-3 mb-8"><div className="p-3 bg-indigo-50 rounded-2xl"><Clock className="w-6 h-6 text-indigo-600"/></div><h2 className="text-3xl font-black text-slate-900">Mis Pedidos</h2></div>
                      {myOrders.length === 0 ? (
                         <div className="text-center py-32 opacity-50 flex flex-col items-center"><Package className="w-24 h-24 mb-6 text-slate-200"/> <p className="font-bold text-xl text-slate-400">Aún no tienes pedidos</p><button onClick={()=>{setCurrentView('store')}} className="mt-4 text-indigo-600 font-bold hover:underline">Ir a comprar</button></div>
                      ) : myOrders.map(order => (<OrderCard key={order.id} order={order} />))}
                  </div>
              );
          case 'profile':
              return (
                  <div className="max-w-lg mx-auto pb-32">
                        <div className="flex items-center gap-3 mb-8"><div className="p-3 bg-indigo-50 rounded-2xl"><User className="w-6 h-6 text-indigo-600"/></div><h2 className="text-3xl font-black text-slate-900">Mi Perfil</h2></div>
                        <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                            <div className="h-40 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 relative overflow-hidden">
                                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                            </div>
                            <div className="px-8 pb-8 relative">
                                <div className="w-28 h-28 rounded-full bg-white p-1.5 absolute -top-14 left-1/2 -translate-x-1/2 shadow-xl group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                                    <div className="w-full h-full rounded-full bg-slate-100 overflow-hidden relative border-4 border-white">
                                             {avatarUploading ? (
                                                 <div className="absolute inset-0 flex items-center justify-center bg-black/30"><Loader2 className="w-8 h-8 text-white animate-spin"/></div>
                                             ) : userData?.avatar_url ? (
                                                 <img src={userData.avatar_url} className="w-full h-full object-cover" />
                                             ) : (
                                                 <div className="w-full h-full flex items-center justify-center text-4xl font-black text-slate-300">{userData?.nombre.charAt(0)}</div>
                                             )}
                                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                 <Camera className="w-8 h-8 text-white"/>
                                             </div>
                                    </div>
                                    <input type="file" ref={avatarInputRef} hidden accept="image/*" onChange={handleAvatarUpload} />
                                </div>
                                <div className="mt-16 text-center mb-8">
                                    <h3 className="text-2xl font-black text-slate-900">{userData?.nombre}</h3>
                                    <p className="text-sm font-medium text-slate-500">{userData?.telefono || 'Sin teléfono'}</p>
                                </div>
                                <div className="space-y-4">
                                    {isEditingProfile ? (
                                            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                                <div>
                                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nombre</label>
                                                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-white border-slate-200 rounded-xl p-3.5 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700"/>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Celular</label>
                                                    <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full bg-white border-slate-200 rounded-xl p-3.5 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700"/>
                                                </div>
                                                <div className="flex gap-3 pt-2">
                                                    <button onClick={() => setIsEditingProfile(false)} className="flex-1 py-3.5 rounded-xl bg-white border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition">Cancelar</button>
                                                    <button onClick={handleSaveProfile} className="flex-1 py-3.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition">Guardar Cambios</button>
                                                </div>
                                            </div>
                                    ) : (
                                            <>
                                                <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-4 border border-slate-100">
                                                    <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-500"><User className="w-5 h-5"/></div>
                                                    <div><p className="text-[10px] text-slate-400 font-bold uppercase">Nombre Completo</p><p className="font-bold text-slate-900">{userData?.nombre}</p></div>
                                                </div>
                                                <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-4 border border-slate-100">
                                                    <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-500"><Smartphone className="w-5 h-5"/></div>
                                                    <div><p className="text-[10px] text-slate-400 font-bold uppercase">Número de Celular</p><p className="font-bold text-slate-900">{userData?.telefono || 'No registrado'}</p></div>
                                                </div>
                                                <button onClick={() => setIsEditingProfile(true)} className="w-full py-4 mt-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 flex items-center justify-center gap-2 shadow-lg shadow-slate-200 transition-all active:scale-95">
                                                    <Edit2 className="w-4 h-4"/> Editar Información
                                                </button>
                                            </>
                                    )}
                                </div>
                            </div>
                        </div>
                  </div>
              );
          case 'support':
              return (
                <div className="max-w-lg mx-auto pb-32">
                    <div className="flex items-center gap-3 mb-8"><div className="p-3 bg-green-50 rounded-2xl"><HelpCircle className="w-6 h-6 text-green-600"/></div><h2 className="text-3xl font-black text-slate-900">Ayuda y Soporte</h2></div>
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-8 rounded-[32px] shadow-lg shadow-green-200 text-center text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><MessageCircle className="w-10 h-10 text-white"/></div>
                            <h3 className="font-black text-2xl mb-2">¿Necesitas ayuda?</h3>
                            <p className="text-green-100 text-sm mb-8 font-medium">Nuestro equipo está listo para resolver tus dudas por WhatsApp.</p>
                            <div className="flex gap-4">
                                <button onClick={() => window.open(`https://api.whatsapp.com/send?phone=51961241085&text=Hola,%20tengo%20una%20consulta`, '_blank')} className="flex-1 py-4 bg-white text-green-600 rounded-xl font-bold hover:bg-green-50 flex items-center justify-center gap-2 shadow-lg transition"><MessageCircle className="w-5 h-5"/> WhatsApp</button>
                                <button onClick={() => window.open('tel:961241085')} className="flex-1 py-4 bg-black/20 text-white rounded-xl font-bold hover:bg-black/30 flex items-center justify-center gap-2 backdrop-blur-md transition"><Smartphone className="w-5 h-5"/> Llamar</button>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900 mb-4 ml-1 text-lg">Preguntas Frecuentes</h3>
                            <div className="space-y-3">
                                <FAQItem question="¿Cuál es el tiempo de entrega?" answer="El tiempo promedio es de 30 a 45 minutos dependiendo de la zona." />
                                <FAQItem question="¿Métodos de pago?" answer="Aceptamos Yape, Plin y efectivo contra entrega." />
                                <FAQItem question="¿Puedo cancelar mi pedido?" answer="Solo si el estado es 'Pendiente'. Si ya está en camino, contáctanos por WhatsApp." />
                            </div>
                        </div>
                    </div>
                </div>
              );
          case 'settings':
              return (
                  <div className="max-w-lg mx-auto pb-32">
                      <div className="flex items-center gap-3 mb-8"><div className="p-3 bg-slate-100 rounded-2xl"><Settings className="w-6 h-6 text-slate-700"/></div><h2 className="text-3xl font-black text-slate-900">Configuración</h2></div>
                      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-2">
                           <div className="p-4 flex justify-between items-center hover:bg-slate-50 rounded-2xl transition cursor-pointer">
                               <div><p className="font-bold text-slate-800">Notificaciones</p><p className="text-xs text-slate-500 font-medium">Recibir alertas de pedidos</p></div>
                               <div className="w-12 h-7 bg-green-500 rounded-full relative"><div className="w-5 h-5 bg-white rounded-full absolute right-1 top-1 shadow-sm"></div></div>
                           </div>
                           <div className="p-4 flex justify-between items-center hover:bg-slate-50 rounded-2xl transition cursor-pointer">
                               <div><p className="font-bold text-slate-800">Sonidos</p><p className="text-xs text-slate-500 font-medium">Efectos de sonido en la app</p></div>
                               <div className="w-12 h-7 bg-green-500 rounded-full relative"><div className="w-5 h-5 bg-white rounded-full absolute right-1 top-1 shadow-sm"></div></div>
                           </div>
                           <div className="p-4 hover:bg-red-50 rounded-2xl transition cursor-pointer">
                               <button onClick={() => showToast("Caché limpiada", 'success')} className="text-red-500 font-bold text-sm flex items-center gap-3 w-full"><Trash2 className="w-5 h-5"/> Borrar caché de la aplicación</button>
                           </div>
                      </div>
                  </div>
              );
          case 'about':
            return (
                <div className="max-w-lg mx-auto pb-32 text-center pt-10">
                    <div className="bg-white p-12 rounded-[40px] shadow-xl shadow-slate-200 border border-slate-100 inline-block mb-10 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 via-pink-500 to-indigo-500"></div>
                        <div className="bg-slate-50 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner"><Store className="w-12 h-12 text-slate-900"/></div>
                        <h1 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">Bodega Jormard</h1>
                        <p className="text-slate-500 font-medium">Tu tienda en el bolsillo</p>
                        <span className="inline-block mt-6 px-4 py-1.5 bg-slate-100 rounded-full text-xs font-bold text-slate-600 tracking-wide">v2.5.0 Premium</span>
                    </div>
                    <button onClick={() => window.open('https://bodega-jormard.vercel.app', '_blank')} className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl mb-8 hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 active:scale-95">Visitar Sitio Web</button>
                    <p className="text-xs text-slate-400 font-medium">© 2026 Jormard Inc. Todos los derechos reservados.</p>
                </div>
            )
          default: return null;
      }
  }

  // --- RENDER PRINCIPAL ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-200">
      
      {/* TOUR GUIDE OVERLAY */}
      <AnimatePresence>
         {showTour && <TourGuide isOpen={showTour} onClose={closeTour} setCurrentView={setCurrentView} setIsCartOpen={setIsCartOpen} />}
      </AnimatePresence>

      {/* MAPA */}
      {isMapOpen && <LocationMap onConfirm={(lat, lng) => { setIsMapOpen(false); fetchAddressFromCoords(lat, lng); }} onCancel={() => setIsMapOpen(false)} />}
      <AnimatePresence>{toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>

      {/* MODAL DETALLE PRODUCTO */}
      <AnimatePresence>
          {selectedProduct && (
              <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedProduct(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
                  <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white rounded-[32px] w-full max-w-md overflow-hidden relative z-10 shadow-2xl">
                      <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 bg-white/80 backdrop-blur-md p-2 rounded-full z-20 hover:bg-white shadow-sm transition"><X className="w-6 h-6 text-slate-700"/></button>
                      <div className="h-72 sm:h-80 bg-slate-100 relative group">
                          {selectedProduct.imagen_url ? <img src={selectedProduct.imagen_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"/> : <div className="flex items-center justify-center h-full"><ImageIcon className="w-20 h-20 text-slate-300"/></div>}
                          {isOfferActive(selectedProduct) && <div className="absolute bottom-4 left-4 bg-orange-500 text-white font-black px-4 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 text-xs"><Zap className="w-4 h-4 fill-white"/> OFERTA FLASH</div>}
                      </div>
                      <div className="p-8">
                          <div className="flex justify-between items-start mb-4">
                              <div>
                                  <p className="text-xs font-bold text-indigo-500 uppercase mb-1 tracking-wider">{selectedProduct.categoria}</p>
                                  <h2 className="text-3xl font-black text-slate-900 leading-tight">{selectedProduct.nombre}</h2>
                              </div>
                              <div className="text-right">
                                  {isOfferActive(selectedProduct) && selectedProduct.precio_oferta ? (
                                      <><p className="text-sm text-slate-400 line-through font-medium">S/ {selectedProduct.precio.toFixed(2)}</p><p className="text-3xl font-black text-orange-600">S/ {selectedProduct.precio_oferta.toFixed(2)}</p></>
                                  ) : <p className="text-3xl font-black text-slate-900">S/ {selectedProduct.precio.toFixed(2)}</p>}
                              </div>
                          </div>
                          
                          <div className="flex items-center gap-3 mb-8">
                              <div className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 ${selectedProduct.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  <div className={`w-2 h-2 rounded-full ${selectedProduct.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                  {selectedProduct.stock > 0 ? `En Stock: ${selectedProduct.stock}` : 'Agotado'}
                              </div>
                          </div>

                          <button 
                            onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }} 
                            disabled={selectedProduct.stock <= 0}
                            className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl ${selectedProduct.stock > 0 ? 'bg-slate-900 text-white hover:bg-indigo-600 shadow-indigo-200' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}
                          >
                              {selectedProduct.stock > 0 ? <><ShoppingCart className="w-5 h-5"/> Agregar a la Canasta</> : 'No Disponible'}
                          </button>
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>

      {/* --- SIDEBAR --- */}
      <AnimatePresence>
          {isMenuOpen && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMenuOpen(false)} className="fixed inset-0 bg-slate-900/60 z-40 backdrop-blur-sm lg:hidden" />
                <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} className="fixed left-0 top-0 h-full w-[300px] bg-white z-50 shadow-2xl flex flex-col lg:hidden rounded-r-[32px]">
                    <div className="p-8 bg-slate-900 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-3xl -mr-10 -mt-10 opacity-50"></div>
                        <div className="flex items-center gap-4 mb-4 relative z-10">
                            <div className="w-14 h-14 rounded-full bg-white p-1 shadow-lg">
                                <div className="w-full h-full rounded-full bg-slate-100 overflow-hidden flex items-center justify-center">
                                    {userData?.avatar_url ? <img src={userData.avatar_url} className="w-full h-full object-cover"/> : <span className="font-black text-2xl text-slate-900">{userData?.nombre.charAt(0)}</span>}
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg leading-tight">{userData?.nombre}</h3>
                                <p className="text-xs text-slate-400 truncate w-32 font-medium">Cliente VIP</p>
                            </div>
                        </div>
                    </div>
                    <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 ml-2">Menú</p>
                        <button id="nav-store-mobile" onClick={() => { setCurrentView('store'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all ${currentView === 'store' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}><Store className="w-5 h-5"/> Tienda</button>
                        <button id="nav-favorites-mobile" onClick={() => { setCurrentView('favorites'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all ${currentView === 'favorites' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}><Heart className="w-5 h-5"/> Favoritos</button>
                        <button id="nav-orders-mobile" onClick={() => { setCurrentView('orders'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all ${currentView === 'orders' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}><Clock className="w-5 h-5"/> Mis Pedidos</button>
                        <button id="nav-profile-mobile" onClick={() => { setCurrentView('profile'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all ${currentView === 'profile' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}><User className="w-5 h-5"/> Mi Perfil</button>
                        <div className="my-6 border-t border-slate-100"></div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 ml-2">Otros</p>
                        <button id="nav-settings-mobile" onClick={() => { setCurrentView('settings'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all ${currentView === 'settings' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}><Settings className="w-5 h-5"/> Ajustes</button>
                        <button id="nav-support-mobile" onClick={() => { setCurrentView('support'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all ${currentView === 'support' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}><HelpCircle className="w-5 h-5"/> Ayuda</button>
                        {/* BOTON TUTORIAL MOVIL */}
                        <button onClick={() => { setIsMenuOpen(false); setShowTour(true); }} className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all text-slate-600 hover:bg-slate-50`}><PlayCircle className="w-5 h-5"/> Tutorial</button>
                    </nav>
                    <div className="p-6 border-t border-slate-100">
                        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-2xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors"><LogOut className="w-5 h-5"/> Cerrar Sesión</button>
                    </div>
                </motion.div>
              </>
          )}
      </AnimatePresence>

      <div className="lg:flex">
          <aside id="tour-menu" className="hidden lg:flex w-72 h-screen sticky top-0 bg-white border-r border-slate-100 flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
             <div className="p-8 flex items-center gap-3">
                 <div className="bg-slate-900 p-2 rounded-xl text-white shadow-lg"><Store className="w-6 h-6"/></div>
                 <span className="font-black text-2xl tracking-tight text-slate-900">Jormard</span>
             </div>
             <nav className="flex-1 px-4 space-y-1">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-4 mt-4">Principal</p>
                 <button id="nav-store" onClick={() => setCurrentView('store')} className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold transition-all ${currentView === 'store' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}><Store className="w-5 h-5"/> Tienda</button>
                 <button id="nav-favorites" onClick={() => setCurrentView('favorites')} className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold transition-all ${currentView === 'favorites' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}><Heart className="w-5 h-5"/> Favoritos</button>
                 <button id="nav-orders" onClick={() => setCurrentView('orders')} className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold transition-all ${currentView === 'orders' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}><Clock className="w-5 h-5"/> Pedidos</button>
                 <button id="nav-profile" onClick={() => setCurrentView('profile')} className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold transition-all ${currentView === 'profile' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}><User className="w-5 h-5"/> Perfil</button>
                 
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-4 mt-8">Preferencias</p>
                 <button id="nav-settings" onClick={() => setCurrentView('settings')} className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold transition-all ${currentView === 'settings' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}><Settings className="w-5 h-5"/> Ajustes</button>
                 <button id="nav-support" onClick={() => setCurrentView('support')} className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold transition-all ${currentView === 'support' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}><HelpCircle className="w-5 h-5"/> Soporte</button>
                 {/* BOTON TUTORIAL PC */}
                 <button onClick={() => setShowTour(true)} className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl font-bold transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-900`}><PlayCircle className="w-5 h-5"/> Tutorial</button>
             </nav>
             <div className="p-4 border-t border-slate-100 mx-4 mb-4">
                <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-sm">
                          {userData?.avatar_url ? <img src={userData.avatar_url} className="w-full h-full object-cover"/> : <span className="font-black text-slate-900">{userData?.nombre.charAt(0)}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate text-slate-900">{userData?.nombre}</p>
                          <p className="text-xs text-slate-500 truncate font-medium">Cliente</p>
                      </div>
                </div>
                <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all text-sm"><LogOut className="w-4 h-4"/> Cerrar Sesión</button>
             </div>
          </aside>

          <div className="flex-1 min-h-screen relative">
              {/* HEADER MOVIL */}
              <nav className="bg-white/80 backdrop-blur-xl sticky top-0 z-30 border-b border-slate-100 px-5 py-4 flex lg:hidden items-center justify-between">
                <div id="tour-menu-mobile" className="flex items-center gap-4">
                    <button onClick={() => setIsMenuOpen(true)} className="p-2 -ml-2 text-slate-700 hover:bg-slate-100 rounded-xl transition"><Menu className="w-6 h-6"/></button>
                    <h1 className="font-black text-xl text-slate-900 tracking-tight">{currentView === 'store' ? 'Jormard' : currentView === 'orders' ? 'Mis Pedidos' : currentView === 'profile' ? 'Perfil' : 'Bodega'}</h1>
                </div>
                <button id="tour-cart-mobile" onClick={() => setIsCartOpen(true)} className="relative p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl group transition-all">
                  <ShoppingCart className="w-5 h-5 text-slate-700 group-hover:text-indigo-600 transition-colors" />
                  {cart.length > 0 && (<span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md animate-in zoom-in ring-2 ring-white">{cart.reduce((acc, item) => acc + item.cantidad, 0)}</span>)}
                </button>
              </nav>

              {/* HEADER DESKTOP */}
              <div className="hidden lg:flex sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-10 py-5 justify-between items-center">
                   <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{currentView === 'store' ? 'Tienda' : currentView === 'orders' ? 'Historial' : currentView === 'profile' ? 'Perfil' : currentView === 'support' ? 'Centro de Ayuda' : currentView === 'favorites' ? 'Favoritos' : 'Configuración'}</h2>
                        <p className="text-slate-400 text-sm font-medium">{currentView === 'store' ? 'Explora nuestros mejores productos' : 'Administra tu cuenta y pedidos'}</p>
                   </div>
                   <div className="flex items-center gap-6">
                       {currentView === 'store' && (
                           <div id="tour-search" className="relative group w-96">
                                <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input type="text" placeholder="¿Qué se te antoja hoy?" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"/>
                           </div>
                       )}
                       <button id="tour-cart" onClick={() => setIsCartOpen(true)} className="relative px-5 py-3 bg-slate-900 hover:bg-indigo-600 rounded-2xl group transition-all flex items-center gap-3 shadow-lg shadow-slate-200 hover:shadow-indigo-200 active:scale-95">
                           <ShoppingCart className="w-5 h-5 text-white" />
                           <span className="font-bold text-sm text-white">S/ {totalCartPrice.toFixed(2)}</span>
                           {cart.length > 0 && (<span className="bg-white text-slate-900 text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full">{cart.reduce((acc, item) => acc + item.cantidad, 0)}</span>)}
                       </button>
                   </div>
              </div>

              {/* CONTENIDO PRINCIPAL */}
              <main className="p-5 sm:p-10 max-w-[1600px] mx-auto min-h-[calc(100vh-80px)]">
                  {/* Search móvil solo en Store */}
                  {currentView === 'store' && (
                      <div id="tour-search-mobile" className="lg:hidden mb-6 relative">
                         <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                         <input type="text" placeholder="Buscar productos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white shadow-sm border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-base font-medium focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none"/>
                      </div>
                  )}
                  
                  {renderContent()}
              </main>
          </div>
      </div>

      {/* --- CART SIDEBAR --- */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="fixed inset-0 bg-slate-900/40 z-50 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-white z-[60] shadow-2xl flex flex-col rounded-l-[32px]">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                    <h2 className="text-2xl font-black text-slate-900">Mi Canasta</h2>
                    <p className="text-slate-500 text-sm font-medium">{cart.length} productos seleccionados</p>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-full transition shadow-sm"><X className="w-6 h-6 text-slate-700" /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-5">
                {cart.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-6">
                       <div className="bg-slate-50 p-8 rounded-full border border-slate-100 shadow-sm"><ShoppingCart className="w-16 h-16 text-slate-300"/></div>
                       <div className="text-center">
                           <p className="font-bold text-xl text-slate-900">Tu canasta está vacía</p>
                           <p className="text-sm mt-2">Parece que aún no has agregado nada.</p>
                       </div>
                       <button onClick={() => setIsCartOpen(false)} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition">Explorar Productos</button>
                   </div>
                ) : cart.map((item) => (
                    <motion.div layout key={item.id} className="flex gap-5 items-center bg-white p-3 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                      <div className="w-24 h-24 rounded-xl bg-slate-50 relative overflow-hidden flex-shrink-0 border border-slate-100">
                          {item.imagen_url ? <img src={item.imagen_url} className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display='none'} /> : <div className="absolute inset-0 flex items-center justify-center"><ImageIcon className="w-8 h-8 text-slate-300"/></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-indigo-500 uppercase mb-1">{item.categoria}</p>
                        <h4 className="font-bold text-slate-900 line-clamp-1 text-lg">{item.nombre}</h4>
                        <p className="text-slate-900 font-black mt-1 text-lg">S/ {(item.precioFinal * item.cantidad).toFixed(2)}</p>
                      </div>
                      <div className="flex flex-col items-center gap-1 bg-slate-50 rounded-xl p-1 border border-slate-100">
                        <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 bg-white shadow-sm rounded-lg hover:text-indigo-600 flex items-center justify-center border border-slate-100"><Plus className="w-4 h-4" /></button>
                        <span className="text-sm font-black w-6 text-center py-1">{item.cantidad}</span>
                        <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 bg-white shadow-sm rounded-lg hover:text-indigo-600 flex items-center justify-center border border-slate-100"><Minus className="w-4 h-4" /></button>
                      </div>
                      {/* BOTÓN DE BORRAR DENTRO DE LA TARJETA (ARREGLADO) */}
                      <button onClick={() => removeFromCart(item.id)} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition"><Trash2 className="w-5 h-5" /></button>
                    </motion.div>
                  ))}
              </div>
              {cart.length > 0 && (
                <div className="p-8 bg-white border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-10">
                  <div className="flex justify-between items-center mb-6">
                      <span className="text-slate-500 font-medium">Total Estimado</span>
                      <span className="text-3xl font-black text-slate-900">S/ {totalCartPrice.toFixed(2)}</span>
                  </div>
                  <button onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }} className="w-full bg-slate-900 text-white font-bold py-5 rounded-2xl hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 active:scale-95 flex justify-center items-center gap-3 text-lg">
                      Proceder al Pago <ArrowRight className="w-6 h-6"/>
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- CHECKOUT MODAL --- */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCheckoutOpen(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="bg-white w-full max-w-lg rounded-t-[32px] sm:rounded-[32px] p-0 relative z-10 max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
              
              {!orderSuccessId ? (
                <>
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
                         <h2 className="text-2xl font-black text-slate-900">Finalizar Compra</h2>
                         <button onClick={() => setIsCheckoutOpen(false)} className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-100"><X className="w-5 h-5 text-slate-500"/></button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                          {/* ENTREGA */}
                          <section>
                              <div className="flex items-center gap-2 mb-4">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">1</div>
                                  <h3 className="font-bold text-slate-800 text-lg">Tipo de Entrega</h3>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setDeliveryType('delivery')} className={`p-4 rounded-2xl flex flex-col items-center gap-2 font-bold text-sm transition-all border-2 ${deliveryType === 'delivery' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}><Bike className="w-6 h-6" /> Delivery (S/ 2.00)</button>
                                <button onClick={() => setDeliveryType('recojo')} className={`p-4 rounded-2xl flex flex-col items-center gap-2 font-bold text-sm transition-all border-2 ${deliveryType === 'recojo' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}><Store className="w-6 h-6" /> Recojo en Tienda</button>
                              </div>

                              <AnimatePresence>
                                {deliveryType === 'delivery' && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4 space-y-4">
                                        {/* SAVED ADDRESSES */}
                                        {savedAddresses.length > 0 && (
                                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                                {savedAddresses.map(addr => (
                                                    <button key={addr.id} onClick={() => setAddress(addr.direccion)} className={`px-4 py-2 rounded-xl border text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all ${address === addr.direccion ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                                        <Home className="w-3 h-3"/> {addr.alias}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        <div className="relative group">
                                            <div className="absolute left-4 top-4 bg-slate-100 p-2 rounded-lg"><MapPin className="w-5 h-5 text-slate-500"/></div>
                                            <textarea placeholder="Ingresa tu dirección exacta..." value={address} onChange={e => setAddress(e.target.value)} className={`w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pl-16 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-medium min-h-[80px] resize-none ${gpsLoading ? 'opacity-50' : ''}`} disabled={gpsLoading}/>
                                            {gpsLoading && <div className="absolute right-4 top-4"><Loader2 className="w-5 h-5 animate-spin text-indigo-500"/></div>}
                                        </div>
                                        
                                        <div className="flex gap-3">
                                            <button onClick={handleUseCurrentLocation} className="flex-1 py-3 bg-indigo-50 text-indigo-700 font-bold rounded-xl text-sm hover:bg-indigo-100 border border-indigo-100 flex justify-center gap-2 items-center transition"><LocateFixed className="w-4 h-4" /> Usar GPS</button>
                                            <button onClick={() => setIsMapOpen(true)} className="flex-1 py-3 bg-white text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-50 border border-slate-200 flex justify-center gap-2 items-center transition"><MapIcon className="w-4 h-4" /> Abrir Mapa</button>
                                        </div>

                                        {/* SAVE ADDRESS OPTION */}
                                        {address && !savedAddresses.find(a => a.direccion === address) && (
                                            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                                                <label className="flex items-center gap-3 text-sm font-bold text-slate-700 cursor-pointer mb-2">
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${showSaveAddress ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                                                        {showSaveAddress && <Check className="w-3 h-3 text-white"/>}
                                                    </div>
                                                    <input type="checkbox" checked={showSaveAddress} onChange={(e) => setShowSaveAddress(e.target.checked)} className="hidden"/>
                                                    Guardar esta dirección para futuros pedidos
                                                </label>
                                                {showSaveAddress && (
                                                    <input type="text" placeholder="Ej: Casa, Oficina..." value={newAddressAlias} onChange={e => setNewAddressAlias(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500"/>
                                                )}
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                              </AnimatePresence>
                          </section>

                          {/* PAGO */}
                          <section>
                              <div className="flex items-center gap-2 mb-4 border-t border-slate-100 pt-6">
                                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">2</div>
                                  <h3 className="font-bold text-slate-800 text-lg">Método de Pago</h3>
                              </div>
                              <div className="grid grid-cols-2 gap-4 mb-6">
                                <button onClick={() => setPaymentMethod('efectivo')} className={`p-4 rounded-2xl flex flex-col items-center gap-2 font-bold text-sm transition-all border-2 ${paymentMethod === 'efectivo' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}><Banknote className="w-6 h-6" /> Efectivo</button>
                                <button onClick={() => setPaymentMethod('yape')} className={`p-4 rounded-2xl flex flex-col items-center gap-2 font-bold text-sm transition-all border-2 ${paymentMethod === 'yape' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}><Smartphone className="w-6 h-6" /> Yape / Plin</button>
                              </div>

                              <AnimatePresence>
                                {paymentMethod === 'yape' && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-5 shadow-inner">
                                        <div className="text-center mb-4">
                                            <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">Número Yape/Plin</p>
                                            <div onClick={() => {navigator.clipboard.writeText("961241085"); showToast("Número copiado", 'success')}} className="bg-white border border-purple-100 rounded-xl py-3 px-6 inline-flex items-center gap-3 cursor-pointer hover:shadow-md transition active:scale-95">
                                                <span className="text-2xl font-black text-slate-800 tracking-wider">961 241 085</span>
                                                <Copy className="w-4 h-4 text-purple-500"/>
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-2">Titular: Jormard Store</p>
                                        </div>
                                        
                                        <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-purple-300 bg-white/60 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-white transition gap-3 h-48 relative overflow-hidden group">
                                            {voucherFile ? (
                                                <img src={URL.createObjectURL(voucherFile)} className="absolute inset-0 w-full h-full object-contain p-2" />
                                            ) : (
                                                <div className="flex flex-col items-center">
                                                    <div className="bg-purple-100 p-3 rounded-full mb-2 group-hover:scale-110 transition"><Upload className="w-6 h-6 text-purple-600"/></div>
                                                    <p className="text-sm text-purple-900 font-bold">Subir Captura de Pago</p>
                                                    <p className="text-xs text-slate-500">Click para seleccionar imagen</p>
                                                </div>
                                            )}
                                        </div>
                                        <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => setVoucherFile(e.target.files?.[0] || null)}/>
                                    </motion.div>
                                )}
                              </AnimatePresence>
                          </section>
                    </div>

                    <div className="p-6 border-t border-slate-100 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-20">
                        <div className="flex justify-between items-center mb-2 text-sm text-slate-500"><span>Subtotal</span><span>S/ {totalCartPrice.toFixed(2)}</span></div>
                        {deliveryType === 'delivery' && <div className="flex justify-between items-center mb-4 text-sm text-slate-500"><span>Envío</span><span>S/ 2.00</span></div>}
                        <div className="flex justify-between items-center mb-6">
                             <span className="text-lg font-bold text-slate-900">Total a Pagar</span>
                             <span className="text-3xl font-black text-slate-900">S/ {(totalCartPrice + (deliveryType === 'delivery' ? 2 : 0)).toFixed(2)}</span>
                        </div>
                        <button onClick={handlePlaceOrder} disabled={loading} className="w-full bg-slate-900 text-white font-bold py-5 rounded-2xl shadow-xl hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-lg">
                          {loading ? <Loader2 className="animate-spin w-6 h-6"/> : <>Confirmar Pedido <CheckCircle2 className="w-6 h-6" /></>}
                        </button>
                    </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 10 }} className="w-32 h-32 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-8 shadow-inner"><CheckCircle2 className="w-16 h-16" /></motion.div>
                  <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">¡Pedido Exitoso!</h2>
                  <p className="text-slate-500 mb-8 leading-relaxed text-lg">Tu pedido <span className="font-bold text-slate-900">#{orderSuccessId}</span> ha sido recibido correctamente. Pronto lo prepararemos.</p>
                  
                  {paymentMethod === 'yape' && !voucherFile && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 mb-8 text-left w-full">
                          <p className="text-sm font-bold text-yellow-800 mb-2 flex items-center gap-2"><Info className="w-4 h-4"/> Atención: Falta comprobante</p>
                          <p className="text-xs text-yellow-700 mb-4 leading-relaxed">Para acelerar tu pedido, envíanos la captura de pago por WhatsApp ahora mismo.</p>
                          <button onClick={() => window.open(`https://api.whatsapp.com/send?phone=51961241085&text=Hola,%20adjunto%20comprobante%20para%20el%20pedido%20%23${orderSuccessId}`, '_blank')} className="w-full py-3.5 bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-green-600 transition shadow-lg shadow-green-200">
                             <MessageCircle className="w-5 h-5"/> Enviar por WhatsApp
                          </button>
                      </div>
                  )}

                  <button onClick={closeSuccessModal} className="w-full bg-slate-100 text-slate-900 font-bold py-4 rounded-2xl hover:bg-slate-200 transition">Volver a mis pedidos</button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}