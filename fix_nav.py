import os
import re

nav_html = """      <ul class="nav-links">
        <li><a href="marketplace.html" class="nav-link">Eventos</a></li>
        <li><a href="tickets.html" class="nav-link">Entradas Publicadas</a></li>
        <li><a href="dashboard.html" class="nav-link">Mi Actividad</a></li>
        <li><a href="profile.html" class="nav-link" id="nav-profile-link">Mi Perfil</a></li>
      </ul>"""

for f in os.listdir('.'):
    if f.endswith('.html'):
        with open(f, 'r') as file:
            content = file.read()
        
        # Regex to match the ul nav-links and its children
        pattern = re.compile(r'\s*<ul class="nav-links">.*?</ul>', re.DOTALL)
        new_content = pattern.sub('\n' + nav_html, content)
        
        with open(f, 'w') as file:
            file.write(new_content)
        print(f"Updated {f}")
