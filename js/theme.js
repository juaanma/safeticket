// js/theme.js
const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
document.documentElement.setAttribute('data-theme', savedTheme);

document.addEventListener('DOMContentLoaded', () => {
    // Inject the theme toggle button if it doesn't exist
    if (!document.getElementById('theme-toggle-btn')) {
        const btn = document.createElement('button');
        btn.id = 'theme-toggle-btn';
        btn.title = 'Cambiar modo claro / oscuro';
        btn.style.cssText = `
            position: fixed;
            bottom: 90px;
            right: 20px;
            z-index: 9999;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: var(--surface);
            color: var(--text-main);
            border: 2px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
            transition: var(--transition);
            font-size: 1.5rem;
        `;
        
        // Add hover effect dynamically
        btn.onmouseover = () => { btn.style.transform = 'scale(1.1)'; };
        btn.onmouseout = () => { btn.style.transform = 'scale(1)'; };

        const currentTheme = document.documentElement.getAttribute('data-theme');
        btn.innerHTML = currentTheme === 'dark' ? '<i class="ph-bold ph-sun"></i>' : '<i class="ph-bold ph-moon"></i>';
        
        document.body.appendChild(btn);

        btn.addEventListener('click', () => {
            const cTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = cTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Update icon
            if (newTheme === 'dark') {
                btn.innerHTML = '<i class="ph-bold ph-sun"></i>';
            } else {
                btn.innerHTML = '<i class="ph-bold ph-moon"></i>';
            }
        });
    }
});



// Notificaciones Estéticas (Toasts)
window.ShowToast = function(message, forceType = null) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    Object.assign(container.style, {
      position: 'fixed',
      bottom: '100px',
      right: '20px',
      left: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      zIndex: '9999',
      pointerEvents: 'none',
      alignItems: 'center'
    });
    document.body.appendChild(container);
  }

  const msgLower = message.toLowerCase();
  let type = 'success';
  if (forceType) {
    type = forceType;
  } else if (msgLower.includes('error') || msgLower.includes('falta') || msgLower.includes('no se pudo') || msgLower.includes('incorrecta') || msgLower.includes('debes') || msgLower.includes('prueba')) {
    type = 'error';
  }

  const toast = document.createElement('div');
  const bgColor = type === 'error' ? '#ef4444' : '#10b981';
  const icon = type === 'error' ? 'ph-warning-circle' : 'ph-check-circle';
  
  Object.assign(toast.style, {
    background: bgColor,
    color: '#fff',
    padding: '1rem 1.5rem',
    borderRadius: '12px',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.8rem',
    fontWeight: '600',
    fontSize: '0.95rem',
    opacity: '0',
    transform: 'translateY(20px)',
    transition: 'all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    pointerEvents: 'auto',
    maxWidth: '400px',
    width: '100%'
  });

  toast.innerHTML = '<i class="ph-fill ' + icon + '" style="font-size: 1.4rem;"></i> <span>' + message + '</span>';
  
  container.appendChild(toast);
  
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
};

// Sobrescribir alert original para no modificar decenas de archivos
window.alert = function(msg) {
  window.ShowToast(msg);
};
