// js/tickets.js
document.addEventListener('DOMContentLoaded', async () => {
  if (!window.MiSupabase) return;

  const container = document.getElementById('tickets-grid-container');
  if (!container) return;

  // Mostramos el loader temporal
  container.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color: var(--text-muted); margin-top: 2rem;"><i class="ph-bold ph-spinner ph-spin" style="font-size: 2rem; margin-bottom: 1rem;"></i><br>Cargando entradas...</p>';

  const { data: tickets, error } = await window.MiSupabase
    .from('tickets')
    .select('*, events(*)')
    .eq('status', 'disponible')
    .order('created_at', { ascending: false });

  if (error || !tickets || tickets.length === 0) {
    container.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color: var(--text-muted); margin-top: 2rem;">No hay entradas publicadas en este momento.</p>';
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

  // Si hay al menos un ticket, limpiar y renderizar
  container.innerHTML = '';
  // Aseguramos variables de layout fluidas
  container.style.display = 'grid';
  container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(300px, 1fr))';
  container.style.gap = '1.5rem';

  const formatPrice = (number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(number);

  tickets.forEach(ticket => {
    const ev = ticket.events || {};
    const dateOpt = { weekday: 'short', day: 'numeric', month: 'short' };
    const dateStr = ev.date ? new Date(ev.date).toLocaleDateString('es-ES', dateOpt) : '';
    const priceStr = formatPrice(ticket.price);
    
    // Generamos datos del vendedor para la UI
    const pData = profileMap[ticket.seller_id] || { name: 'Vendedor Anónimo', avatar: null };
    const sellerName = pData.name || 'Vendedor Anónimo';
    const sellerSnippet = sellerName.split(' ')[0]; // Mostrar solo el primer nombre
    const formatLabel = ticket.format === 'pdf' ? 'Digital' : ticket.format === 'app' ? 'Transferencia' : 'Física';
    
    // Si tiene foto, armamos la etiqueta img, de lo contrario un ícono genérico verificado
    const avatarImg = pData.avatar ? `<img src="${pData.avatar}" style="width: 22px; height: 22px; border-radius: 50%; object-fit: cover;">` : `<i class="ph-fill ph-check-circle" style="color: #10b981;"></i>`;
    
    const html = `
      <div class="ticket-card" style="display:flex; flex-direction:column; border: 1px solid var(--border); border-radius: var(--radius-sm); overflow:hidden; background: var(--surface);">
        <div style="height: 120px; background-image: url('${ev.image_url || 'https://images.unsplash.com/photo-1540039155732-d6749b9325eb?w=800'}'); background-size: cover; background-position: center; position: relative;">
          <div style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.6); color: white; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">${formatLabel}</div>
        </div>
        <div style="padding: 1rem; flex: 1; display:flex; flex-direction:column;">
          <div style="color: var(--primary); font-size: 0.8rem; font-weight:600; margin-bottom: 0.2rem;">${dateStr}</div>
          <h3 style="font-size: 1.1rem; margin-bottom: 0.5rem; color: var(--text-main); line-height: 1.3;">${ev.title || 'Evento General'}</h3>
          <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.8rem;"><i class="ph-fill ph-map-pin"></i> ${ev.location || 'Coordinar con vendedor'}</div>
          
          <div style="background: var(--bg-color); border: 1px dashed var(--border); padding: 0.8rem; border-radius: var(--radius-sm); margin-bottom: 1rem; margin-top: auto;">
             <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <span style="font-size: 0.8rem; color: var(--text-muted);">Sector</span>
                <span style="font-weight: 600; font-size: 0.9rem;">${ticket.section}</span>
             </div>
             <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.8rem; color: var(--text-muted); display:flex; align-items:center; gap:0.4rem;">
                  ${avatarImg} ${sellerSnippet}
                </span>
                <span style="font-weight: 700; color: var(--primary); font-size: 1.1rem;">${priceStr}</span>
             </div>
          </div>
          <a href="event.html?id=${ticket.event_id}" class="btn btn-primary" style="width: 100%; text-align: center;">Comprar Seguro</a>
        </div>
      </div>
    `;
    
    container.insertAdjacentHTML('beforeend', html);
  });
});
