$files = Get-ChildItem -Path . -File -Recurse | Where-Object { $_.Extension -in '.html', '.js' }

$replacements = @(
    @("SesiÃƒÂ³n", "Sesión"),
    @("Ã¡", "á"),
    @("Ã©", "é"),
    @("Ã­", "í"),
    @("Ã³", "ó"),
    @("Ãº", "ú"),
    @("Ã±", "ñ"),
    @("Ã‘", "Ñ"),
    @("Â¿", "¿"),
    @("Â¡", "¡"),
    @("Ã ", "í"),
    @("GARANTÃ A", "GARANTÍA"),
    @("eéxitosamente", "exitosamente"),
    @("lougeado", "logueado"),
    @("LOUGEADO", "LOGUEADO"),
    @("harcode", "hardcode")
)

foreach ($file in $files) {
    if ($file.FullName -match '\\node_modules\\|\.git\\') { continue }
    
    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
    $content = [System.Text.Encoding]::UTF8.GetString($bytes)
    
    $changed = $false
    foreach ($pair in $replacements) {
        $key = $pair[0]
        $val = $pair[1]
        if ($content.Contains($key)) {
            $content = $content.Replace($key, $val)
            $changed = $true
        }
    }
    
    if ($changed) {
        [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
        Write-Host "Fixed typos in $($file.Name)"
    }
}
