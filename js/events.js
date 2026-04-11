// js/events.js

function formatEventDate(dateString) {
  const options = { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
  const d = new Date(dateString);
  return d.toLocaleDateString('es-ES', options).replace(',', ' •') + ' hs';
}

function formatPrice(number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(number);
}

// Carga principal de eventos
// Carga principal de eventos
async function loadEvents(containerSelector = '.events-grid', limit = null) {
  const container = document.querySelector(containerSelector);
  if (!container || !window.MiSupabase) return;

  // 1. Consultar eventos
  let query = window.MiSupabase.from('events').select('*');
  if (limit) query = query.limit(limit);

  const { data: events, error: eventsError } = await query.order('date', { ascending: true });

  if (eventsError || !events) {
    console.error('Error fetching events:', eventsError);
    container.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">Hubo un error cargando los eventos.</p>';
    return;
  }

  // 2. Extraer IDs para buscar sus tickets
  const eventIds = events.map(e => e.id);
  
  let allTickets = [];
  if (eventIds.length > 0) {
    const { data: ticketsData } = await window.MiSupabase
      .from('tickets')
      .select('event_id, price, status')
      .in('event_id', eventIds)
      .eq('status', 'disponible');
      
    if (ticketsData) allTickets = ticketsData;
  }

  if (events.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color: var(--text-muted);">No hay eventos disponibles en este momento.</p>';
    return;
  }

  // Generar HTML
  container.innerHTML = ''; // Limpiar tarjetas harcodeadas

  events.forEach(event => {
    // Calcular cuántos tickets hay "disponibles" para ESTE evento
    const availableTickets = allTickets.filter(t => t.event_id === event.id);
    const minPrice = availableTickets.length > 0 
      ? Math.min(...availableTickets.map(t => t.price)) 
      : 0;

    const ticketsText = availableTickets.length > 0 
      ? `${availableTickets.length} entradas disponibles` 
      : 'Sin entradas disponibles';

    const priceText = availableTickets.length > 0 
      ? `<div class="event-price"><span>Desde</span> ${formatPrice(minPrice)}</div>`
      : `<div class="event-price" style="color: var(--text-muted);">Agotado</div>`;

    const html = `
      <a href="event.html?id=${event.id}" class="event-card">
        <div class="event-image">
          <img src="${event.image_url || 'https://images.unsplash.com/photo-1540039155732-d6749b9325eb?w=800'}" alt="${event.title}">
          <div class="event-badge"><i class="ph-fill ph-shield-check"></i> Protegido</div>
        </div>
        <div class="event-details">
          <div class="event-date">${formatEventDate(event.date)}</div>
          <h3 class="event-title">${event.title}</h3>
          <div class="event-location"><i class="ph ph-map-pin"></i> ${event.location}</div>
          <div class="event-footer">
            ${priceText}
            <span style="color: #cbd5e1; font-size: 0.9rem;">${ticketsText}</span>
          </div>
        </div>
      </a>
    `;
    
    container.insertAdjacentHTML('beforeend', html);
  });
  
  // Actualizar contador global si existe
  const countLabel = document.getElementById('events-count-label');
  if (countLabel) {
    countLabel.innerText = `(${events.length})`;
  }
}

// Exponer la funcion global para llamarla al cargar
window.loadEvents = loadEvents;


