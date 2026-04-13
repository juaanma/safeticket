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
    card.className = 'chat-card';
    card.innerHTML = `
      <div class="chat-badge ${badgeClass}">${typeTag}</div>
      <div class="chat-avatar" style="${avatarStyle}">${initials}</div>
      <div class="chat-content">
        <div class="chat-header-row">
          <div class="chat-name">${counterName}</div>
          <div class="chat-date">${dateStr}</div>
        </div>
        <div class="chat-event"><i class="ph-bold ph-ticket"></i> ${eventTitle} (Sec: ${ticket.section})</div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.3rem;"><i class="ph-bold ph-arrow-right"></i> Haz clic para ver el estado y hablar</div>
      </div>
    `;

    listContainer.appendChild(card);
  }
});
