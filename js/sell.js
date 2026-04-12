// js/sell.js

document.addEventListener('DOMContentLoaded', async () => {
  if (!window.MiSupabase) return;

  const eventInput = document.getElementById('sell-event-input');
  const hiddenIdEl = document.getElementById('sell-event-id');
  const autocompleteList = document.getElementById('autocomplete-list');
  const form = document.getElementById('sell-form');
  const errorMsg = document.getElementById('sell-error-msg');
  const btnSubmit = document.getElementById('btn-submit-sell');
  
  let allEventsCache = [];

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
      if (eventInput) eventInput.placeholder = 'Error cargando eventos';
      return;
    }

    // Filtrar eventos falsos iniciales
    const fakeTitles = ["Festival Primavera Sound", "Arctic Monkeys", "Duki en River Plate", "Coldplay", "Creamfields", "Tan Bionica", "Duki"];
    const events = eventsRaw.filter(e => !fakeTitles.includes(e.title));

    if (events.length === 0) {
      if (eventInput) eventInput.placeholder = 'No hay eventos disponibles';
      return;
    }

    allEventsCache = events.map(ev => ({
      id: ev.id,
      text: `${ev.title} (${new Date(ev.date).toLocaleDateString()})`
    }));
  }

  loadEventsDropdown();

  // Autocomplete logic
  if (eventInput && autocompleteList) {
    eventInput.addEventListener('input', function() {
      const val = this.value;
      autocompleteList.innerHTML = '';
      hiddenIdEl.value = ''; // clean if user starts typing again
      
      if (!val) {
        autocompleteList.style.display = 'none';
        return;
      }
      
      const matches = allEventsCache.filter(e => e.text.toLowerCase().includes(val.toLowerCase()));
      
      if (matches.length > 0) {
        autocompleteList.style.display = 'block';
        matches.forEach(m => {
          const item = document.createElement('div');
          
          // Reemplazar coincidencia para mostrarla en negrita
          const regex = new RegExp(`(${val})`, 'gi');
          item.innerHTML = m.text.replace(regex, "<strong>$1</strong>");
          
          item.addEventListener('click', function() {
            eventInput.value = m.text;
            hiddenIdEl.value = m.id;
            autocompleteList.style.display = 'none';
          });
          autocompleteList.appendChild(item);
        });
      } else {
        const item = document.createElement('div');
        item.style.color = 'var(--text-muted)';
        item.style.cursor = 'default';
        item.innerText = 'No se encontraron eventos...';
        autocompleteList.appendChild(item);
        autocompleteList.style.display = 'block';
      }
    });

    document.addEventListener('click', function (e) {
      if (e.target !== eventInput && e.target !== autocompleteList) {
        autocompleteList.style.display = 'none';
      }
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

    const eventId = hiddenIdEl.value;

    if (!eventId) {
      errorMsg.innerText = "Error: Por favor, selecciona un evento válido de la lista sugerida.";
      errorMsg.style.display = 'block';
      return;
    }

    const section = document.getElementById('sell-section').value;
    const seat = document.getElementById('sell-seat').value;
    const format = document.getElementById('sell-format').value;
    const price = document.getElementById('sell-price').value;
    
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
      status: 'disponible'
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


