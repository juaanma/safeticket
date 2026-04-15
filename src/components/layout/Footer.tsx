import React from 'react';
import { Ticket, Globe, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-slate-50 border-t border-slate-200/50 pt-12 pb-8 md:py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-6 md:px-8 grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8 mb-8">
        <div className="col-span-1 md:col-span-1">
          <div className="text-xl font-bold flex items-center gap-2 text-[#1a1c1f] mb-4 md:mb-6">
            <Ticket className="w-6 h-6" />
            SafeTicket
          </div>
          <p className="text-sm text-slate-600 mb-6 max-w-xs md:max-w-none">
            La plataforma de reventa de entradas mas segura y confiable. Despídete de las estafas.
          </p>
          <div className="flex gap-4">
            <Globe className="w-5 h-5 text-slate-400 cursor-pointer hover:text-[#5144d4]" />
          </div>
        </div>

        <div>
          <h5 className="font-bold text-[#0f172a] mb-4">Plataforma</h5>
          <ul className="space-y-3 text-sm text-slate-600">
            <li><a className="hover:text-[#5144d4] transition-all" href="#">Cómo Funciona</a></li>
            <li><a className="text-[#5144d4] font-semibold transition-all" href="#">Garantía SafeTrust</a></li>
            <li><Link className="hover:text-[#5144d4] transition-all" to="/sell">Vender Entrada</Link></li>
          </ul>
        </div>

        <div>
          <h5 className="font-bold text-[#0f172a] mb-4">Legal</h5>
          <ul className="space-y-3 text-sm text-slate-600">
            <li><a className="hover:text-[#5144d4] transition-all" href="#">Términos de Servicio</a></li>
            <li><a className="hover:text-[#5144d4] transition-all" href="#">Privacidad</a></li>
            <li><a className="hover:text-[#5144d4] transition-all" href="#">Cookies</a></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 md:px-8 border-t border-slate-200/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-slate-500">© 2026 SafeTicket. El Mercado Seguro de Entradas.</p>
        <div className="flex items-center gap-2 bg-[#0ea5e9]/10 text-[#0ea5e9] px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
          <Lock className="w-3 h-3" /> 100% Pagos Seguros
        </div>
      </div>
    </footer>
  );
};
