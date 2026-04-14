// js/tickets.js
document.addEventListener('DOMContentLoaded', async () => {
  if (!window.MiSupabase) return;

  const container = document.getElementById('tickets-grid-container');
  if (!container) return;

  // Mostramos el loader temporal
  container.innerHTML = '<div class="col-span-full flex flex-col items-center justify-center text-slate-400 py-12"><span class="material-symbols-outlined text-4xl animate-spin mb-4">refresh</span><p class="font-medium">Buscando Entradas...</p></div>';

  const { data: tickets, error } = await window.MiSupabase
    .from('tickets')
    .select('*, events(*)')
    .eq('status', 'disponible')
    .order('created_at', { ascending: false });

  if (error || !tickets || tickets.length === 0) {
    container.innerHTML = '<div class="col-span-full flex flex-col items-center justify-center text-slate-400 py-12"><p class="font-medium">No hay entradas publicadas en este momento.</p></div>';
    return;
  }

  // Obtener perfiles de los vendedores para sus nombres y fotos
  const sellerIds = [...new Set(tickets.map(t => t.seller_id))];
  const { data: profiles } = await window.MiSupabase
    .from('profiles')
    .select('user_id, full_name, avatar_url')
    .in('user_id', sellerIds);
    
  const profileMap = {};
  if (profiles) {
    profiles.forEach(p => profileMap[p.user_id] = { name: p.full_name, avatar: p.avatar_url });
  }

  const formatPrice = (number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(number);

  let rawTickets = tickets;

  function renderTickets() {
    container.innerHTML = '';
    
    // Obtener valores de los filtros
    const searchValue = document.getElementById('search-filter') ? document.getElementById('search-filter').value.toLowerCase().trim() : '';
    const genreValue = document.getElementById('genre-filter') ? document.getElementById('genre-filter').value.toLowerCase() : '';
    const priceSortValue = document.getElementById('price-sort') ? document.getElementById('price-sort').value : '';

    // Filtrar
    let filteredTickets = rawTickets.filter(ticket => {
        const ev = ticket.events || {};
        const titleMatch = ev.title ? ev.title.toLowerCase().includes(searchValue) : false;
        
        const matchesSearch = titleMatch || searchValue === '';
        
        const genreMatch = ev.category ? ev.category.toLowerCase().includes(genreValue) : false;
        const matchesGenre = genreValue === '' || genreMatch;

        return matchesSearch && matchesGenre;
    });

    // Ordenar Precio
    if (priceSortValue === 'asc') {
        filteredTickets.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (priceSortValue === 'desc') {
        filteredTickets.sort((a, b) => Number(b.price) - Number(a.price));
    }

    if (filteredTickets.length === 0) {
        container.innerHTML = '<div class="col-span-full flex flex-col items-center justify-center text-slate-400 py-12"><h3 class="font-black text-xl mb-2">Sin resultados</h3><p class="font-medium">No hay entradas que coincidan con tus filtros.</p></div>';
        return;
    }

    filteredTickets.forEach(ticket => {
        const ev = ticket.events || {};
        const dateOpt = { weekday: 'short', day: 'numeric', month: 'short' };
        const dateStr = ev.date ? new Date(ev.date).toLocaleDateString('es-ES', dateOpt) : '';
        const priceStr = formatPrice(ticket.price);
        
        // Generamos datos del vendedor para la UI
        const pData = profileMap[ticket.seller_id] || { name: 'Vendedor Anónimo', avatar: null };
        const sellerName = pData.name || 'Vendedor Anónimo';
        const sellerSnippet = sellerName.split(' ')[0]; // Mostrar solo el primer nombre
        const formatLabel = ticket.format === 'pdf' ? 'Digital' : ticket.format === 'app' ? 'Transferencia' : 'Física';
        
        // Avatar styling
        const avatarImg = pData.avatar ? `<img src="${pData.avatar}" class="w-6 h-6 rounded-full object-cover shadow-sm ring-2 ring-white">` : `<span class="material-symbols-outlined text-[#10b981] text-xl">verified_user</span>`;
        
        const html = `
          <a href="order.html?ticket_id=${ticket.id}" class="block bg-white rounded-[16px] md:rounded-[24px] overflow-hidden border border-slate-100 shadow-[0_4px_20px_rgba(26,28,31,0.04)] flex flex-row md:flex-col hover:shadow-[0_12px_40px_rgba(26,28,31,0.08)] transition-all active:scale-[0.98]">
            <div class="w-[100px] sm:w-[140px] md:w-full h-auto min-h-[110px] md:h-[130px] bg-cover bg-center relative shrink-0" style="background-image: url('${ev.image_url || 'https://images.unsplash.com/photo-1540039155732-d6749b9325eb?w=800'}');">
              <div class="absolute inset-0 bg-black/10"></div>
              <div class="absolute top-2 left-2 md:top-3 md:right-3 md:left-auto bg-black/60 backdrop-blur-md text-white px-2 py-0.5 md:py-1 rounded-[6px] md:rounded-lg text-[9px] md:text-xs font-bold shadow-sm tracking-wide">
                ${formatLabel}
              </div>
            </div>
            <div class="p-3 md:p-6 flex-1 flex flex-col justify-center md:justify-start min-w-0">
              <div class="text-[#5144d4] text-[10px] md:text-[13px] font-black uppercase tracking-[0.1em] md:tracking-widest mb-0.5 md:mb-1 line-clamp-1">${dateStr}</div>
              <h3 class="font-bold text-[#1a1c1f] text-[14px] md:text-[1.1rem] leading-[1.15] md:leading-tight mb-1 md:mb-2 line-clamp-2">${ev.title || 'Evento General'}</h3>
              <div class="hidden md:flex text-[13px] text-slate-500 font-medium mb-5 items-center gap-1.5 line-clamp-1"><span class="material-symbols-outlined text-[1rem]">location_on</span> ${ev.location || 'Coordinar con vendedor'}</div>
              
              <div class="flex flex-col md:bg-slate-50/80 md:border md:border-slate-200/60 md:p-4 md:rounded-xl md:mt-auto">
                 <div class="flex max-md:flex-col max-md:gap-0.5 md:justify-between md:items-center mb-1 md:mb-2">
                    <span class="text-[11px] md:text-[12px] text-slate-500 font-medium md:uppercase md:tracking-widest md:font-semibold line-clamp-1"><span class="md:hidden font-bold text-slate-600">Sec:</span> ${ticket.section}</span>
                    <span class="font-black text-[#5144d4] text-[16px] md:text-[1.15rem] leading-none">${priceStr}</span>
                 </div>
                 <div class="hidden md:flex justify-between items-center pt-2 border-t border-slate-200/50">
                    <span class="text-[13px] font-medium text-slate-600 flex items-center gap-2">
                      ${avatarImg} <span class="truncate max-w-[80px]">${sellerSnippet}</span>
                    </span>
                 </div>
              </div>
              <div class="hidden md:flex w-full bg-[#faf9fd] text-[#1a1c1f] font-bold py-3.5 rounded-[14px] hover:bg-slate-200 transition-colors text-center shadow-sm justify-center items-center mt-6">
                 Comprar Ticket Seguro
              </div>
            </div>
          </a>
        `;
        
        container.insertAdjacentHTML('beforeend', html);
    });
  }

  // Escuchar eventos en los filtros
  const searchEl = document.getElementById('search-filter');
  const genreEl = document.getElementById('genre-filter');
  const priceEl = document.getElementById('price-sort');

  if (searchEl) searchEl.addEventListener('input', renderTickets);
  if (genreEl) genreEl.addEventListener('change', renderTickets);
  if (priceEl) priceEl.addEventListener('change', renderTickets);

  // Render inicial
  renderTickets();
});
