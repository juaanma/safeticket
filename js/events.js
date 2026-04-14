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

  const { data: eventsRaw, error: eventsError } = await query.order('date', { ascending: true });

  if (eventsError || !eventsRaw) {
    console.error('Error fetching events:', eventsError);
    container.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">Hubo un error cargando los eventos.</p>';
    return;
  }

  // Mostrar absolutamente todos los eventos públicos validos que vengan de supabase
  const events = eventsRaw;
  
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
    const availableTickets = allTickets.filter(t => t.event_id === event.id);
    const minPrice = availableTickets.length > 0 ? Math.min(...availableTickets.map(t => Number(t.price))) : 0;
    const isSoldOut = availableTickets.length === 0;
    
    const html = `
      <div class="bg-white rounded-[24px] overflow-hidden border border-slate-100 shadow-[0_8px_30px_rgba(26,28,31,0.04)] flex flex-col hover:shadow-[0_12px_40px_rgba(26,28,31,0.08)] transition-shadow">
          <div class="relative h-[200px] md:h-[220px] overflow-hidden cursor-pointer" onclick="window.location.href='event.html?id=${event.id}'">
              <img src="${event.image_url || 'https://images.unsplash.com/photo-1540039155732-d6749b9325eb?w=800'}" alt="${event.title}" class="w-full h-full object-cover transition-transform duration-700 hover:scale-105 ${isSoldOut ? 'grayscale opacity-70' : ''}">
              <div class="absolute top-4 left-4">
                  <span class="bg-white/90 backdrop-blur-md text-[#1a1c1f] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                      ${event.category || 'Música'}
                  </span>
              </div>
              ${isSoldOut ? `
              <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span class="bg-[#1a1c1f] text-white font-black text-sm px-6 py-2.5 rounded-full rotate-[-12deg] shadow-lg">SOLD OUT</span>
              </div>
              ` : ''}
          </div>
          <div class="p-6 flex-1 flex flex-col cursor-pointer" onclick="window.location.href='event.html?id=${event.id}'">
              <div class="flex justify-between items-start mb-4 gap-4">
                  <h3 class="font-bold text-[#1a1c1f] text-[1.15rem] leading-tight flex-1 line-clamp-2">${event.title}</h3>
                  <span class="text-[#5144d4] font-black tracking-tight shrink-0">${isSoldOut ? '---' : formatPrice(minPrice)}</span>
              </div>
              <div class="flex flex-col gap-2.5 mb-8 text-sm font-medium text-slate-500">
                  <div class="flex items-center gap-2 text-slate-500">
                      <span class="material-symbols-outlined text-[1.1rem]">calendar_today</span> <span class="truncate">${formatEventDate(event.date)}</span>
                  </div>
                  <div class="flex items-center gap-2 text-slate-500">
                      <span class="material-symbols-outlined text-[1.1rem]" style="font-variation-settings: 'FILL' 1;">location_on</span> <span class="truncate">${event.location}</span>
                  </div>
                  <div class="flex items-center gap-2 ${!isSoldOut && availableTickets.length > 0 ? 'text-[#5144d4]' : 'text-slate-400'} mt-1">
                      <span class="material-symbols-outlined text-[1.1rem]">${!isSoldOut ? 'verified' : 'cancel'}</span> 
                      ${isSoldOut ? 'Sin stock disponible' : availableTickets.length === 1 ? '¡1 última entrada!' : availableTickets.length + ' tickets en venta'}
                  </div>
              </div>
              <button class="w-full mt-auto bg-[#faf9fd] text-[#1a1c1f] font-bold py-3.5 rounded-[14px] hover:bg-slate-200 transition-colors">
                  Ver Detalles
              </button>
          </div>
      </div>
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
window.loadEvents = loadEvents;

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('index-events-grid')) {
    window.loadEvents('#index-events-grid', 4);
  } else if (document.querySelector('.events-grid')) {
    window.loadEvents('.events-grid');
  }
});
