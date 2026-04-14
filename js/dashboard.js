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
      if (ticket.status === 'vendido' || ticket.status === 'entregado') {
        ventasCount++;
        income += Number(ticket.price);
      }
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
      filteredTickets = allTickets.filter(t => t.seller_id === userData.user.id && t.status === 'disponible');
    } else if (tabName === 'sold') {
      filteredTickets = allTickets.filter(t => t.seller_id === userData.user.id && (t.status === 'vendido' || t.status === 'entregado'));
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
      let statusClass = 'text-amber-600 bg-amber-50 border border-amber-200/50';
      let statusDot = 'bg-amber-500';
      
      if (ticket.status === 'disponible') {
        statusText = 'En Venta';
        statusClass = 'text-emerald-600 bg-emerald-50 border border-emerald-200/50';
        statusDot = 'bg-emerald-500';
      } else if (ticket.status === 'vendido') {
        statusText = isBuyer ? 'Adquirido (QR)' : 'Retenido en Escrow';
        statusClass = isBuyer ? 'text-emerald-600 bg-emerald-50 border border-emerald-200/50' : 'text-indigo-600 bg-indigo-50 border border-indigo-200/50';
        statusDot = isBuyer ? 'bg-emerald-500' : 'bg-indigo-500';
      } else if (ticket.status === 'entregado') {
        statusText = isBuyer ? 'Transacción Finalizada' : 'Liquidación Pendiente';
        statusClass = isBuyer ? 'text-slate-600 bg-slate-50 border border-slate-200/50' : 'text-blue-600 bg-blue-50 border border-blue-200/50';
        statusDot = isBuyer ? 'bg-slate-400' : 'bg-blue-500';
      }

      const d = new Date(ticket.created_at);
      const dateStr = d.toLocaleDateString();
      const formattedPrice = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(ticket.price);

      // Botones de accion segun rol y estado
      let actionsHtml = '';
      if (ticket.status === 'disponible') {
        if (isSeller) {
          actionsHtml = `<button onclick="window.deleteTicket('${ticket.id}')" class="text-red-400 hover:text-red-600 transition-colors" title="Eliminar Listado"><span class="material-symbols-outlined text-[1.4rem]">delete</span></button>`;
        }
      } else if (ticket.status === 'vendido' || ticket.status === 'entregado') {
        actionsHtml = `<a href="order.html?ticket_id=${ticket.id}" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#5144d4] text-[#5144d4] text-[13px] font-bold hover:bg-indigo-50 transition-colors"><span class="material-symbols-outlined text-[1rem]">chat</span> Coordinar</a>`;
      }

      const row = `
        <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-none">
          <td class="py-4 px-6 md:px-8">
            <div class="font-bold text-[#1a1c1f] text-sm md:text-[15px] mb-0.5">${eventTitle}</div>
            <div class="text-[12px] font-medium text-slate-500 uppercase tracking-widest">Sector: ${ticket.section}</div>
          </td>
          <td class="py-4 px-6 text-[14px] font-semibold text-slate-600">${transactionType}</td>
          <td class="py-4 px-6 text-[14px] font-medium text-slate-500">${dateStr}</td>
          <td class="py-4 px-6 font-black text-[#5144d4]">${formattedPrice}</td>
          <td class="py-4 px-6 md:px-8">
            <div class="flex items-center justify-end gap-4">
              <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold ${statusClass}">
                <span class="w-1.5 h-1.5 rounded-full ${statusDot}"></span>
                ${statusText}
              </span>
              ${actionsHtml}
            </div>
          </td>
        </tr>
      `;
      tableBody.insertAdjacentHTML('beforeend', row);
    });
  }

  // Lógica de Tabs
  const navMenuLinks = document.querySelectorAll('#dashboard-nav-menu a[data-tab]');
  const panelTitle = document.getElementById('panel-title');
  const tableTitle = document.getElementById('table-title');
  const statsGrid = document.getElementById('stats-grid');
  
  navMenuLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      // Quitar clases activas y resetear al estado inactivo Tailwind
      navMenuLinks.forEach(l => {
          l.className = "flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm text-slate-500 hover:text-[#5144d4] hover:bg-[#faf9fd] transition-colors";
      });
      // Añadir purpurina Tailwind activo
      link.className = "flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-colors text-[#5144d4] bg-indigo-50/50";
      
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
        <td colspan="5" class="py-16 text-center text-slate-500 font-medium">No tienes actividad registrada aún. <br><br> <a href="sell.html" class="text-[#5144d4] font-bold hover:underline">Publica tu primera entrada</a> o <a href="marketplace.html" class="text-[#5144d4] font-bold hover:underline">explora eventos</a>.</td>
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


