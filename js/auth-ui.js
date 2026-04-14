// auth-ui.js
// Script para actualizar la barra de navegación dependiendo si el usuario está logueado o no
document.addEventListener('DOMContentLoaded', () => {
  // Buscamos la sesión guardada de Supabase en localStorage
  const getSessionData = () => {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        try {
          return JSON.parse(localStorage.getItem(key));
        } catch(e) {}
      }
    }
    return null;
  };

  const sessionData = getSessionData();
  const navActionsContainer = document.getElementById('nav-desktop-actions');

  if (navActionsContainer) {
    if (sessionData && sessionData.user) {
      // Estado: Usuario LOUGEADO
      const isAdmin = sessionData.user.email === 'safebeatcontacto@gmail.com';
      const adminBtnHtml = isAdmin 
        ? `<a href="admin.html" class="hidden md:block text-sm font-bold bg-[#8b5cf6] text-white px-5 py-2.5 rounded-full hover:bg-[#7c3aed] transition-colors shadow-md shadow-purple-500/20">Admin Panel</a>` 
        : '';
        
      navActionsContainer.innerHTML = `
        <a href="chats.html" class="hidden md:flex w-10 h-10 items-center justify-center rounded-full bg-slate-100/80 hover:bg-indigo-50 text-slate-600 hover:text-[#5144d4] transition-all shadow-[0_2px_8px_rgba(26,28,31,0.03)] hover:shadow-indigo-500/10 relative group" title="Mis Mensajes">
          <span class="material-symbols-outlined text-[1.25rem] group-hover:scale-110 transition-transform">chat</span>
        </a>
        ${adminBtnHtml}
        <a href="#" class="app-logout-btn hidden md:flex items-center text-[13.5px] font-bold text-slate-500 hover:text-red-500 transition-colors ml-2 py-2">Cerrar Sesión</a>
      `;

      // Assign listener to the newly injected logout button
      const logoutBtn = navActionsContainer.querySelector('.app-logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          if (window.MiSupabase) {
            await window.MiSupabase.auth.signOut();
          }
          window.location.href = 'index.html';
        });
      }
    } else {
      // Estado: Usuario DESLOGUEADO
      navActionsContainer.innerHTML = `
        <a href="login.html" class="hidden md:block text-sm font-bold text-[#5144d4] hover:opacity-80 transition-opacity">Iniciar Sesión</a>
        <a href="login.html" class="hidden md:block text-sm font-bold bg-[#5144d4] text-white px-5 py-2.5 rounded-full hover:bg-[#4338ca] transition-colors shadow hover:-translate-y-0.5">Registrarse</a>
      `;
    }
  }
});


