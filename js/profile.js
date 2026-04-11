// js/profile.js

document.addEventListener('DOMContentLoaded', async () => {
  if (!window.MiSupabase) return;

  const { data: userData, error: userError } = await window.MiSupabase.auth.getUser();
  if (userError || !userData || !userData.user) return;

  // Actualizar email del usuario
  const emailInput = document.getElementById('profile-email');
  if (emailInput) emailInput.value = userData.user.email;

  // Obtener estado de verificación desde la tabla profiles
  const { data: profile, error: profileError } = await window.MiSupabase
    .from('profiles')
    .select('is_verified, full_name, phone')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  const displayAlias = (profile && profile.full_name) ? profile.full_name : (userData.user.email.split('@')[0] || 'Usuario');
  const storedName = (profile && profile.full_name) ? profile.full_name : '';
  
  // Header
  const init = document.getElementById('profile-user-initials');
  const nameEl = document.getElementById('profile-user-name');
  const emailHeaderEl = document.getElementById('profile-user-email-header');
  
  if (init) init.innerText = displayAlias.substring(0, 2).toUpperCase();
  if (nameEl) nameEl.innerText = displayAlias;
  if (emailHeaderEl) emailHeaderEl.innerText = userData.user.email;

  // Inputs puros (sin auto-relleno de email)
  const fullNameInput = document.getElementById('profile-fullname');
  if (fullNameInput) fullNameInput.value = storedName;
  
  const phoneInput = document.getElementById('profile-phone');
  if (phoneInput && profile && profile.phone) {
      phoneInput.value = profile.phone;
  }

  // Si está verificado, cambiar la UI a verde (Validado)
  if (profile && profile.is_verified) {
    const card = document.getElementById('verification-card');
    const icon = document.getElementById('verification-icon');
    const title = document.getElementById('verification-title');
    const text = document.getElementById('verification-text');
    const btnKyc = document.getElementById('btn-kyc-verify-profile');

    if (card) {
      card.style.background = 'rgba(16, 185, 129, 0.05)';
      card.style.borderColor = 'var(--accent)';
    }
    if (icon) {
      icon.className = 'ph-fill ph-seal-check';
      icon.style.color = 'var(--accent)';
    }
    if (title) title.innerText = 'Cuenta Verificada';
    if (text) text.innerText = 'Tu identidad ha sido validada exitosamente. Puedes vender entradas y retirar tu dinero.';
    if (btnKyc) btnKyc.style.display = 'none';
  }

  // Lógica para guardar los cambios manuales del usuario
  const btnSave = document.getElementById('btn-save-profile');
  if (btnSave) {
    btnSave.addEventListener('click', async () => {
      btnSave.innerText = 'Guardando...';
      btnSave.disabled = true;

      const newName = document.getElementById('profile-fullname').value;
      const newPhone = document.getElementById('profile-phone').value;

      // Si no existe la fila, intentamos hacer upsert o insert si es posible,
      // pero para evitar errores de RLS usaremos upsert.
      const { error: updateError } = await window.MiSupabase.from('profiles').upsert({
        user_id: userData.user.id,
        full_name: newName,
        phone: newPhone
      }, { onConflict: 'user_id' });

      if (updateError) {
        alert("Hubo un error al actualizar tus datos.");
      } else {
        alert("¡Datos actualizados correctamente!");
        // Update header dynamically without reload
        const init = document.getElementById('profile-user-initials');
        const nameEl = document.getElementById('profile-user-name');
        if (init) init.innerText = newName.substring(0, 2).toUpperCase();
        if (nameEl) nameEl.innerText = newName;
      }
      
      btnSave.innerText = 'Guardar Cambios';
      btnSave.disabled = false;
    });
  }
});
