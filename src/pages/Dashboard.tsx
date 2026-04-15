import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Ticket, ShieldCheck, PlusCircle, MessageCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'compras' | 'ventas'>('compras');
  
  const [purchases, setPurchases] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    
    // Fetch Purchases 
    const { data: purchaseData, error: purchaseErr } = await supabase
      .from('tickets')
      .select('*, events(*)')
      .eq('buyer_id', user?.id)
      .order('created_at', { ascending: false });

    if (!purchaseErr && purchaseData) {
      setPurchases(purchaseData);
    }

    // Fetch Sales
    const { data: saleData, error: saleErr } = await supabase
      .from('tickets')
      .select('*, events(*)')
      .eq('seller_id', user?.id)
      .order('created_at', { ascending: false });

    if (!saleErr && saleData) {
      setSales(saleData);
    }

    setLoading(false);
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-20">
      <div className="bg-[#5144d4] text-white pt-8 md:pt-12 pb-12 md:pb-16 px-6 md:px-8 relative">
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-[2.5rem] font-black tracking-tight mb-2">Mi Actividad</h1>
            <p className="text-[#e2e8f0] text-[13px] md:text-base max-w-xl">
              Tus entradas compradas y tickets publicados, todo en un solo lugar seguro.
            </p>
          </div>
          <Link to="/sell" className="bg-white text-[#5144d4] px-5 py-2.5 md:px-6 md:py-3 rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all text-sm md:text-base flex items-center justify-center gap-2 self-stretch md:self-auto text-center">
            <PlusCircle className="w-5 h-5" /> Vender Entrada
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-8 -mt-6 relative z-20">
        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-white rounded-2xl shadow-sm border border-slate-100 max-w-sm mb-8">
          <button 
            onClick={() => setActiveTab('compras')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'compras' ? 'bg-[#5144d4] text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
          >
            Mis Compras
          </button>
          <button 
            onClick={() => setActiveTab('ventas')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'ventas' ? 'bg-[#5144d4] text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
          >
            Mis Ventas
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center text-[#5144d4]">
            <Loader2 className="w-10 h-10 animate-spin" />
          </div>
        ) : activeTab === 'compras' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {purchases.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-100 flex flex-col items-center">
                <Ticket className="w-16 h-16 text-slate-200 mb-4" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">No tienes compras aún</h3>
                <p className="text-slate-500 mb-6">Explora el mercado para encontrar tu próximo evento.</p>
                <Link to="/marketplace" className="text-[#5144d4] font-bold hover:underline">Ver catálogo</Link>
              </div>
            ) : (
              purchases.map((ticket: any) => {
                const ev = ticket.events;
                if (!ev) return null;

                return (
                  <div key={ticket.id} className="bg-white rounded-[20px] overflow-hidden border border-slate-200 shadow-sm flex flex-col relative group">
                    <div className="p-5 flex-1 relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          (ticket.status === 'entregado' || ticket.status === 'liquidado') ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {(ticket.status === 'entregado' || ticket.status === 'liquidado') ? 'Transacción Finalizada' : 'Transferencia Pendiente'}
                        </span>
                        {(ticket.status === 'entregado' || ticket.status === 'liquidado') && <ShieldCheck className="w-6 h-6 text-emerald-500" />}
                      </div>
                      <h3 className="text-lg font-bold text-[#0f172a] mb-1 line-clamp-1">{ev.title}</h3>
                      <p className="text-sm text-slate-500 font-medium mb-4">{new Date(ev.date).toLocaleDateString()}</p>
                      
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-500">Formato</span>
                          <span className="font-bold uppercase">{ticket.format}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-500">Sector</span>
                          <span className="font-bold">{ticket.section}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Precio Nominal</span>
                          <span className="font-black text-[#5144d4]">${Number(ticket.price).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 border-t border-slate-100 p-4 relative z-10 flex gap-2">
                      <Link to={`/order?ticket_id=${ticket.id}`} className="flex-1 bg-white border border-[#5144d4] text-[#5144d4] py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-[#5144d4]/5 flex items-center justify-center gap-2 transition-colors">
                        <MessageCircle className="w-4 h-4" /> Seguimiento y Chat
                      </Link>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {sales.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-100 flex flex-col items-center">
                <Ticket className="w-16 h-16 text-slate-200 mb-4" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">No tienes entradas publicadas</h3>
                <p className="text-slate-500 mb-6">Recupera tu dinero vendiendo una entrada de forma segura.</p>
                <Link to="/sell" className="bg-[#5144d4] text-white px-6 py-2 rounded-full font-bold shadow hover:bg-[#4338ca]">Vender Entrada</Link>
              </div>
            ) : (
              sales.map((ticket: any) => {
                const ev = ticket.events;
                if (!ev) return null;

                return (
                  <div key={ticket.id} className="bg-white rounded-[20px] p-5 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${
                        ticket.status === 'disponible' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {ticket.status}
                      </span>
                      <span className="font-black text-lg">${Number(ticket.price).toLocaleString()}</span>
                    </div>
                    <h3 className="font-bold text-[#0f172a] truncate mb-1">{ev.title}</h3>
                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-4">{ticket.section}</p>
                    
                    <div className="pt-3 border-t border-slate-100 flex gap-2">
                      {ticket.status === 'disponible' ? (
                        <button className="flex-1 bg-red-50 text-red-600 font-semibold py-2 rounded-xl text-xs hover:bg-red-100 transition-colors flex justify-center items-center gap-1"><AlertCircle className="w-3.5 h-3.5"/> Eliminar Listado</button>
                      ) : (
                        <Link to={`/order?ticket_id=${ticket.id}`} className="flex-1 bg-[#5144d4] text-white font-semibold py-2 rounded-xl text-xs hover:bg-[#4338ca] transition-colors flex justify-center items-center gap-1">
                          <MessageCircle className="w-3.5 h-3.5"/> Coordinar con Comprador
                        </Link>
                      )}
                    </div>
                  </div>
                 )
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
