// auth-guard.js
// Poner este script en cualquier pantalla que requiera que el usuario esté logueado

document.addEventListener('DOMContentLoaded', async () => {
  if (!window.MiSupabase) {
    console.warn("Modo de prueba: omitiendo protección de página porque las claves de Supabase no están configuradas.");
    return;
  }

  // Revisar si el usuario está activo
  const { data: { user } } = await window.MiSupabase.auth.getUser();

  if (!user) {
    // Si no hay sesión válida, lo pateamos a login
    window.location.replace('login.html');
  } else {
    // Si hay usuario, opcionalmente podríamos rellenar sus datos globales aquí.
    console.log("Acceso concedido al usuario:", user.email);
  }
});
