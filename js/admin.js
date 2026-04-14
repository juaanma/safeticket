// js/admin.js

const ADMIN_EMAIL = 'safebeatcontacto@gmail.com';

document.addEventListener('DOMContentLoaded', async () => {
  if (!window.MiSupabase) {
    return;
  }

  const { data: sessionData, error: sessionError } = await window.MiSupabase.auth.getSession();
  if (sessionError || !sessionData || !sessionData.session) {
    // Si no hay sesión, simplemente dejamos la página 404 visible
    return;
  }

  const userEmail = sessionData.session.user.email;
  if (userEmail !== ADMIN_EMAIL) {
    // Si no es el admin, dejamos la página 404 visible sin dar explicaciones
    return;
  }

  // Si es el admin: Ocultar 404 y mostrar la interfaz de admin
  const fake404 = document.getElementById('fake-404-ui');
  const adminSecret = document.getElementById('admin-secret-ui');
  
  if (fake404) fake404.style.display = 'none';
  if (adminSecret) adminSecret.style.display = 'block';

  // Load everything
  await loadAdminData();
});

async function loadAdminData() {
  const tbody = document.getElementById('admin-tx-list');
  
  // Extraemos todos los tickets que NO estén disponibles, o sean relevantes
  // Por simplicidad, traemos todos los tickets para control total.
  const { data: tickets, error } = await window.MiSupabase
    .from('tickets')
    .select('*, events(title)')
    .order('created_at', { ascending: false });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#ef4444;">Error al cargar datos globales: Asegúrate de haber ejecutado la regla RLS del Admin en Supabase.</td></tr>`;
    console.error("Admin DB Error: ", error);
    return;
  }

  if (!tickets || tickets.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No hay registros en la base de datos.</td></tr>`;
    return;
  }

  let totalEscrow = 0;
  let totalEarnings = 0;
  let txCount = 0;

  tbody.innerHTML = '';

  const formatARS = (num) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(num);

  tickets.forEach(ticket => {
    const price = Number(ticket.price);
    const fee = price * 0.08;
    const total = price + fee;
    
    // KPIs Logic
    if (ticket.status === 'vendido') {
      totalEscrow += total; // Todo el dinero lo tenemos retenido nosotros
      txCount++;
    } else if (ticket.status === 'entregado') {
      totalEscrow += price; // Nosotros le debemos el precio base al vendedor
      totalEarnings += fee; // El 8% ya es ganancia consolidada
      txCount++;
    } else if (ticket.status === 'liquidado') {
      // Ya transferimos al vendedor. Escrow es 0 de esta transacción.
      totalEarnings += fee; // Nuestra ganancia histórica se mantiene
      txCount++;
    }

    // Render Row
    let statusBadgeClass = ticket.status;
    let statusText = ticket.status.toUpperCase();
    
    let btnAction = '-';
    if (ticket.status === 'entregado') {
      btnAction = `<button class="btn-liquidar" onclick="liquidarVendedor('${ticket.id}')">Liquidar Vendedor</button>`;
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="id-col" title="${ticket.id}">${ticket.id.substring(0, 8)}...</td>
      <td><strong>${ticket.events ? ticket.events.title : 'N/A'}</strong></td>
      <td style="font-size: 0.8rem; color:var(--text-muted);">
        <div style="margin-bottom: 2px;">V: <span class="id-col">${ticket.seller_id ? ticket.seller_id.substring(0,6) : 'N/A'}</span></div>
        <div>C: <span class="id-col">${ticket.buyer_id ? ticket.buyer_id.substring(0,6) : 'N/A'}</span></div>
      </td>
      <td><strong>${formatARS(total)}</strong><br><span style="font-size: 0.75rem; color:var(--text-muted);">(Ticket: ${formatARS(price)})</span></td>
      <td><span class="status-badge ${statusBadgeClass}">${statusText}</span></td>
      <td>${btnAction}</td>
    `;
    tbody.appendChild(tr);
  });

  // Update KPIs
  document.getElementById('kpi-escrow').innerText = formatARS(totalEscrow);
  document.getElementById('kpi-earnings').innerText = formatARS(totalEarnings);
  document.getElementById('kpi-ops').innerText = txCount.toString();
}

// Global func para boton
window.liquidarVendedor = async (ticketId) => {
  if(!confirm("¿Estás 100% seguro de que le transferiste el dinero al Vendedor a través de su CVU? Esta acción marcará la operación como Finalizada definitivamente.")) return;

  const { error } = await window.MiSupabase
    .from('tickets')
    .update({ status: 'liquidado' })
    .eq('id', ticketId);

  if (error) {
    alert("Error de base de datos: No se pudo actualizar el estado a liquidado.");
    console.error(error);
  } else {
    // Recargar tabla
    loadAdminData();
  }
};
