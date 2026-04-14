$files = @(
    "index.html",
    "marketplace.html",
    "dashboard.html",
    "profile.html",
    "sell.html",
    "tickets.html",
    "event.html",
    "login.html"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        
        # 1. Update Mobile Nav "Tickets" text to "Actividad"
        # It's inside the span under the dashboard.html link
        # Example: <a href="dashboard.html" ... > \n <span class="material-symbols-outlined ...">confirmation_number</span> \n <span class="...">Tickets</span>
        $content = $content -replace '(?s)(<a href="dashboard\.html"[^>]*>.*?<span class="[^"]*">)Tickets(</span>)', '${1}ACTIVIDAD$2'
        
        # 2. Add an ID to the desktop actions div so auth-ui.js can find it
        # <!-- Actions --> \n <div class="flex items-center gap-4">
        # Some files might have `gap-4` or `gap-6` or similar. Let's just catch the <!-- Actions --> div
        $content = $content -replace '<!-- Actions -->\s*<div class="([^"]*)">', '<!-- Actions -->`r`n        <div id="nav-desktop-actions" class="$1">'
        
        Set-Content -Path $file -Value $content -Encoding UTF8
        Write-Host "Updated HTML: $file"
    }
}
