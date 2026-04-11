// js/dashboard.js

document.addEventListener('DOMContentLoaded', async () => {
  if (!window.MiSupabase) return;

  const tableBody = document.getElementById('dashboard-tx-list');
  if (!tableBody) return;

  const { data: userData } = await window.MiSupabase.auth.getUser();
  if (!userData || !userData.user) return;

  // Actualizar perfil Sidebar KYC
  const profileStatus = document.getElementById('profile-status');
  const btnKycVerify = document.getElementById('btn-kyc-verify');
  const { data: profile } = await window.MiSupabase
    .from('profiles')
    .select('is_verified')
    .eq('user_id', userData.user.id)
    .single();

  if (profile && profile.is_verified) {
    profileStatus.style.color = '#10b981'; // Green
    profileStatus.innerHTML = '<i class="ph-fill ph-shield-check"></i> Identidad Validada';
    if (btnKycVerify) btnKycVerify.style.display = 'none';
  }

  // Cargar tickets del usuario (Compras y Ventas)
  const { data: tickets, error } = await window.MiSupabase
    .from('tickets')
    .select('*, events(*)')
    .or(`seller_id.eq.${userData.user.id},buyer_id.eq.${userData.user.id}`)
    .order('created_at', { ascending: false });

  if (error || !tickets || tickets.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--text-muted); padding:3rem;">No tienes actividad registrada aún. <br><br> <a href="sell.html" style="color:var(--primary); text-decoration: underline;">Pública tu primera entrada</a> o <a href="marketplace.html" style="color:var(--primary); text-decoration: underline;">explora eventos</a>.</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = '';
  
  let income = 0;
  let ventasCount = 0;
  let comprasCount = 0;
  
  tickets.forEach(ticket => {
    const isSeller = ticket.seller_id === userData.user.id;
    const isBuyer = ticket.buyer_id === userData.user.id;

    if (isSeller) {
      ventasCount++;
      if (ticket.status === 'disponible' || ticket.status === 'vendido') {
        income += Number(ticket.price);
      }
    }
    if (isBuyer) comprasCount++;

    const eventTitle = ticket.events ? ticket.events.title : 'Evento Desconocido';
    const transactionType = isBuyer ? 'Compra' : 'Venta';
    
    let statusText = ticket.status;
    let statusClass = 'status-pending';
    
    if (ticket.status === 'disponible') {
      statusText = 'En Venta';
      statusClass = 'status-success';
    } else if (ticket.status === 'vendido') {
      statusText = isBuyer ? 'Adquirido (QR Activo)' : 'Retenido en Escrow';
      statusClass = isBuyer ? 'status-success' : 'status-pending';
    }

    const d = new Date(ticket.created_at);
    const dateStr = d.toLocaleDateString();
    const formattedPrice = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(ticket.price);

    // Boton de cancelar si soy el vendedor y sigue disponible
    let actionsHtml = '';
    if (isSeller && ticket.status === 'disponible') {
      actionsHtml = `<button onclick="window.deleteTicket('${ticket.id}')" style="background:transparent; border:none; color:#ef4444; cursor:pointer;" title="Eliminar Listado"><i class="ph-bold ph-trash"></i></button>`;
    }

    const row = `
      <tr>
        <td><strong>${eventTitle}</strong><br><span style="font-size: 0.85rem; color: var(--text-muted);">Sector: ${ticket.section}</span></td>
        <td>${transactionType}</td>
        <td>${dateStr}</td>
        <td>${formattedPrice}</td>
        <td>
          <div style="display:flex; align-items:center; gap: 1rem;">
            <span class="status-badge ${statusClass}">${statusText}</span>
            ${actionsHtml}
          </div>
        </td>
      </tr>
    `;
    tableBody.insertAdjacentHTML('beforeend', row);
  });

  // Atualizar stats superiores
  const statValues = document.querySelectorAll('.stat-value');
  if (statValues.length >= 3) {
    const formattedIncome = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(income);
    statValues[0].innerText = formattedIncome;
    statValues[1].innerText = ventasCount.toString();
    statValues[2].innerText = comprasCount.toString();
  }
});

// Función global para eliminar listado
window.deleteTicket = async (ticketId) => {
  if(!confirm('¿Estás seguro de que deseas cancelar la publicación de esta entrada? (Desaparecerá permanentemente)')) return;

  const { error } = await window.MiSupabase
    .from('tickets')
    .delete()
    .eq('id', ticketId);

  if (error) {
    alert('Error al intentar eliminar la entrada: ' + error.message);
  } else {
    alert('Entrada eliminada exitosamente.');
    window.location.reload();
  }
};
