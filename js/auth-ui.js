// auth-ui.js
// Script para actualizar la barra de navegación dependiendo si el usuario está logueado o no
document.addEventListener('DOMContentLoaded', () => {
  // Buscamos la sesión guardada de Supabase en localStorage
  const isSessionActive = () => {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        return true;
      }
    }
    return false;
  };

  if (isSessionActive()) {
    const navActions = document.querySelector('.nav-actions');
    
    // Solo modificamos si existe el contenedor navActions y no estamos en la página del dashboard
    if (navActions && !window.location.pathname.includes('dashboard.html')) {
      navActions.innerHTML = `
        <a href="sell.html" class="btn btn-outline">Vender entrada</a>
      `;
    }
  }
});


