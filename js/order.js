// js/order.js

let currentStep = 1;
let ticketData = null;
let eventData = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!window.MiSupabase) {
    alert("Error de conexión con la base de datos.");
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const ticketId = urlParams.get('ticket_id');

  if (!ticketId) {
    alert("Entrada no encontrada.");
    window.location.href = 'marketplace.html';
    return;
  }

  // 1. Obtener ticket y evento
  const { data: ticket, error } = await window.MiSupabase
    .from('tickets')
    .select('*, events(*)')
    .eq('id', ticketId)
    .single();

  if (error || !ticket) {
    alert("Entrada no disponible o eliminada.");
    window.location.href = 'marketplace.html';
    return;
  }

  ticketData = ticket;
  eventData = ticket.events;

  // Si ya estaba en un estado distinto a "disponible", tal vez redirigir iterando steps
  if (ticket.status === 'vendido') {
    // Para simplificar, asumimos que este flujo es the happy path nuevo
    // pero si recargan, podríamos saltar al paso 4
  }

  populateData();
  startTimer(10 * 60, document.getElementById('checkout-timer'));
});

function populateData() {
  const formatARS = (num) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(num);

  const price = Number(ticketData.price);
  const fee = price * 0.08;
  const total = price + fee;

  const dateOpt = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
  const dateStr = new Date(eventData.date).toLocaleDateString('es-ES', dateOpt).replace(',', ' •') + ' hs';

  // Step 1
  document.getElementById('s1-event-title').innerText = eventData.title;
  document.getElementById('s1-event-detail').innerText = dateStr;
  document.getElementById('s1-ticket-section').innerText = ticketData.section;
  document.getElementById('s1-price').innerText = formatARS(price);
  document.getElementById('s1-fee').innerText = formatARS(fee);
  document.getElementById('s1-total').innerText = formatARS(total);

  // Step 2
  document.getElementById('s2-total').innerText = formatARS(total);

  // Step 3 / 4 variables
  document.getElementById('s3-op-id').innerText = ticketData.id.split('-')[0].toUpperCase();
  document.getElementById('s4-seller-id').innerText = '#' + ticketData.seller_id.substring(0, 4).toUpperCase();
}

function goToStep(stepNumber) {
  document.querySelectorAll('.step-view').forEach(el => el.classList.remove('active'));
  document.getElementById('step-' + stepNumber).classList.add('active');
  currentStep = stepNumber;
  window.scrollTo(0, 0);
}

// Timer logic
function startTimer(duration, display) {
  let timer = duration, minutes, seconds;
  setInterval(function () {
    minutes = parseInt(timer / 60, 10);
    seconds = parseInt(timer % 60, 10);

    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    display.textContent = minutes + ":" + seconds;

    if (--timer < 0) {
      timer = 0;
      // timeout behavior
    }
  }, 1000);
}

function copyToClipboard(text, btnEl) {
  navigator.clipboard.writeText(text).then(() => {
    const originalText = btnEl.innerHTML;
    btnEl.innerHTML = '<i class="ph-bold ph-check"></i> Copiado';
    setTimeout(() => { btnEl.innerHTML = originalText; }, 2000);
  });
}

async function simulatePaymentValidation() {
  const btn = document.getElementById('btn-ya-transferi');
  const spinner = document.getElementById('validation-spinner');
  
  btn.style.display = 'none';
  spinner.style.display = 'block';

  // Marcar simuladamente el ticket como vendido (backend real)
  const { data: userData } = await window.MiSupabase.auth.getUser();
  if (userData && userData.user) {
    await window.MiSupabase
      .from('tickets')
      .update({ status: 'vendido', buyer_id: userData.user.id })
      .eq('id', ticketData.id);
  }

  setTimeout(() => {
    goToStep(3);
  }, 3000); // 3 seconds validation simulation
}

function finalizeOrder() {
  goToStep(4);
}

function switchTab(tabName) {
  const tabStatus = document.getElementById('tab-status');
  const tabChat = document.getElementById('tab-chat');
  const viewStatus = document.getElementById('view-status');
  const viewChat = document.getElementById('view-chat');

  // Reset
  tabStatus.classList.remove('active');
  tabChat.classList.remove('active');
  tabStatus.style.borderBottomColor = 'transparent';
  tabStatus.style.color = 'var(--text-muted)';
  tabChat.style.borderBottomColor = 'transparent';
  tabChat.style.color = 'var(--text-muted)';

  viewStatus.style.display = 'none';
  viewChat.style.display = 'none';

  if (tabName === 'status') {
    tabStatus.classList.add('active');
    tabStatus.style.borderBottomColor = 'var(--primary)';
    tabStatus.style.color = 'var(--primary)';
    viewStatus.style.display = 'block';
  } else {
    tabChat.classList.add('active');
    tabChat.style.borderBottomColor = 'var(--primary)';
    tabChat.style.color = 'var(--primary)';
    viewChat.style.display = 'block';
  }
}

function sendMsgInput() {
  const input = document.getElementById('chat-input');
  const val = input.value.trim();
  if (!val) return;
  sendMsg(val);
  input.value = '';
}

function sendMsg(text) {
  const container = document.getElementById('chat-messages');
  
  const div = document.createElement('div');
  div.className = 'chat-msg sent';
  div.innerText = text;
  container.appendChild(div);
  
  // Auto-scroll
  container.scrollTop = container.scrollHeight;

  // Respuesta simulada
  setTimeout(() => {
    const rDiv = document.createElement('div');
    rDiv.className = 'chat-msg received';
    rDiv.innerText = "¡Dale, genial! Ahora mismo estoy en el trabajo, te hago el envío ni bien llego a casa a las 18hs :)";
    container.appendChild(rDiv);
    container.scrollTop = container.scrollHeight;
  }, 2500);
}
