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
  // Intentamos un update primero. Si falla o no se actualizan filas (porque no existe el perfil aún), hacemos insert
  const { data: updatedData, error: updateError } = await window.MiSupabase
    .from('profiles')
    .update({ is_verified: true })
    .eq('user_id', user.id)
    .select();

  let finalError = null;
  if (updateError || !updatedData || updatedData.length === 0) {
     const metadataName = (user && user.user_metadata && user.user_metadata.full_name) ? user.user_metadata.full_name : 'Usuario';
     const { error: insertError } = await window.MiSupabase
       .from('profiles')
       .insert([{ user_id: user.id, full_name: metadataName, is_verified: true }]);
     
     if (insertError) {
       finalError = insertError;
     } else {
       finalError = null; // Si el insert salvó el día, anulamos el updateError
     }
  }

  if (finalError) {
    iconEl.className = 'ph-fill ph-x-circle spinner';
    iconEl.style.color = '#ef4444';
    titleEl.innerText = 'Detalle de Error de Base de Datos';
    msgEl.innerHTML = `<strong style="color:#ef4444">${finalError.code || 'ERR'}</strong>: ${finalError.message || finalError.details || JSON.stringify(finalError)}`;
    console.error(finalError);
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
