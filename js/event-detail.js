// js/event-detail.js

document.addEventListener('DOMContentLoaded', async () => {
  if (!window.MiSupabase) return;

  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id');

  if (!eventId) {
    document.querySelector('.event-info').innerHTML = '<h2>Evento no encontrado</h2><p>Selecciona un evento válido desde <a href="marketplace.html">Explorar</a></p>';
    document.querySelector('.ticket-list').innerHTML = '';
    return;
  }

  // 1. Cargar datos del Evento
  const { data: event, error } = await window.MiSupabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error || !event) {
    document.querySelector('.event-info').innerHTML = '<h2>Evento no encontrado</h2>';
    return;
  }

  // Actualizar hero y titulo
  document.querySelector('.event-hero-bg').style.backgroundImage = `url('${event.image_url}')`;
  document.querySelector('.event-hero-image').src = event.image_url || 'https://images.unsplash.com/photo-1540039155732-d6749b9325eb?w=800';
  
  const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
  const d = new Date(event.date);
  const dateStr = d.toLocaleDateString('es-ES', options).replace(',', ' •') + ' hs';

  document.querySelector('.event-info').innerHTML = `
    <div style="color: var(--primary); font-weight: 600; margin-bottom: 0.5rem;"><i class="ph ph-calendar"></i> ${dateStr}</div>
    <h1 style="font-size: 2.5rem; margin-bottom: 1rem;">${event.title}</h1>
    <div style="font-size: 1.1rem; color: #e2e8f0; margin-bottom: 0.5rem;"><i class="ph ph-map-pin"></i> ${event.location}</div>
    <div style="font-size: 0.95rem; color: var(--text-muted);"><i class="ph ph-users"></i> Detectando entradas...</div>
  `;

  // 2. Cargar tickets disponibles para este evento
  const { data: tickets, error: ticketsError } = await window.MiSupabase
    .from('tickets')
    .select('*') 
    .eq('event_id', eventId)
    .eq('status', 'disponible')
    .order('price', { ascending: true });

  const ticketContainer = document.querySelector('.ticket-list');
  ticketContainer.innerHTML = '';

  if (ticketsError || !tickets || tickets.length === 0) {
    ticketContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 3rem;">No hay entradas disponibles en este momento. ¡Sé el primero en vender una!</p>';
    // Actualizar el header
    document.querySelector('.event-info div:last-child').innerHTML = `<i class="ph ph-users"></i> 0 entradas de reventa disponibles`;
    return;
  }
  
  // Guardamos para uso del modal
  window.currentEventObj = event;
  window.currentEventTickets = tickets;

  // Actualizar contador del header
  document.querySelector('.event-info div:last-child').innerHTML = `<i class="ph ph-users"></i> ${tickets.length} entradas de reventa disponibles`;

  // Renderizar tickets reales
  tickets.forEach(ticket => {
    // Al no poder leer auth.users por seguridad, usamos una anonimización amigable
    const sellerIdSnippet = ticket.seller_id.substring(0, 4).toUpperCase();
    const sellerName = 'Vendedor #' + sellerIdSnippet;
    const initial = sellerName.charAt(10); // Caracter del numero

    const formattedFormat = ticket.format === 'pdf' ? 'Entrada Digital (PDF)' : 
                            ticket.format === 'app' ? 'Transferencia en App' : 
                            ticket.format === 'fisica' ? 'Entrada Física' : ticket.format;

    // Formatear precio
    const formattedPrice = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(ticket.price);

    const html = `
      <div class="ticket-item">
        <div>
          <div class="ticket-section">Sector / Ubicación</div>
          <div style="font-size: 1.1rem; font-weight: 600;">${ticket.section}</div>
          <div style="font-size: 0.85rem; color: var(--text-muted);">${formattedFormat}</div>
        </div>
        
        <div>
          <div class="ticket-section" style="margin-bottom: 0.5rem;">Vendedor</div>
          <div class="seller-info">
            <div class="seller-avatar">${initial}</div>
            <div>
              <div style="font-weight: 600;">${sellerName}</div>
              <div class="trust-badge"><i class="ph-fill ph-check-circle"></i> Vendedor Identificado</div>
            </div>
          </div>
        </div>

        <div class="price-col">
          <div class="ticket-section">Precio final</div>
          <div class="amount">${formattedPrice}</div>
        </div>

        <div>
          <button class="btn btn-primary btn-buy" style="width: 100%;" onclick="buyTicket('${ticket.id}', this)">Comprar Ahora</button>
        </div>
      </div>
    `;

    ticketContainer.insertAdjacentHTML('beforeend', html);
  });
});

window.buyTicket = function(ticketId, btn) {
  // 1. Encontrar ticket
  const ticket = window.currentEventTickets.find(t => t.id === ticketId);
  if (!ticket) return;

  const event = window.currentEventObj;

  // 2. Buscar stock de tickets idénticos (mismo seller_id, section, price)
  const identicalTickets = window.currentEventTickets.filter(t => 
    t.seller_id === ticket.seller_id && 
    t.section === ticket.section && 
    t.price === ticket.price
  );
  
  const maxQty = identicalTickets.length;
  window.currentCheckoutTicket = ticket;
  window.currentCheckoutMaxQty = maxQty;

  const sellerNameSnippet = 'Vendedor #' + ticket.seller_id.substring(0, 4).toUpperCase();

  // 3. Llenar el UI del Modal
  document.getElementById('co-event-img').src = event.image_url || 'https://images.unsplash.com/photo-1540039155732-d6749b9325eb?w=800';
  document.getElementById('co-event-title').innerText = event.title;
  document.getElementById('co-ticket-section').innerText = ticket.section;
  document.getElementById('co-seller-id').innerText = sellerNameSnippet;
  document.getElementById('co-max-qty-label').innerText = maxQty;

  const qtySelect = document.getElementById('co-qty-selector');
  qtySelect.innerHTML = '';
  for(let i=1; i<=maxQty; i++) {
    qtySelect.innerHTML += `<option value="${i}">${i} x ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(ticket.price)}</option>`;
  }
  qtySelect.value = "1";

  // 4. Calcular Valores
  updateCheckoutTotals();

  // 5. Mostrar Modal
  const modal = document.getElementById('checkout-overlay');
  modal.classList.add('active');
  
  // Ocultar scroll de pagina
  document.body.style.overflow = 'hidden';
};

// Logica interna del modal
function updateCheckoutTotals() {
  const qty = parseInt(document.getElementById('co-qty-selector').value) || 1;
  const ticket = window.currentCheckoutTicket;
  if (!ticket) return;

  const totalBase = ticket.price * qty;
  const fee = totalBase * 0.08; // 8% de seguridad
  const totalPagado = totalBase + fee;

  const formatARS = (num) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(num);

  document.getElementById('co-summary-qty-text').innerText = `${qty} Entrada(s)`;
  document.getElementById('co-summary-subtotal').innerText = formatARS(totalBase);
  document.getElementById('co-summary-fee').innerText = formatARS(fee);
  document.getElementById('co-summary-total').innerText = formatARS(totalPagado);
}

document.addEventListener('DOMContentLoaded', () => {
  // Listeners del modal (si existe)
  const qtySelect = document.getElementById('co-qty-selector');
  if (qtySelect) {
    qtySelect.addEventListener('change', updateCheckoutTotals);
  }

  const btnClose = document.getElementById('btn-close-checkout');
  const modal = document.getElementById('checkout-overlay');
  if (btnClose && modal) {
    btnClose.addEventListener('click', () => {
      modal.classList.remove('active');
      document.body.style.overflow = 'auto';
    });
  }

  // Payment Methods Select
  const paymentCards = document.querySelectorAll('.payment-method-card');
  paymentCards.forEach(card => {
    card.addEventListener('click', () => {
      paymentCards.forEach(c => {
        c.classList.remove('selected');
        c.querySelector('.check-icon').style.display = 'none';
        c.querySelector('.check-icon').style.color = 'var(--border)';
      });
      card.classList.add('selected');
      card.querySelector('.check-icon').style.display = 'block';
      card.querySelector('.check-icon').style.color = 'var(--primary)';
    });
  });

  // Procesar compra
  const btnProcess = document.getElementById('btn-process-checkout');
  if(btnProcess) {
    btnProcess.addEventListener('click', () => {
      const originalText = btnProcess.innerText;
      btnProcess.innerHTML = '<i class="ph-bold ph-spinner ph-spin"></i> Aprobando pago...';
      btnProcess.style.opacity = '0.8';
      btnProcess.disabled = true;

      setTimeout(() => {
        alert("¡Oferta de compra exitosa! El dinero ha sido retenido y recibirás las entradas pronto.");
        window.location.href = 'dashboard.html';
      }, 1500);
    });
  }
});

