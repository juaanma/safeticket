$files = Get-ChildItem -Path . -Include *.html,*.js -Recurse

$replacements = @{
    "SesiÃƒÂ³n" = "Sesión"
    "Ã¡" = "á"
    "Ã©" = "é"
    "Ã­" = "í"
    "Ã³" = "ó"
    "Ãº" = "ú"
    "Ã±" = "ñ"
    "Ã‘" = "Ñ"
    "Â¿" = "¿"
    "Â¡" = "¡"
    "Ã " = "í"
    "GARANTÃ A" = "GARANTÍA"
    "GarantÃ a" = "Garantía"
    "eéxitosamente" = "exitosamente"
    "lougeado" = "logueado"
    "LOUGEADO" = "LOGUEADO"
    "harcode" = "hardcode"
    "inisiar" = "iniciar"
    "registrar y iniciar" = "registrar e iniciar"
    "Ã\x8D" = "Í"
}

foreach ($file in $files) {
    if ($file.FullName -match '\\node_modules\\|\.git\\') { continue }
    
    # Read raw bytes to avoid powershell parsing the wrong charset before replace
    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
    $content = [System.Text.Encoding]::UTF8.GetString($bytes)
    
    $changed = $false
    foreach ($key in $replacements.Keys) {
        if ($content -match [regex]::Escape($key)) {
            $content = $content.Replace($key, $replacements[$key])
            $changed = $true
        }
    }
    
    if ($changed) {
        [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
        Write-Host "Fixed typos in $($file.Name)"
    }
}
