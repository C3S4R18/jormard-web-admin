"use client";

import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { 
  Plus, Trash2, BarChart3, Upload, FileSpreadsheet, X, Loader2, Menu, Clock, 
  CheckCircle2, MapPin, Eye, Banknote, Search, AlertTriangle, 
  TrendingUp, Copy, Bell, LogOut, Volume2, Zap, Timer, Pencil, XCircle,
  Map, ExternalLink, HelpCircle, FileDown, ChevronRight, Flag, Image as ImageIcon, 
  Paperclip, Users, Settings, Package, ShoppingBag, ArrowRight, LayoutDashboard, Phone, Calendar
} from 'lucide-react';

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

// --- CONFIG ---
const CATEGORIAS = [
  "Abarrotes", "Aseo y limpieza", "Bebidas", "Caramelos", "Chocolates",
  "Cuidado personal", "Descartables y más", "Galletas", "Lácteos",
  "Licores", "Mascotas", "Papelería", "Snacks", "Útiles escolares",
  "Yogures", "Otros"
];

// --- COMPONENTES UI ---
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }}
    className={`fixed bottom-10 right-10 z-[100] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md border ${
      type === 'success' ? 'bg-gray-900 text-white border-gray-700' : 'bg-red-600 text-white border-red-500'
    }`}
  >
    {type === 'success' ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <X className="w-5 h-5" />}
    <span className="font-bold text-sm">{message}</span>
  </motion.div>
);

const StatCard = ({ title, value, icon, color, subtext }: { title: string, value: string, icon: any, color: string, subtext?: string }) => (
  <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group transition-all relative overflow-hidden">
    <div className={`absolute right-0 top-0 p-10 opacity-5 rounded-bl-full ${color.replace('text-', 'bg-')}`}></div>
    <div className="relative z-10">
      <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">{title}</p>
      <h3 className="text-3xl font-black text-gray-900">{value}</h3>
      {subtext && <p className={`text-xs font-bold mt-2 ${color} flex items-center gap-1`}>{subtext}</p>}
    </div>
    <div className={`p-4 rounded-xl ${color.replace('text-', 'bg-').replace('600', '50')} ${color} relative z-10`}>
      {icon}
    </div>
  </motion.div>
);

// --- TOUR GUIDE (ACTUALIZADO PARA EXPLICAR TODO) ---
const TourGuide = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const [step, setStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

    const steps = [
        { 
            title: "Bienvenido al Panel Jefe", 
            desc: "Este es el centro de control de tu bodega. Vamos a repasar las secciones clave.",
            targetId: null 
        },
        { 
            title: "1. Resumen (Dashboard)", 
            desc: "Aquí verás tus métricas clave: Ventas del día, pedidos pendientes y alertas de stock bajo.",
            targetId: 'nav-dashboard',
            mobileId: 'nav-dashboard-mobile'
        },
        { 
            title: "2. Gestión de Pedidos", 
            desc: "Donde ocurre la magia. Recibe órdenes en tiempo real, verifica pagos Yape y despacha productos.",
            targetId: 'nav-orders',
            mobileId: 'nav-orders-mobile'
        },
        { 
            title: "3. Inventario", 
            desc: "Control total de productos. Agrega, edita precios, crea ofertas flash y sube stock masivamente con Excel.",
            targetId: 'nav-inventory',
            mobileId: 'nav-inventory-mobile'
        },
        { 
            title: "4. Base de Clientes", 
            desc: "Conoce a tus compradores. Visualiza quiénes son, su número de contacto y cuánto te compran.",
            targetId: 'nav-customers',
            mobileId: 'nav-customers-mobile'
        }
    ];

    const updatePosition = () => {
        const currentStep = steps[step];
        let el = null;
        if (currentStep.targetId) {
            el = document.getElementById(currentStep.targetId);
            if (el && window.getComputedStyle(el).display === 'none' && currentStep.mobileId) {
                el = document.getElementById(currentStep.mobileId);
            }
        }
        if (el) {
            const rect = el.getBoundingClientRect();
            setTargetRect(rect);
            const isSidebar = rect.height > window.innerHeight * 0.8 || rect.left < 100; // Detectar sidebar izquierda
            
            if (isSidebar) {
                // Sidebar: Poner a la derecha
                setTooltipStyle({ top: `${rect.top}px`, left: `${rect.right + 20}px` });
            } else {
                // Elemento normal
                setTooltipStyle({
                    top: `${rect.bottom + 20}px`, left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '350px'
                });
            }
        } else {
            setTargetRect(null);
            setTooltipStyle({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '90%', maxWidth: '400px' });
        }
    };

    useLayoutEffect(() => {
        if (isOpen) {
            const timer = setTimeout(updatePosition, 100);
            window.addEventListener('resize', updatePosition);
            return () => { window.removeEventListener('resize', updatePosition); clearTimeout(timer); }
        }
    }, [step, isOpen]);

    const handleNext = () => { if (step < steps.length - 1) setStep(step + 1); else onClose(); };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[120] overflow-hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 transition-all duration-500 ease-in-out"
                style={{ background: 'rgba(0,0,0,0.7)', clipPath: targetRect ? `polygon(0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%, ${targetRect.left}px ${targetRect.top}px, ${targetRect.right}px ${targetRect.top}px, ${targetRect.right}px ${targetRect.bottom}px, ${targetRect.left}px ${targetRect.bottom}px, ${targetRect.left}px ${targetRect.top}px)` : undefined }}
            />
            {targetRect && <motion.div layoutId="tour-ring" className="absolute border-2 border-orange-500 rounded-lg shadow-[0_0_20px_rgba(249,115,22,0.6)]" style={{ top: targetRect.top - 4, left: targetRect.left - 4, width: targetRect.width + 8, height: targetRect.height + 8 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />}
            <motion.div key={step} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute bg-white p-6 rounded-3xl shadow-2xl" style={tooltipStyle}>
                <div className="flex justify-between items-start mb-4">
                    <div className="bg-orange-100 p-2 rounded-full text-orange-600"><Flag size={24}/></div>
                    <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md">{step + 1} / {steps.length}</span>
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">{steps[step].title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">{steps[step].desc}</p>
                <div className="flex justify-between items-center">
                    <button onClick={onClose} className="text-gray-400 font-bold text-sm hover:text-gray-600">Omitir</button>
                    <button onClick={handleNext} className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors shadow-lg shadow-orange-100 flex items-center gap-2">{step === steps.length - 1 ? '¡Listo!' : 'Siguiente'} <ArrowRight size={16}/></button>
                </div>
            </motion.div>
        </div>
    );
};

export default function AdminDashboard() {
  // --- ESTADOS ---
  const [currentView, setCurrentView] = useState<'dashboard' | 'orders' | 'inventory' | 'customers'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false); 
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);
  
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
    // Check Tour
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
    await Promise.all([fetchProducts(), fetchOrders()]);
    setLoading(false);
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

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        
        const formatted = data.map((row: any) => ({
          nombre: row.nombre || row.Nombre,
          precio: parseFloat(row.precio || row.Precio || 0),
          stock: parseInt(row.stock || row.Stock || 0),
          categoria: row.categoria || row.Categoria || 'General',
          imagen_url: row.imagen_url || row.Imagen || row.imagen || '/placeholder.png'
        }));
        
        const { error } = await supabase.from('productos').upsert(formatted, { onConflict: 'nombre' });
        if (error) throw error;
        showToast(`Procesados ${formatted.length} productos correctamente`, 'success');
        fetchProducts(); 
      } catch (error: any) { showToast("Error: " + error.message, 'error'); }
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
  
  // --- LOGICA DE CLIENTES (Calculada desde Pedidos para mostrar historial real) ---
  const uniqueCustomers = Array.from(new Set(orders.map(o => o.cliente_nombre)))
    .map(name => {
        const customerOrders = orders.filter(o => o.cliente_nombre === name);
        // Ordenar por fecha para obtener la última
        const sortedOrders = customerOrders.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return {
            name,
            phone: customerOrders[0].cliente_telefono,
            totalSpent: customerOrders.reduce((acc, curr) => acc + (curr.estado === 'atendido' ? curr.total : 0), 0),
            orderCount: customerOrders.length,
            lastOrder: sortedOrders[0].created_at
        }
    })
    .sort((a,b) => b.totalSpent - a.totalSpent); // Ordenar por mejores clientes

  const filteredCustomers = uniqueCustomers.filter(c => 
     c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
     c.phone.includes(customerSearch)
  );

  // Helper para color de avatar aleatorio pero consistente
  const getAvatarColor = (name: string) => {
    const colors = ['bg-red-100 text-red-600', 'bg-blue-100 text-blue-600', 'bg-green-100 text-green-600', 'bg-yellow-100 text-yellow-600', 'bg-purple-100 text-purple-600', 'bg-pink-100 text-pink-600'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex selection:bg-orange-200">
      
      <AnimatePresence>
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        {showGuide && <TourGuide isOpen={showGuide} onClose={closeTour} />}
      </AnimatePresence>

      {/* --- SIDEBAR DESKTOP --- */}
      <aside id="admin-sidebar" className="hidden lg:flex w-64 bg-white border-r border-gray-100 flex-col fixed h-full z-20">
          <div className="p-6 border-b border-gray-100 flex items-center gap-2">
              <div className="bg-gray-900 p-1.5 rounded-lg text-white shadow-lg"><LayoutDashboard className="w-6 h-6"/></div>
              <span className="font-black text-xl tracking-tight">Panel Jefe</span>
          </div>
          <nav className="flex-1 p-4 space-y-1">
              <button id="nav-dashboard" onClick={() => setCurrentView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${currentView === 'dashboard' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}><BarChart3 className="w-5 h-5"/> Resumen</button>
              <button id="nav-orders" onClick={() => setCurrentView('orders')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${currentView === 'orders' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                  <ShoppingBag className="w-5 h-5"/> Pedidos 
                  {pendientes > 0 && <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{pendientes}</span>}
              </button>
              <button id="nav-inventory" onClick={() => setCurrentView('inventory')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${currentView === 'inventory' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}><Package className="w-5 h-5"/> Inventario</button>
              <button id="nav-customers" onClick={() => setCurrentView('customers')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${currentView === 'customers' ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-50'}`}><Users className="w-5 h-5"/> Clientes</button>
          </nav>
          <div className="p-4 border-t border-gray-100 space-y-2">
             <button onClick={() => setShowGuide(true)} className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-gray-500 hover:text-blue-600 rounded-xl hover:bg-blue-50 transition"><HelpCircle className="w-4 h-4"/> Ver Tutorial</button>
             <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm font-bold text-red-500 hover:text-red-600 rounded-xl hover:bg-red-50 transition"><LogOut className="w-4 h-4"/> Cerrar Sesión</button>
          </div>
      </aside>

      {/* --- SIDEBAR MOBILE (DRAWER) --- */}
      <AnimatePresence>
         {isMobileMenuOpen && (
             <>
                <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"/>
                <motion.div initial={{x:'-100%'}} animate={{x:0}} exit={{x:'-100%'}} className="fixed left-0 top-0 h-full w-[280px] bg-white z-50 shadow-2xl flex flex-col lg:hidden">
                    <div className="p-6 bg-gray-900 text-white flex items-center gap-3">
                        <LayoutDashboard className="w-6 h-6"/> <span className="font-black text-xl">Panel Jefe</span>
                    </div>
                    <nav className="flex-1 p-4 space-y-1">
                        <button id="nav-dashboard-mobile" onClick={() => { setCurrentView('dashboard'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold ${currentView === 'dashboard' ? 'bg-orange-50 text-orange-600' : 'text-gray-600'}`}><BarChart3 className="w-5 h-5"/> Resumen</button>
                        <button id="nav-orders-mobile" onClick={() => { setCurrentView('orders'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold ${currentView === 'orders' ? 'bg-orange-50 text-orange-600' : 'text-gray-600'}`}><ShoppingBag className="w-5 h-5"/> Pedidos</button>
                        <button id="nav-inventory-mobile" onClick={() => { setCurrentView('inventory'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold ${currentView === 'inventory' ? 'bg-orange-50 text-orange-600' : 'text-gray-600'}`}><Package className="w-5 h-5"/> Inventario</button>
                        <button id="nav-customers-mobile" onClick={() => { setCurrentView('customers'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold ${currentView === 'customers' ? 'bg-orange-50 text-orange-600' : 'text-gray-600'}`}><Users className="w-5 h-5"/> Clientes</button>
                    </nav>
                    <div className="p-4">
                        <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100"><LogOut className="w-5 h-5"/> Salir</button>
                    </div>
                </motion.div>
             </>
         )}
      </AnimatePresence>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="flex-1 lg:ml-64 p-4 sm:p-8 max-w-7xl mx-auto w-full">
         {/* Top Bar Mobile */}
         <div className="lg:hidden flex items-center justify-between mb-6">
             <div className="flex items-center gap-3">
                 <button id="admin-menu-btn" onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-white rounded-xl shadow-sm border border-gray-100"><Menu className="w-6 h-6 text-gray-700"/></button>
                 <span className="font-extrabold text-lg text-gray-900">Bodega Jormard</span>
             </div>
             <button onClick={() => { playNotificationSound(); showToast("Sonido OK 🔊", 'success'); }} className="p-2 bg-white rounded-full shadow-sm"><Volume2 className="w-5 h-5 text-gray-400"/></button>
         </div>

         {/* Vista: Dashboard */}
         {currentView === 'dashboard' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                     <div>
                         <h1 className="text-3xl font-black text-gray-900 tracking-tight">Buenos días, Jefe 👋</h1>
                         <p className="text-gray-500">Aquí tienes el resumen de hoy.</p>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => { playNotificationSound(); showToast("Sonido OK", 'success'); }} className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50"><Volume2 className="w-4 h-4"/> Probar Sonido</button>
                     </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Ventas Totales" value={`S/ ${totalVentas.toFixed(2)}`} icon={<TrendingUp className="w-6 h-6 text-green-600"/>} color="text-green-600" subtext="+12% vs ayer"/>
                    <StatCard title="Pedidos Pendientes" value={`${pendientes}`} icon={<Bell className="w-6 h-6 text-orange-600"/>} color="text-orange-600" subtext="Requieren atención"/>
                    <StatCard title="Inventario Bajo" value={`${lowStock}`} icon={<AlertTriangle className="w-6 h-6 text-red-600"/>} color="text-red-600" subtext="Productos < 5 un."/>
                    <StatCard title="Clientes Totales" value={`${uniqueCustomers.length}`} icon={<Users className="w-6 h-6 text-blue-600"/>} color="text-blue-600" subtext="Registrados"/>
                 </div>

                 <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                     <h3 className="font-bold text-gray-900 mb-4">Últimos Pedidos</h3>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="text-gray-400 font-bold uppercase text-xs border-b border-gray-100">
                                <tr><th className="pb-3">ID</th><th className="pb-3">Cliente</th><th className="pb-3">Monto</th><th className="pb-3">Estado</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {orders.slice(0, 5).map(o => (
                                    <tr key={o.id} className="group hover:bg-gray-50 transition cursor-pointer" onClick={() => {setSelectedOrder(o); setCurrentView('orders')}}>
                                        <td className="py-3 font-medium">#{o.id}</td>
                                        <td className="py-3">{o.cliente_nombre}</td>
                                        <td className="py-3 font-bold">S/ {o.total.toFixed(2)}</td>
                                        <td className="py-3"><span className={`px-2 py-1 rounded-lg text-xs font-bold ${o.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-700' : o.estado === 'pagado' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>{o.estado}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     </div>
                     <button onClick={() => setCurrentView('orders')} className="w-full mt-4 py-3 bg-gray-50 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition flex items-center justify-center gap-2">Ver todos los pedidos <ArrowRight className="w-4 h-4"/></button>
                 </div>
             </div>
         )}

         {/* Vista: Pedidos */}
         {currentView === 'orders' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h2 className="text-2xl font-black text-gray-900">Gestión de Pedidos</h2>
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"/>
                        <input type="text" placeholder="Buscar cliente..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)} className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none w-full shadow-sm"/>
                    </div>
                </div>

                {loading ? <div className="text-center py-20"><Loader2 className="animate-spin w-10 h-10 mx-auto text-gray-300"/></div> : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <AnimatePresence>
                    {orders
                      .filter(o => o.cliente_nombre.toLowerCase().includes(orderSearch.toLowerCase()))
                      .map((order) => (
                      <motion.div 
                        key={order.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className={`bg-white border rounded-2xl p-5 shadow-sm relative overflow-hidden cursor-pointer hover:shadow-lg transition-all group ${order.estado === 'pendiente' ? 'border-l-4 border-l-yellow-400' : ''} ${order.estado === 'pagado' ? 'border-l-4 border-l-purple-500 bg-purple-50/20' : ''} ${order.estado === 'atendido' ? 'opacity-60 border-gray-100 grayscale-[0.5]' : ''}`}
                        onClick={() => setSelectedOrder(order)}
                      >
                        {order.estado === 'pendiente' && <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm">POR PAGAR</div>}
                        {order.estado === 'pagado' && <div className="absolute top-0 right-0 bg-purple-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm flex gap-1 items-center"><CheckCircle2 className="w-3 h-3"/> LISTO</div>}
                        
                        {order.comprobante_url && order.estado === 'pendiente' && (
                            <div className="absolute top-8 right-3 animate-pulse">
                                <div className="bg-purple-100 text-purple-700 p-1.5 rounded-full shadow-sm border border-purple-200"><Paperclip className="w-4 h-4" /></div>
                            </div>
                        )}

                        <div className="flex justify-between items-start mb-4 pl-2">
                            <div>
                              <h3 className="font-bold text-gray-900 text-lg group-hover:text-orange-600 transition-colors">{order.cliente_nombre}</h3>
                              <div className="text-xs text-gray-400 font-medium flex items-center gap-1 mt-1"><Clock className="w-3 h-3" /> {new Date(order.created_at).toLocaleString()}</div>
                            </div>
                        </div>

                        <div className="flex justify-between items-end pl-2 pt-2 border-t border-gray-100/50">
                            <div className="text-xs text-gray-500 font-medium flex items-center gap-2">
                              <span className="bg-gray-100 px-2 py-1 rounded-md text-gray-700">{order.items.length} items</span>
                              {order.metodo_pago === 'yape' ? <span className="text-purple-600 font-bold text-[10px] uppercase">📱 Yape</span> : <span className="text-green-600 font-bold text-[10px] uppercase">💵 Efectivo</span>}
                            </div>
                            <div className="text-xl font-black text-gray-900">S/ {order.total.toFixed(2)}</div>
                        </div>
                      </motion.div>
                    ))}
                    </AnimatePresence>
                  </div>
                )}
             </div>
         )}

         {/* Vista: Inventario */}
         {currentView === 'inventory' && (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4">
                 <div className="lg:col-span-1" ref={formTopRef}>
                     <div className={`bg-white p-6 rounded-3xl shadow-sm border sticky top-24 transition-colors ${editingId ? 'border-orange-300 ring-4 ring-orange-50' : 'border-gray-100'}`}>
                         <h2 className="text-lg font-black flex items-center gap-2 mb-4">{editingId ? <Pencil className="w-5 h-5 text-orange-600"/> : <Plus className="w-5 h-5 text-orange-500"/>} {editingId ? "Editar Producto" : "Nuevo Producto"}</h2>
                         <form onSubmit={handleSaveProduct} className="space-y-4">
                             <div className="space-y-1">
                                 <label className="text-[10px] uppercase font-bold text-gray-400">Nombre</label>
                                 <input type="text" value={newProduct.nombre} onChange={e => setNewProduct({...newProduct, nombre: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium" />
                             </div>
                             <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-gray-400">Precio</label>
                                    <input type="number" step="0.10" value={newProduct.precio} onChange={e => setNewProduct({...newProduct, precio: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-medium" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-gray-400">Stock</label>
                                    <input type="number" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-medium" />
                                </div>
                             </div>
                             {/* Ofertas */}
                             <div className={`border rounded-xl p-4 transition-all ${newProduct.oferta_activa ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-100'}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="flex items-center gap-2 text-xs font-bold uppercase text-gray-600 cursor-pointer select-none"><Zap className={`w-4 h-4 ${newProduct.oferta_activa ? 'text-orange-500 fill-orange-500' : 'text-gray-400'}`} /> Oferta Flash</label>
                                    <div onClick={() => setNewProduct({...newProduct, oferta_activa: !newProduct.oferta_activa})} className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${newProduct.oferta_activa ? 'bg-orange-500' : 'bg-gray-300'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${newProduct.oferta_activa ? 'translate-x-4' : 'translate-x-0'}`} />
                                    </div>
                                </div>
                                {newProduct.oferta_activa && (
                                    <motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} className="space-y-3 pt-2">
                                        <input type="number" step="0.10" placeholder="Precio Oferta" value={newProduct.precio_oferta} onChange={e => setNewProduct({...newProduct, precio_oferta: e.target.value})} className="w-full p-2 bg-white border border-orange-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-sm font-bold text-orange-600" />
                                        <div className="grid grid-cols-2 gap-2">
                                            <input type="time" value={newProduct.hora_inicio} onChange={e => setNewProduct({...newProduct, hora_inicio: e.target.value})} className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs" />
                                            <input type="time" value={newProduct.hora_fin} onChange={e => setNewProduct({...newProduct, hora_fin: e.target.value})} className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs" />
                                        </div>
                                    </motion.div>
                                )}
                             </div>
                             {/* Categoría e Imagen */}
                             <div className="space-y-1">
                                 <label className="text-[10px] uppercase font-bold text-gray-400">Categoría</label>
                                 <select value={newProduct.categoria} onChange={e => setNewProduct({...newProduct, categoria: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-medium">
                                     <option value="">Seleccionar...</option>
                                     {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                 </select>
                             </div>
                             <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-200 p-6 rounded-xl text-center cursor-pointer hover:bg-orange-50 hover:border-orange-200 transition-all group">
                                {uploadingImage ? <Loader2 className="animate-spin mx-auto text-orange-500"/> : (newProduct.imagen_url ? <img src={newProduct.imagen_url} className="h-24 w-full object-contain rounded-lg"/> : <div className="text-gray-400 text-sm font-medium group-hover:text-orange-500"><Upload className="w-6 h-6 mx-auto mb-2"/>Subir Foto</div>)}
                             </div>
                             <input type="file" ref={fileInputRef} hidden onChange={handleImageUpload} />
                             
                             <div className="flex gap-2">
                                 {editingId && <button type="button" onClick={resetForm} className="flex-1 bg-gray-100 text-gray-600 font-bold py-3.5 rounded-xl hover:bg-gray-200 transition">Cancelar</button>}
                                 <button type="submit" className={`flex-1 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-95 ${editingId ? 'bg-orange-600 hover:bg-orange-700' : 'bg-gray-900 hover:bg-gray-800'}`}>{editingId ? "Actualizar" : "Guardar"}</button>
                             </div>
                         </form>
                         
                         {!editingId && (
                             <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 gap-2">
                                 <button onClick={handleDownloadTemplate} className="bg-white border border-gray-200 text-gray-600 font-bold py-2 rounded-xl text-xs hover:bg-gray-50 flex items-center justify-center gap-1"><FileDown size={14}/> Plantilla</button>
                                 <button onClick={() => excelInputRef.current?.click()} className="bg-green-50 border border-green-200 text-green-700 font-bold py-2 rounded-xl text-xs hover:bg-green-100 flex items-center justify-center gap-1"><FileSpreadsheet size={14}/> Importar Excel</button>
                                 <input type="file" ref={excelInputRef} hidden accept=".xlsx" onChange={handleExcelUpload} />
                             </div>
                         )}
                     </div>
                 </div>

                 <div className="lg:col-span-2 space-y-4">
                     <div className="relative">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400"/>
                        <input type="text" placeholder="Buscar producto..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl w-full text-sm focus:ring-2 focus:ring-orange-500 outline-none shadow-sm"/>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <AnimatePresence>
                        {products.filter(p => p.nombre.toLowerCase().includes(productSearch.toLowerCase())).map(p => (
                            <motion.div key={p.id} layout initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className={`bg-white p-3 rounded-2xl border flex gap-4 relative group hover:shadow-md transition-all ${editingId === p.id ? 'border-orange-400 ring-2 ring-orange-100' : 'border-gray-100 hover:border-orange-200'}`}>
                                <div className="w-20 h-20 bg-gray-50 rounded-xl flex-shrink-0 relative overflow-hidden">
                                    <img src={p.imagen_url} className="w-full h-full object-cover" onError={(e) => (e.target as HTMLImageElement).src = '/placeholder.png'} />
                                    {p.oferta_activa && <div className="absolute top-0 left-0 bg-orange-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-br-lg z-10">OFERTA</div>}
                                </div>
                                <div className="flex-1 py-1">
                                    <h4 className="font-bold text-gray-900 line-clamp-1 text-sm">{p.nombre}</h4>
                                    <p className="text-xs text-gray-500 font-medium mb-1">{p.categoria}</p>
                                    <div className="flex justify-between items-end mt-2">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.stock < 5 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>Stock: {p.stock}</span>
                                        <div className="text-right">
                                            {p.oferta_activa ? <><span className="block text-[10px] text-gray-400 line-through">S/ {p.precio.toFixed(2)}</span><span className="font-black text-orange-600 text-sm">S/ {p.precio_oferta?.toFixed(2)}</span></> : <span className="font-black text-gray-900 text-sm">S/ {p.precio.toFixed(2)}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEditClick(p)} className="p-1.5 bg-white border border-gray-200 rounded-lg hover:text-orange-600 hover:border-orange-200"><Pencil size={14}/></button>
                                    <button onClick={() => handleDeleteProduct(p.id)} className="p-1.5 bg-white border border-gray-200 rounded-lg hover:text-red-600 hover:border-red-200"><Trash2 size={14}/></button>
                                </div>
                            </motion.div>
                        ))}
                        </AnimatePresence>
                     </div>
                 </div>
             </div>
         )}

         {/* Vista: Clientes (MEJORADA) */}
         {currentView === 'customers' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                 <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                     <h2 className="text-2xl font-black text-gray-900">Cartera de Clientes</h2>
                     <div className="relative w-full sm:w-72">
                         <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"/>
                         <input type="text" placeholder="Buscar cliente..." value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none w-full shadow-sm"/>
                     </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                     {filteredCustomers.length === 0 ? (
                         <div className="col-span-full text-center py-20 opacity-50">
                             <Users className="w-16 h-16 mx-auto mb-4 text-gray-300"/>
                             <p>No se encontraron clientes.</p>
                         </div>
                     ) : (
                         filteredCustomers.map((customer, idx) => (
                             <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} transition={{delay: idx*0.05}} key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all group flex flex-col gap-4">
                                 <div className="flex items-center gap-4">
                                     <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl shadow-inner ${getAvatarColor(customer.name)}`}>
                                         {customer.name.charAt(0)}
                                     </div>
                                     <div className="overflow-hidden">
                                         <h3 className="font-bold text-gray-900 truncate" title={customer.name}>{customer.name}</h3>
                                         <p className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3"/> {customer.phone}</p>
                                     </div>
                                 </div>
                                 
                                 <div className="grid grid-cols-2 gap-2 text-center bg-gray-50 rounded-xl p-2">
                                     <div>
                                         <p className="text-[10px] text-gray-400 font-bold uppercase">Pedidos</p>
                                         <p className="font-black text-gray-900">{customer.orderCount}</p>
                                     </div>
                                     <div>
                                         <p className="text-[10px] text-gray-400 font-bold uppercase">Gastado</p>
                                         <p className="font-black text-green-600">S/ {customer.totalSpent.toFixed(2)}</p>
                                     </div>
                                 </div>

                                 <div className="flex justify-between items-center text-xs text-gray-400 border-t border-gray-100 pt-3">
                                     <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> Último pedido:</span>
                                     <span className="font-medium text-gray-600">{new Date(customer.lastOrder).toLocaleDateString()}</span>
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
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
                
                <div className={`p-6 text-white flex justify-between items-start ${selectedOrder.estado === 'pendiente' ? 'bg-gradient-to-r from-gray-900 to-gray-800' : selectedOrder.estado === 'pagado' ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'bg-gradient-to-r from-green-600 to-emerald-600'}`}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-3xl font-black tracking-tight">Pedido #{selectedOrder.id}</h2>
                      <button onClick={() => copyToClipboard(`Pedido #${selectedOrder.id}`)} className="text-white/50 hover:text-white"><Copy className="w-4 h-4"/></button>
                    </div>
                    <p className="text-white/70 text-sm font-medium">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                  </div>
                  <button onClick={() => setSelectedOrder(null)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition"><X className="w-5 h-5 text-white"/></button>
                </div>
                
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {/* EVIDENCIA DE PAGO */}
                    {selectedOrder.metodo_pago === 'yape' && selectedOrder.comprobante_url && (
                        <div className="mb-6 bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 bg-purple-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl z-10">EVIDENCIA</div>
                           <div className="h-20 w-20 rounded-xl bg-gray-200 flex-shrink-0 overflow-hidden cursor-pointer shadow-sm border border-purple-100" onClick={() => window.open(selectedOrder.comprobante_url, '_blank')}>
                              <img src={selectedOrder.comprobante_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                           </div>
                           <div className="flex-1">
                               <p className="text-sm font-bold text-purple-900 uppercase">Pago con Yape/Plin</p>
                               <button onClick={() => window.open(selectedOrder.comprobante_url, '_blank')} className="mt-2 text-xs bg-white border border-purple-200 text-purple-700 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 hover:bg-purple-100 transition-colors">
                                  <Eye className="w-3 h-3"/> Ver Voucher
                               </button>
                           </div>
                        </div>
                    )}

                    {selectedOrder.metodo_pago === 'yape' && !selectedOrder.comprobante_url && (
                        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center gap-3">
                           <AlertTriangle className="w-6 h-6 text-yellow-600"/>
                           <div><p className="text-sm font-bold text-yellow-900">Pago Yape sin Evidencia</p><p className="text-xs text-yellow-700">El cliente no subió foto. Verifica manualmente.</p></div>
                        </div>
                    )}

                    <div className="bg-gray-50 border border-gray-100 p-5 rounded-2xl mb-6 space-y-3">
                      <div className="flex items-start gap-3">
                          <div className="bg-white p-2 rounded-lg shadow-sm"><Eye className="w-4 h-4 text-gray-900"/></div>
                          <div><p className="text-xs text-gray-400 font-bold uppercase">Cliente</p><p className="font-bold text-gray-900">{selectedOrder.cliente_nombre}</p></div>
                      </div>
                      <div className="flex items-start gap-3">
                          <div className="bg-white p-2 rounded-lg shadow-sm"><MapPin className="w-4 h-4 text-gray-900"/></div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-400 font-bold uppercase">Dirección</p>
                            <p className="font-medium text-gray-700 text-sm break-words">{selectedOrder.tipo_entrega === 'delivery' ? selectedOrder.direccion : 'Recojo en Tienda'}</p>
                            {selectedOrder.tipo_entrega === 'delivery' && (
                                <button onClick={() => handleOpenMap(selectedOrder.direccion)} className="mt-2 text-xs flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 transition-colors border border-blue-100">
                                    <Map className="w-3 h-3" /> Ver en Mapa <ExternalLink className="w-3 h-3"/>
                                </button>
                            )}
                          </div>
                      </div>
                      <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                          <span className="font-bold text-blue-600">{selectedOrder.cliente_telefono}</span>
                          <button onClick={() => copyToClipboard(selectedOrder.cliente_telefono)} className="text-xs font-bold text-gray-400 hover:text-gray-600 flex items-center gap-1"><Copy className="w-3 h-3"/> COPIAR</button>
                      </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Productos</p>
                        {selectedOrder.items.map((item, idx) => (
                           <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                              <div className="flex items-center gap-3">
                                <span className="bg-gray-100 text-gray-700 font-bold w-8 h-8 flex items-center justify-center rounded-lg text-sm">{item.cantidad}</span>
                                <span className="font-medium text-gray-700">{item.nombre}</span>
                              </div>
                              <span className="font-bold text-gray-900">S/ {(item.precio * item.cantidad).toFixed(2)}</span>
                           </div>
                        ))}
                    </div>
                    
                    <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-100">
                        <div className="flex flex-col"><span className="text-gray-500 font-medium text-sm">Total a cobrar</span><span className="text-[10px] text-gray-400 uppercase font-bold">{selectedOrder.metodo_pago === 'yape' ? 'Vía Yape/Plin' : 'En Efectivo'}</span></div>
                        <span className="text-3xl font-black text-gray-900">S/ {selectedOrder.total.toFixed(2)}</span>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100">
                  {selectedOrder.estado === 'pendiente' && (
                    <div className="flex gap-3">
                      <button onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'cancelado')} className="flex-1 py-4 rounded-xl border-2 border-gray-200 font-bold text-gray-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all">Cancelar</button>
                      <button onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'pagado')} className="flex-[2] py-4 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 shadow-lg shadow-purple-200 flex items-center justify-center gap-2 transform active:scale-95 transition-all"><Banknote className="w-5 h-5" /> Confirmar Pago</button>
                    </div>
                  )}
                  {selectedOrder.estado === 'pagado' && (
                    <button onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'atendido')} className="w-full py-4 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 shadow-lg shadow-green-200 flex items-center justify-center gap-2 transform active:scale-95 transition-all text-lg"><CheckCircle2 className="w-6 h-6" /> {selectedOrder.tipo_entrega === 'delivery' ? 'Marcar como Enviado' : 'Marcar como Entregado'}</button>
                  )}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button onClick={() => handleDeleteOrder(selectedOrder.id)} className="w-full py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 hover:shadow-md transition-all flex items-center justify-center gap-2 opacity-80 hover:opacity-100"><Trash2 className="w-4 h-4" /> Eliminar Definitivamente</button>
                  </div>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}