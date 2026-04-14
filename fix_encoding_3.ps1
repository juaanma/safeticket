$files = Get-ChildItem -Path . -File -Recurse | Where-Object { $_.Extension -in '.html', '.js' }

$replacements = @{
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
    "â„¢" = "™"
    "Ã\x8D" = "Í"
}

foreach ($file in $files) {
    if ($file.FullName -match 'node_modules|\.git|tailwind') { continue }
    
    $content = Get-Content -Path $file.FullName -Raw
    $original = $content
    
    # We do case sensitive replace
    foreach ($key in $replacements.Keys) {
        $content = $content.Replace($key, $replacements[$key])
    }
    
    if ($content -cne $original) {
        [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
        Write-Host "Fixed encoding in $($file.Name)"
    }
}
