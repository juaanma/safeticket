import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Ticket, Search, PlusCircle, LayoutDashboard, User, MessageCircle, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const desktopActive = "text-[#5144d4] font-bold border-b-2 border-[#5144d4] pb-1 transition-colors";
  const desktopInactive = "text-[#1a1c1f] hover:text-[#5144d4] transition-colors";

  const mobileActive = "flex flex-col items-center justify-center text-[#5144d4] p-[0.35rem] active:scale-90 duration-200";
  const mobileInactive = "flex flex-col items-center justify-center text-[#1a1c1f] opacity-60 hover:opacity-100 p-[0.35rem] active:scale-90 duration-200";

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="w-full top-0 sticky z-50 bg-[#faf9fd]/90 backdrop-blur-md shadow-[0_12px_32px_rgba(26,28,31,0.06)]">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 text-[1.35rem] font-black tracking-tighter text-[#5144d4]">
            <Ticket className="hidden md:block w-7 h-7" />
            SafeTicket
          </Link>

          <div className="hidden md:flex items-center gap-8 font-medium text-sm">
            <NavLink to="/" className={({ isActive }) => isActive ? desktopActive : desktopInactive}>Inicio</NavLink>
            <NavLink to="/marketplace" className={({ isActive }) => isActive ? desktopActive : desktopInactive}>Explorar</NavLink>
            <NavLink to="/sell" className={({ isActive }) => isActive ? desktopActive : desktopInactive}>Vender</NavLink>
            {user && (
              <>
                <NavLink to="/dashboard" className={({ isActive }) => isActive ? desktopActive : desktopInactive}>Mi Actividad</NavLink>
                <NavLink to="/profile" className={({ isActive }) => isActive ? desktopActive : desktopInactive}>Mi Perfil</NavLink>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link to="/dashboard" className="relative text-[#1a1c1f] hover:text-[#5144d4] transition-colors p-2">
                  <MessageCircle className="w-6 h-6" />
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                </Link>
                <button 
                  onClick={handleSignOut}
                  className="hidden md:block bg-transparent border border-[#5144d4] text-[#5144d4] px-6 py-2.5 rounded-full font-semibold text-sm active:scale-95 transition-all hover:bg-[#5144d4]/5"
                >
                  Cerrar Sesión
                </button>
                <button 
                  onClick={handleSignOut}
                  className="md:hidden text-slate-400 hover:text-red-500 p-2 transition-colors active:scale-90"
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="w-6 h-6" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="hidden md:block text-sm font-semibold hover:text-[#5144d4] transition-colors">
                  Iniciar Sesión
                </Link>
                <Link to="/register" className="bg-[#5144d4] text-white px-6 py-2.5 rounded-full font-semibold text-sm active:scale-95 transition-all hover:bg-[#4338ca] shadow hover:shadow-lg">
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-[100] flex justify-around items-center px-3 pb-3 pt-2 bg-[#faf9fd]/90 backdrop-blur-xl shadow-[0_-12px_32px_rgba(26,28,31,0.06)] rounded-t-[32px] border-t border-slate-200/50">
        <NavLink to="/" className={({ isActive }) => isActive ? mobileActive : mobileInactive}>
          <Ticket className="w-5 h-5" />
          <span className="font-bold text-[9px] uppercase tracking-widest mt-1">Inicio</span>
        </NavLink>
        <NavLink to="/marketplace" className={({ isActive }) => isActive ? mobileActive : mobileInactive}>
          <Search className="w-5 h-5" />
          <span className="font-bold text-[9px] uppercase tracking-widest mt-1">Explorar</span>
        </NavLink>
        <NavLink to="/sell" className={({ isActive }) => isActive ? mobileActive : mobileInactive}>
          <PlusCircle className="w-5 h-5" />
          <span className="font-bold text-[9px] uppercase tracking-widest mt-1">Vender</span>
        </NavLink>
        {user && (
          <>
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? mobileActive : mobileInactive}>
              <LayoutDashboard className="w-5 h-5" />
              <span className="font-bold text-[9px] uppercase tracking-widest mt-1">Actividad</span>
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => isActive ? mobileActive : mobileInactive}>
              <User className="w-5 h-5" />
              <span className="font-bold text-[9px] uppercase tracking-widest mt-1">Perfil</span>
            </NavLink>
          </>
        )}
      </nav>
    </>
  );
};
