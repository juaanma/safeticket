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
      // Estado: Usuario LOGUEADO
      const isAdmin = sessionData.user.email === 'safebeatcontacto@gmail.com' || sessionData.user.email === 'ignaciocosta.dev@gmail.com'; // Added dev email just in case or just checking admin properly
      const adminBtnHtml = isAdmin 
        ? `<a href="admin.html" class="flex items-center text-[10px] md:text-sm font-bold bg-[#8b5cf6] text-white px-3 py-1.5 md:px-5 md:py-2.5 rounded-full hover:bg-[#7c3aed] transition-colors shadow-md shadow-purple-500/20 mr-2 md:mr-0 z-50"><span class="material-symbols-outlined text-[1rem] mr-1 hidden md:block">admin_panel_settings</span>Admin</a>` 
        : '';
        
      navActionsContainer.innerHTML = `
        <a href="chats.html" class="flex w-8 h-8 md:w-10 md:h-10 items-center justify-center rounded-full bg-slate-100/80 hover:bg-indigo-50 text-slate-600 hover:text-[#5144d4] transition-all shadow-[0_2px_8px_rgba(26,28,31,0.03)] hover:shadow-indigo-500/10 relative group mr-1 md:mr-0" title="Mis Mensajes">
          <span class="material-symbols-outlined text-[1.25rem] group-hover:scale-110 transition-transform">chat</span>
        </a>
        ${adminBtnHtml}
        <a href="#" class="app-logout-btn flex items-center text-[12px] md:text-[13.5px] font-bold text-slate-500 hover:text-red-500 transition-colors ml-1 md:ml-2 py-2">
          <span class="md:hidden material-symbols-outlined text-[1.25rem]">logout</span>
          <span class="hidden md:inline">Cerrar Sesión</span>
        </a>
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
        <!-- Botones Mobile -->
        <a href="login.html" class="md:hidden text-xs font-bold text-[#5144d4] border border-[#5144d4] px-4 py-1.5 rounded-full mr-2">Entrar</a>
        <a href="register.html" class="md:hidden text-xs font-bold bg-[#5144d4] text-white px-4 py-1.5 rounded-full shadow-md shadow-indigo-500/20">Registro</a>
        
        <!-- Botones Desktop -->
        <a href="login.html" class="hidden md:block text-sm font-bold text-[#5144d4] hover:opacity-80 transition-opacity">Iniciar Sesión</a>
        <a href="register.html" class="hidden md:block text-sm font-bold bg-[#5144d4] text-white px-5 py-2.5 rounded-full hover:bg-[#4338ca] transition-colors shadow hover:-translate-y-0.5 pointer-events-auto">Registrarse</a>
      `;
    }
  }
});


