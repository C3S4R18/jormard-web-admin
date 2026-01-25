"use client";

import { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { 
  Search, ShoppingCart, LogOut, Store, Plus, Minus, X, 
  Trash2, MapPin, Bike, CheckCircle2, ArrowRight, 
  Clock, Package, Loader2, Zap, LocateFixed, Map as MapIcon,
  Image as ImageIcon, ChevronDown, ChevronUp, Banknote, Smartphone, Upload, MessageCircle, Copy
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
  metodo_pago?: string;     // NUEVO
  comprobante_url?: string; // NUEVO
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

// --- COMPONENTE TOAST ---
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error' | 'offer', onClose: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }}
    className={`fixed bottom-20 left-1/2 -translate-x-1/2 md:bottom-10 md:left-10 md:translate-x-0 z-[70] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md border ${
      type === 'success' ? 'bg-gray-900/90 text-white border-gray-800' : 
      type === 'offer' ? 'bg-orange-600/90 text-white border-orange-500' :
      'bg-red-500/90 text-white border-red-400'
    }`}
  >
    {type === 'success' ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : type === 'offer' ? <Zap className="w-5 h-5 text-yellow-300 fill-yellow-300 animate-pulse" /> : <X className="w-5 h-5" />}
    <span className="font-bold text-sm">{message}</span>
  </motion.div>
);

// --- COMPONENTE: TARJETA DE PEDIDO ---
const OrderCard = ({ order }: { order: Pedido }) => {
  const [expanded, setExpanded] = useState(false);
  const statusColors = { pendiente: 'bg-yellow-50 text-yellow-700 border-yellow-200', pagado: 'bg-purple-50 text-purple-700 border-purple-200', atendido: 'bg-green-50 text-green-700 border-green-200', cancelado: 'bg-red-50 text-red-700 border-red-200' };
  const statusLabels = { pendiente: 'Pendiente', pagado: 'Pagado', atendido: 'Listo', cancelado: 'Cancelado' };

  return (
    <motion.div layout className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-3">
      <div onClick={() => setExpanded(!expanded)} className={`p-4 flex justify-between items-center cursor-pointer transition-colors ${expanded ? 'bg-gray-50' : 'bg-white'}`}>
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${order.tipo_entrega === 'delivery' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                {order.tipo_entrega === 'delivery' ? <Bike className="w-5 h-5"/> : <Store className="w-5 h-5"/>}
            </div>
            <div>
                <h4 className="font-bold text-gray-900 text-sm">Pedido #{order.id}</h4>
                <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()} • {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${statusColors[order.estado]}`}>{statusLabels[order.estado].toUpperCase()}</span>
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-400"/> : <ChevronDown className="w-4 h-4 text-gray-400"/>}
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-gray-100">
                <div className="p-4 bg-white">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Productos</p>
                    <div className="space-y-2 mb-4">
                        {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm text-gray-700">
                                <span><span className="font-bold">{item.cantidad}x</span> {item.nombre}</span>
                                <span className="font-medium">S/ {(item.precio * item.cantidad).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-gray-100 pt-3 mt-3">
                        <div className="flex justify-between items-center mb-2">
                             <span className="text-xs font-bold text-gray-400 uppercase">Método de Pago</span>
                             <span className={`text-xs font-bold px-2 py-0.5 rounded ${order.metodo_pago === 'yape' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                                {order.metodo_pago === 'yape' ? '📱 Yape/Plin' : '💵 Efectivo'}
                             </span>
                        </div>
                        {order.tipo_entrega === 'delivery' && (
                           <div className="mb-3">
                               <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><MapPin className="w-3 h-3"/> Dirección</p>
                               <p className="text-xs text-gray-600 font-medium ml-4">{order.direccion || 'Ubicación GPS'}</p>
                           </div>
                        )}
                        <div className="flex justify-between items-center">
                           <span className="text-gray-500 font-medium text-sm">Total Pagado</span>
                           <span className="text-xl font-black text-gray-900">S/ {order.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function ClientCatalog() {
  // Datos
  const [products, setProducts] = useState<Producto[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Producto[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [myOrders, setMyOrders] = useState<Pedido[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userData, setUserData] = useState<{nombre: string, telefono: string} | null>(null);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [orderSuccessId, setOrderSuccessId] = useState<number | null>(null); // Guardamos ID del pedido creado
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error' | 'offer'} | null>(null);

  // Estados Geolocalización
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  // Datos Pedido
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'recojo'>('delivery');
  const [address, setAddress] = useState('');
  
  // NUEVOS ESTADOS DE PAGO
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'yape'>('efectivo');
  const [voucherFile, setVoucherFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // --- GEOLOCALIZACIÓN ---
  const fetchAddressFromCoords = async (lat: number, lng: number) => {
    setGpsLoading(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, { headers: { 'User-Agent': 'BodegaJormardApp/1.0' } });
      const data = await response.json();
      if (data && data.display_name) {
        const street = data.address.road || data.address.pedestrian || '';
        const number = data.address.house_number || '';
        const suburb = data.address.suburb || data.address.neighbourhood || '';
        setAddress(street ? `${street} ${number}, ${suburb}` : data.display_name.split(',').slice(0, 3).join(','));
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

  const handleMapConfirm = (lat: number, lng: number) => { setIsMapOpen(false); fetchAddressFromCoords(lat, lng); };

  // --- INIT ---
  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);
      setUserData({ nombre: user.user_metadata.full_name || 'Cliente', telefono: user.user_metadata.phone || '' });
      fetchMyOrders(user.id);
      
      supabase.channel('mis-pedidos-realtime').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `user_id=eq.${user.id}` }, (payload) => {
           const newOrder = payload.new as Pedido;
           setMyOrders((prev) => prev.map((order) => order.id === newOrder.id ? newOrder : order));
           showToast(`Pedido #${newOrder.id}: ${newOrder.estado.toUpperCase()}`, 'success');
      }).subscribe();
      
      await fetchProducts();
    };
    initData();
    // Realtime Productos (Omitido por brevedad, igual que antes)
  }, [router]);

  const fetchProducts = async () => {
    const { data } = await supabase.from('productos').select('*').order('id', { ascending: false });
    if (data) { setProducts(data); setFilteredProducts(data); }
    setLoading(false);
  };

  const fetchMyOrders = async (uid: string) => {
    const { data } = await supabase.from('pedidos').select('*').eq('user_id', uid).order('created_at', { ascending: false });
    if (data) setMyOrders(data);
  };

  useEffect(() => {
    let result = [...products];
    if (selectedCategory !== 'Todos') result = result.filter(p => p.categoria === selectedCategory);
    if (searchTerm) result = result.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredProducts(result);
  }, [searchTerm, selectedCategory, products]);

  const addToCart = (product: Producto) => {
    const active = isOfferActive(product);
    const finalPrice = (active && product.precio_oferta) ? product.precio_oferta : product.precio;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, cantidad: item.cantidad + 1, precioFinal: finalPrice } : item);
      return [...prev, { ...product, cantidad: 1, precioFinal: finalPrice }];
    });
    showToast(`Agregaste ${product.nombre}`, 'success');
  };

  const removeFromCart = (id: number) => setCart(prev => prev.filter(item => item.id !== id));
  
  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.cantidad + delta;
        return newQty > 0 ? { ...item, cantidad: newQty } : item;
      }
      return item;
    }));
  };

  const totalCartPrice = cart.reduce((acc, item) => acc + (item.precioFinal * item.cantidad), 0);
  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.categoria)))];

  // --- LÓGICA DE COMPRA ---
  const handlePlaceOrder = async () => {
    if (deliveryType === 'delivery' && !address) return showToast("Falta la dirección de entrega", 'error');
    if (!userData?.nombre) return showToast("Error de usuario. Reinicia sesión.", 'error');

    try {
      setLoading(true);

      // 1. Subir imagen si existe (Para móvil o si el usuario PC quiere subirla)
      let uploadedUrl: string | null = null;
      if (paymentMethod === 'yape' && voucherFile) {
         const fileName = `${userId}/${Date.now()}_voucher.${voucherFile.name.split('.').pop()}`;
         const { error: uploadError } = await supabase.storage.from('comprobantes').upload(fileName, voucherFile);
         if (uploadError) throw uploadError;
         const { data } = supabase.storage.from('comprobantes').getPublicUrl(fileName);
         uploadedUrl = data.publicUrl;
      }

      // 2. Crear Pedido
      const { data, error } = await supabase.from('pedidos').insert([{
        user_id: userId,
        cliente_nombre: userData.nombre,
        cliente_telefono: userData.telefono,
        tipo_entrega: deliveryType,
        direccion: deliveryType === 'delivery' ? address : 'Recojo en tienda',
        items: cart.map(i => ({...i, precio: i.precioFinal})),
        total: totalCartPrice + (deliveryType === 'delivery' ? 2 : 0),
        estado: 'pendiente',
        metodo_pago: paymentMethod,       // Nuevo campo
        comprobante_url: uploadedUrl      // Nuevo campo (puede ser null)
      }]).select().single();

      if (error) throw error;

      // 3. Éxito
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
    setIsOrdersOpen(true);
    setVoucherFile(null); // Resetear archivo
  };

  const handleCopyYape = () => {
     navigator.clipboard.writeText("961241085");
     showToast("Número copiado al portapapeles", 'success');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-24 md:pb-10 selection:bg-orange-200">
      
      {/* MAPA */}
      {isMapOpen && <LocationMap onConfirm={handleMapConfirm} onCancel={() => setIsMapOpen(false)} />}

      <AnimatePresence>
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* HEADER (Igual que antes) */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <div className="bg-gradient-to-tr from-orange-500 to-red-500 p-2 rounded-xl text-white shadow-lg shadow-orange-200"><Store className="w-5 h-5" /></div>
           <div><h1 className="font-extrabold text-lg leading-none tracking-tight">Jormard</h1><p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Bodega Digital</p></div>
        </div>
        <div className="hidden md:block flex-1 max-w-md mx-6 relative group">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
          <input type="text" placeholder="Buscar productos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-100/50 border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all"/>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsOrdersOpen(true)} className="hidden md:block relative p-2 hover:bg-orange-50 rounded-full text-gray-600 hover:text-orange-600 transition-colors" title="Mis Pedidos">
            <Clock className="w-6 h-6" />
            {myOrders.some(o => o.estado === 'pendiente') && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-orange-500 border-2 border-white rounded-full animate-pulse" />}
          </button>
          <button onClick={() => setIsCartOpen(true)} className="relative p-2 hover:bg-orange-50 rounded-full group transition-colors">
            <ShoppingCart className="w-6 h-6 text-gray-600 group-hover:text-orange-600 transition-colors" />
            {cart.length > 0 && (<span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm animate-in zoom-in">{cart.reduce((acc, item) => acc + item.cantidad, 0)}</span>)}
          </button>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className="hidden md:flex p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors"><LogOut className="w-5 h-5" /></button>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="md:hidden mb-4 relative">
           <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
           <input type="text" placeholder="¿Qué se te antoja?" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white shadow-sm border border-gray-100 rounded-2xl py-3 pl-11 pr-4 text-base focus:ring-2 focus:ring-orange-500 outline-none"/>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide w-full mb-4 sticky top-[65px] z-20 bg-gray-50/95 backdrop-blur-sm py-2 mask-linear-fade">
           {categories.map((cat) => (
             <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${selectedCategory === cat ? 'bg-gray-900 text-white border-gray-900 shadow-md transform scale-105' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>{cat}</button>
           ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4"><Loader2 className="animate-spin text-orange-500 w-10 h-10"/><p className="text-gray-400 font-medium text-sm animate-pulse">Cargando la bodega...</p></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
            <AnimatePresence mode='popLayout'>
              {filteredProducts.map((prod) => {
                const activeOffer = isOfferActive(prod);
                return (
                <motion.div key={prod.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ y: -5 }} className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 hover:shadow-xl hover:border-orange-100 transition-all group relative flex flex-col justify-between h-full">
                  <div className="aspect-square bg-gray-100 rounded-xl mb-3 overflow-hidden relative">
                    <div className="absolute inset-0 flex items-center justify-center z-0"><ImageIcon className="text-gray-300 w-10 h-10" /></div>
                    {prod.imagen_url && <img src={prod.imagen_url} alt={prod.nombre} className="w-full h-full object-cover relative z-10 transition-opacity duration-300" onError={(e) => e.currentTarget.style.display = 'none'} />}
                    {prod.stock < 5 && <span className="absolute bottom-2 left-2 z-20 bg-red-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm">¡Quedan {prod.stock}!</span>}
                    {activeOffer && (<div className="absolute top-2 left-2 z-20 bg-orange-600 text-white text-[10px] font-black px-2 py-1 rounded shadow-sm flex items-center gap-1 animate-pulse"><Zap className="w-3 h-3 fill-white"/> OFERTA</div>)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm sm:text-base leading-tight mb-1 line-clamp-2">{prod.nombre}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">{prod.categoria}</p>
                    <div className="flex items-end justify-between mt-auto">
                      <div>
                        {activeOffer && prod.precio_oferta ? (
                            <div className="flex flex-col"><span className="text-xs text-gray-400 line-through decoration-red-400 decoration-2">S/ {prod.precio.toFixed(2)}</span><span className="text-xl font-black text-orange-600">S/ {prod.precio_oferta.toFixed(2)}</span></div>
                        ) : (<span className="text-lg font-extrabold text-gray-900">S/ {prod.precio.toFixed(2)}</span>)}
                      </div>
                      <motion.button whileTap={{ scale: 0.8 }} onClick={() => addToCart(prod)} className="bg-gray-900 text-white p-2.5 rounded-xl shadow-lg hover:bg-orange-600 transition-colors"><Plus className="w-5 h-5" /></motion.button>
                    </div>
                  </div>
                </motion.div>
              )})}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* MOBILE BOTTOM NAV */}
      <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-100 z-30 pb-safe">
        <div className="flex justify-around items-center p-2">
          <button onClick={() => { setIsOrdersOpen(false); setIsCartOpen(false); }} className="p-3 rounded-2xl flex flex-col items-center gap-1 text-orange-600"><Store className="w-6 h-6" /><span className="text-[10px] font-bold">Tienda</span></button>
          <button onClick={() => setIsOrdersOpen(true)} className="p-3 rounded-2xl flex flex-col items-center gap-1 text-gray-400 hover:text-orange-600 relative">
            <Clock className="w-6 h-6" />{myOrders.some(o => o.estado === 'pendiente') && <span className="absolute top-2 right-4 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />}<span className="text-[10px] font-bold">Pedidos</span>
          </button>
          <button onClick={() => setIsCartOpen(true)} className="p-3 rounded-2xl flex flex-col items-center gap-1 text-gray-400 hover:text-orange-600 relative">
            <ShoppingCart className="w-6 h-6" />{cart.length > 0 && <span className="absolute top-2 right-3 w-2 h-2 bg-red-500 rounded-full" />}<span className="text-[10px] font-bold">Carrito</span>
          </button>
        </div>
      </div>

      {/* --- CART SIDEBAR --- */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed right-0 top-0 h-full w-full sm:w-[450px] bg-white z-50 shadow-2xl flex flex-col">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-2xl font-extrabold flex items-center gap-2">Mi Canasta <span className="text-base font-normal text-gray-400">({cart.length})</span></h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition"><X className="w-6 h-6 text-gray-500" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4"><div className="bg-gray-100 p-6 rounded-full"><ShoppingCart className="w-12 h-12 text-gray-300"/></div><p className="font-medium">Tu canasta está vacía</p><button onClick={() => setIsCartOpen(false)} className="text-orange-600 font-bold hover:underline">Ir a comprar</button></div>
                ) : cart.map((item) => (
                    <motion.div layout key={item.id} className="flex gap-4 items-center bg-white p-3 rounded-2xl border border-gray-100 shadow-sm relative group">
                      <div className="w-20 h-20 rounded-xl bg-gray-100 relative overflow-hidden flex-shrink-0">
                          <div className="absolute inset-0 flex items-center justify-center"><ImageIcon className="w-6 h-6 text-gray-300"/></div>
                          {item.imagen_url && <img src={item.imagen_url} className="w-full h-full object-cover relative z-10" onError={(e) => e.currentTarget.style.display='none'} />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 line-clamp-1">{item.nombre}</h4>
                        <p className="text-xs text-gray-500 mb-2">{item.categoria}</p>
                        <p className="text-orange-600 font-extrabold">S/ {(item.precioFinal * item.cantidad).toFixed(2)}</p>
                      </div>
                      <div className="flex flex-col items-center gap-2 bg-gray-50 rounded-xl p-1.5">
                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 bg-white shadow-sm rounded-lg hover:text-orange-600"><Plus className="w-3 h-3" /></button>
                        <span className="text-xs font-bold w-4 text-center">{item.cantidad}</span>
                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 bg-white shadow-sm rounded-lg hover:text-orange-600"><Minus className="w-3 h-3" /></button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="absolute -left-2 -top-2 bg-red-100 text-red-500 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm hover:bg-red-500 hover:text-white"><Trash2 className="w-3 h-3" /></button>
                    </motion.div>
                  ))}
              </div>
              {cart.length > 0 && (
                <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                  <div className="flex justify-between items-center mb-6 text-2xl font-black text-gray-900"><span>Total</span><span>S/ {totalCartPrice.toFixed(2)}</span></div>
                  <button onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }} className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-orange-600 transition-all shadow-xl shadow-orange-200 active:scale-95 flex justify-center items-center gap-2">Proceder al Pago <ArrowRight className="w-5 h-5"/></button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- MIS PEDIDOS --- */}
      <AnimatePresence>
        {isOrdersOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOrdersOpen(false)} className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed right-0 top-0 h-full w-full sm:w-[450px] bg-white z-50 shadow-2xl flex flex-col">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h2 className="text-2xl font-extrabold flex items-center gap-2"><Clock className="w-6 h-6 text-purple-600"/> Historial</h2>
                <button onClick={() => setIsOrdersOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition"><X className="w-6 h-6 text-gray-500" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 space-y-4">
                  {myOrders.length === 0 ? (
                     <div className="text-center py-20 opacity-50"><Package className="w-20 h-20 mx-auto mb-4 text-gray-300"/> <p className="font-medium">Aún no tienes pedidos</p></div>
                  ) : myOrders.map(order => (<OrderCard key={order.id} order={order} />))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- CHECKOUT MODAL (MEJORADO) --- */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCheckoutOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-8 relative z-10 max-h-[90vh] overflow-y-auto shadow-2xl">
              {!orderSuccessId ? (
                <>
                  <h2 className="text-3xl font-black mb-1 text-gray-900">Checkout</h2>
                  <p className="text-gray-500 mb-6 text-sm">Confirma los detalles de tu orden.</p>
                  
                  {/* TIPO ENTREGA */}
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2">1. Entrega</p>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <button onClick={() => setDeliveryType('delivery')} className={`p-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all border ${deliveryType === 'delivery' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-gray-50 text-gray-400 border-gray-100'}`}><Bike className="w-4 h-4" /> Delivery</button>
                    <button onClick={() => setDeliveryType('recojo')} className={`p-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all border ${deliveryType === 'recojo' ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-gray-50 text-gray-400 border-gray-100'}`}><Store className="w-4 h-4" /> Recojo</button>
                  </div>

                  {deliveryType === 'delivery' && (
                     <div className="mb-6 space-y-2">
                        <div className="relative group">
                           <input type="text" placeholder=" " value={address} onChange={e => setAddress(e.target.value)} className={`peer w-full bg-gray-50 border border-gray-200 rounded-xl p-4 pt-5 pl-11 outline-none focus:border-orange-500 transition-all font-medium ${gpsLoading ? 'opacity-50' : ''}`} disabled={gpsLoading}/>
                           <label className="absolute left-11 top-4 text-gray-400 text-xs font-bold uppercase transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-orange-500">Dirección de Entrega</label>
                           <MapPin className="absolute left-4 top-5 w-5 h-5 text-gray-400"/>
                           {gpsLoading && <Loader2 className="absolute right-4 top-5 w-5 h-5 animate-spin text-orange-500"/>}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleUseCurrentLocation} className="flex-1 py-2 bg-orange-50 text-orange-700 font-bold rounded-lg text-xs hover:bg-orange-100 border border-orange-100 flex justify-center gap-1 items-center"><LocateFixed className="w-3 h-3" /> Usar GPS</button>
                            <button onClick={() => setIsMapOpen(true)} className="flex-1 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg text-xs hover:bg-gray-200 border border-gray-200 flex justify-center gap-1 items-center"><MapIcon className="w-3 h-3" /> Abrir Mapa</button>
                        </div>
                     </div>
                  )}

                  {/* METODO PAGO */}
                  <p className="text-xs font-bold text-gray-400 uppercase mb-2 mt-4">2. Método de Pago</p>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <button onClick={() => setPaymentMethod('efectivo')} className={`p-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all border ${paymentMethod === 'efectivo' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-100'}`}><Banknote className="w-4 h-4" /> Efectivo</button>
                    <button onClick={() => setPaymentMethod('yape')} className={`p-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all border ${paymentMethod === 'yape' ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-gray-50 text-gray-400 border-gray-100'}`}><Smartphone className="w-4 h-4" /> Yape/Plin</button>
                  </div>

                  {paymentMethod === 'yape' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 bg-purple-50 border border-purple-100 rounded-2xl p-4">
                          <p className="text-xs text-purple-800 mb-2 font-medium text-center">Yapea al número:</p>
                          <div onClick={handleCopyYape} className="bg-white border border-purple-200 rounded-xl p-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition active:scale-95 mb-4">
                              <span className="text-xl font-black text-purple-700 tracking-wider">961 241 085</span>
                              <Copy className="w-4 h-4 text-purple-400"/>
                          </div>
                          
                          <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-purple-300 bg-white/50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-white transition gap-2">
                              {voucherFile ? (
                                  <>
                                    <div className="w-full h-32 rounded-lg overflow-hidden bg-gray-100 relative">
                                        <img src={URL.createObjectURL(voucherFile)} className="w-full h-full object-contain" />
                                    </div>
                                    <p className="text-xs text-green-600 font-bold">Foto cargada</p>
                                  </>
                              ) : (
                                  <>
                                    <Upload className="w-6 h-6 text-purple-400"/>
                                    <p className="text-xs text-purple-600 font-bold">Subir Captura (Click aquí)</p>
                                    <p className="text-[10px] text-purple-400 text-center leading-tight">Si estás en PC y no puedes,<br/>envíala por WhatsApp al terminar.</p>
                                  </>
                              )}
                          </div>
                          <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={(e) => setVoucherFile(e.target.files?.[0] || null)}/>
                      </motion.div>
                  )}

                  <div className="bg-gray-50 p-4 rounded-2xl mb-6">
                      <div className="flex justify-between items-center text-sm mb-1 text-gray-500"><span>Subtotal</span><span>S/ {totalCartPrice.toFixed(2)}</span></div>
                      {deliveryType === 'delivery' && <div className="flex justify-between items-center text-sm mb-1 text-gray-500"><span>Envío</span><span>S/ 2.00</span></div>}
                      <div className="border-t border-gray-200 my-2 pt-2 flex justify-between items-center font-black text-xl text-gray-900"><span>Total</span><span>S/ {(totalCartPrice + (deliveryType === 'delivery' ? 2 : 0)).toFixed(2)}</span></div>
                  </div>

                  <button onClick={handlePlaceOrder} disabled={loading} className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl shadow-xl hover:bg-gray-800 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? <Loader2 className="animate-spin w-5 h-5"/> : <>Confirmar Pedido <ArrowRight className="w-5 h-5" /></>}
                  </button>
                </>
              ) : (
                <div className="text-center py-6">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 className="w-12 h-12" /></motion.div>
                  <h2 className="text-3xl font-black text-gray-900 mb-2">¡Pedido Recibido!</h2>
                  <p className="text-gray-500 mb-6 leading-relaxed">Tu pedido #{orderSuccessId} ha sido registrado.</p>
                  
                  {/* SI ES YAPE Y NO SUBIÓ FOTO (CASO PC) */}
                  {paymentMethod === 'yape' && !voucherFile && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6 text-left">
                          <p className="text-sm font-bold text-yellow-800 mb-1">⚠️ Falta el comprobante</p>
                          <p className="text-xs text-yellow-700 mb-3">Como no subiste la foto, envíala por WhatsApp para que validemos tu pago rápido.</p>
                          <button 
                            onClick={() => window.open(`https://api.whatsapp.com/send?phone=51961241085&text=Hola,%20adjunto%20comprobante%20para%20el%20pedido%20%23${orderSuccessId}`, '_blank')}
                            className="w-full py-3 bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-green-600 transition shadow-lg shadow-green-200"
                          >
                             <MessageCircle className="w-5 h-5"/> Enviar por WhatsApp
                          </button>
                      </div>
                  )}

                  <button onClick={closeSuccessModal} className="text-gray-900 font-bold underline hover:text-orange-600">Volver a la tienda</button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}