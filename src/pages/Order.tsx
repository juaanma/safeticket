import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  ShieldCheck, AlertCircle, ArrowLeft, Loader2, Info, Banknote,
  CheckCircle, MessageCircle, Send, Copy, ThumbsUp, ThumbsDown, Star
} from 'lucide-react';

export const Order: React.FC = () => {
  const [searchParams] = useSearchParams();
  const ticketId = searchParams.get('ticket_id');
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Base Data States
  const [ticket, setTicket] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [sellerReviews, setSellerReviews] = useState({ total: 0, pos: 0, neg: 0 });
  const [loading, setLoading] = useState(true);

  // View States
  const [viewState, setViewState] = useState<'CHECKOUT' | 'HUB'>('CHECKOUT');
  const [hubTab, setHubTab] = useState<'STATUS' | 'CHAT'>('STATUS');

  // Checkout Specific
  const [checkoutStep, setCheckoutStep] = useState<1|2|3>(1);
  const [timer, setTimer] = useState(600);
  const [buying, setBuying] = useState(false);

  // Hub Specific
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [confirmingReceipt, setConfirmingReceipt] = useState(false);

  // Review states
  const [existingReview, setExistingReview] = useState<any>(null);
  const [reviewType, setReviewType] = useState<boolean | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!ticketId) {
      navigate('/marketplace');
      return;
    }
    fetchOrderData();
  }, [ticketId, user]);

  useEffect(() => {
    // Timer para checkout
    if (viewState === 'CHECKOUT' && checkoutStep < 3 && timer > 0) {
      const int = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(int);
    }
  }, [timer, viewState, checkoutStep]);

  useEffect(() => {
    if (viewState === 'HUB') {
      loadMessages();
      const channel = supabase.channel(`chat_room_${ticketId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `ticket_id=eq.${ticketId}` }, (payload) => {
          setMessages(prev => [...prev, payload.new]);
          scrollToBottom();
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [viewState, ticketId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const fetchOrderData = async () => {
    try {
      setLoading(true);
      const { data: ticketData, error } = await supabase
        .from('tickets')
        .select('*, events(*)')
        .eq('id', ticketId)
        .single();

      if (error || !ticketData) throw new Error('Entrada no encontrada');
      setTicket(ticketData);
      setEvent(ticketData.events);

      if (ticketData.status === 'disponible') {
        if (ticketData.seller_id === user?.id) {
          // El vendedor no puede comprar su propia entrada disponible
          navigate('/dashboard'); 
        } else {
          setViewState('CHECKOUT');
          // Fetch reputation
          const { data: sProfile } = await supabase.from('profiles').select('*').eq('user_id', ticketData.seller_id).single();
          if (sProfile) {
            setSellerProfile(sProfile);
            const { data: revs } = await supabase.from('reviews').select('is_positive').eq('seller_id', ticketData.seller_id);
            if (revs) {
              const pos = revs.filter((r: any) => r.is_positive).length;
              setSellerReviews({ total: revs.length, pos, neg: revs.length - pos });
            }
          }
        }
      } else {
        // En progreso o terminada -> HUD
        if (user?.id !== ticketData.seller_id && user?.id !== ticketData.buyer_id) {
          navigate('/marketplace'); // No es de él
          return;
        }
        setViewState('HUB');

        // Check if there is review
        if (ticketData.status === 'entregado' || ticketData.status === 'liquidado') {
          const { data: rev } = await supabase.from('reviews').select('*').eq('ticket_id', ticketId).single();
          if (rev) setExistingReview(rev);
        }

        // Fetch counterparty profile
        const counterId = user?.id === ticketData.seller_id ? ticketData.buyer_id : ticketData.seller_id;
        if (counterId) {
          const { data: cProfile } = await supabase.from('profiles').select('*').eq('user_id', counterId).single();
          if (cProfile) setSellerProfile(cProfile);
        }
      }

    } catch (err) {
      alert("Error al cargar la orden.");
      navigate('/marketplace');
    } finally {
      setLoading(false);
    }
  };

  // ----- CHECKOUT HANDLERS ----- //
  const formatTime = (s: number) => `${Math.floor(s/60).toString().padStart(2, '0')}:${(s%60).toString().padStart(2, '0')}`;
  
  const handleSimulatePayment = async () => {
    setBuying(true);
    try {
      const { error } = await supabase.from('tickets')
        .update({ status: 'vendido', buyer_id: user?.id })
        .eq('id', ticketId);
      
      if (error) throw error;
      
      setTimeout(() => {
        setCheckoutStep(3);
        setBuying(false);
      }, 2000);
    } catch (err) {
      alert("Error en sistema de cobros.");
      setBuying(false);
    }
  };

  const handleFinishCheckout = () => {
    window.location.reload(); // Recarga para levantar como HUB
  };

  // ----- HUB HANDLERS ----- //
  const loadMessages = async () => {
    const { data } = await supabase.from('messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
    if (data) {
      setMessages(data);
      scrollToBottom();
    }
  };

  const handleSendMessage = async (forcedText?: string) => {
    const textToSend = forcedText || chatInput.trim();
    if (!textToSend || !user) return;
    
    if (!forcedText) setChatInput('');
    
    await supabase.from('messages').insert([{
      ticket_id: ticketId,
      sender_id: user.id,
      content: textToSend
    }]);
  };

  const handleConfirmReceipt = async () => {
    if (!confirm('¿Estás seguro que tienes la entrada real y válida en tu poder? Tras confirmar esta acción, los fondos serán liberados al vendedor y no habrá reembolso.')) return;
    setConfirmingReceipt(true);
    
    const { error } = await supabase.from('tickets').update({ status: 'entregado' }).eq('id', ticketId);
    if (!error) {
       await supabase.from('messages').insert([{
        ticket_id: ticketId,
        sender_id: user?.id,
        content: '✅ [SISTEMA]: El comprador ha confirmado la recepción exitosa de la entrada. La orden se ha completado y los fondos proceden a liquidación.'
      }]);
      window.location.reload();
    } else {
      alert("Error al confirmar recepción.");
    }
    setConfirmingReceipt(false);
  };

  const handleSubmitReview = async () => {
    if (reviewType === null || !user) return;
    setSubmittingReview(true);
    const { error } = await supabase.from('reviews').insert([{
      ticket_id: ticketId,
      seller_id: ticket.seller_id,
      buyer_id: user.id,
      is_positive: reviewType,
      comment: reviewComment || null
    }]);
    if (!error) {
      fetchOrderData(); // Recarga para obtener la review
    } else {
      alert("Error al enviar calificación.");
    }
    setSubmittingReview(false);
  };

  const isSeller = user?.id === ticket?.seller_id;
  const isBuyer = user?.id === ticket?.buyer_id;

  if (loading) return <div className="min-h-screen flex justify-center items-center"><Loader2 className="w-10 h-10 animate-spin text-[#5144d4]" /></div>;
  if (!ticket || !event) return <div className="p-10 text-center">Datos no encontrados.</div>;

  const price = Number(ticket.price);
  const fee = price * 0.15;
  const total = price + fee;
  
  const initials = sellerProfile?.full_name ? sellerProfile.full_name.substring(0, 2).toUpperCase() : 'US';

  // ---------------- RENDERS ---------------- //

  if (viewState === 'CHECKOUT') {
    return (
      <div className="bg-[#f8fafc] min-h-[calc(100vh-80px)] pt-6 pb-20">
        <div className="max-w-[500px] mx-auto px-4 md:px-0">
          
          {checkoutStep === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-black text-[#1a1c1f]">Resumen de Compra</h2>
                <div className="bg-red-50 text-red-600 px-3 py-1.5 rounded-full font-bold text-sm flex items-center gap-1.5 border border-red-100">
                  <AlertCircle className="w-4 h-4" /> {formatTime(timer)}
                </div>
              </div>

              <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl flex items-start gap-3 mb-4 text-sm font-medium border border-emerald-200/50">
                <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                <p>Tu dinero estará retenido y protegido por SafeTicket hasta que confirmes la entrega de la entrada.</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5 shadow-sm">
                <h3 className="font-bold border-b border-slate-100 pb-2 mb-3 text-[15px]">Detalle de la Entrada</h3>
                
                <div className="flex justify-between text-[14px] mb-2"><span className="text-slate-500">Evento</span><span className="font-bold text-right pl-4">{event.title}</span></div>
                <div className="flex justify-between text-[14px] mb-2"><span className="text-slate-500">Sector</span><span className="font-bold">{ticket.section}</span></div>
                
                <div className="border-t border-dashed border-slate-200 mt-4 pt-4 mb-2 flex justify-between text-[14px]">
                  <span className="text-slate-500">Precio Nominal</span><span className="font-bold">${price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[14px] mb-4">
                  <span className="text-slate-500">Tarifa Servicio (15%)</span><span className="font-bold text-slate-500">${fee.toLocaleString()}</span>
                </div>
                
                <div className="border-t border-slate-200 pt-3 flex justify-between text-[17px] font-black text-[#1a1c1f]">
                  <span>Total a Pagar</span><span className="text-[#5144d4]">${total.toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100 p-4 mb-5">
                <h3 className="font-bold mb-3 text-[14px] text-slate-700">Vendedor Verificado</h3>
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-10 h-10 rounded-full bg-[#5144d4] text-white flex justify-center items-center font-bold relative shrink-0">
                    {sellerProfile?.avatar_url ? <img src={sellerProfile.avatar_url} className="w-full h-full rounded-full object-cover"/> : initials}
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 p-0.5 rounded-full border-2 border-white"><ShieldCheck className="w-3 h-3 text-white"/></div>
                   </div>
                   <div className="flex-1">
                      <div className="font-bold text-[#1a1c1f] text-[15px]">{sellerProfile?.full_name || 'Vendedor Anónimo'}</div>
                      <div className="text-[12px] font-semibold text-emerald-600">Identidad Validada por DNI</div>
                   </div>
                </div>

                <div className="flex justify-around text-center border-t border-indigo-100 pt-3">
                  <div>
                    <div className="font-black text-base text-[#1a1c1f] leading-none mb-1">{sellerReviews.total}</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Transac.</div>
                  </div>
                  <div className="w-[1px] bg-indigo-100"></div>
                  <div>
                    <div className="font-black text-base text-emerald-600 leading-none mb-1 flex justify-center items-center gap-1">{sellerReviews.pos} <ThumbsUp className="w-[12px] h-[12px]"/></div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Positivas</div>
                  </div>
                  <div className="w-[1px] bg-indigo-100"></div>
                  <div>
                    <div className="font-black text-base text-red-500 leading-none mb-1 flex justify-center items-center gap-1">{sellerReviews.neg} <ThumbsDown className="w-[12px] h-[12px]"/></div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Negativas</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-white border-2 border-[#5144d4] rounded-2xl p-4 mb-6 shadow-sm shadow-indigo-100 cursor-pointer">
                <Banknote className="w-8 h-8 text-[#5144d4]" />
                <div>
                  <div className="font-bold text-[#1a1c1f] text-[14px]">Transferencia / Billetera Virtual</div>
                  <div className="text-[12px] text-slate-500 font-medium mt-0.5">Sin límite temporal. Acreditación 100% inmediata.</div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => navigate(-1)} className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-3.5 rounded-xl hover:bg-slate-50 transition-colors">Cancelar</button>
                <button onClick={() => setCheckoutStep(2)} className="flex-[2] bg-[#5144d4] text-white font-bold py-3.5 rounded-xl hover:bg-[#4338ca] shadow-md shadow-indigo-500/20 active:translate-y-0.5 transition-all">Continuar a Pagar</button>
              </div>
            </div>
          )}

          {checkoutStep === 2 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <button onClick={() => setCheckoutStep(1)} className="text-slate-500 font-bold text-sm flex items-center gap-1 mb-5 hover:text-[#5144d4]"><ArrowLeft className="w-4 h-4"/> Volver</button>
              <h2 className="text-2xl font-black text-[#1a1c1f] mb-1">Paso final...</h2>
              <p className="text-sm text-slate-500 mb-6 font-medium">Para asegurar tus entradas, transfiere el monto exacto a la siguiente cuenta recaudadora bajo mandato (Escrow) de SafeTicket.</p>

              <div className="bg-emerald-50/50 border-2 border-emerald-500 rounded-2xl p-6 text-center mb-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-bl-lg">Cuenta Verificada</div>
                <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Monto exacto a transferir</div>
                <div className="text-4xl font-black text-[#1a1c1f] mb-2">${total.toLocaleString('es-AR')}</div>
                <div className="flex items-center justify-center gap-1.5 text-xs text-red-500 font-bold"><AlertCircle className="w-4 h-4"/> Si no transfieres los centavos, fallará la validación.</div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6">
                <div className="mb-4 pb-4 border-b border-slate-100">
                  <div className="text-[12px] text-slate-500 font-bold uppercase tracking-wider mb-1">Titular (Destinatario)</div>
                  <div className="font-bold text-[15px] text-[#1a1c1f]">FIDEICOMISO SAFE TICKET GLOBAL S.R.L.</div>
                  <div className="text-[12px] text-slate-500 mt-1">CUIT: 30-71459201-1</div>
                </div>
                <div>
                  <div className="text-[12px] text-slate-500 font-bold uppercase tracking-wider mb-2">CVU / ALIAS</div>
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                     <span className="font-mono font-bold text-[#1a1c1f] text-[15px]">0000168300000003661121</span>
                     <button className="text-[#5144d4] font-bold text-xs flex items-center gap-1 hover:bg-indigo-50 px-2 py-1.5 rounded-lg active:bg-indigo-100 transition-colors"><Copy className="w-4 h-4"/> Copiar</button>
                  </div>
                </div>
              </div>

              {buying ? (
                <div className="flex flex-col items-center justify-center py-6">
                   <Loader2 className="w-12 h-12 text-[#5144d4] animate-spin mb-3" />
                   <h3 className="font-bold text-[#1a1c1f] mb-1">Validando pago en la red...</h3>
                   <p className="text-xs text-slate-500 font-medium">Por favor, no cierres ni recargues esta ventana.</p>
                </div>
              ) : (
                <button onClick={handleSimulatePayment} className="w-full bg-[#5144d4] text-white font-bold py-4 rounded-xl hover:bg-[#4338ca] shadow-lg shadow-indigo-500/25 active:translate-y-0.5 transition-all text-[15px]">
                  Confirmar Transferencia
                </button>
              )}
            </div>
          )}

          {checkoutStep === 3 && (
            <div className="animate-in fade-in zoom-in duration-500 text-center py-8">
               <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30">
                 <CheckCircle className="w-12 h-12" />
               </div>
               <h2 className="text-2xl font-black text-[#1a1c1f] mb-2">¡Pago Validado!</h2>
               <p className="text-slate-500 mb-8 font-medium">Tus fondos están asegurados en la bóveda inmutable. Ya podés coordinar la entrega directa con el vendedor de forma 100% encriptada y monitoreada.</p>
               
               <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-8 text-left flex justify-between items-center">
                 <div>
                    <div className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-1">Autorización Nº</div>
                    <div className="font-mono font-bold text-[#1a1c1f]">TX-{ticketId?.split('-')[0].toUpperCase()}</div>
                 </div>
                 <div className="text-emerald-600 font-black flex items-center gap-1"><ShieldCheck className="w-5 h-5"/> Aprobado</div>
               </div>

               <button onClick={handleFinishCheckout} className="w-full bg-[#1a1c1f] text-white font-bold py-4 rounded-xl hover:bg-black shadow-lg active:translate-y-0.5 transition-all text-[15px] flex justify-center items-center gap-2">
                  Ingresar al Chat HUB <MessageCircle className="w-5 h-5" />
               </button>
            </div>
          )}

        </div>
      </div>
    );
  }

  // ============== HUD COORDINA ============== //
  
  const isFinalizado = ticket.status === 'entregado' || ticket.status === 'liquidado';

  return (
    <div className="bg-[#f8fafc] min-h-[calc(100vh-80px)] pt-6 pb-20">
      <div className="max-w-[700px] mx-auto px-4 md:px-0">
        
        <div className="flex items-center gap-4 border-b-2 border-slate-200 mb-6 pb-0">
          <button onClick={() => setHubTab('STATUS')} className={`pb-3 font-bold text-[15px] px-2 transition-all relative ${hubTab === 'STATUS' ? 'text-[#5144d4] border-b-2 border-[#5144d4] -mb-[2px]' : 'text-slate-500 hover:text-[#1a1c1f]'}`}>
             Seguimiento
          </button>
          <button onClick={() => setHubTab('CHAT')} className={`pb-3 font-bold text-[15px] px-2 transition-all relative ${hubTab === 'CHAT' ? 'text-[#5144d4] border-b-2 border-[#5144d4] -mb-[2px]' : 'text-slate-500 hover:text-[#1a1c1f]'}`}>
             Chat Seguro
          </button>
        </div>

        {hubTab === 'STATUS' && (
          <div className="animate-in fade-in duration-300">
             
             {isFinalizado && (
                <div className="bg-emerald-50 border-2 border-emerald-500/20 rounded-2xl p-6 mb-8 text-center shadow-sm">
                   <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                   <h3 className="text-xl font-black text-emerald-800 mb-2">Transacción Completada</h3>
                   <p className="text-emerald-700/80 font-medium text-sm max-w-md mx-auto">La entrada fue recibida satisfactoriamente. Los fondos han sido liberados y están en proceso de liquidación hacia la cuenta del vendedor.</p>
                </div>
             )}

             <div className="bg-white rounded-[24px] border border-slate-200 p-6 md:p-8 shadow-[0_4px_25px_rgba(0,0,0,0.03)] mb-8 relative overflow-hidden">
                
                <h3 className="text-lg font-black text-[#1a1c1f] mb-8">Línea de Vida</h3>
                
                <div className="relative pl-6 border-l-2 border-slate-100 space-y-8">
                  {/* Step 1 */}
                  <div className="relative">
                    <div className="absolute -left-[31px] bg-emerald-500 rounded-full w-4 h-4 border-[3px] border-white shadow-sm ring-2 ring-emerald-100"></div>
                    <div className="font-bold text-[#1a1c1f] mb-0.5 leading-none">Entrada Listada</div>
                    <div className="text-[13px] text-slate-500 font-medium">Publicación auditada e indexada en el directorio base.</div>
                  </div>
                  {/* Step 2 */}
                  <div className="relative">
                    <div className="absolute -left-[31px] bg-emerald-500 rounded-full w-4 h-4 border-[3px] border-white shadow-sm ring-2 ring-emerald-100"></div>
                    <div className="font-bold text-[#1a1c1f] mb-0.5 leading-none">Venta Asegurada (Escrow)</div>
                    <div className="text-[13px] text-slate-500 font-medium">El comprador abonó el total y SafeTicket garantizó resguardo.</div>
                  </div>
                  {/* Step 3 */}
                  <div className="relative">
                    <div className={`absolute -left-[31px] rounded-full w-4 h-4 border-[3px] border-white shadow-sm ${isFinalizado ? 'bg-emerald-500 ring-2 ring-emerald-100' : 'bg-[#5144d4] ring-4 ring-indigo-100'}`}></div>
                    <div className={`font-bold mb-0.5 leading-none ${!isFinalizado ? 'text-[#5144d4]' : 'text-[#1a1c1f]'}`}>Coordinación de Entrega</div>
                    <div className="text-[13px] text-slate-500 font-medium">Diálogo seguro por vías internas para el pase final del activo.</div>
                  </div>
                  {/* Step 4 */}
                  <div className={`relative ${!isFinalizado && 'opacity-40 grayscale blur-[0.5px]'}`}>
                    <div className={`absolute -left-[31px] rounded-full w-4 h-4 border-[3px] border-white shadow-sm ${isFinalizado ? 'bg-emerald-500 ring-2 ring-emerald-100' : 'bg-slate-300'}`}></div>
                    <div className="font-bold text-[#1a1c1f] mb-0.5 leading-none">Liberación Confirmada</div>
                    <div className="text-[13px] text-slate-500 font-medium">El comprador declaró satisfactoria la inspección. Cierre contable.</div>
                  </div>
                </div>

             </div>

             {/* ACCIONES O REVIEWS SEGÚN EL ROL */}
             {!isFinalizado && isBuyer && (
                <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-6 text-center shadow-lg shadow-amber-500/5">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-500 mx-auto mb-3"><AlertCircle className="w-6 h-6"/></div>
                  <h4 className="font-black text-[#1a1c1f] text-lg mb-2">¿Te transfirió la entrada?</h4>
                  <p className="text-sm font-medium text-slate-600 mb-6 leading-relaxed">Si validaste fehacientemente que la entrada es legítima y funcional en la APP/PDF respectivo, libera los fondos.</p>
                  <button onClick={handleConfirmReceipt} disabled={confirmingReceipt} className="w-full bg-amber-500 text-white font-black py-4 rounded-xl hover:bg-amber-600 shadow-xl shadow-amber-500/20 active:translate-y-0.5 transition-all flex justify-center items-center gap-2">
                    {confirmingReceipt ? <Loader2 className="w-5 h-5 animate-spin"/> : 'He Recibido la Entrada y Funciona'}
                  </button>
                </div>
             )}

             {!isFinalizado && isSeller && (
                <div className="bg-blue-50 border border-blue-200/60 rounded-2xl p-6 text-center">
                  <Info className="w-10 h-10 text-blue-500 mx-auto mb-3" />
                  <h4 className="font-black text-blue-900 text-lg mb-2">Esperando Confirmación...</h4>
                  <p className="text-sm font-medium text-blue-800/80 leading-relaxed">Tus fondos están asegurados, pero no serán transferidos a tu CBU nativo hasta que el comprador pulse el botón de recepción oficial en su aplicación.</p>
                </div>
             )}

             {isFinalizado && isBuyer && !existingReview && (
                <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm animate-in zoom-in duration-500">
                  <div className="flex items-center gap-2 text-amber-500 font-bold mb-2 text-lg"><Star className="w-6 h-6 fill-amber-500"/> Valora la Experiencia</div>
                  <p className="text-[13px] font-medium text-slate-500 mb-5 leading-relaxed">Tu opinión construye el ecosistema de confianza de SaFeTicket. ¿El vendedor cooperó celeramente?</p>
                  
                  <div className="flex gap-3 mb-4">
                    <button onClick={() => setReviewType(true)} className={`flex-1 py-3 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-all ${reviewType === true ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                      <ThumbsUp className="w-5 h-5"/> Positiva
                    </button>
                    <button onClick={() => setReviewType(false)} className={`flex-1 py-3 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-all ${reviewType === false ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                      <ThumbsDown className="w-5 h-5"/> Negativa
                    </button>
                  </div>
                  
                  {reviewType !== null && (
                    <div className="animate-in fade-in duration-200">
                      <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} rows={3} placeholder="Dejar descargo opcional (público visible)" className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-[#5144d4] focus:border-[#5144d4] transition-all outline-none resize-none mb-3"></textarea>
                      <button onClick={handleSubmitReview} disabled={submittingReview} className="w-full bg-[#1a1c1f] text-white font-bold py-3.5 rounded-xl hover:bg-black transition-all flex justify-center items-center gap-2">
                        {submittingReview ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Publicar Calificación'}
                      </button>
                    </div>
                  )}
                </div>
             )}
             {isFinalizado && isBuyer && existingReview && (
               <div className="bg-slate-50 border border-slate-200 rounded-[20px] p-5 flex items-center gap-4">
                  <div className={`p-3 rounded-full ${existingReview.is_positive ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                    {existingReview.is_positive ? <ThumbsUp className="w-6 h-6"/> : <ThumbsDown className="w-6 h-6"/>}
                  </div>
                  <div>
                    <div className="font-bold text-[#1a1c1f]">Calificación Emitida</div>
                    <div className="text-sm text-slate-500">{existingReview.is_positive ? 'Recomendaste al vendedor' : 'Reportaste incidencia de nivel de servicio'}</div>
                  </div>
               </div>
             )}

          </div>
        )}


        {hubTab === 'CHAT' && (
          <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[550px] animate-in fade-in duration-300">
            {/* Header chat */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-500">
                    {sellerProfile?.avatar_url ? <img src={sellerProfile.avatar_url} className="w-full h-full object-cover"/> : initials}
                 </div>
                 <div>
                   <div className="font-bold text-[14px] text-[#1a1c1f]">{sellerProfile?.full_name || 'Usuario'}</div>
                   <div className="text-[11px] font-bold text-emerald-500 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Encriptación Viva</div>
                 </div>
               </div>
               <div className="text-slate-400"><Info className="w-5 h-5"/></div>
            </div>

            {/* Bodies */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-50/50">
               <div className="text-center w-full my-2">
                 <span className="bg-indigo-50 text-[#5144d4] px-3 py-1.5 rounded-full text-[11px] font-bold tracking-widest uppercase">Canal de Custodia</span>
               </div>
               
               {messages.map((m: any) => {
                 const amISender = m.sender_id === user?.id;
                 const isSystem = m.content.includes('[SISTEMA]');
                 
                 if (isSystem) {
                   return (
                     <div key={m.id} className="text-center w-full my-4">
                       <span className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-medium shadow-md">
                         {m.content}
                       </span>
                     </div>
                   )
                 }

                 return (
                   <div key={m.id} className={`max-w-[75%] rounded-2xl p-3 font-medium text-[14px] shadow-sm ${amISender ? 'bg-[#5144d4] text-white self-end rounded-br-[4px]' : 'bg-white text-[#1a1c1f] self-start rounded-bl-[4px] border border-slate-100'}`}>
                     {m.content}
                     <div className={`text-[9px] mt-1 text-right ${amISender ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                     </div>
                   </div>
                 )
               })}
               <div ref={messagesEndRef} />
            </div>

            {/* Textarea Area */}
            {!isFinalizado && (
              <div className="p-3 bg-white border-t border-slate-100">
                {isSeller && (
                  <div className="flex gap-2 overflow-x-auto pb-3 mb-1 scrollbar-hide">
                    <button onClick={() => handleSendMessage('¡Hola! Soy el vendedor. ¿Cómo preferís que te pase la entrada?')} className="whitespace-nowrap px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-xs font-bold text-slate-600 transition-colors">¿Cómo transfiero?</button>
                    <button onClick={() => handleSendMessage('Genial, ¿me pasas tu mail/usuario así realizo la transferencia digital?')} className="whitespace-nowrap px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-xs font-bold text-slate-600 transition-colors">Solicitar Mail</button>
                    <button onClick={() => handleSendMessage('Ya te acabo de transferir la entrada, por favor chequea y confirmá acá.')} className="whitespace-nowrap px-4 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-[#5144d4] rounded-full text-xs font-bold transition-colors">Aviso Enviada</button>
                  </div>
                )}
                {isBuyer && (
                  <div className="flex gap-2 overflow-x-auto pb-3 mb-1 scrollbar-hide">
                    <button onClick={() => handleSendMessage('Hola, ya realicé el pago y estoy esperando instrucciones.')} className="whitespace-nowrap px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-xs font-bold text-slate-600 transition-colors">Pago Listo</button>
                    <button onClick={() => handleSendMessage('¿Me la envías por email o transferencia de App oficial?')} className="whitespace-nowrap px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-xs font-bold text-slate-600 transition-colors">¿Cómo la envías?</button>
                  </div>
                )}
                <div className="flex gap-2 items-center bg-slate-50 border border-slate-200 rounded-full p-1 pl-4">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Escribe un mensaje encriptado..." 
                    className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-slate-700" 
                  />
                  <button onClick={() => handleSendMessage()} className="w-10 h-10 rounded-full bg-[#5144d4] hover:bg-[#4338ca] text-white flex items-center justify-center transition-all disabled:opacity-50"><Send className="w-5 h-5 ml-0.5"/></button>
                </div>
              </div>
            )}
            {isFinalizado && (
              <div className="p-4 bg-emerald-50 border-t border-emerald-100 text-center text-sm font-bold text-emerald-700">
                 Chat clausurado protocolarmente post-finalización
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
