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

  if (sessionData) {
    const navActions = document.querySelector('.nav-actions');
    const isAdmin = sessionData.user && sessionData.user.email === 'safebeatcontacto@gmail.com';
    
    // Aplicamos esto globalmente para inyectar el Admin y los Chats en el nav global superior
    if (navActions) {
      const adminBtnHtml = isAdmin ? `<a href="admin.html" class="btn btn-primary" style="margin-right: 10px; background: #8b5cf6; border-color: #8b5cf6;"><i class="ph-bold ph-shield-star"></i> Admin</a>` : '';
      
      navActions.innerHTML = `
        <a href="chats.html" style="font-size: 1.5rem; color: var(--text-main); position: relative; margin-right: 10px;" title="Mis Mensajes">
          <i class="ph-bold ph-chat-circle-dots"></i>
        </a>
        ${adminBtnHtml}
        <a href="sell.html" class="btn btn-outline">Vender entrada</a>
      `;
    }
  }
});


