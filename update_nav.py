import os
import re

files_to_update = [
    'index.html',
    'marketplace.html',
    'sell.html',
    'dashboard.html',
    'profile.html',
    'event.html',
    'tickets.html',
    'login.html'
]

# Define base navigation standard items (in order)
nav_items = [
    {'name': 'Explorar', 'href': 'index.html'},
    {'name': 'Comprar', 'href': 'marketplace.html'},
    {'name': 'Vender', 'href': 'sell.html'},
    {'name': 'Mi Actividad', 'href': 'dashboard.html'},
    {'name': 'Mi Perfil', 'href': 'profile.html'}
]

active_class = 'text-[#5144d4] font-bold border-b-2 border-[#5144d4] pb-1 transition-colors duration-200'
inactive_class = 'text-[#1a1c1f] hover:text-[#5144d4] transition-colors duration-200'

for val in files_to_update:
    if os.path.exists(val):
        with open(val, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Determine which item is active based on current file
        active_href = val
        if val in ['event.html', 'login.html']:
            # No specific top nav highlighted for these
            active_href = None
        elif val == 'tickets.html': # Probably map to dashboard or something, but we can leave none
            active_href = None
            
        # Build the new inner html for desktop links
        links_html = "\n"
        for item in nav_items:
            # Handle the fact that index.html had some dark mode classes, we'll strip them for consistency or keep them
            is_active = (item['href'] == active_href)
            cls = active_class if is_active else inactive_class
            links_html += f'            <a class="{cls}" href="{item["href"]}">{item["name"]}</a>\n'
        
        # Replace the <div class="hidden md:flex items-center gap-8 font-['Inter'] font-medium text-sm"> block
        # The block ends before the <!-- Actions --> comment
        
        # We need a regex that matches from <!-- Desktop Links --> down to <!-- Actions -->
        pattern = re.compile(r'(<!-- Desktop Links -->\s*<div class="hidden md:flex items-center gap-8 font-\[\'Inter\'\] font-medium text-sm">)(.*?)(</div>\s*<!-- Actions -->)', re.DOTALL)
        
        def replace_func(match):
            return match.group(1) + links_html + "        " + match.group(3)
            
        new_content = pattern.sub(replace_func, content)
        
        # In case the div class was slightly different (like in index.html): 'font-medium text-sm'
        pattern2 = re.compile(r'(<!-- Desktop Links -->\s*<div class="[^"]*hidden md:flex items-center gap-8.*?">)(.*?)(</div>\s*<!-- Actions -->)', re.DOTALL)
        new_content = pattern2.sub(replace_func, new_content)
        
        with open(val, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {val}")
