import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Ticket, Calendar, ShieldCheck, Loader2, Info } from 'lucide-react';

export const Sell: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [eventId, setEventId] = useState('');
  const [section, setSection] = useState('');
  const [price, setPrice] = useState('');
  const [format, setFormat] = useState('pdf');

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  const fetchEvents = async () => {
    const { data } = await supabase.from('events').select('*').order('date', { ascending: true });
    if (data) setEvents(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId || !section || !price) return;
    
    setSubmitting(true);
    
    const { error } = await supabase
      .from('tickets')
      .insert([
        {
          event_id: eventId,
          seller_id: user?.id,
          section,
          price: parseFloat(price),
          format,
          status: 'disponible',
        }
      ]);

    if (!error) {
      navigate('/dashboard');
    } else {
      console.error(error);
      alert('Hubo un error al publicar la entrada.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex justify-center items-center bg-[#f8fafc]">
        <Loader2 className="w-10 h-10 animate-spin text-[#5144d4]" />
      </div>
    );
  }

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-20">
      <div className="bg-[#5144d4] text-white pt-8 md:pt-12 pb-12 md:pb-16 px-6 md:px-8 relative">
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <h1 className="text-2xl md:text-[2.5rem] font-black tracking-tight mb-3">Vender una entrada</h1>
          <p className="text-[#e2e8f0] text-sm md:text-base">Convierte esa entrada que no vas a usar en efectivo de forma segura con SafeTrust.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 md:px-8 -mt-8 relative z-20">
        <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-slate-100">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 mb-8">
            <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0" />
            <p className="text-sm text-blue-800 font-medium leading-relaxed">
              Tu publicación está protegida por SafeTicket. El comprador pagará a un fideicomiso y tú recibirás el dinero automáticamente cuando el evento termine exitosamente.
            </p>
          </div>

          <div className="space-y-6">
            {/* Event Selection */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Evento</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                <select 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-[#5144d4] outline-none appearance-none"
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  required
                >
                  <option value="" disabled>Selecciona el evento</option>
                  {events.map((ev: any) => (
                    <option key={ev.id} value={ev.id}>{ev.title} - {new Date(ev.date).toLocaleDateString()}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sector */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Sector / Ubicación</label>
                <div className="relative">
                  <Ticket className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ej. Campo VIP, Platea Alta"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-[#5144d4] outline-none"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                  />
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Precio de Venta ($ ARS)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:ring-2 focus:ring-[#5144d4] outline-none"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Format Selection */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Formato de la Entrada</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className={`cursor-pointer rounded-xl border flex flex-col p-4 transition-all ${format === 'pdf' ? 'border-[#5144d4] bg-[#5144d4]/5 ring-1 ring-[#5144d4]' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input type="radio" name="format" value="pdf" className="sr-only" checked={format === 'pdf'} onChange={(e) => setFormat(e.target.value)} />
                  <span className="font-bold text-sm text-slate-800 mb-1">E-Ticket (PDF)</span>
                  <span className="text-xs text-slate-500">Documento PDF con código QR o de barras.</span>
                </label>
                <label className={`cursor-pointer rounded-xl border flex flex-col p-4 transition-all ${format === 'app' ? 'border-[#5144d4] bg-[#5144d4]/5 ring-1 ring-[#5144d4]' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input type="radio" name="format" value="app" className="sr-only" checked={format === 'app'} onChange={(e) => setFormat(e.target.value)} />
                  <span className="font-bold text-sm text-slate-800 mb-1">Transferencia App</span>
                  <span className="text-xs text-slate-500">Tickets Wallet, Quentro o similar.</span>
                </label>
                <label className={`cursor-pointer rounded-xl border flex flex-col p-4 transition-all ${format === 'fisica' ? 'border-[#5144d4] bg-[#5144d4]/5 ring-1 ring-[#5144d4]' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input type="radio" name="format" value="fisica" className="sr-only" checked={format === 'fisica'} onChange={(e) => setFormat(e.target.value)} />
                  <span className="font-bold text-sm text-slate-800 mb-1">Física</span>
                  <span className="text-xs text-slate-500">Cartón o papel impreso original de boletería.</span>
                </label>
              </div>
            </div>

            {/* Terms */}
            <div className="pt-4 border-t border-slate-100 flex items-start gap-3">
              <Info className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-500 leading-relaxed">
                Al publicar tu entrada, aceptas nuestros <a href="#" className="underline">Términos de Garantía SafeTrust</a>. 
                Si la entrada resulta ser fraudulenta, tu cuenta será suspendida y el dinero regresará al comprador.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-md text-base font-bold text-white bg-[#5144d4] hover:bg-[#4338ca] focus:outline-none transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Publicar Entrada'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
