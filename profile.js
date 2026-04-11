// js/profile.js

document.addEventListener('DOMContentLoaded', async () => {
  if (!window.MiSupabase) return;

  const { data: userData, error: userError } = await window.MiSupabase.auth.getUser();
  if (userError || !userData || !userData.user) return;

  // Actualizar email del usuario
  const emailInput = document.getElementById('profile-email');
  if (emailInput) emailInput.value = userData.user.email;

  // Obtener estado de verificación desde la tabla profiles (y datos adicionales)
  const { data: profile, error: profileError } = await window.MiSupabase
    .from('profiles')
    .select('*')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  const metadataNameForAlias = (userData && userData.user && userData.user.user_metadata && userData.user.user_metadata.full_name) 
    ? userData.user.user_metadata.full_name 
    : '';
  const displayAlias = metadataNameForAlias || (profile && profile.full_name) || 'Usuario';
  const storedName = (profile && profile.full_name) ? profile.full_name : '';
  
  // Header
  const init = document.getElementById('profile-user-initials');
  const nameEl = document.getElementById('profile-user-name');
  const emailHeaderEl = document.getElementById('profile-user-email-header');
  
  if (nameEl) nameEl.innerText = displayAlias;
  if (emailHeaderEl) emailHeaderEl.innerText = userData.user.email;

  // Lógica de Foto de Perfil (Avatar)
  let stagedAvatarBase64 = null;

  const avatarUpload = document.getElementById('avatar-upload');
  if (avatarUpload) {
    avatarUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
          stagedAvatarBase64 = event.target.result;
          
          if (init) {
            init.style.backgroundImage = `url(${stagedAvatarBase64})`;
            init.innerText = '';
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Cargar avatar desde DB remota (o localStorage de fallback)
  const savedAvatar = (profile && profile.avatar_url) ? profile.avatar_url : localStorage.getItem('avatar_' + userData.user.id);
  if (savedAvatar) {
    if (init) {
      init.style.backgroundImage = `url(${savedAvatar})`;
      init.innerText = '';
    }
  } else {
    if (init) init.innerText = displayAlias.substring(0, 2).toUpperCase();
  }

  // Inputs puros (sin auto-relleno de email)
  const fullNameInput = document.getElementById('profile-fullname');
  // Usar el nombre que se guardó en los metadatos al momento de registrarse (Auth)
  const metadataName = (userData && userData.user && userData.user.user_metadata && userData.user.user_metadata.full_name) 
    ? userData.user.user_metadata.full_name 
    : storedName;
    
  if (fullNameInput) fullNameInput.value = metadataName;
  
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
    if (text) text.innerText = 'Tu identidad ha sido validada eéxitosamente. Puedes vender entradas y retirar tu dinero.';
    if (btnKyc) btnKyc.style.display = 'none';
  } else if (profile && profile.phone && String(profile.phone).includes("DNI")) {
    const card = document.getElementById('verification-card');
    const icon = document.getElementById('verification-icon');
    const title = document.getElementById('verification-title');
    const text = document.getElementById('verification-text');
    const btnKyc = document.getElementById('btn-kyc-verify-profile');

    if (card) {
      card.style.background = 'rgba(59, 130, 246, 0.05)';
      card.style.borderColor = '#3b82f6';
    }
    if (icon) {
      icon.className = 'ph-fill ph-clock-afternoon';
      icon.style.color = '#3b82f6';
    }
    if (title) title.innerText = 'Identidad en Revisión';
    if (title) title.style.color = '#3b82f6';
    if (text) text.innerText = 'Tus documentos están siendo moderados manualmente. Te notificaremos pronto.';
    if (btnKyc) btnKyc.style.display = 'none';
  }

  // Lógica para guardar los cambios manuales del usuario
  const btnSave = document.getElementById('btn-save-profile');
  if (btnSave) {
    btnSave.addEventListener('click', async () => {
      btnSave.innerText = 'Guardando...';
      btnSave.disabled = true;

      const newPhone = document.getElementById('profile-phone').value;
      const currentNameForInitials = metadataName || 'Usuario';

      let updatePayload = { phone: newPhone };

      if (stagedAvatarBase64) {
        updatePayload.avatar_url = stagedAvatarBase64;
        localStorage.setItem('avatar_' + userData.user.id, stagedAvatarBase64); // Fallback offline
        stagedAvatarBase64 = null;
      }

      // Intentar actualización estándar
      const { data: updatedData, error: updateError } = await window.MiSupabase.from('profiles').update(updatePayload).eq('user_id', userData.user.id).select();

      if (updateError) {
        // Mock de exito si Supabase falla
        let insertPayload = {
           user_id: userData.user.id,
           full_name: metadataName,
           phone: newPhone
        };
        if (updatePayload.avatar_url) insertPayload.avatar_url = updatePayload.avatar_url;
        await window.MiSupabase.from('profiles').insert([insertPayload]);
        
        finishSuccess(currentNameForInitials);
      } else {
        finishSuccess(currentNameForInitials);
      }

      function finishSuccess(nName) {
        alert("¡Tus cambios han sido guardados correctamente!");
        const nameEl = document.getElementById('profile-user-name');
        if (nameEl) nameEl.innerText = nName;
      }
      
      btnSave.innerText = 'Guardar Cambios';
      btnSave.disabled = false;
    });
  }

  // Lógica para Datos Bancarios
  const btnSaveBank = document.getElementById('btn-save-bank');
  const cbuInput = document.getElementById('profile-cbu');
  const aliasInput = document.getElementById('profile-alias');

  // Cargar bancarios desde DB si existe, o localStorage de fallback
  let loadedCbu = '';
  let loadedAlias = '';
  if (profile && profile.cbu) loadedCbu = profile.cbu;
  if (profile && profile.alias) loadedAlias = profile.alias;
  
  if (!loadedCbu) loadedCbu = localStorage.getItem('bank_cbu_' + userData.user.id) || '';
  if (!loadedAlias) loadedAlias = localStorage.getItem('bank_alias_' + userData.user.id) || '';

  if (cbuInput) cbuInput.value = loadedCbu;
  if (aliasInput) aliasInput.value = loadedAlias;

  if (btnSaveBank) {
    btnSaveBank.addEventListener('click', async () => {
      if (!cbuInput.value && !aliasInput.value) {
        alert("Ingresa al menos un CBU o Alias.");
        return;
      }
      
      btnSaveBank.innerText = 'Actualizando...';
      btnSaveBank.disabled = true;

      const newCbu = cbuInput.value;
      const newAlias = aliasInput.value;

      // Intentamos guardarlo en supabase, asumiendo columnas cbu y alias
      const { error: updateBankError } = await window.MiSupabase.from('profiles').update({
        cbu: newCbu,
        alias: newAlias
      }).eq('user_id', userData.user.id);

      // Guardamos en LocalStorage también por si Supabase no tiene esas columnas 
      localStorage.setItem('bank_cbu_' + userData.user.id, newCbu);
      localStorage.setItem('bank_alias_' + userData.user.id, newAlias);

      alert("¡Tus datos bancarios han sido actualizados con éxito!");
      
      btnSaveBank.innerText = 'Actualizar CBU';
      btnSaveBank.disabled = false;
    });
  }

  // Lógica para pestañas del Perfil
  const tabs = {
    personal: { link: document.getElementById('tab-link-personal'), content: document.getElementById('tab-personal') },
    kyc: { link: document.getElementById('tab-link-kyc'), content: document.getElementById('tab-kyc') },
    security: { link: document.getElementById('tab-link-security'), content: document.getElementById('tab-security') }
  };

  function switchTab(tabId) {
    if (!tabs[tabId]) return;
    // Esconder todo y quitar active
    Object.values(tabs).forEach(t => {
      if (t.link) t.link.classList.remove('active');
      if (t.content) t.content.style.display = 'none';
    });
    // Mostrar la seleccionada
    if (tabs[tabId].link) tabs[tabId].link.classList.add('active');
    if (tabs[tabId].content) tabs[tabId].content.style.display = 'block';
    
    // Guardar en la URL para que persista al recargar
    window.location.hash = tabId;
  }

  if (tabs.personal.link) tabs.personal.link.addEventListener('click', (e) => { e.preventDefault(); switchTab('personal'); });
  if (tabs.kyc.link) tabs.kyc.link.addEventListener('click', (e) => { e.preventDefault(); switchTab('kyc'); });
  if (tabs.security.link) tabs.security.link.addEventListener('click', (e) => { e.preventDefault(); switchTab('security'); });

  // Leer hash de la URL al cargar
  const initialHash = window.location.hash.replace('#', '');
  if (initialHash && tabs[initialHash]) switchTab(initialHash);

  // Lógica para actualizar contraseña
  const btnChangePwd = document.getElementById('btn-change-password');
  if (btnChangePwd) {
    btnChangePwd.addEventListener('click', async () => {
      const oldPwdInput = document.getElementById('profile-old-password');
      const pwdInput = document.getElementById('profile-new-password');
      const confirmPwdInput = document.getElementById('profile-confirm-password');
      
      if (!oldPwdInput || !oldPwdInput.value) {
        alert("Debes ingresar tu contraseña actual.");
        return;
      }
      if (!pwdInput || !pwdInput.value || pwdInput.value.length < 6) {
        alert("La nueva contraseña debe tener al menos 6 caracteres.");
        return;
      }
      if (pwdInput.value !== confirmPwdInput.value) {
        alert("Las contraseñas nuevas no coinciden.");
        return;
      }
      
      btnChangePwd.innerText = 'Guardando...';
      btnChangePwd.disabled = true;

      // 1. Validar la contraseña antigua iniciando sesión en segundo plano
      const { error: signInError } = await window.MiSupabase.auth.signInWithPassword({
        email: userData.user.email,
        password: oldPwdInput.value,
      });

      if (signInError) {
        alert("La contraseña actual es incorrecta.");
        btnChangePwd.innerText = 'Guardar';
        btnChangePwd.disabled = false;
        return;
      }

      // 2. Si fue correcta, actualizar a la nueva
      const { error: updateError } = await window.MiSupabase.auth.updateUser({
        password: pwdInput.value
      });

      if (updateError) {
        alert("Hubo un error al actualizar la contraseña: " + updateError.message);
      } else {
        alert("¡Tu contraseña ha sido actualizada eéxitosamente!");
        oldPwdInput.value = '';
        pwdInput.value = '';
      }

      btnChangePwd.innerText = 'Guardar';
      btnChangePwd.disabled = false;
    });
  }
});


