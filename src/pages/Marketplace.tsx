import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, MapPin, Filter, Loader2 } from 'lucide-react';

export const Marketplace: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('todos');
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [reputations, setReputations] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    const { data: ticketData, error } = await supabase
      .from('tickets')
      .select('*, events(*)')
      .eq('status', 'disponible')
      .order('created_at', { ascending: false });

    if (error || !ticketData) {
      setLoading(false);
      return;
    }

    setTickets(ticketData);

    // Fetch Seller data
    const sellerIds = [...new Set(ticketData.map((t: any) => t.seller_id))];
    if (sellerIds.length > 0) {
      const { data: profs } = await supabase.from('profiles').select('user_id, full_name, avatar_url').in('user_id', sellerIds);
      const { data: revs } = await supabase.from('reviews').select('seller_id, is_positive').in('seller_id', sellerIds);
      
      const newProfs: any = {};
      profs?.forEach(p => newProfs[p.user_id] = p);
      setProfiles(newProfs);

      const newRevs: any = {};
      revs?.forEach(r => {
        if (!newRevs[r.seller_id]) newRevs[r.seller_id] = { total: 0, pos: 0 };
        newRevs[r.seller_id].total++;
        if (r.is_positive) newRevs[r.seller_id].pos++;
      });
      setReputations(newRevs);
    }
    
    setLoading(false);
  };

  const filteredTickets = tickets.filter((t: any) => {
    const ev = t.events || {};
    const titleMatch = ev.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const eventMatch = searchTerm === '' || titleMatch;
    const formatMatch = selectedFormat === 'todos' || t.format === selectedFormat;
    
    return eventMatch && formatMatch;
  });

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-20">
      {/* Header section */}
      <div className="bg-[#5144d4] pt-8 md:pt-16 pb-20 md:pb-32 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <h1 className="text-3xl md:text-[3.5rem] font-black text-white mb-2 md:mb-4 tracking-tight drop-shadow-sm">Explorador Global</h1>
          <p className="text-sm md:text-xl text-[#e2e8f0] font-medium max-w-2xl mx-auto">Encontrá las entradas que buscás de forma rápida y 100% garantizada.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-8 -mt-8 relative z-20">
        {/* Controles de Filtro */}
        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-100 flex flex-col md:flex-row gap-4 mb-8">
          {/* Searching */}
          <div className="flex-1 relative flex items-center bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 focus-within:border-[#5144d4] focus-within:ring-1 focus-within:ring-[#5144d4] transition-all">
            <Search className="text-slate-400 w-5 h-5 mr-3" />
            <input 
              type="text" 
              placeholder="Buscar artista o evento..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-none p-0 focus:ring-0 text-[#0f172a] placeholder-slate-400 text-sm md:text-base font-medium outline-none"
            />
          </div>

          <div className="w-full md:w-64 relative flex items-center bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
            <Filter className="text-slate-400 w-5 h-5 mr-3" />
            <select 
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="w-full bg-transparent border-none p-0 focus:ring-0 text-[#0f172a] text-sm md:text-base font-medium outline-none appearance-none"
            >
              <option value="todos">Todos los formatos</option>
              <option value="pdf">Digital (PDF)</option>
              <option value="app">Transferencia App</option>
              <option value="fisica">Ticket Físico</option>
            </select>
          </div>
        </div>

        {/* Grilla de Entradas */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
          {loading ? (
            <div className="col-span-full py-20 flex justify-center text-[#5144d4]">
               <Loader2 className="w-10 h-10 animate-spin" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 font-medium bg-white rounded-2xl border border-slate-100 shadow-sm">
               No hay entradas disponibles que coincidan con tu búsqueda.
            </div>
          ) : (
            filteredTickets.map((t: any) => {
              const ev = t.events || {};
              const sProfile = profiles[t.seller_id] || { full_name: 'Anónimo' };
              const sRep = reputations[t.seller_id];
              let repLabel = "NUEVO";
              let repColor = "text-slate-500";
              if (sRep && sRep.total > 0) {
                const pct = Math.round((sRep.pos / sRep.total) * 100);
                repLabel = pct + "%";
                repColor = pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-500' : 'text-red-500';
              }

              return (
                <a key={t.id} href={`/order?ticket_id=${t.id}`} className="bg-white rounded-[16px] md:rounded-[20px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-[0_12px_40px_rgba(26,28,31,0.08)] transition-all flex flex-col group block">
                  <div className="h-24 md:h-32 bg-slate-200 relative overflow-hidden shrink-0">
                    <img src={ev.image_url || 'https://images.unsplash.com/photo-1540039155732-d6749b9325eb?w=800'} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="absolute top-2 right-2 md:top-3 md:right-3 bg-black/60 backdrop-blur-md text-white px-1.5 py-0.5 md:px-2 md:py-1 flex items-center gap-1 rounded-md md:rounded-lg text-[9px] md:text-xs font-bold shadow-sm tracking-wide">
                      {t.format.toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="p-3 md:p-5 flex-1 flex flex-col">
                    <div className="text-[#5144d4] text-[9px] md:text-[11px] font-black uppercase tracking-widest mb-1 md:mb-1.5">{new Date(ev.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                    <h3 className="font-bold text-[#0f172a] text-[13px] md:text-lg leading-tight mb-1 md:mb-2 line-clamp-2">{ev.title}</h3>
                    <div className="flex items-center gap-1 md:gap-1.5 text-[10px] md:text-sm text-slate-500 font-medium mb-2 md:mb-4 line-clamp-1">
                      <MapPin className="w-3 h-3 md:w-4 md:h-4 shrink-0" /> <span className="truncate">{ev.location}</span>
                    </div>
                    
                    <div className="mt-auto bg-slate-50/80 rounded-lg md:rounded-xl p-2.5 md:p-4 border border-slate-200/60">
                      <div className="flex flex-col xl:flex-row xl:justify-between items-start xl:items-center mb-1.5 md:mb-2 gap-1 xl:gap-0">
                        <span className="text-[9px] md:text-[12px] text-slate-500 font-semibold uppercase tracking-widest line-clamp-1">Sec: {t.section}</span>
                        <span className="font-black text-[#5144d4] text-sm md:text-xl leading-none">${Number(t.price).toLocaleString('es-AR')}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 md:pt-3 border-t border-slate-200/50">
                        <span className="text-[10px] md:text-[13px] font-medium text-slate-600 flex items-center gap-1 md:gap-2">
                          <span className="w-4 h-4 md:w-6 md:h-6 rounded-full bg-slate-300 overflow-hidden shrink-0">
                            {sProfile.avatar_url && <img src={sProfile.avatar_url} className="w-full h-full object-cover" />}
                          </span>
                          <span className="truncate max-w-[50px] md:max-w-[80px]">{sProfile.full_name.split(' ')[0]}</span>
                        </span>
                        <span className={`text-[9px] md:text-[11px] font-bold ${repColor} bg-slate-100 px-1 py-0.5 md:px-1.5 md:py-0.5 rounded-sm md:rounded-md shrink-0`}>{repLabel}</span>
                      </div>
                    </div>
                  </div>
                </a>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
