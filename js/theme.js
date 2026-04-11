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


