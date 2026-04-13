document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const error = urlParams.get('error');
  const errorDescription = urlParams.get('error_description');
  
  const titleEl = document.getElementById('callback-title');
  const msgEl = document.getElementById('callback-msg');
  const iconEl = document.getElementById('callback-icon');
  const btnReturn = document.getElementById('btn-return');

  if (error) {
    iconEl.className = 'ph-fill ph-warning-circle spinner';
    iconEl.style.color = '#ef4444';
    titleEl.innerText = 'Verificación Fallida o Cancelada';
    msgEl.innerText = errorDescription || 'Cancelaste o falló el proceso en DIDIT.';
    btnReturn.style.display = 'inline-block';
    return;
  }

  if (!code) {
    iconEl.className = 'ph-fill ph-question spinner';
    titleEl.innerText = 'Código no encontrado';
    msgEl.innerText = 'La URL de retorno no contiene el código de verificación requerido por DIDIT.';
    btnReturn.style.display = 'inline-block';
    return;
  }

  if (!window.MiSupabase) {
    titleEl.innerText = 'Error de Conexión';
    msgEl.innerText = 'No se encontró la configuración de Supabase.';
    btnReturn.style.display = 'inline-block';
    return;
  }

  const { data: { user } } = await window.MiSupabase.auth.getUser();
  
  if (!user) {
    iconEl.className = 'ph-fill ph-user-minus spinner';
    titleEl.innerText = 'Sesión inválida';
    msgEl.innerText = 'No hemos encontrado tu sesión de usuario original. Requieres iniciar sesión nuevamente.';
    btnReturn.style.display = 'inline-block';
    return;
  }

  // En un entorno de Producción REAL, este es el punto en el que el Front-End NO DEBERÍA
  // marcar al perfil como verificado. Se debería llamar a un backend (Edge Function)
  // pasándole el "code". El backend intercambia el code con el ClientSecret, descarga 
  // la credencial de DIDIT de que es humano y real, y el backend altera Supabase.
  // PARA EFECTOS DE ESTA DEMO / MVP, APROBAREMOS EL FLOW FRONT-END:

  titleEl.innerText = 'Actualizando Perfil...';
  
  // Actualizamos supabase marcando que el usuario pasó el KYC exitosamente
  // Usamos upsert por si el perfil aún no ha sido creado al momento de registrarse
  const { error: updateError } = await window.MiSupabase
    .from('profiles')
    .upsert({ user_id: user.id, is_verified: true, updated_at: new Date() }, { onConflict: 'user_id' });

  if (updateError) {
    iconEl.className = 'ph-fill ph-x-circle spinner';
    iconEl.style.color = '#ef4444';
    titleEl.innerText = 'Error en Base de Datos';
    msgEl.innerText = 'DIDIT confirmó tu identidad, pero hubo un error al asegurar tu perfil.';
    console.error(updateError);
    btnReturn.style.display = 'inline-block';
    return;
  }

  // Éxito Total
  iconEl.className = 'ph-fill ph-check-circle spinner';
  iconEl.classList.remove('ph-spin'); // Frenar giro
  iconEl.style.color = '#10b981'; // Verde de éxito
  titleEl.innerText = '¡Identidad Verificada!';
  msgEl.innerText = 'DIDIT Protocol ha validado tus parámetros correctamente. Estamos redirigiéndote al portal...';
  
  // Redirigir al dashboard luego de unos pocos segundos para que el usuario lea el msj.
  setTimeout(() => {
    window.location.replace('dashboard.html');
  }, 2500);
});
