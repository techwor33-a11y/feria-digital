
import React from 'react';
import { AppView } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  userRole?: 'cliente' | 'vendedor';
  userName?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setActiveView, userRole, userName }) => {
  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-slate-50 shadow-2xl relative overflow-x-hidden font-sans border-x border-gray-100">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100 p-4 flex justify-between items-center">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveView(userRole === 'vendedor' ? 'vendor-dashboard' : 'directory')}>
          <div className="bg-orange-500 p-2 rounded-2xl shadow-lg shadow-orange-200 group-active:scale-90 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.378 1.602a.75.75 0 00-.756 0L3 6.632l9 5.25 9-5.25-8.622-5.03zM21.75 7.93l-9 5.25v9l8.622-5.03a.75.75 0 00.378-.648V7.93zM11.25 22.18v-9l-9-5.25v8.57a.75.75 0 00.378.648l8.622 5.03z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold brand tracking-tight text-slate-800 leading-none">Feria Digital</h1>
            <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Conectando Barrios</span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
          <div className="w-7 h-7 bg-white rounded-xl flex items-center justify-center shadow-sm">
             <span className="text-[10px] font-bold text-slate-400">{userName?.charAt(0) || 'U'}</span>
          </div>
          <span className="text-[9px] font-bold text-slate-500 pr-2 uppercase">{userRole}</span>
        </div>
      </header>

      <main className="flex-grow p-5 pb-28 overflow-y-auto scroll-smooth">
        {children}
      </main>

      <nav className="fixed bottom-6 left-4 right-4 max-w-[calc(512px-2rem)] mx-auto bg-slate-900/95 backdrop-blur-lg rounded-[2rem] shadow-2xl flex justify-around items-center p-3 z-50 border border-white/10">
        {userRole === 'cliente' ? (
          <>
            <button onClick={() => setActiveView('directory')} className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${activeView === 'directory' ? 'text-orange-500 scale-110' : 'text-slate-400'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activeView === 'directory' ? 2.5 : 2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              <span className="text-[8px] font-bold uppercase tracking-widest">Explorar</span>
            </button>
            <button onClick={() => setActiveView('scanner')} className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${activeView === 'scanner' ? 'text-orange-500 scale-110' : 'text-slate-400'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activeView === 'scanner' ? 2.5 : 2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
              <span className="text-[8px] font-bold uppercase tracking-widest">Escanear</span>
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setActiveView('vendor-dashboard')} className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${activeView === 'vendor-dashboard' ? 'text-orange-500 scale-110' : 'text-slate-400'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activeView === 'vendor-dashboard' ? 2.5 : 2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className="text-[8px] font-bold uppercase tracking-widest">Mi Puesto</span>
            </button>
            <button onClick={() => setActiveView('scanner')} className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all ${activeView === 'scanner' ? 'text-orange-500 scale-110' : 'text-slate-400'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activeView === 'scanner' ? 2.5 : 2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span className="text-[8px] font-bold uppercase tracking-widest">Cámara</span>
            </button>
          </>
        )}
      </nav>
    </div>
  );
};

export default Layout;
