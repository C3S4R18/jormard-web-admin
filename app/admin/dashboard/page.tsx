"use client";

import { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { 
  Plus, Trash2, BarChart3, Upload, FileSpreadsheet, X, Loader2, Menu, Clock, 
  CheckCircle2, MapPin, Eye, Banknote, Search, AlertTriangle, 
  TrendingUp, Copy, Bell, LogOut, Volume2, Zap, Timer, Pencil, XCircle,
  Map, ExternalLink, HelpCircle, FileDown, ChevronRight, Flag
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
}

// --- LISTA DE CATEGORÍAS ---
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
    className={`fixed bottom-10 right-10 z-[70] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md border ${
      type === 'success' ? 'bg-gray-900 text-white border-gray-700' : 'bg-red-600 text-white border-red-500'
    }`}
  >
    {type === 'success' ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <X className="w-5 h-5" />}
    <span className="font-bold text-sm">{message}</span>
  </motion.div>
);

const StatCard = ({ title, value, icon, color, subtext }: { title: string, value: string, icon: any, color: string, subtext?: string }) => (
  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
    <div>
      <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-2xl font-black text-gray-900">{value}</h3>
      {subtext && <p className={`text-xs font-bold mt-1 ${color}`}>{subtext}</p>}
    </div>
    <div className={`p-3 rounded-xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
  </div>
);

// --- GUÍA PASO A PASO ---
const StepByStepGuide = ({ onClose }: { onClose: () => void }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { 
      title: "Bienvenido a tu Panel", 
      icon: <Flag className="w-12 h-12 text-gray-900"/>, 
      desc: "Este es el centro de control de tu Bodega. Desde aquí gestionarás pedidos, inventario y ofertas. ¡Veamos cómo funciona!" 
    },
    { 
      title: "1. Gestión de Pedidos", 
      icon: <Bell className="w-12 h-12 text-orange-500"/>, 
      desc: "Los pedidos llegan aquí.\n🟡 Amarillo: Falta pagar.\n🟣 Morado: Pagado (Yape/Plin).\n🟢 Verde: Entregado.\n¡Cambia el estado para mantener el orden!" 
    },
    { 
      title: "2. Inventario Inteligente", 
      icon: <Pencil className="w-12 h-12 text-blue-500"/>, 
      desc: "Agrega productos manualmente o con Excel. Si subes un Excel con un nombre que ya existe, el sistema actualizará el precio y stock en lugar de duplicarlo." 
    },
    { 
      title: "3. Imágenes Fáciles", 
      icon: <Search className="w-12 h-12 text-purple-500"/>, 
      desc: "¿No tienes la foto a la mano? Sube el producto sin foto. Luego, usa el botón de la 'Lupa' en la lista para buscarla en Google y copiar el link." 
    },
    { 
      title: "4. Ofertas Flash", 
      icon: <Zap className="w-12 h-12 text-yellow-500"/>, 
      desc: "Configura precios especiales por horario. Por ejemplo: 'Pan con Pollo' a S/ 3.00 solo de 7:00 AM a 10:00 AM." 
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
    else onClose();
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative flex flex-col min-h-[400px]" 
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute top-4 right-4 z-10">
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"><X className="w-4 h-4 text-gray-500"/></button>
        </div>
        <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
          <AnimatePresence mode='wait'>
            <motion.div 
              key={currentStep}
              initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} transition={{ duration: 0.2 }}
              className="flex flex-col items-center"
            >
              <div className="mb-6 p-4 bg-gray-50 rounded-full shadow-inner">{steps[currentStep].icon}</div>
              <h2 className="text-2xl font-black text-gray-900 mb-4">{steps[currentStep].title}</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{steps[currentStep].desc}</p>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div className="flex gap-1">
             {steps.map((_, idx) => (
                <div key={idx} className={`w-2 h-2 rounded-full transition-colors ${idx === currentStep ? 'bg-gray-900' : 'bg-gray-300'}`} />
             ))}
          </div>
          <div className="flex gap-3">
             {currentStep > 0 && <button onClick={handlePrev} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-200 rounded-xl transition">Atrás</button>}
             <button onClick={handleNext} className="px-6 py-2 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition flex items-center gap-2">
                {currentStep === steps.length - 1 ? '¡Empezar!' : 'Siguiente'} 
                {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4"/>}
             </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default function AdminDashboard() {
  // --- ESTADOS ---
  const [activeTab, setActiveTab] = useState<'inventario' | 'pedidos'>('pedidos');
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false); 
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);
  
  // Filtros
  const [orderSearch, setOrderSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

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
      imagen_url: newProduct.imagen_url || '/placeholder.png', // Imagen por defecto
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

    if(error) {
        showToast("Error al guardar: " + error.message, 'error');
    } else {
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
  
  // --- EXCEL LOGIC (MEJORADO CON UPSERT) ---
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
          // LOGICA INTELIGENTE DE IMAGEN: Si no hay link, pone el placeholder
          imagen_url: row.imagen_url || row.Imagen || row.imagen || '/placeholder.png'
        }));
        
        // UPSERT: Si el nombre existe, actualiza. Si no, crea.
        const { error } = await supabase
            .from('productos')
            .upsert(formatted, { onConflict: 'nombre' });

        if (error) throw error;
        showToast(`Procesados ${formatted.length} productos correctamente`, 'success');
        fetchProducts(); 
      } catch (error: any) { 
        console.error(error);
        showToast("Error: " + error.message, 'error'); 
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
    } catch (error: any) {
      showToast("Error al eliminar: " + error.message, 'error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copiado al portapapeles", 'success');
  };

  // --- MÉTRICAS ---
  const totalVentas = orders.filter(o => o.estado === 'atendido').reduce((acc, o) => acc + o.total, 0);
  const pendientes = orders.filter(o => o.estado === 'pendiente').length;
  const lowStock = products.filter(p => p.stock < 5).length;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      
      <AnimatePresence>
        {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        {showGuide && <StepByStepGuide onClose={() => setShowGuide(false)} />}
      </AnimatePresence>

      {/* NAVBAR */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 px-6 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-gray-900 p-2 rounded-xl text-white shadow-lg shadow-gray-200">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg leading-none tracking-tight">Panel Jefe</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Bodega Jormard</p>
          </div>
        </div>
        
        <div className="hidden md:flex bg-gray-100 p-1 rounded-xl">
          <button onClick={() => setActiveTab('pedidos')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'pedidos' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            🔔 Pedidos
          </button>
          <button onClick={() => setActiveTab('inventario')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'inventario' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            📦 Inventario
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* BOTÓN GUÍA */}
          <button 
            onClick={() => setShowGuide(true)}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
            title="Guía de Uso"
          >
            <HelpCircle className="w-6 h-6" />
          </button>

          <button 
            onClick={() => { playNotificationSound(); showToast("Sonido Activado 🔊", 'success'); }}
            className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-full transition-all"
            title="Activar/Probar Sonido"
          >
            <Volume2 className="w-5 h-5" />
          </button>

          <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className="hidden md:flex items-center gap-2 px-4 py-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl font-bold text-sm transition-colors">
            <LogOut className="w-4 h-4" /> Salir
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2"><Menu className="w-6 h-6" /></button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
        
        {/* --- STATS ROW --- */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
           <StatCard title="Ventas Totales" value={`S/ ${totalVentas.toFixed(2)}`} icon={<TrendingUp className="w-6 h-6 text-green-600"/>} color="text-green-600" subtext="Dinero ingresado"/>
           <StatCard title="Por Atender" value={`${pendientes}`} icon={<Bell className="w-6 h-6 text-orange-600"/>} color="text-orange-600" subtext="Pedidos esperando"/>
           <StatCard title="Stock Bajo" value={`${lowStock}`} icon={<AlertTriangle className="w-6 h-6 text-red-600"/>} color="text-red-600" subtext="Productos < 5 un."/>
        </div>

        {/* --- VISTA PEDIDOS --- */}
        {activeTab === 'pedidos' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
               <div>
                  <h2 className="text-2xl font-black text-gray-900">Bandeja de Entrada</h2>
                  <p className="text-gray-500 text-sm">Gestiona y despacha los pedidos.</p>
               </div>
               <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"/>
                  <input type="text" placeholder="Buscar cliente..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)} className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none w-full sm:w-64"/>
               </div>
            </div>

            {loading ? <div className="text-center py-20"><Loader2 className="animate-spin w-10 h-10 mx-auto text-gray-300"/></div> : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                {orders
                  .filter(o => o.cliente_nombre.toLowerCase().includes(orderSearch.toLowerCase()))
                  .map((order) => (
                  <motion.div 
                    key={order.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className={`bg-white border rounded-2xl p-5 shadow-sm relative overflow-hidden cursor-pointer hover:shadow-lg transition-all group
                      ${order.estado === 'pendiente' ? 'border-l-4 border-l-yellow-400' : ''}
                      ${order.estado === 'pagado' ? 'border-l-4 border-l-purple-500 bg-purple-50/20' : ''}
                      ${order.estado === 'atendido' ? 'opacity-60 border-gray-100 grayscale-[0.5]' : ''}
                    `}
                    onClick={() => setSelectedOrder(order)}
                  >
                    {order.estado === 'pendiente' && <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm">POR PAGAR</div>}
                    {order.estado === 'pagado' && <div className="absolute top-0 right-0 bg-purple-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm flex gap-1 items-center"><CheckCircle2 className="w-3 h-3"/> LISTO PARA ENVÍO</div>}
                    
                    <div className="flex justify-between items-start mb-4 pl-2">
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg group-hover:text-orange-600 transition-colors">{order.cliente_nombre}</h3>
                          <div className="text-xs text-gray-400 font-medium flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" /> {new Date(order.created_at).toLocaleString()}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${order.tipo_entrega === 'delivery' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-50 text-gray-700 border-gray-100'}`}>
                          {order.tipo_entrega === 'delivery' ? '🛵 Delivery' : '🏪 Recojo'}
                        </span>
                    </div>

                    <div className="flex justify-between items-end pl-2 pt-2 border-t border-gray-100/50">
                        <div className="text-xs text-gray-500 font-medium">
                          <span className="bg-gray-100 px-2 py-1 rounded-md text-gray-700">{order.items.length} items</span>
                        </div>
                        <div className="text-xl font-black text-gray-900">
                          S/ {order.total.toFixed(2)}
                        </div>
                    </div>
                  </motion.div>
                ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {/* --- VISTA INVENTARIO --- */}
        {activeTab === 'inventario' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Formulario Productos (Agregar o Editar) */}
            <div className="lg:col-span-1" ref={formTopRef}>
              <div className={`bg-white p-6 rounded-2xl shadow-sm border sticky top-24 transition-colors ${editingId ? 'border-orange-300 ring-2 ring-orange-100' : 'border-gray-100'}`}>
                
                {/* Header del Formulario */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-black flex items-center gap-2">
                        {editingId ? <Pencil className="w-5 h-5 text-orange-600"/> : <Plus className="w-5 h-5 text-orange-500"/>} 
                        {editingId ? "Editar Producto" : "Agregar Producto"}
                    </h2>
                    {editingId && (
                        <button onClick={resetForm} className="text-xs text-red-500 font-bold flex items-center gap-1 hover:underline">
                            <XCircle className="w-4 h-4"/> Cancelar
                        </button>
                    )}
                </div>

                <form onSubmit={handleSaveProduct} className="space-y-4">
                  <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-gray-400">Nombre</label>
                      <input type="text" value={newProduct.nombre} onChange={e => setNewProduct({...newProduct, nombre: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-gray-400">Precio Normal</label>
                        <input type="number" step="0.10" value={newProduct.precio} onChange={e => setNewProduct({...newProduct, precio: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-gray-400">Stock</label>
                        <input type="number" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium" />
                    </div>
                  </div>
                  
                  {/* CONFIGURACIÓN DE OFERTA DINÁMICA */}
                  <div className={`border rounded-xl p-4 transition-all ${newProduct.oferta_activa ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex items-center justify-between mb-2">
                        <label className="flex items-center gap-2 text-xs font-bold uppercase text-gray-600 cursor-pointer select-none">
                            <Zap className={`w-4 h-4 ${newProduct.oferta_activa ? 'text-orange-500 fill-orange-500' : 'text-gray-400'}`} />
                            Precio por Horario
                        </label>
                        <div 
                            onClick={() => setNewProduct({...newProduct, oferta_activa: !newProduct.oferta_activa})}
                            className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${newProduct.oferta_activa ? 'bg-orange-500' : 'bg-gray-300'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${newProduct.oferta_activa ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                    </div>
                    
                    {newProduct.oferta_activa && (
                        <motion.div initial={{opacity: 0, height: 0}} animate={{opacity: 1, height: 'auto'}} className="space-y-3 pt-2">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-orange-600">Precio Oferta</label>
                                <input type="number" step="0.10" placeholder="Ej: 1.00" value={newProduct.precio_oferta} onChange={e => setNewProduct({...newProduct, precio_oferta: e.target.value})} className="w-full p-2 bg-white border border-orange-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 text-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1"><Timer className="w-3 h-3"/> Inicio</label>
                                    <input type="time" value={newProduct.hora_inicio} onChange={e => setNewProduct({...newProduct, hora_inicio: e.target.value})} className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-1"><Timer className="w-3 h-3"/> Fin</label>
                                    <input type="time" value={newProduct.hora_fin} onChange={e => setNewProduct({...newProduct, hora_fin: e.target.value})} className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs" />
                                </div>
                            </div>
                            <p className="text-[10px] text-orange-600 italic leading-tight">
                                * El producto costará S/ {newProduct.precio_oferta || '0.00'} entre las {newProduct.hora_inicio} y {newProduct.hora_fin}.
                            </p>
                        </motion.div>
                    )}
                  </div>

                  <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-gray-400">Categoría</label>
                      <select value={newProduct.categoria} onChange={e => setNewProduct({...newProduct, categoria: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-medium">
                         <option value="">Seleccionar...</option>
                         {CATEGORIAS.map(cat => (
                             <option key={cat} value={cat}>{cat}</option>
                         ))}
                      </select>
                  </div>

                  <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-200 p-6 rounded-xl text-center cursor-pointer hover:bg-orange-50 hover:border-orange-200 transition-all group">
                      {uploadingImage ? <Loader2 className="animate-spin mx-auto text-orange-500"/> : (newProduct.imagen_url ? <img src={newProduct.imagen_url} className="h-24 w-full object-contain rounded-lg"/> : <div className="text-gray-400 text-sm font-medium group-hover:text-orange-500"><Upload className="w-6 h-6 mx-auto mb-2"/>Click para subir foto</div>)}
                  </div>
                  <input type="file" ref={fileInputRef} hidden onChange={handleImageUpload} />
                  
                  <button className={`w-full text-white font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-95 ${editingId ? 'bg-orange-600 hover:bg-orange-700' : 'bg-gray-900 hover:bg-gray-800'}`}>
                      {editingId ? "Actualizar Producto" : "Guardar Producto"}
                  </button>
                </form>
                
                {!editingId && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <p className="text-xs text-gray-400 font-bold mb-2 text-center">O IMPORTA MASIVAMENTE</p>
                        <div className="flex gap-2">
                          <button onClick={handleDownloadTemplate} className="flex-1 bg-gray-100 text-gray-600 border border-gray-200 font-bold py-3 rounded-xl flex justify-center gap-2 hover:bg-gray-200 transition-colors text-sm items-center">
                             <FileDown className="w-4 h-4"/> Plantilla
                          </button>
                          <button onClick={() => excelInputRef.current?.click()} className="flex-[2] bg-green-50 text-green-700 border border-green-200 font-bold py-3 rounded-xl flex justify-center gap-2 hover:bg-green-100 transition-colors text-sm items-center">
                             <FileSpreadsheet className="w-4 h-4"/> Subir Excel
                          </button>
                        </div>
                        <input type="file" ref={excelInputRef} hidden accept=".xlsx" onChange={handleExcelUpload} />
                    </div>
                )}
              </div>
            </div>

            {/* Lista Productos */}
            <div className="lg:col-span-2 space-y-4">
              <div className="relative">
                 <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400"/>
                 <input type="text" placeholder="Buscar producto..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl w-full text-sm focus:ring-2 focus:ring-orange-500 outline-none shadow-sm"/>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AnimatePresence>
                {products
                  .filter(p => p.nombre.toLowerCase().includes(productSearch.toLowerCase()))
                  .map(p => (
                  <motion.div key={p.id} layout initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className={`bg-white p-3 rounded-2xl border flex gap-4 relative group hover:shadow-md transition-all ${editingId === p.id ? 'border-orange-400 ring-2 ring-orange-100' : 'border-gray-100 hover:border-orange-200'}`}>
                      <div className="w-20 h-20 bg-gray-50 rounded-xl flex-shrink-0 relative overflow-hidden">
                         <img 
                            src={p.imagen_url} 
                            className="w-full h-full object-cover rounded-xl" 
                            onError={(e) => (e.target as HTMLImageElement).src = '/placeholder.png'} 
                         />
                         {p.oferta_activa && <div className="absolute -top-2 -left-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10">OFERTA</div>}
                      </div>
                      <div className="flex-1 py-1">
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-gray-900 line-clamp-1">{p.nombre}</h4>
                            {p.stock < 5 && <AlertTriangle className="w-4 h-4 text-red-500" />}
                          </div>
                          <p className="text-xs text-gray-500 font-medium mb-1">{p.categoria}</p>
                          
                          {/* PRECIO VISUALIZACIÓN */}
                          <div className="flex justify-between items-end mt-2">
                             <span className={`text-xs font-bold px-2 py-0.5 rounded ${p.stock < 5 ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>Stock: {p.stock}</span>
                             <div className="text-right">
                                {p.oferta_activa ? (
                                    <>
                                        <span className="block text-xs text-gray-400 line-through">S/ {p.precio.toFixed(2)}</span>
                                        <span className="font-black text-orange-600">S/ {p.precio_oferta?.toFixed(2)}</span>
                                    </>
                                ) : (
                                    <span className="font-black text-gray-900">S/ {p.precio.toFixed(2)}</span>
                                )}
                             </div>
                          </div>
                      </div>
                      
                      {/* BOTONES ACCIÓN */}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* BOTÓN BUSCAR IMAGEN GOOGLE */}
                          <button 
                            onClick={() => window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(p.nombre + ' producto peru')}`, '_blank')}
                            className="p-2 bg-white shadow-sm border border-gray-100 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" 
                            title="Buscar foto en Google"
                          >
                              <Search className="w-4 h-4"/>
                          </button>

                          <button onClick={() => handleEditClick(p)} className="p-2 bg-white shadow-sm border border-gray-100 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors" title="Editar">
                              <Pencil className="w-4 h-4"/>
                          </button>
                          <button onClick={() => handleDeleteProduct(p.id)} className="p-2 bg-white shadow-sm border border-gray-100 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Eliminar">
                              <Trash2 className="w-4 h-4"/>
                          </button>
                      </div>
                  </motion.div>
                ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- MODAL DETALLE PEDIDO --- */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
                
                <div className={`p-6 text-white flex justify-between items-start ${
                  selectedOrder.estado === 'pendiente' ? 'bg-gradient-to-r from-gray-900 to-gray-800' :
                  selectedOrder.estado === 'pagado' ? 'bg-gradient-to-r from-purple-600 to-indigo-600' :
                  'bg-gradient-to-r from-green-600 to-emerald-600'
                }`}>
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
                    
                    {/* DATOS CLIENTE & DIRECCIÓN */}
                    <div className="bg-gray-50 border border-gray-100 p-5 rounded-2xl mb-6 space-y-3">
                      <div className="flex items-start gap-3">
                          <div className="bg-white p-2 rounded-lg shadow-sm"><Eye className="w-4 h-4 text-gray-900"/></div>
                          <div>
                            <p className="text-xs text-gray-400 font-bold uppercase">Cliente</p>
                            <p className="font-bold text-gray-900">{selectedOrder.cliente_nombre}</p>
                          </div>
                      </div>
                      
                      {/* --- SECCIÓN DIRECCIÓN Y MAPA --- */}
                      <div className="flex items-start gap-3">
                          <div className="bg-white p-2 rounded-lg shadow-sm">
                              <MapPin className="w-4 h-4 text-gray-900"/>
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-400 font-bold uppercase">Dirección</p>
                            <p className="font-medium text-gray-700 text-sm break-words">
                                {selectedOrder.tipo_entrega === 'delivery' ? selectedOrder.direccion : 'Recojo en Tienda'}
                            </p>
                            
                            {/* BOTÓN MAPA: Solo si es delivery */}
                            {selectedOrder.tipo_entrega === 'delivery' && (
                                <button 
                                    onClick={() => handleOpenMap(selectedOrder.direccion)}
                                    className="mt-2 text-xs flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 transition-colors border border-blue-100"
                                >
                                    <Map className="w-3 h-3" /> Ver ubicación en Mapa <ExternalLink className="w-3 h-3"/>
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
                        <span className="text-gray-500 font-medium">Total a cobrar</span>
                        <span className="text-3xl font-black text-gray-900">S/ {selectedOrder.total.toFixed(2)}</span>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100">
                  {selectedOrder.estado === 'pendiente' && (
                    <div className="flex gap-3">
                      <button onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'cancelado')} className="flex-1 py-4 rounded-xl border-2 border-gray-200 font-bold text-gray-400 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all">Cancelar</button>
                      <button onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'pagado')} className="flex-[2] py-4 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 shadow-lg shadow-purple-200 flex items-center justify-center gap-2 transform active:scale-95 transition-all">
                          <Banknote className="w-5 h-5" /> Confirmar Pago Yape
                      </button>
                    </div>
                  )}

                  {selectedOrder.estado === 'pagado' && (
                    <button onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'atendido')} className="w-full py-4 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 shadow-lg shadow-green-200 flex items-center justify-center gap-2 transform active:scale-95 transition-all text-lg">
                        <CheckCircle2 className="w-6 h-6" /> 
                        {selectedOrder.tipo_entrega === 'delivery' ? 'Marcar como Enviado' : 'Marcar como Entregado'}
                    </button>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button 
                      onClick={() => handleDeleteOrder(selectedOrder.id)}
                      className="w-full py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 hover:shadow-md transition-all flex items-center justify-center gap-2 opacity-80 hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" /> Eliminar Pedido Definitivamente
                    </button>
                  </div>

                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}