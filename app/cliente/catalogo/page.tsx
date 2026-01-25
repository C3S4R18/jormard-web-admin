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
  Image as ImageIcon, ChevronDown, ChevronUp, Banknote, Smartphone, 
  Upload, MessageCircle, Copy, Menu, User, Settings, HelpCircle, Info, Camera, Edit2
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
  metodo_pago?: string;
  comprobante_url?: string;
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

// --- COMPONENTE FAQ ITEM ---
const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
    const [expanded, setExpanded] = useState(false);
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <button onClick={() => setExpanded(!expanded)} className="w-full flex justify-between items-center p-4 text-left font-bold text-gray-800 text-sm">
                {question}
                {expanded ? <ChevronUp className="w-4 h-4 text-gray-400"/> : <ChevronDown className="w-4 h-4 text-gray-400"/>}
            </button>
            <AnimatePresence>
                {expanded && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="bg-gray-50 px-4 pb-4">
                         <p className="text-xs text-gray-600 leading-relaxed pt-2 border-t border-gray-100">{answer}</p>
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
  const [userId, setUserId] = useState<string | null>(null);
  const [userData, setUserData] = useState<{nombre: string, telefono: string, avatar_url?: string} | null>(null);
  
  // UI States (Navegación)
  const [currentView, setCurrentView] = useState<'store' | 'orders' | 'profile' | 'support' | 'settings' | 'about'>('store');
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Para el sidebar en móvil

  // UI States (Modales)
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderSuccessId, setOrderSuccessId] = useState<number | null>(null);
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

  // --- INIT ---
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
      // Inicializar campos de edición
      setEditName(meta.full_name || '');
      setEditPhone(meta.phone || '');

      fetchMyOrders(user.id);
      
      supabase.channel('mis-pedidos-realtime').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `user_id=eq.${user.id}` }, (payload) => {
           const newOrder = payload.new as Pedido;
           setMyOrders((prev) => prev.map((order) => order.id === newOrder.id ? newOrder : order));
           showToast(`Pedido #${newOrder.id}: ${newOrder.estado.toUpperCase()}`, 'success');
      }).subscribe();
      
      await fetchProducts();
    };
    initData();
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

          // Actualizar Auth Metadata
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

  // --- LOGOUT MEJORADO ---
  const handleLogout = async () => {
      await supabase.auth.signOut();
      router.push('/'); // Redirige al Home, no al login
  };

  // --- GEOLOCALIZACIÓN Y FILTROS (Igual que antes) ---
  useEffect(() => {
    let result = [...products];
    if (selectedCategory !== 'Todos') result = result.filter(p => p.categoria === selectedCategory);
    if (searchTerm) result = result.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredProducts(result);
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

  // --- CARRITO ---
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
    setCart(prev => prev.map(item => item.id === id ? (item.cantidad + delta > 0 ? { ...item, cantidad: item.cantidad + delta } : item) : item));
  };
  const totalCartPrice = cart.reduce((acc, item) => acc + (item.precioFinal * item.cantidad), 0);
  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.categoria)))];

  // --- CHECKOUT ---
  const handlePlaceOrder = async () => {
    if (deliveryType === 'delivery' && !address) return showToast("Falta la dirección", 'error');
    if (!userData?.nombre) return showToast("Error de usuario.", 'error');

    try {
      setLoading(true);
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
    setCurrentView('orders'); // Ir a pedidos
    setVoucherFile(null);
  };

  // --- RENDERIZADO DE VISTAS PRINCIPALES ---
  const renderContent = () => {
      switch (currentView) {
          case 'store':
              return (
                  <>
                      {/* Categorías */}
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide w-full mb-4 sticky top-[65px] z-20 bg-gray-50/95 backdrop-blur-sm py-2">
                        {categories.map((cat) => (
                          <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${selectedCategory === cat ? 'bg-gray-900 text-white border-gray-900 shadow-md transform scale-105' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>{cat}</button>
                        ))}
                      </div>

                      {/* Lista de Productos */}
                      {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4"><Loader2 className="animate-spin text-orange-500 w-10 h-10"/><p className="text-gray-400 font-medium text-sm animate-pulse">Cargando bodega...</p></div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6 pb-20">
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
                  </>
              );
          case 'orders':
              return (
                  <div className="max-w-2xl mx-auto pb-20">
                      <h2 className="text-2xl font-black mb-6 flex items-center gap-2"><Clock className="w-7 h-7 text-orange-500"/> Mis Pedidos</h2>
                      {myOrders.length === 0 ? (
                         <div className="text-center py-20 opacity-50"><Package className="w-20 h-20 mx-auto mb-4 text-gray-300"/> <p className="font-medium">Aún no tienes pedidos</p></div>
                      ) : myOrders.map(order => (<OrderCard key={order.id} order={order} />))}
                  </div>
              );
          case 'profile':
              return (
                  <div className="max-w-lg mx-auto pb-20">
                       <h2 className="text-2xl font-black mb-6 flex items-center gap-2"><User className="w-7 h-7 text-blue-500"/> Mi Perfil</h2>
                       
                       <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                           <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative"></div>
                           <div className="px-6 pb-6 relative">
                               {/* Avatar */}
                               <div className="w-24 h-24 rounded-full bg-white p-1 absolute -top-12 left-1/2 -translate-x-1/2 shadow-lg group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                                   <div className="w-full h-full rounded-full bg-gray-200 overflow-hidden relative">
                                        {avatarUploading ? (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/30"><Loader2 className="w-6 h-6 text-white animate-spin"/></div>
                                        ) : userData?.avatar_url ? (
                                            <img src={userData.avatar_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">{userData?.nombre.charAt(0)}</div>
                                        )}
                                        {/* Overlay de cámara */}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                            <Camera className="w-6 h-6 text-white"/>
                                        </div>
                                   </div>
                                   <input type="file" ref={avatarInputRef} hidden accept="image/*" onChange={handleAvatarUpload} />
                               </div>

                               <div className="mt-14 text-center">
                                   <h3 className="text-xl font-bold text-gray-900">{userData?.nombre}</h3>
                                   <p className="text-sm text-gray-500">{userData?.telefono || 'Sin teléfono'}</p>
                               </div>

                               <div className="mt-8 space-y-4">
                                   {isEditingProfile ? (
                                       <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                           <div>
                                               <label className="text-xs font-bold text-gray-400 uppercase">Nombre</label>
                                               <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full border rounded-xl p-3 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"/>
                                           </div>
                                           <div>
                                               <label className="text-xs font-bold text-gray-400 uppercase">Celular</label>
                                               <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full border rounded-xl p-3 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"/>
                                           </div>
                                           <div className="flex gap-2 pt-2">
                                               <button onClick={() => setIsEditingProfile(false)} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold text-gray-600 hover:bg-gray-200">Cancelar</button>
                                               <button onClick={handleSaveProfile} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200">Guardar Cambios</button>
                                           </div>
                                       </div>
                                   ) : (
                                       <>
                                           <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4">
                                               <div className="p-2 bg-white rounded-lg shadow-sm"><User className="w-5 h-5 text-gray-400"/></div>
                                               <div><p className="text-xs text-gray-400 font-bold uppercase">Nombre</p><p className="font-medium text-gray-900">{userData?.nombre}</p></div>
                                           </div>
                                           <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4">
                                               <div className="p-2 bg-white rounded-lg shadow-sm"><Smartphone className="w-5 h-5 text-gray-400"/></div>
                                               <div><p className="text-xs text-gray-400 font-bold uppercase">Celular</p><p className="font-medium text-gray-900">{userData?.telefono || 'No registrado'}</p></div>
                                           </div>
                                           <button onClick={() => setIsEditingProfile(true)} className="w-full py-3 mt-2 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 flex items-center justify-center gap-2">
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
                <div className="max-w-lg mx-auto pb-20">
                    <h2 className="text-2xl font-black mb-6 flex items-center gap-2"><HelpCircle className="w-7 h-7 text-green-500"/> Ayuda y Soporte</h2>
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><MessageCircle className="w-8 h-8 text-green-600"/></div>
                            <h3 className="font-bold text-lg mb-1">¿Necesitas ayuda urgente?</h3>
                            <p className="text-gray-500 text-sm mb-6">Contáctanos directamente por WhatsApp o llamada.</p>
                            <div className="flex gap-3">
                                <button onClick={() => window.open(`https://api.whatsapp.com/send?phone=51961241085&text=Hola,%20tengo%20una%20consulta`, '_blank')} className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 flex items-center justify-center gap-2"><MessageCircle className="w-5 h-5"/> WhatsApp</button>
                                <button onClick={() => window.open('tel:961241085')} className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 flex items-center justify-center gap-2"><Smartphone className="w-5 h-5"/> Llamar</button>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 mb-3 ml-1">Preguntas Frecuentes</h3>
                            <div className="space-y-2">
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
                  <div className="max-w-lg mx-auto pb-20">
                      <h2 className="text-2xl font-black mb-6 flex items-center gap-2"><Settings className="w-7 h-7 text-gray-700"/> Configuración</h2>
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                           <div className="p-4 flex justify-between items-center">
                               <div><p className="font-bold text-gray-800">Notificaciones</p><p className="text-xs text-gray-500">Recibir alertas de pedidos</p></div>
                               <div className="w-10 h-6 bg-green-500 rounded-full relative"><div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow-sm"></div></div>
                           </div>
                           <div className="p-4 flex justify-between items-center">
                               <div><p className="font-bold text-gray-800">Sonidos</p><p className="text-xs text-gray-500">Efectos de sonido en la app</p></div>
                               <div className="w-10 h-6 bg-green-500 rounded-full relative"><div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow-sm"></div></div>
                           </div>
                           <div className="p-4">
                               <button onClick={() => showToast("Caché limpiada", 'success')} className="text-red-500 font-bold text-sm flex items-center gap-2"><Trash2 className="w-4 h-4"/> Borrar caché de la aplicación</button>
                           </div>
                      </div>
                  </div>
              );
          case 'about':
            return (
                <div className="max-w-lg mx-auto pb-20 text-center">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 inline-block mb-6">
                        <Store className="w-16 h-16 text-orange-500 mx-auto mb-4"/>
                        <h1 className="text-2xl font-black text-gray-900">Bodega Jormard</h1>
                        <p className="text-gray-500">Tu tienda en el bolsillo</p>
                        <span className="inline-block mt-4 px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-600">v2.4.0 (Web)</span>
                    </div>
                    <button onClick={() => window.open('https://bodega-jormard.vercel.app', '_blank')} className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl mb-4 hover:bg-gray-800">Visitar Sitio Web</button>
                    <p className="text-xs text-gray-400">© 2026 Jormard Inc. Todos los derechos reservados.</p>
                </div>
            )
          default: return null;
      }
  }

  // --- RENDER PRINCIPAL ---
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 selection:bg-orange-200">
      
      {/* MAPA */}
      {isMapOpen && <LocationMap onConfirm={(lat, lng) => { setIsMapOpen(false); fetchAddressFromCoords(lat, lng); }} onCancel={() => setIsMapOpen(false)} />}
      <AnimatePresence>{toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>

      {/* --- SIDEBAR DE NAVEGACIÓN (Desktop & Mobile Drawer) --- */}
      <AnimatePresence>
          {isMenuOpen && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMenuOpen(false)} className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm lg:hidden" />
                <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} className="fixed left-0 top-0 h-full w-[280px] bg-white z-50 shadow-2xl flex flex-col lg:hidden">
                    {/* Drawer Content (Mobile) */}
                    <div className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                                {userData?.avatar_url ? <img src={userData.avatar_url} className="w-full h-full object-cover"/> : <span className="font-bold text-xl">{userData?.nombre.charAt(0)}</span>}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg leading-tight">{userData?.nombre}</h3>
                                <p className="text-xs text-gray-400 truncate w-32">{userId}</p>
                            </div>
                        </div>
                    </div>
                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                        <button onClick={() => { setCurrentView('store'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${currentView === 'store' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}><Store className="w-5 h-5"/> Tienda</button>
                        <button onClick={() => { setCurrentView('orders'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${currentView === 'orders' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}><Clock className="w-5 h-5"/> Mis Pedidos</button>
                        <button onClick={() => { setCurrentView('profile'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${currentView === 'profile' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}><User className="w-5 h-5"/> Mi Perfil</button>
                        <div className="my-4 border-t border-gray-100"></div>
                        <button onClick={() => { setCurrentView('settings'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${currentView === 'settings' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}><Settings className="w-5 h-5"/> Configuración</button>
                        <button onClick={() => { setCurrentView('support'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${currentView === 'support' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}><HelpCircle className="w-5 h-5"/> Ayuda</button>
                        <button onClick={() => { setCurrentView('about'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${currentView === 'about' ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}><Info className="w-5 h-5"/> Acerca de</button>
                    </nav>
                    <div className="p-4 border-t border-gray-100">
                        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100"><LogOut className="w-5 h-5"/> Cerrar Sesión</button>
                    </div>
                </motion.div>
              </>
          )}
      </AnimatePresence>

      {/* --- LAYOUT DESKTOP (Sidebar fijo a la izquierda) --- */}
      <div className="lg:flex">
          <aside className="hidden lg:flex w-64 h-screen sticky top-0 bg-white border-r border-gray-100 flex-col z-20">
             <div className="p-6 border-b border-gray-100 flex items-center gap-2">
                 <div className="bg-orange-500 p-1.5 rounded-lg text-white"><Store className="w-6 h-6"/></div>
                 <span className="font-black text-xl tracking-tight">Jormard</span>
             </div>
             <nav className="flex-1 p-4 space-y-1">
                 <button onClick={() => setCurrentView('store')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${currentView === 'store' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}><Store className="w-5 h-5"/> Tienda</button>
                 <button onClick={() => setCurrentView('orders')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${currentView === 'orders' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}><Clock className="w-5 h-5"/> Pedidos</button>
                 <button onClick={() => setCurrentView('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${currentView === 'profile' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}><User className="w-5 h-5"/> Perfil</button>
                 <div className="my-4 border-t border-gray-100"></div>
                 <button onClick={() => setCurrentView('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${currentView === 'settings' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}><Settings className="w-5 h-5"/> Ajustes</button>
                 <button onClick={() => setCurrentView('support')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${currentView === 'support' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}><HelpCircle className="w-5 h-5"/> Soporte</button>
             </nav>
             <div className="p-4 border-t border-gray-100">
                <div className="flex items-center gap-3 mb-4 px-2">
                     <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                         {userData?.avatar_url ? <img src={userData.avatar_url} className="w-full h-full object-cover"/> : <span className="font-bold text-gray-500">{userData?.nombre.charAt(0)}</span>}
                     </div>
                     <div className="flex-1 min-w-0">
                         <p className="font-bold text-sm truncate">{userData?.nombre}</p>
                         <p className="text-xs text-gray-400 truncate">Cliente</p>
                     </div>
                </div>
                <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gray-50 text-gray-600 font-bold hover:bg-gray-100 text-sm"><LogOut className="w-4 h-4"/> Salir</button>
             </div>
          </aside>

          <div className="flex-1 min-h-screen">
              {/* HEADER MOVIL */}
              <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-gray-100 px-4 py-3 flex lg:hidden items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsMenuOpen(true)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"><Menu className="w-6 h-6"/></button>
                    <h1 className="font-extrabold text-lg leading-none tracking-tight">{currentView === 'store' ? 'Jormard' : currentView === 'orders' ? 'Mis Pedidos' : currentView === 'profile' ? 'Perfil' : 'Bodega'}</h1>
                </div>
                <button onClick={() => setIsCartOpen(true)} className="relative p-2 hover:bg-orange-50 rounded-full group transition-colors">
                  <ShoppingCart className="w-6 h-6 text-gray-600 group-hover:text-orange-600 transition-colors" />
                  {cart.length > 0 && (<span className="absolute top-1 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-sm animate-in zoom-in">{cart.reduce((acc, item) => acc + item.cantidad, 0)}</span>)}
                </button>
              </nav>

              {/* HEADER DESKTOP (SEARCH) */}
              <div className="hidden lg:flex sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-4 justify-between items-center">
                   <h2 className="text-2xl font-black text-gray-900">{currentView === 'store' ? 'Tienda' : currentView === 'orders' ? 'Historial de Pedidos' : currentView === 'profile' ? 'Mi Perfil' : currentView === 'support' ? 'Ayuda' : 'Configuración'}</h2>
                   <div className="flex items-center gap-4">
                       {currentView === 'store' && (
                           <div className="relative group w-80">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                                <input type="text" placeholder="Buscar productos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-100/50 border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all"/>
                           </div>
                       )}
                       <button onClick={() => setIsCartOpen(true)} className="relative p-3 bg-gray-100 hover:bg-orange-50 rounded-xl group transition-colors flex items-center gap-2">
                           <ShoppingCart className="w-5 h-5 text-gray-600 group-hover:text-orange-600" />
                           <span className="font-bold text-sm text-gray-700">S/ {totalCartPrice.toFixed(2)}</span>
                           {cart.length > 0 && (<span className="bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">{cart.reduce((acc, item) => acc + item.cantidad, 0)}</span>)}
                       </button>
                   </div>
              </div>

              {/* CONTENIDO PRINCIPAL */}
              <main className="p-4 sm:p-8 max-w-7xl mx-auto">
                 {/* Search móvil solo en Store */}
                 {currentView === 'store' && (
                     <div className="lg:hidden mb-4 relative">
                        <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                        <input type="text" placeholder="¿Qué se te antoja?" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white shadow-sm border border-gray-100 rounded-2xl py-3 pl-11 pr-4 text-base focus:ring-2 focus:ring-orange-500 outline-none"/>
                     </div>
                 )}
                 
                 {renderContent()}
              </main>
          </div>
      </div>

      {/* --- CART SIDEBAR (Reutilizado) --- */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed right-0 top-0 h-full w-full sm:w-[450px] bg-white z-[60] shadow-2xl flex flex-col">
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

      {/* --- CHECKOUT MODAL (Reutilizado pero mejorado) --- */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCheckoutOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-8 relative z-10 max-h-[90vh] overflow-y-auto shadow-2xl">
              {!orderSuccessId ? (
                <>
                  <h2 className="text-3xl font-black mb-1 text-gray-900">Checkout</h2>
                  <p className="text-gray-500 mb-6 text-sm">Confirma los detalles de tu orden.</p>
                  
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

                  <p className="text-xs font-bold text-gray-400 uppercase mb-2 mt-4">2. Método de Pago</p>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <button onClick={() => setPaymentMethod('efectivo')} className={`p-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all border ${paymentMethod === 'efectivo' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-100'}`}><Banknote className="w-4 h-4" /> Efectivo</button>
                    <button onClick={() => setPaymentMethod('yape')} className={`p-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all border ${paymentMethod === 'yape' ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-gray-50 text-gray-400 border-gray-100'}`}><Smartphone className="w-4 h-4" /> Yape/Plin</button>
                  </div>

                  {paymentMethod === 'yape' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 bg-purple-50 border border-purple-100 rounded-2xl p-4">
                          <p className="text-xs text-purple-800 mb-2 font-medium text-center">Yapea al número:</p>
                          <div onClick={() => {navigator.clipboard.writeText("961241085"); showToast("Copiado", 'success')}} className="bg-white border border-purple-200 rounded-xl p-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition active:scale-95 mb-4">
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
                  
                  {paymentMethod === 'yape' && !voucherFile && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6 text-left">
                          <p className="text-sm font-bold text-yellow-800 mb-1">⚠️ Falta el comprobante</p>
                          <p className="text-xs text-yellow-700 mb-3">Como no subiste la foto, envíala por WhatsApp para que validemos tu pago rápido.</p>
                          <button onClick={() => window.open(`https://api.whatsapp.com/send?phone=51961241085&text=Hola,%20adjunto%20comprobante%20para%20el%20pedido%20%23${orderSuccessId}`, '_blank')} className="w-full py-3 bg-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-green-600 transition shadow-lg shadow-green-200">
                             <MessageCircle className="w-5 h-5"/> Enviar por WhatsApp
                          </button>
                      </div>
                  )}

                  <button onClick={closeSuccessModal} className="text-gray-900 font-bold underline hover:text-orange-600">Volver a mis pedidos</button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}