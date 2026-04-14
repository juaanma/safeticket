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

$replacementTemplate = @"
        <!-- Desktop Links -->
        <div class="hidden md:flex items-center gap-8 font-['Inter'] font-medium text-sm">
            <a class="{EXPLORAR_CLS}" href="index.html">Explorar</a>
            <a class="{COMPRAR_CLS}" href="marketplace.html">Comprar</a>
            <a class="{VENDER_CLS}" href="sell.html">Vender</a>
            <a class="{ACTIVIDAD_CLS}" href="dashboard.html">Mi Actividad</a>
            <a class="{PERFIL_CLS}" href="profile.html">Mi Perfil</a>
        </div>
        <!-- Actions -->
"@

$activeClass = "text-[#5144d4] font-bold border-b-2 border-[#5144d4] pb-1 transition-colors duration-200"
$inactiveClass = "text-[#1a1c1f] hover:text-[#5144d4] transition-colors duration-200"

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        
        $expCls = $inactiveClass
        $compCls = $inactiveClass
        $vendCls = $inactiveClass
        $actCls = $inactiveClass
        $perfCls = $inactiveClass

        if ($file -match "index.html") { $expCls = $activeClass }
        if ($file -match "marketplace.html") { $compCls = $activeClass }
        if ($file -match "sell.html") { $vendCls = $activeClass }
        if ($file -match "dashboard.html") { $actCls = $activeClass }
        if ($file -match "profile.html") { $perfCls = $activeClass }

        $replacement = $replacementTemplate -replace "{EXPLORAR_CLS}", $expCls `
                                           -replace "{COMPRAR_CLS}", $compCls `
                                           -replace "{VENDER_CLS}", $vendCls `
                                           -replace "{ACTIVIDAD_CLS}", $actCls `
                                           -replace "{PERFIL_CLS}", $perfCls

        # The regex spans from <!-- Desktop Links --> up to <!-- Actions -->
        # We need to escape any regex specials inside the replacement? No, -replace takes direct string for the replacement side if we use a regex object or literal substitution properly. Wait, standard -replace uses regex match and string sub with $1.
        
        $regex = '(?s)<!-- Desktop Links -->.*?<!-- Actions -->'
        $content = [System.Text.RegularExpressions.Regex]::Replace($content, $regex, $replacement)
        
        Set-Content -Path $file -Value $content -Encoding UTF8
        Write-Host "Updated $file"
    }
}
