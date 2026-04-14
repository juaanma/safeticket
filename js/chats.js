// js/chats.js

document.addEventListener('DOMContentLoaded', async () => {
  if (!window.MiSupabase) {
    alert("Error de conexión con la base de datos.");
    return;
  }

  const { data: userData } = await window.MiSupabase.auth.getUser();
  if (!userData || !userData.user) {
    window.location.href = 'login.html';
    return;
  }

  const currentUserId = userData.user.id;
  const listContainer = document.getElementById('chats-list');

  // Buscar todos los tickets donde soy comprador o vendedor, que ya están en proceso de entrega o finalizados.
  const { data: tickets, error } = await window.MiSupabase
    .from('tickets')
    .select('*, events(*)')
    .or(`seller_id.eq.${currentUserId},buyer_id.eq.${currentUserId}`)
    .in('status', ['vendido', 'entregado', 'liquidado'])
    .order('created_at', { ascending: false });

  if (error || !tickets || tickets.length === 0) {
    listContainer.innerHTML = `
      <div class="empty-state">
        <i class="ph-fill ph-chat-teardrop-slash"></i>
        <p>No tienes mensajes ni negociaciones activas en este momento.</p>
        <a href="marketplace.html" class="btn btn-outline" style="margin-top: 1rem;">Explorar Eventos</a>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = '';

  for (const ticket of tickets) {
    const isSeller = ticket.seller_id === currentUserId;
    const isBuyer = ticket.buyer_id === currentUserId;

    // Si es ambos (prueba local de que compro su propio ticket) lo tratamos como comprador primario para evitar errores lógicos,
    // o le damos doble badge.
    
    // Identificar a la contraparte
    let counterpartyId = null;
    let typeTag = '';
    let badgeClass = '';
    
    if (isSeller && !isBuyer) {
      counterpartyId = ticket.buyer_id;
      typeTag = 'VENTA';
      badgeClass = 'badge-venta';
    } else if (isBuyer && !isSeller) {
      counterpartyId = ticket.seller_id;
      typeTag = 'COMPRA';
      badgeClass = 'badge-compra';
    } else {
      // Testing locally buying own ticket
      counterpartyId = currentUserId; 
      typeTag = 'AUTO-COMPRA';
      badgeClass = 'badge-compra';
    }

    if (ticket.status === 'entregado') {
      typeTag = typeTag + ' FINALIZADA';
      badgeClass = 'badge-cerrado';
    }

    // Obtener perfil de la contraparte
    let counterName = 'Usuario Desconocido';
    let avatarStyle = '';
    let initials = 'US';

    if (counterpartyId) {
      const { data: profile } = await window.MiSupabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('user_id', counterpartyId)
        .maybeSingle();

      if (profile) {
        counterName = profile.full_name || '#' + counterpartyId.substring(0, 4).toUpperCase();
        if (profile.avatar_url) {
          avatarStyle = `background-image: url('${profile.avatar_url}');`;
          initials = '';
        } else {
          initials = counterName.substring(0, 2).toUpperCase();
        }
      }
    }

    const eventTitle = ticket.events ? ticket.events.title : 'Evento Eliminado';
    const d = new Date(ticket.updated_at || ticket.created_at);
    const dateStr = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

    const card = document.createElement('a');
    card.href = `order.html?ticket_id=${ticket.id}`;
    card.className = "bg-white border border-slate-200/60 rounded-3xl p-5 flex flex-col md:flex-row gap-4 md:items-center hover:border-[#5144d4] hover:shadow-[0_8px_30px_rgba(81,68,212,0.08)] transition-all group relative";
    
    // Badge styles
    let badgeTailwind = "bg-slate-100 text-slate-600";
    if (badgeClass === 'badge-compra') badgeTailwind = "bg-indigo-100/80 text-[#5144d4]";
    if (badgeClass === 'badge-venta') badgeTailwind = "bg-emerald-100/80 text-emerald-600";
    if (badgeClass === 'badge-cerrado') badgeTailwind = "bg-slate-200 text-slate-500";
    
    // Avatar styles
    let avatarTailwind = avatarStyle ? `background-image: ${avatarStyle.match(/url\('.*?'\)/)[0]};` : '';

    card.innerHTML = `
      <div class="absolute top-5 right-5 ${badgeTailwind} font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-lg">
        ${typeTag}
      </div>
      
      <div class="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-bold text-lg shrink-0 bg-cover bg-center border border-slate-200" style="${avatarTailwind}">
        ${initials}
      </div>
      
      <div class="flex-1 flex flex-col justify-center min-w-0 pr-20 md:pr-4">
        <div class="flex items-center gap-3 mb-1">
          <h3 class="font-bold text-[#1a1c1f] text-[1.1rem] truncate">${counterName}</h3>
          <span class="text-xs font-semibold text-slate-400">${dateStr}</span>
        </div>
        <div class="text-sm font-medium text-slate-600 truncate mb-3">
          ${eventTitle} <span class="text-slate-400">(Sec: ${ticket.section})</span>
        </div>
        <div class="flex items-center gap-1.5 text-[13px] font-bold text-[#5144d4] group-hover:translate-x-1 transition-transform">
          Consultar estado <span class="material-symbols-outlined text-[1rem]">arrow_forward</span>
        </div>
      </div>
    `;

    listContainer.appendChild(card);
  }
});
