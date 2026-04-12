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

  const { data: sessionData } = await window.MiSupabase.auth.getSession();
  if (!sessionData || !sessionData.session) {
    alert("Debes iniciar sesión para ver esta orden.");
    window.location.href = 'login.html';
    return;
  }

  ticketData = ticket;
  eventData = ticket.events;
  window.currentUser = sessionData.session.user;

  const isSeller = window.currentUser.id === ticket.seller_id;

  populateData();

  if (isSeller) {
    // Si es el vendedor, salta directamente al chat de coordinación
    goToStep(4);
    switchTab('chat');
    const recBox = document.getElementById('reception-box');
    if (recBox) recBox.style.display = 'none';
  } else {
    // Si es el comprador, inicia o retoma el flujo
    if (ticket.status === 'vendido' || ticket.status === 'entregado') {
      goToStep(4);
      if (ticket.status === 'entregado') {
        const recBox = document.getElementById('reception-box');
        if(recBox) {
          recBox.style.background = 'rgba(16, 185, 129, 0.05)';
          recBox.style.borderColor = 'rgba(16, 185, 129, 0.3)';
          recBox.innerHTML = '<div style="color: #10b981; font-weight: 600; text-align:center; padding:1rem;"><i class="ph-fill ph-check-circle" style="font-size:3rem; margin-bottom: 0.5rem;"></i><br><span style="font-size: 1.2rem;">Entrega Confirmada</span><p style="color:var(--text-muted); font-size:0.85rem; margin-top: 0.5rem; font-weight: normal;">Has notificado la recepción válida de la entrada. El vendedor recibirá sus fondos.<br>¡Disfruta el evento!</p></div>';
        }
        setTimeout(() => {
          const items = document.querySelectorAll('.timeline-item');
          if(items.length >= 4) {
             items[2].classList.remove('active');
             items[2].classList.add('completed');
             items[3].classList.add('completed');
          }
        }, 50);
      }
    } else {
      startTimer(10 * 60, document.getElementById('checkout-timer'));
    }
  }

  // Configurar chat en vivo
  await loadMessages();
  subscribeToChat(ticketId);
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
  
  const isSellerInfo = window.currentUser.id === ticketData.seller_id;
  const counterpartyId = isSellerInfo ? ticketData.buyer_id : ticketData.seller_id;

  if (counterpartyId) {
    window.MiSupabase.from('profiles').select('full_name, avatar_url').eq('user_id', counterpartyId).maybeSingle().then(({data}) => {
      const nameLabel = document.getElementById('chat-name-label');
      const avatarDiv = document.getElementById('chat-avatar');
      
      const roleText = isSellerInfo ? 'Comprador' : 'Vendedor';
      let nameText = data && data.full_name ? data.full_name : '#' + counterpartyId.substring(0, 4).toUpperCase();
      
      if (nameLabel) {
        nameLabel.innerHTML = `${roleText}: <strong>${nameText}</strong>`;
      }
      
      if (data && data.avatar_url && avatarDiv) {
        avatarDiv.style.backgroundImage = `url(${data.avatar_url})`;
        avatarDiv.innerHTML = '';
      }
    });
  } else {
    // Fallback if no buyer yet
    const nameLabel = document.getElementById('chat-name-label');
    if (nameLabel) nameLabel.innerHTML = `Vendedor: <strong>#${ticketData.seller_id.substring(0, 4).toUpperCase()}</strong>`;
  }
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
    // scroll al fondo al abrir
    const container = document.getElementById('chat-messages');
    container.scrollTop = container.scrollHeight;
  }
}

async function loadMessages() {
  const container = document.getElementById('chat-messages');
  container.innerHTML = '<div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; margin: 1rem 0;">A partir de este momento puedes coordinar la entrega en tiempo real.</div>';

  const { data: messages, error } = await window.MiSupabase
    .from('messages')
    .select('*')
    .eq('ticket_id', ticketData.id)
    .order('created_at', { ascending: true });

  if (!error && messages) {
    messages.forEach(msg => appendMessageUI(msg));
  }
}

function subscribeToChat(tId) {
  window.MiSupabase.channel('chat_room_' + tId)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `ticket_id=eq.${tId}` }, payload => {
      appendMessageUI(payload.new);
    })
    .subscribe();
}

function appendMessageUI(msg) {
  const container = document.getElementById('chat-messages');
  const isMine = msg.sender_id === window.currentUser.id;
  
  const div = document.createElement('div');
  div.className = isMine ? 'chat-msg sent' : 'chat-msg received';
  div.innerText = msg.content;
  container.appendChild(div);
  
  container.scrollTop = container.scrollHeight;
}

async function sendMsgInput() {
  const input = document.getElementById('chat-input');
  const val = input.value.trim();
  if (!val) return;
  
  input.value = '';
  input.disabled = true;

  const { error } = await window.MiSupabase.from('messages').insert([{
    ticket_id: ticketData.id,
    sender_id: window.currentUser.id,
    content: val
  }]);

  input.disabled = false;
  input.focus();
}

function sendMsg(text) {
  const input = document.getElementById('chat-input');
  input.value = text;
  sendMsgInput();
}

async function confirmReceived() {
  if(!confirm('¿Estás seguro que tienes la entrada real y válida en tu poder? Tras confirmar esta acción, los fondos serán liberados al vendedor y no habrá reembolso.')) return;

  const btn = document.getElementById('btn-confirm-received');
  if(btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="ph-bold ph-spinner ph-spin"></i> Confirmando...';
  }

  const { error } = await window.MiSupabase
    .from('tickets')
    .update({ status: 'entregado' })
    .eq('id', ticketData.id);

  if (error) {
    alert('Error al intentar confirmar. Intenta nuevamente.');
    if(btn) {
      btn.disabled = false;
      btn.innerText = 'Ya recibí la entrada';
    }
    return;
  }
  
  // Enviar mensaje de confirmacion visible
  await window.MiSupabase.from('messages').insert([{
    ticket_id: ticketData.id,
    sender_id: window.currentUser.id,
    content: '✅ [SISTEMA]: El comprador ha confirmado la recepción exitosa de la entrada. La orden se ha completado y los fondos proceden a liquidación.'
  }]);

  window.location.reload();
}
