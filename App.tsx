
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Vendor, AppView, UserProfile, Product, InAppMessage } from './types';
import { MOCK_VENDORS } from './constants';
import Layout from './components/Layout';
import { 
  getAIVendorInsight, 
  getAISmartSearch, 
  generateAIDescription,
  getDailySellerTip,
  processVendorClaim
} from './services/geminiService';

const STORAGE_KEYS = {
  USER: 'feria_digital_user',
  LAST_CATEGORY: 'feria_digital_last_cat'
};

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [view, setView] = useState<AppView>(() => {
    const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (!savedUser) return 'login';
    const parsedUser: UserProfile = JSON.parse(savedUser);
    return parsedUser.role === 'vendedor' ? 'vendor-dashboard' : 'directory';
  });

  const [activeCategory, setActiveCategory] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.LAST_CATEGORY) || 'Todas';
  });

  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>(MOCK_VENDORS);
  
  // AI States
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimText, setClaimText] = useState('');
  const [claimResponse, setClaimResponse] = useState<string | null>(null);

  // Vendor Panel States
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [showStallQR, setShowStallQR] = useState(false);
  const [newProductData, setNewProductData] = useState({ name: '', description: '', price: '', image: '' });
  const [activeDashboardTab, setActiveDashboardTab] = useState<'resumen' | 'productos' | 'mensajes'>('resumen');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [regRole, setRegRole] = useState<'cliente' | 'vendedor'>('cliente');
  const [regData, setRegData] = useState({ name: '', dni: '', phone: '', sector: '' });

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LAST_CATEGORY, activeCategory);
  }, [activeCategory]);

  const dynamicCategories = useMemo(() => {
    const cats = new Set<string>(['Todas']);
    vendors.filter(v => v.isActiveToday).forEach(v => {
      if (v.products.length > 0) cats.add(v.category);
    });
    return Array.from(cats);
  }, [vendors]);

  const currentVendor = useMemo(() => {
    if (!user || user.role !== 'vendedor' || !user.vendorId) return null;
    return vendors.find(v => v.id === user.vendorId) || null;
  }, [user, vendors]);

  const averageRating = useMemo(() => {
    if (!currentVendor || currentVendor.reviews.length === 0) return 0;
    const total = currentVendor.reviews.reduce((acc, rev) => acc + rev.rating, 0);
    return (total / currentVendor.reviews.length).toFixed(1);
  }, [currentVendor]);

  const activeVendorsList = useMemo(() => {
    let list = vendors.filter(v => v.isActiveToday);
    if (activeCategory !== 'Todas') {
      list = list.filter(v => v.category === activeCategory);
    }
    return list;
  }, [vendors, activeCategory]);

  const savedVendors = useMemo(() => {
    return vendors.filter(v => user?.savedVendorIds.includes(v.id));
  }, [vendors, user]);

  // Funciones de Cámara
  useEffect(() => {
    if (view === 'scanner') startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [view]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) { console.error(err); }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
    }
  };

  const simulateScan = (vendorId: string) => {
    const found = vendors.find(v => v.id === vendorId);
    if (found && user) {
      if (!user.savedVendorIds.includes(vendorId)) {
        setUser({ ...user, savedVendorIds: [...user.savedVendorIds, vendorId] });
      }
      setSelectedVendor(found);
      setView('vendor');
    }
  };

  const handleMagicDesc = async () => {
    if (!newProductData.name) return alert("Escribí el nombre del producto primero.");
    setIsGeneratingDesc(true);
    const result = await generateAIDescription(newProductData.name);
    setNewProductData(prev => ({ 
      ...prev, 
      description: result.description, 
      price: result.suggestedPrice.toString() 
    }));
    setIsGeneratingDesc(false);
  };

  const handleAddProduct = () => {
    if (!newProductData.name || !newProductData.price) return alert("Faltan datos.");
    const product: Product = {
      id: 'p-' + Date.now(),
      name: newProductData.name,
      description: newProductData.description,
      price: parseFloat(newProductData.price),
      image: newProductData.image || 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400'
    };
    setVendors(prev => prev.map(v => v.id === user?.vendorId ? { ...v, products: [product, ...v.products] } : v));
    setIsAddingProduct(false);
    setNewProductData({ name: '', description: '', price: '', image: '' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewProductData(prev => ({ ...prev, image: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleRegister = () => {
    if (!regData.name || !regData.dni) return alert("Completa los campos.");
    const newUser: UserProfile = {
      id: 'u-' + Date.now(), name: regData.name, lastName: '', email: '', role: regRole, dni: regData.dni, phone: regData.phone, vendorId: regRole === 'vendedor' ? 'v-new' : undefined, savedVendorIds: []
    };
    if (regRole === 'vendedor') {
      setVendors([...vendors, {
        id: 'v-new', name: regData.name, puestoNumber: 'P-00', sector: regData.sector, category: 'Otros', description: 'Nuevo puesto', image: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400', schedule: 'Sábados', phone: regData.phone, whatsapp: regData.phone, isActiveToday: true, acceptsCash: true, acceptsTransfer: true, salesCount: 0, viewCount: 0, favoritedCount: 0, products: [], reviews: [], messages: []
      }]);
    }
    setUser(newUser);
    setView(regRole === 'cliente' ? 'directory' : 'vendor-dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
    setView('login');
  };

  // Renderizados Condicionales de Vistas
  if (view === 'login') return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20"><div className="absolute -top-24 -left-24 w-96 h-96 bg-orange-500 rounded-full blur-[120px]"></div></div>
      <div className="bg-white/10 backdrop-blur-3xl w-full max-w-sm rounded-[3rem] p-10 shadow-2xl border border-white/10 z-10 animate-in fade-in duration-700">
        <div className="text-center mb-10">
          <div className="bg-orange-500 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl mb-6">
            <svg className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <h1 className="text-4xl font-black text-white brand tracking-tighter">Feria Digital</h1>
          <p className="text-slate-400 text-[10px] uppercase font-bold tracking-[0.3em] mt-3">IA del Barrio</p>
        </div>
        <div className="space-y-4">
          <button onClick={() => { setRegRole('cliente'); setView('register'); }} className="w-full bg-white text-slate-900 p-5 rounded-2xl font-black text-lg active:scale-95 transition-all">Soy Cliente</button>
          <button onClick={() => { setRegRole('vendedor'); setView('register'); }} className="w-full bg-white/5 border-2 border-white/10 text-white p-5 rounded-2xl font-bold active:scale-95 transition-all">Soy Feriante</button>
        </div>
      </div>
    </div>
  );

  if (view === 'register') return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl border border-slate-100">
        <h2 className="text-3xl font-black text-slate-800 tracking-tight text-center mb-8">Unite al barrio</h2>
        <div className="space-y-4">
          <input type="text" placeholder="Nombre completo" className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-medium" onChange={e => setRegData({...regData, name: e.target.value})} />
          <input type="text" placeholder="DNI" className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-medium" onChange={e => setRegData({...regData, dni: e.target.value})} />
          <input type="tel" placeholder="WhatsApp" className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-medium" onChange={e => setRegData({...regData, phone: e.target.value})} />
          {regRole === 'vendedor' && <input type="text" placeholder="Sector o Pasillo" className="w-full bg-orange-50 p-5 rounded-2xl outline-none font-bold" onChange={e => setRegData({...regData, sector: e.target.value})} />}
        </div>
        <button onClick={handleRegister} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black mt-8 shadow-xl active:scale-95 transition-all">Empezar</button>
      </div>
    </div>
  );

  return (
    <Layout activeView={view} setActiveView={setView} userRole={user?.role} userName={user?.name}>
      {view === 'directory' && (
        <div className="space-y-8 pb-10">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Tu Mercado <br/><span className="text-orange-500">en la palma.</span></h2>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-5 px-5">
            {dynamicCategories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap shadow-sm border ${activeCategory === cat ? 'bg-slate-900 text-white border-slate-900 scale-105' : 'bg-white text-slate-400 border-slate-100 hover:border-orange-200'}`}>{cat}</button>
            ))}
          </div>
          {savedVendors.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Tus Favoritos</h3>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {savedVendors.map(vendor => (
                  <div key={vendor.id} onClick={() => { setSelectedVendor(vendor); setView('vendor'); }} className="flex-shrink-0 w-20 text-center space-y-2 cursor-pointer">
                    <img src={vendor.image} className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg mx-auto" />
                    <p className="text-[9px] font-bold text-slate-700 line-clamp-1">{vendor.name}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
          <section className="grid gap-8">
            {activeVendorsList.map(vendor => (
              <div key={vendor.id} onClick={() => { setSelectedVendor(vendor); setView('vendor'); }} className="relative bg-white rounded-[3rem] overflow-hidden shadow-2xl border border-slate-100 group cursor-pointer active:scale-[0.98] transition-all">
                <div className="h-48 relative">
                  <img src={vendor.image} className="w-full h-full object-cover" />
                  <div className="absolute bottom-4 left-6">
                    <span className="bg-orange-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase">{vendor.category}</span>
                    <h3 className="text-2xl font-black text-white tracking-tight">{vendor.name}</h3>
                  </div>
                </div>
                <div className="p-6 flex justify-between items-center">
                  <p className="text-xs text-slate-400 font-medium">{vendor.description}</p>
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-orange-500"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7-7 7" /></svg></div>
                </div>
              </div>
            ))}
          </section>
        </div>
      )}

      {view === 'vendor-dashboard' && currentVendor && (
        <div className="space-y-8 pb-20">
          <div className="bg-slate-900 -mx-5 -mt-5 p-10 rounded-b-[4rem] text-white">
            <h2 className="text-2xl font-black tracking-tight">Panel de Gestión</h2>
            <div className="flex gap-2 mt-6 bg-white/5 p-2 rounded-3xl">
              <button onClick={() => setActiveDashboardTab('resumen')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeDashboardTab === 'resumen' ? 'bg-orange-500 text-white' : 'text-slate-400'}`}>Resumen</button>
              <button onClick={() => setActiveDashboardTab('productos')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeDashboardTab === 'productos' ? 'bg-orange-500 text-white' : 'text-slate-400'}`}>Productos</button>
              <button onClick={() => setActiveDashboardTab('mensajes')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeDashboardTab === 'mensajes' ? 'bg-orange-500 text-white' : 'text-slate-400'}`}>Mensajes</button>
            </div>
          </div>

          {activeDashboardTab === 'resumen' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Ventas</span>
                  <p className="text-3xl font-black text-slate-800">{currentVendor.salesCount}</p>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Favoritos</span>
                  <p className="text-3xl font-black text-slate-800">{currentVendor.favoritedCount}</p>
                </div>
              </div>

              {/* Sección QR del Puesto */}
              <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl space-y-6 text-center">
                 <div className="bg-orange-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                 </div>
                 <div className="space-y-2">
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Tu Identidad Digital</h3>
                    <p className="text-slate-400 text-xs px-4">Mostrá este código a tus clientes para que te guarden en su celular y vean tus ofertas siempre.</p>
                 </div>
                 
                 {!showStallQR ? (
                    <button 
                      onClick={() => setShowStallQR(true)}
                      className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] active:scale-95 transition-all"
                    >
                      Generar QR de Mi Puesto
                    </button>
                 ) : (
                    <div className="animate-in zoom-in duration-300">
                       <div className="bg-slate-50 p-6 rounded-[2.5rem] inline-block border-4 border-white shadow-inner mb-4">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${currentVendor.id}`} 
                            alt="Vendor QR" 
                            className="w-48 h-48 mix-blend-multiply"
                          />
                       </div>
                       <div className="flex gap-2">
                          <button onClick={() => setShowStallQR(false)} className="flex-1 bg-slate-100 py-4 rounded-2xl text-[10px] font-black uppercase text-slate-400">Ocultar</button>
                          <button className="flex-1 bg-orange-500 text-white py-4 rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-orange-100">Compartir</button>
                       </div>
                    </div>
                 )}
              </div>
            </div>
          )}

          {activeDashboardTab === 'productos' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <button onClick={() => setIsAddingProduct(true)} className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black text-lg shadow-xl shadow-slate-200 flex items-center justify-center gap-3 active:scale-95 transition-all">
                <span>+</span> Publicar Producto
              </button>

              <div className="grid gap-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Tu Catálogo</h3>
                {currentVendor.products.map(p => (
                  <div key={p.id} className="bg-white p-4 rounded-[2rem] border border-slate-100 flex items-center gap-4 shadow-sm">
                    <img src={p.image} className="w-16 h-16 rounded-2xl object-cover" />
                    <div className="flex-grow">
                      <h4 className="font-bold text-slate-800 leading-tight">{p.name}</h4>
                      <p className="text-orange-500 font-black">${p.price}</p>
                    </div>
                    <button className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeDashboardTab === 'mensajes' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {currentVendor.messages.length > 0 ? (
                currentVendor.messages.map(m => (
                  <div key={m.id} className={`p-6 rounded-[2.5rem] border-2 shadow-sm ${m.type === 'claim' ? 'bg-orange-50 border-orange-100' : 'bg-white border-slate-50'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-black text-slate-800">{m.customerName}</span>
                      <span className="text-[9px] font-black uppercase bg-slate-200 px-2 py-1 rounded-full">{m.type}</span>
                    </div>
                    <p className="text-sm text-slate-600 font-medium">{m.content}</p>
                  </div>
                ))
              ) : (
                <div className="bg-white p-10 rounded-[3rem] text-center border-2 border-dashed border-slate-100"><p className="text-slate-400 font-bold text-sm italic">Sin mensajes hoy.</p></div>
              )}
            </div>
          )}

          <button onClick={handleLogout} className="w-full bg-slate-100 py-6 rounded-2xl font-black text-slate-400 mt-10">Cerrar Sesión</button>
        </div>
      )}

      {/* Modal de Nuevo Producto */}
      {isAddingProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 space-y-6 shadow-2xl animate-in slide-in-from-bottom-full duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Nuevo Producto</h2>
              <button onClick={() => setIsAddingProduct(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold">✕</button>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <input type="text" placeholder="Nombre (ej: Miel pura)" className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-bold" value={newProductData.name} onChange={e => setNewProductData({...newProductData, name: e.target.value})} />
                <button onClick={handleMagicDesc} disabled={isGeneratingDesc} className={`absolute right-3 top-3 px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${isGeneratingDesc ? 'bg-slate-200 text-slate-400 animate-pulse' : 'bg-orange-500 text-white shadow-lg'}`}>
                  {isGeneratingDesc ? 'Pensando...' : '✨ IA Mágica'}
                </button>
              </div>
              <textarea placeholder="Descripción del producto..." className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-medium h-32 resize-none" value={newProductData.description} onChange={e => setNewProductData({...newProductData, description: e.target.value})} />
              <div className="flex gap-4">
                <input type="number" placeholder="Precio ($)" className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-black text-orange-500" value={newProductData.price} onChange={e => setNewProductData({...newProductData, price: e.target.value})} />
                <button onClick={() => fileInputRef.current?.click()} className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-300 overflow-hidden">
                  {newProductData.image ? <img src={newProductData.image} className="w-full h-full object-cover" /> : <span className="text-2xl text-slate-400">📸</span>}
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              </div>
            </div>

            <button onClick={handleAddProduct} className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-lg active:scale-95 transition-all shadow-xl">Publicar Oferta</button>
          </div>
        </div>
      )}

      {view === 'vendor' && selectedVendor && (
         <div className="space-y-8 animate-in slide-in-from-bottom duration-500 pb-20">
            <div className="relative h-64 -mx-5 -mt-5">
              <img src={selectedVendor.image} className="w-full h-full object-cover" />
              <button onClick={() => setView('directory')} className="absolute top-8 left-8 w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white">✕</button>
            </div>
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-slate-800">{selectedVendor.name}</h2>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{selectedVendor.category} • {selectedVendor.sector}</p>
            </div>
            <div className="flex gap-4">
               <button onClick={() => window.open(`https://wa.me/${selectedVendor.whatsapp}`)} className="flex-1 bg-green-500 text-white p-5 rounded-[2rem] font-black shadow-lg">WhatsApp</button>
               <button onClick={() => { setView('claims'); setClaimResponse(null); }} className="flex-1 bg-slate-100 text-slate-800 p-5 rounded-[2rem] font-black">Mediador IA</button>
            </div>
            <div className="grid gap-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Ofertas del día</h3>
              {selectedVendor.products.map(p => (
                <div key={p.id} className="bg-white p-5 rounded-[2.5rem] flex items-center gap-6 border border-slate-50 shadow-sm">
                  <img src={p.image} className="w-20 h-20 rounded-2xl object-cover" />
                  <div className="flex-grow">
                     <h4 className="font-bold text-slate-800">{p.name}</h4>
                     <p className="text-orange-500 font-black text-lg">${p.price}</p>
                  </div>
                </div>
              ))}
            </div>
         </div>
      )}

      {view === 'scanner' && (
        <div className="h-full flex flex-col items-center justify-center p-6 space-y-10">
          <div className="relative w-full max-w-sm aspect-square bg-black rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-64 border-2 border-orange-500/50 rounded-3xl animate-pulse flex items-center justify-center"><div className="w-full h-0.5 bg-orange-500 animate-[bounce_2s_infinite]"></div></div>
            </div>
          </div>
          <div className="text-center space-y-4">
             <h3 className="text-2xl font-black text-slate-800 tracking-tight">Escaneá el QR</h3>
             <p className="text-slate-400 text-sm">Apuntá al código del feriante para guardarlo en tus favoritos.</p>
             <div className="flex gap-2 justify-center">
                <button onClick={() => simulateScan('v1')} className="bg-slate-100 p-3 rounded-xl text-[10px] font-bold uppercase">Simular Scan: Rosa</button>
                <button onClick={() => simulateScan('v2')} className="bg-slate-100 p-3 rounded-xl text-[10px] font-bold uppercase">Simular Scan: Juan</button>
             </div>
          </div>
        </div>
      )}

      {view === 'claims' && selectedVendor && (
        <div className="space-y-8">
           <div className="flex items-center gap-4">
             <button onClick={() => setView('vendor')} className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">←</button>
             <h2 className="text-2xl font-black tracking-tight">Mediador IA</h2>
           </div>
           <div className="bg-orange-50 p-6 rounded-[2.5rem] border border-orange-100"><p className="text-sm font-medium text-slate-700 italic">"Hola, contame qué pasó con el puesto {selectedVendor.name} y yo me encargo de procesarlo con respeto."</p></div>
           <textarea placeholder="Escribí tu descargo aquí..." className="w-full bg-white p-6 rounded-[2rem] h-40 shadow-xl outline-none" value={claimText} onChange={e => setClaimText(e.target.value)} />
           <button onClick={async () => {
              setIsClaiming(true);
              const res = await processVendorClaim(claimText, selectedVendor.name);
              setClaimResponse(res.response);
              setIsClaiming(false);
           }} disabled={isClaiming || !claimText} className={`w-full py-6 rounded-[2rem] font-black text-lg shadow-xl ${isClaiming ? 'bg-slate-200' : 'bg-slate-900 text-white'}`}>
             {isClaiming ? 'Analizando...' : 'Enviar Descargo'}
           </button>
           {claimResponse && <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl border border-green-100 animate-in zoom-in"><p className="font-bold text-slate-800">"{claimResponse}"</p></div>}
        </div>
      )}
    </Layout>
  );
};

export default App;
