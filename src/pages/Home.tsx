import React from 'react';
import { Shield, Verified, Ticket as TicketIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Home: React.FC = () => {
  return (
    <>
      {/* Hero Section */}
      <header className="relative min-h-[500px] md:min-h-[716px] flex items-center py-16 overflow-hidden md:m-0 m-4 md:rounded-none rounded-[2rem]">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#5144d4]/20 via-[#f8fafc]/80 to-[#f8fafc]"></div>
          <img 
            className="w-full h-full object-cover opacity-20 filter grayscale mix-blend-overlay md:mix-blend-normal"
            src="https://images.unsplash.com/photo-1540039155732-d6749b9325eb?w=1600" 
            alt="Background concert" 
          />
        </div>
        <div className="container max-w-7xl mx-auto px-6 md:px-8 relative z-10 w-full">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-[3.5rem] md:leading-[1.1] font-black tracking-tighter text-[#0f172a] mb-4 md:mb-6">
              Compra y vende entradas <span className="text-[#5144d4] block md:inline">sin riesgo de estafas</span>
            </h1>
            <p className="text-sm md:text-xl text-[#64748b] mb-8 md:mb-10 leading-relaxed font-normal">
              La plataforma líder en reventa segura. Verificamos cada ticket y protegemos cada pago para que tu única preocupación sea disfrutar del show.
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link to="/marketplace" className="bg-[#5144d4] text-white px-8 py-3.5 rounded-full font-bold text-base md:text-lg transition-all hover:bg-[#4338ca] shadow-lg active:scale-95 text-center w-full sm:w-auto">
                Ver Entradas
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-4 text-xs md:text-sm font-semibold text-[#64748b]">
              <span className="flex items-center gap-1"><Verified className="w-5 h-5 text-[#0ea5e9]" /> 100% Verificado</span>
              <span className="flex items-center gap-1"><Shield className="w-5 h-5 text-[#0ea5e9]" /> SafeTrust</span>
            </div>
          </div>
        </div>
      </header>

      {/* Trust Section */}
      <section className="py-16 md:py-24 bg-white/50">
        <div className="container max-w-7xl mx-auto px-6 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="bg-white p-8 md:p-10 rounded-[1.5rem] shadow-sm flex flex-col gap-4 group hover:shadow-md transition-shadow border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-[#5144d4]/10 flex items-center justify-center text-[#5144d4] mb-2">
                <Verified className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-[#0f172a]">Identidad Verificada</h3>
              <p className="text-sm md:text-base text-slate-600 leading-relaxed">
                Solo usuarios validados pueden vender. Eliminamos el anonimato para garantizar tu seguridad.
              </p>
            </div>

            <div className="bg-white p-8 md:p-10 rounded-[1.5rem] shadow-sm flex flex-col gap-4 group hover:shadow-md transition-shadow border border-slate-100 border-t-4 border-t-[#0ea5e9]">
              <div className="w-12 h-12 rounded-xl bg-[#0ea5e9]/10 flex items-center justify-center text-[#0ea5e9] mb-2">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-[#0f172a]">Pago Protegido</h3>
              <p className="text-sm md:text-base text-slate-600 leading-relaxed">
                No liberamos el dinero al vendedor hasta que el evento haya finalizado con éxito.
              </p>
            </div>

            <div className="bg-white p-8 md:p-10 rounded-[1.5rem] shadow-sm flex flex-col gap-4 group hover:shadow-md transition-shadow border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-[#5144d4]/10 flex items-center justify-center text-[#5144d4] mb-2">
                <TicketIcon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-[#0f172a]">Garantía de Acceso</h3>
              <p className="text-sm md:text-base text-slate-600 leading-relaxed">
                Si algo falla, te devolvemos el 100% de tu dinero o te conseguimos otra entrada.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
