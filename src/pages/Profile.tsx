import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { User, ShieldAlert, Lock, Loader2, Camera, Verified, ThumbsUp, ThumbsDown } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'personal'|'kyc'|'security'>('personal');
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [phone, setPhone] = useState('');
  const [cbu, setCbu] = useState('');
  const [alias, setAlias] = useState('');

  // Security Form States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Reputation Stats
  const [reviews, setReviews] = useState({ total: 0, pos: 0, neg: 0 });

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
    if (data) {
      setProfile(data);
      setPhone(data.phone || '');
      setCbu(data.cbu_cvu || '');
      setAlias(data.cbu_alias || '');
    }

    const { data: revs } = await supabase.from('reviews').select('is_positive').eq('seller_id', user.id);
    if (revs) {
      const pos = revs.filter((r: any) => r.is_positive).length;
      setReviews({ total: revs.length, pos, neg: revs.length - pos });
    }

    setLoading(false);
  };

  const handleSaveContact = async () => {
    setSaving(true);
    await supabase.from('profiles').update({ phone }).eq('user_id', user?.id);
    alert('Contacto actualizado.');
    setSaving(false);
  };

  const handleSaveBank = async () => {
    setSaving(true);
    await supabase.from('profiles').update({ cbu_cvu: cbu, cbu_alias: alias }).eq('user_id', user?.id);
    alert('Datos bancarios actualizados.');
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      alert("Completa todos los campos de contraseña.");
      return;
    }
    if (newPassword.length < 6) {
      alert("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("Las contraseñas nuevas no coinciden.");
      return;
    }

    setSaving(true);
    // 1. Validar actual (haciendo signin ciego)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user?.email || '',
      password: oldPassword,
    });

    if (signInError) {
      alert("La contraseña actual es incorrecta.");
      setSaving(false);
      return;
    }

    // 2. Actualizar contraseña
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) {
      alert("Hubo un error al actualizar la contraseña: " + updateError.message);
    } else {
      alert("¡Tu contraseña ha sido actualizada!");
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex justify-center items-center bg-[#f8fafc]">
        <Loader2 className="w-10 h-10 animate-spin text-[#5144d4]" />
      </div>
    );
  }

  const initials = profile?.full_name ? profile.full_name.substring(0, 2).toUpperCase() : '--';
  const isVerified = profile?.is_verified;

  return (
    <div className="bg-[#f8fafc] min-h-[calc(100vh-80px)] pt-10 pb-20">
      <div className="max-w-7xl mx-auto px-6 md:px-8 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <aside className="w-full md:w-[280px] shrink-0">
          <div className="bg-white rounded-[32px] p-6 shadow-[0_8px_30px_rgba(26,28,31,0.04)] border border-slate-100 flex flex-col items-center sticky top-28">
            <div className="relative w-24 h-24 mb-4">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-300 to-[#5144d4] flex items-center justify-center text-3xl font-black text-white shadow-inner overflow-hidden">
                {profile?.avatar_url ? <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover"/> : initials}
              </div>
              <button className="absolute -bottom-1 -right-1 bg-[#5144d4] text-white w-9 h-9 rounded-full flex items-center justify-center border-[3px] border-white shadow-md hover:scale-110 transition-all">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            
            <h2 className="text-xl font-bold text-[#1a1c1f] mb-1 text-center">{profile?.full_name || 'Cargando...'}</h2>
            <p className="text-[13px] text-slate-500 font-medium mb-5 text-center">{user?.email}</p>

            {/* Profile Reputation Stats */}
            <div className="w-full flex justify-around text-center border-t border-slate-100 pt-5 pb-2 mb-6">
              <div>
                <div className="font-black text-lg text-[#1a1c1f] leading-none mb-1">{reviews.total}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ventas</div>
              </div>
              <div className="w-[1px] bg-slate-100"></div>
              <div>
                <div className="font-black text-lg text-emerald-600 leading-none mb-1 flex justify-center items-center gap-1">{reviews.pos} <ThumbsUp className="w-[14px] h-[14px]"/></div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Positivas</div>
              </div>
              <div className="w-[1px] bg-slate-100"></div>
              <div>
                <div className="font-black text-lg text-red-500 leading-none mb-1 flex justify-center items-center gap-1">{reviews.neg} <ThumbsDown className="w-[14px] h-[14px]"/></div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Negativas</div>
              </div>
            </div>

            <nav className="w-full flex flex-col gap-1.5">
              <button 
                onClick={() => setActiveTab('personal')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-colors ${activeTab === 'personal' ? 'text-[#5144d4] bg-indigo-50/50' : 'text-slate-500 hover:text-[#5144d4] hover:bg-[#faf9fd]'}`}
              >
                <User className="w-5 h-5" /> Información Personal
              </button>
              <button 
                onClick={() => setActiveTab('kyc')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-colors ${activeTab === 'kyc' ? 'text-[#5144d4] bg-indigo-50/50' : 'text-slate-500 hover:text-[#5144d4] hover:bg-[#faf9fd]'}`}
              >
                <ShieldAlert className="w-5 h-5" /> Verificación DNI
              </button>
              <button 
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-colors ${activeTab === 'security' ? 'text-[#5144d4] bg-indigo-50/50' : 'text-slate-500 hover:text-[#5144d4] hover:bg-[#faf9fd]'}`}
              >
                <Lock className="w-5 h-5" /> Seguridad
              </button>
            </nav>
          </div>
        </aside>

        {/* Panel principal */}
        <div className="flex-1 min-w-0 bg-white rounded-[32px] p-8 md:p-10 shadow-[0_8px_30px_rgba(26,28,31,0.04)] border border-slate-100">
          
          {activeTab === 'personal' && (
            <div className="space-y-10">
              <section>
                <h3 className="text-xl font-black text-[#1a1c1f] border-b border-slate-100 pb-4 mb-6">Datos Personales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-[13px] font-bold text-[#1a1c1f] mb-2 uppercase tracking-wide">Nombre y Apellido</label>
                    <input type="text" className="w-full bg-slate-50 border border-slate-200 text-slate-500 text-[15px] p-3.5 rounded-xl outline-none" value={profile?.full_name || ''} readOnly />
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-[#1a1c1f] mb-2 uppercase tracking-wide">Correo</label>
                    <input type="email" className="w-full bg-slate-50 border border-slate-200 text-slate-500 text-[15px] p-3.5 rounded-xl outline-none" value={user?.email || ''} readOnly />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[13px] font-bold text-[#1a1c1f] mb-2 uppercase tracking-wide">Teléfono Móvil</label>
                    <input type="tel" className="w-full bg-[#f8f9fa] border border-slate-200 text-[#1a1c1f] text-[15px] p-3.5 rounded-xl focus:border-[#5144d4] outline-none transition-all" placeholder="+54 9 11..." value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button onClick={handleSaveContact} disabled={saving} className="bg-[#5144d4] text-white font-bold text-[15px] px-8 py-3.5 rounded-full hover:bg-[#4338ca] hover:-translate-y-0.5 shadow-lg shadow-indigo-500/20 transition-all">Guardar Cambios</button>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-black text-[#1a1c1f] border-b border-slate-100 pb-4 mb-4">Datos Bancarios</h3>
                <p className="text-slate-500 text-[14px] font-medium leading-relaxed mb-6">Aquí depositaremos el dinero de tus ventas exitosas.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-[13px] font-bold text-[#1a1c1f] mb-2 uppercase tracking-wide">CBU / CVU</label>
                    <input type="text" className="w-full bg-[#f8f9fa] border border-slate-200 text-[#1a1c1f] text-[15px] p-3.5 rounded-xl focus:border-[#5144d4] outline-none" placeholder="22 dígitos" value={cbu} onChange={e => setCbu(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-[#1a1c1f] mb-2 uppercase tracking-wide">Alias</label>
                    <input type="text" className="w-full bg-[#f8f9fa] border border-slate-200 text-[#1a1c1f] text-[15px] p-3.5 rounded-xl focus:border-[#5144d4] outline-none" placeholder="EJEMPLO.ALIAS.MP" value={alias} onChange={e => setAlias(e.target.value)} />
                  </div>
                </div>
                <div className="flex justify-end">
                   <button onClick={handleSaveBank} disabled={saving} className="bg-[#faf9fd] text-[#1a1c1f] font-bold text-[15px] px-8 py-3.5 rounded-full border border-slate-200 hover:bg-slate-100 transition-colors">Actualizar CBU</button>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'kyc' && (
            <div>
              <h3 className="text-lg md:text-[1.35rem] font-black tracking-tight text-[#1a1c1f] mb-6">Verificación de Identidad</h3>
              
              {isVerified ? (
                <div className="bg-emerald-50 border border-emerald-200/60 rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  <Verified className="w-12 h-12 text-emerald-500 shrink-0" />
                  <div className="text-center sm:text-left">
                    <h4 className="text-lg font-bold text-[#1a1c1f] mb-1">Cuenta Verificada</h4>
                    <p className="text-sm font-medium text-slate-500 leading-relaxed text-left">Tu identidad ha sido validada exitosamente con tu DNI. Ya puedes vender entradas y retirar tu dinero hacia tu cuenta bancaria cuando quieras.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  <ShieldAlert className="w-12 h-12 text-amber-500 shrink-0" />
                  <div className="text-center sm:text-left">
                    <h4 className="text-lg font-bold text-[#1a1c1f] mb-1">Identidad Sin Verificar</h4>
                    <p className="text-sm font-medium text-slate-500 mb-4 leading-relaxed">Necesitas verificar tu DNI para operar (vender o transferir) dentro del ecosistema SafeTicket.</p>
                    <button onClick={() => alert("El módulo de KYC (Biometría) no está activado en esta demo.")} className="inline-flex items-center gap-2 bg-[#5144d4] text-white font-bold text-sm px-6 py-2.5 rounded-full hover:bg-[#4338ca] transition-all">
                      Iniciar KYC (Demo)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h3 className="text-[1.35rem] font-black tracking-tight text-[#1a1c1f] mb-3">Seguridad y Clave</h3>
              <p className="text-slate-500 text-[15px] font-medium leading-relaxed mb-8">Gestiona la protección integral de tu cuenta cambiando tu contraseña regularmente o validando sesiones abiertas.</p>
              
              <div className="max-w-md">
                <div className="mb-5">
                  <label className="block text-[13px] font-bold text-[#1a1c1f] mb-2 uppercase tracking-wide">Contraseña Actual</label>
                  <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="w-full bg-[#f8f9fa] border border-slate-200 text-[#1a1c1f] text-[15px] font-medium rounded-xl py-3.5 px-4 focus:bg-white focus:border-[#5144d4] focus:ring-4 focus:ring-[#5144d4]/10 transition-all outline-none" placeholder="Ingresa tu contraseña actual" />
                </div>
                <div className="mb-5">
                  <label className="block text-[13px] font-bold text-[#1a1c1f] mb-2 uppercase tracking-wide">Nueva Contraseña</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-[#f8f9fa] border border-slate-200 text-[#1a1c1f] text-[15px] font-medium rounded-xl py-3.5 px-4 focus:bg-white focus:border-[#5144d4] focus:ring-4 focus:ring-[#5144d4]/10 transition-all outline-none" placeholder="Mínimo 6 caracteres" />
                </div>
                <div className="mb-8">
                  <label className="block text-[13px] font-bold text-[#1a1c1f] mb-2 uppercase tracking-wide">Confirmar Contraseña</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-[#f8f9fa] border border-slate-200 text-[#1a1c1f] text-[15px] font-medium rounded-xl py-3.5 px-4 focus:bg-white focus:border-[#5144d4] focus:ring-4 focus:ring-[#5144d4]/10 transition-all outline-none" placeholder="Repite tu nueva contraseña" />
                </div>
                <button onClick={handleChangePassword} disabled={saving} className="bg-red-500 text-white font-bold text-[15px] px-8 py-3.5 rounded-full hover:bg-red-600 hover:-translate-y-0.5 shadow-lg shadow-red-500/20 transition-all disabled:opacity-70 disabled:hover:translate-y-0">
                  {saving ? 'Guardando...' : 'Guardar Nueva Clave'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
