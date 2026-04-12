// js/sell.js

document.addEventListener('DOMContentLoaded', async () => {
  if (!window.MiSupabase) return;

  const eventSelect = document.getElementById('sell-event-id');
  const form = document.getElementById('sell-form');
  const errorMsg = document.getElementById('sell-error-msg');
  const btnSubmit = document.getElementById('btn-submit-sell');

  // KYC Verification check
  const { data: userData } = await window.MiSupabase.auth.getUser();
  if (userData && userData.user) {
    const { data: profile } = await window.MiSupabase
      .from('profiles')
      .select('is_verified, phone')
      .eq('user_id', userData.user.id)
      .maybeSingle();

    if (!profile || !profile.is_verified) {
      // Diferenciar entre "Naranja" y "En Revisión"
      const isPending = (profile && profile.phone && String(profile.phone).includes("DNI")) || localStorage.getItem('kyc_pending_' + userData.user.id) === 'true';
      
      if (isPending) {
        form.innerHTML = `
          <div style="text-align: center; padding: 3rem; background: rgba(59, 130, 246, 0.05); border-radius: var(--radius-md); border: 1px dashed #3b82f6;">
            <i class="ph-fill ph-clock-afternoon" style="font-size: 3.5rem; color: #3b82f6; margin-bottom: 1rem;"></i>
            <h3 style="margin-bottom: 0.5rem; font-size: 1.5rem; color: #3b82f6;">Identidad en Revisión</h3>
            <p style="color: var(--text-muted); margin-bottom: 2rem;">Tus documentos han sido recibidos y están siendo validados por nuestro equipo de moderación. Vuelve pronto para empezar a vender.</p>
            <a href="dashboard.html" class="btn btn-outline" style="width: 100%;">Volver al Inicio</a>
          </div>
        `;
      } else {
        form.innerHTML = `
          <div style="text-align: center; padding: 3rem; background: rgba(99, 102, 241, 0.05); border-radius: var(--radius-md); border: 1px dashed var(--primary);">
            <i class="ph-fill ph-shield-warning" style="font-size: 3.5rem; color: var(--primary); margin-bottom: 1rem;"></i>
            <h3 style="margin-bottom: 0.5rem; font-size: 1.5rem;">Verificación Requerida</h3>
            <p style="color: var(--text-muted); margin-bottom: 2rem;">Para poder publicar entradas y recibir pagos, necesitamos confirmar tu identidad mediante tu DNI.</p>
            <a href="kyc-ar.html" class="btn btn-primary" style="width: 100%;">Completar Verificación <i class="ph-bold ph-arrow-right"></i></a>
          </div>
        `;
      }
      return; // Stop execution, form is disabled
    } else {
      // Mostrar banner de vendedor verificado solo si es verdadero
      const banner = document.getElementById('seller-verified-banner');
      if (banner) banner.style.display = 'flex';
    }
  }

  // Cargar eventos para el dropdown
  async function loadEventsDropdown() {
    const { data: eventsRaw, error } = await window.MiSupabase
      .from('events')
      .select('id, title, date')
      .order('date', { ascending: true });

    if (error || !eventsRaw) {
      eventSelect.innerHTML = '<option value="" disabled selected>Error cargando eventos</option>';
      return;
    }

    // Filtrar eventos falsos iniciales
    const fakeTitles = ["Festival Primavera Sound", "Arctic Monkeys", "Duki en River Plate", "Coldplay", "Creamfields", "Tan Bionica", "Duki"];
    const events = eventsRaw.filter(e => !fakeTitles.includes(e.title));

    if (events.length === 0) {
      eventSelect.innerHTML = '<option value="" disabled selected>No hay eventos disponibles</option>';
      return;
    }

    eventSelect.innerHTML = '<option value="" disabled selected>Selecciona el evento</option>';
    events.forEach(ev => {
      const d = new Date(ev.date).toLocaleDateString();
      const option = document.createElement('option');
      option.value = ev.id;
      option.textContent = `${ev.title} (${d})`;
      eventSelect.appendChild(option);
    });
  }

  loadEventsDropdown();

  // Manejo de carga de archivo de evidencia
  const uploadBox = document.getElementById('evidence-upload-box');
  const fileInput = document.getElementById('ticket-evidence-file');
  const previewContainer = document.getElementById('evidence-preview-container');
  const previewName = document.getElementById('evidence-preview-name');
  let evidenceBase64 = null;

  if (uploadBox && fileInput) {
    uploadBox.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        evidenceBase64 = event.target.result;
        previewName.textContent = "Archivo cargado: " + file.name;
        
        // Hide icons, show preview
        const icon = uploadBox.querySelector('.ph-upload-simple');
        const h4 = uploadBox.querySelector('h4');
        
        if (icon) icon.style.display = 'none';
        if (h4) h4.style.display = 'none';
        
        previewContainer.style.display = 'block';
        uploadBox.style.borderColor = 'var(--primary)';
        uploadBox.style.background = 'rgba(79, 70, 229, 0.05)';
      };
      reader.readAsDataURL(file);
    });
  }

  // Enviar el ticket
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const { data: userData } = await window.MiSupabase.auth.getUser();
    if (!userData || !userData.user) {
      alert("Debes iniciar sesión para publicar una entrada.");
      return;
    }

    const eventId = eventSelect.value;
    const section = document.getElementById('sell-section').value;
    const seat = document.getElementById('sell-seat').value;
    const format = document.getElementById('sell-format').value;
    const price = document.getElementById('sell-price').value;
    
    if (!evidenceBase64) {
      errorMsg.innerText = "Error: Por seguridad es obligatorio subir la evidencia física o digital de la entrada.";
      errorMsg.style.display = 'block';
      return;
    }

    const fullSection = seat ? `${section} - ${seat}` : section;

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = 'Publicando... <i class="ph-bold ph-spinner ph-spin"></i>';
    errorMsg.style.display = 'none';

    const { error } = await window.MiSupabase.from('tickets').insert([{
      event_id: eventId,
      seller_id: userData.user.id,
      section: fullSection,
      format: format,
      price: parseFloat(price),
      evidence_url: evidenceBase64
    }]);

    if (error) {
      errorMsg.innerText = "Error al publicar: " + error.message;
      errorMsg.style.display = 'block';
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = 'Publicar Entrada <i class="ph-bold ph-arrow-right"></i>';
    } else {
      alert('¡Entrada publicada con ééxito!');
      window.location.href = 'dashboard.html';
    }
  });

});


