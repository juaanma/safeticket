import os
import re

tailwind_head = """
    <!-- Tailwind setup -->
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <script src="js/tailwind-config.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet"/>
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
    <style>
        body { font-family: 'Inter', sans-serif; }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            display: inline-block;
            line-height: 1;
        }
        ::-webkit-scrollbar {
            display: none;
        }
    </style>
</head>"""

desktop_nav = """<!-- TopNavBar -->
<nav class="w-full top-0 z-50 bg-[#faf9fd]/90 backdrop-blur-md shadow-[0_12px_32px_rgba(26,28,31,0.06)] relative border-b border-outline-variant/10">
    <div class="max-w-7xl mx-auto px-6 md:px-8 py-4 flex justify-between items-center">
        <!-- Logo -->
        <a href="index.html" class="flex items-center gap-2 text-2xl font-black tracking-tighter text-[#5144d4] dark:text-[#7A70FF]">
            <span class="material-symbols-outlined hidden md:block">confirmation_number</span>
            SafeTicket
        </a>
        
        <!-- Desktop Links -->
        <div class="hidden md:flex items-center gap-8 font-['Inter'] font-medium text-sm">
            <a class="text-[#1a1c1f] hover:text-[#5144d4] transition-colors duration-200" href="index.html">Explorar</a>
            <a class="text-[#1a1c1f] hover:text-[#5144d4] transition-colors duration-200" href="marketplace.html">Comprar</a>
            <a class="text-[#1a1c1f] hover:text-[#5144d4] transition-colors duration-200" href="sell.html">Vender</a>
            <a class="text-[#1a1c1f] hover:text-[#5144d4] transition-colors duration-200" href="dashboard.html">Mi Cuenta</a>
        </div>
        
        <!-- Actions -->
        <div class="flex items-center gap-4">
            <a href="login.html" class="hidden md:block text-sm font-semibold hover:text-primary transition-colors">Iniciar Sesión</a>
        </div>
    </div>
</nav>"""

mobile_nav = """<!-- Bottom Navigation Bar (Mobile Only) -->
<nav class="md:hidden fixed bottom-0 left-0 w-full z-[100] flex justify-around items-center px-4 pb-6 pt-3 bg-[#faf9fd]/90 backdrop-blur-xl shadow-[0_-12px_32px_rgba(26,28,31,0.06)] rounded-t-[32px] border-t border-slate-200/50">
    <a href="index.html" class="flex flex-col items-center justify-center text-[#1a1c1f] opacity-60 p-2 hover:opacity-100 transition-opacity active:scale-90 duration-200">
        <span class="material-symbols-outlined text-2xl">home</span>
        <span class="font-bold text-[10px] uppercase tracking-widest mt-1">Inicio</span>
    </a>
    <a href="marketplace.html" class="flex flex-col items-center justify-center text-[#1a1c1f] opacity-60 p-2 hover:opacity-100 transition-opacity active:scale-90 duration-200">
        <span class="material-symbols-outlined text-2xl">explore</span>
        <span class="font-bold text-[10px] uppercase tracking-widest mt-1">Explorar</span>
    </a>
    <a href="sell.html" class="flex flex-col items-center justify-center mt[-8px] text-white bg-primary shadow-lg p-3 rounded-full active:scale-90 duration-200" style="transform: translateY(-8px);">
        <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">add</span>
    </a>
    <a href="dashboard.html" class="flex flex-col items-center justify-center text-[#1a1c1f] opacity-60 p-2 hover:opacity-100 transition-opacity active:scale-90 duration-200">
        <span class="material-symbols-outlined text-2xl">confirmation_number</span>
        <span class="font-bold text-[10px] uppercase tracking-widest mt-1">Tickets</span>
    </a>
    <a href="profile.html" class="flex flex-col items-center justify-center text-[#1a1c1f] opacity-60 p-2 hover:opacity-100 transition-opacity active:scale-90 duration-200">
        <span class="material-symbols-outlined text-2xl">person</span>
        <span class="font-bold text-[10px] uppercase tracking-widest mt-1">Perfil</span>
    </a>
</nav>
<script>
    document.addEventListener('DOMContentLoaded', () => {
      const path = window.location.pathname;
      const navLinks = document.querySelectorAll('nav.md\\\\:hidden a');
      navLinks.forEach(link => {
          if (path.includes(link.getAttribute('href'))) {
              link.classList.remove('opacity-60', 'text-[#1a1c1f]');
              link.classList.add('text-[#5144d4]');
              link.querySelector('.material-symbols-outlined').style.fontVariationSettings = "'FILL' 1";
          }
      });
      // also for top nav
      const topLinks = document.querySelectorAll('.md\\\\:flex a');
      topLinks.forEach(link => {
          if (path.includes(link.getAttribute('href'))) {
              link.classList.remove('text-[#1a1c1f]');
              link.classList.add('text-[#5144d4]', 'border-b-2', 'border-[#5144d4]', 'pb-1', 'font-bold');
              link.classList.remove('hover:text-[#5144d4]');
          }
      });
    });
</script>
</body>
</html>"""

for file_name in os.listdir('.'):
    if file_name.endswith('.html') and file_name != 'index.html':
        with open(file_name, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 1. Inject tailwind to Head
        if '<script src="https://cdn.tailwindcss.com' not in content:
            content = content.replace('</head>', tailwind_head)
            
        # 2. Replace body tag to include base classes
        content = re.sub(r'<body.*?>', '<body class="bg-background text-on-surface pb-24 md:pb-0 selection:bg-primary/20">', content)

        # 3. Handle old Top Navbar
        nav_pattern = re.compile(r'<!--\s*Navbar\s*-->.*?<\/nav>', re.DOTALL)
        content = nav_pattern.sub(desktop_nav, content)
        
        # 4. Handle Mobile Bottom Nav
        mobile_nav_pattern = re.compile(r'<!--\s*Mobile Bottom Nav\s*-->.*?<\/html>', re.DOTALL)
        if re.search(mobile_nav_pattern, content):
            content = mobile_nav_pattern.sub(mobile_nav, content)
        else:
            # If not found, replace </body></html> with mobile_nav
            content = re.sub(r'<\/body>\s*<\/html>', mobile_nav, content, flags=re.DOTALL)

        with open(file_name, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Injected Tailwind into {file_name}")
