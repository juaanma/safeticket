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
    .select('is_verified, full_name')
    .eq('user_id', userData.user.id)
    .single();

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
});
