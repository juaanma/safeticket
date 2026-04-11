// js/dashboard.js

document.addEventListener('DOMContentLoaded', async () => {
  if (!window.MiSupabase) return;

  const tableBody = document.getElementById('dashboard-tx-list');
  if (!tableBody) return;

  const { data: userData } = await window.MiSupabase.auth.getUser();
  if (!userData || !userData.user) return;

  // Actualizar perfil Sidebar KYC y Nombre
  const profileStatus = document.getElementById('profile-status');
  const btnKycVerify = document.getElementById('btn-kyc-verify');
  const { data: profile } = await window.MiSupabase
    .from('profiles')
    .select('*')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  const metadataNameForAlias = (userData && userData.user && userData.user.user_metadata && userData.user.user_metadata.full_name) 
    ? userData.user.user_metadata.full_name 
    : '';
  const profileNameEl = document.getElementById('dashboard-user-name');
  const profileInitialsEl = document.getElementById('dashboard-user-initials');
  const nameStr = metadataNameForAlias || (profile && profile.full_name) || 'Usuario';
  
  if (profileNameEl) profileNameEl.innerText = nameStr;
  if (profileInitialsEl) profileInitialsEl.innerText = nameStr.substring(0, 2).toUpperCase();

  const isKycPending = (profile && profile.phone && String(profile.phone).includes("DNI")) || localStorage.getItem('kyc_pending_' + userData.user.id) === 'true';

  if (profile && profile.is_verified) {
    const wrapper = document.getElementById('profile-status-wrapper');
    if (wrapper) {
      wrapper.style.background = 'rgba(16, 185, 129, 0.05)';
      wrapper.style.borderColor = 'rgba(16, 185, 129, 0.3)';
    }
    const profileStatus = document.getElementById('profile-status');
    const btnKycVerify = document.getElementById('btn-kyc-verify');
    if (profileStatus) {
      profileStatus.style.color = '#059669'; 
      profileStatus.style.background = 'rgba(16, 185, 129, 0.15)';
      profileStatus.innerHTML = '<i class="ph-fill ph-shield-check"></i> Cuenta Validada';
    }
    if (btnKycVerify) btnKycVerify.style.display = 'none';
    const textDesc = document.getElementById('profile-status-text');
    if(textDesc) textDesc.innerHTML = 'Felicidades, puedes operar sin límites en la plataforma.';
  } else if (isKycPending) {
    const wrapper = document.getElementById('profile-status-wrapper');
    if (wrapper) {
      wrapper.style.background = 'rgba(59, 130, 246, 0.05)';
      wrapper.style.borderColor = 'rgba(59, 130, 246, 0.3)';
    }
    const profileStatus = document.getElementById('profile-status');
    const btnKycVerify = document.getElementById('btn-kyc-verify');
    if (profileStatus) {
      profileStatus.style.color = '#2563eb'; 
      profileStatus.style.background = 'rgba(59, 130, 246, 0.15)';
      profileStatus.innerHTML = '<i class="ph-fill ph-clock-afternoon"></i> En Revisión';
    }
    if (btnKycVerify) btnKycVerify.style.display = 'none';
    const textDesc = document.getElementById('profile-status-text');
    if(textDesc) textDesc.innerHTML = 'Tus documentos están en evaluación.';
  }

  // Load avatar desde base de datos remota si existe
  const savedAvatar = (profile && profile.avatar_url) ? profile.avatar_url : null;
  if (savedAvatar) {
    if (profileInitialsEl) {
      profileInitialsEl.style.backgroundImage = `url(${savedAvatar})`;
      profileInitialsEl.innerText = '';
    }
  } else {
    if (profileInitialsEl) profileInitialsEl.innerText = nameStr.substring(0, 2).toUpperCase();
  }

  // Cargar tickets del usuario (Compras y Ventas)
  const { data: tickets, error } = await window.MiSupabase
    .from('tickets')
    .select('*, events(*)')
    .or(`seller_id.eq.${userData.user.id},buyer_id.eq.${userData.user.id}`)
    .order('created_at', { ascending: false });

  const allTickets = tickets || [];

  // Actualizar stats superiores
  let income = 0;
  let ventasCount = 0;
  let comprasCount = 0;
  
  allTickets.forEach(ticket => {
    const isSeller = ticket.seller_id === userData.user.id;
    const isBuyer = ticket.buyer_id === userData.user.id;
    if (isSeller) {
      ventasCount++;
      if (ticket.status === 'disponible' || ticket.status === 'vendido') income += Number(ticket.price);
    }
    if (isBuyer) comprasCount++;
  });

  const statValues = document.querySelectorAll('.stat-value');
  if (statValues.length >= 3) {
    const formattedIncome = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(income);
    statValues[0].innerText = formattedIncome;
    statValues[1].innerText = ventasCount.toString();
    statValues[2].innerText = comprasCount.toString();
  }

  function renderTable(tabName) {
    tableBody.innerHTML = '';
    
    let filteredTickets = allTickets;
    
    if (tabName === 'purchases') {
      filteredTickets = allTickets.filter(t => t.buyer_id === userData.user.id);
    } else if (tabName === 'published') {
      filteredTickets = allTickets.filter(t => t.seller_id === userData.user.id);
    } else if (tabName === 'sold') {
      filteredTickets = allTickets.filter(t => t.seller_id === userData.user.id && t.status === 'vendido');
    }

    if (filteredTickets.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-muted); padding:3rem;">No hay actividad para esta sección.</td>
        </tr>
      `;
      return;
    }

    filteredTickets.forEach(ticket => {
      const isSeller = ticket.seller_id === userData.user.id;
      const isBuyer = ticket.buyer_id === userData.user.id;

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
  }

  // Lógica de Tabs
  const navMenuLinks = document.querySelectorAll('#dashboard-nav-menu a');
  const panelTitle = document.getElementById('panel-title');
  const tableTitle = document.getElementById('table-title');
  const statsGrid = document.getElementById('stats-grid');
  
  navMenuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      // Quitar active
      navMenuLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      const tabName = link.getAttribute('data-tab');
      
      if (tabName === 'all') {
        if(panelTitle) panelTitle.innerText = 'Resumen de Actividad';
        if(tableTitle) tableTitle.innerText = 'Transacciones Recientes';
        if (statsGrid) statsGrid.style.display = 'grid';
      } else if (tabName === 'purchases') {
        if(panelTitle) panelTitle.innerText = 'Mis Compras';
        if(tableTitle) tableTitle.innerText = 'Entradas que has adquirido';
        if (statsGrid) statsGrid.style.display = 'none';
      } else if (tabName === 'published') {
        if(panelTitle) panelTitle.innerText = 'Entradas Publicadas';
        if(tableTitle) tableTitle.innerText = 'Tus listados en el mercado';
        if (statsGrid) statsGrid.style.display = 'none';
      } else if (tabName === 'sold') {
        if(panelTitle) panelTitle.innerText = 'Entradas Vendidas';
        if(tableTitle) tableTitle.innerText = 'Ventas finalizadas o pendientes de liberación';
        if (statsGrid) statsGrid.style.display = 'none';
      }

      renderTable(tabName);
    });
  });

  // Render inicial general
  if (allTickets.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--text-muted); padding:3rem;">No tienes actividad registrada aún. <br><br> <a href="sell.html" style="color:var(--primary); text-decoration: underline;">Publica tu primera entrada</a> o <a href="marketplace.html" style="color:var(--primary); text-decoration: underline;">explora eventos</a>.</td>
      </tr>
    `;
  } else {
    renderTable('all');
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
    alert('Entrada eliminada eéxitosamente.');
    window.location.reload();
  }
};


