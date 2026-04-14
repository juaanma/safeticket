$files = Get-ChildItem -Path . -Filter *.html

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw

    if ($content -match '<!-- Bottom Navigation Bar \(Mobile Only\)') {
        $content = $content.Replace('px-4 pb-6 pt-3 bg-[#faf9fd]/90', 'px-3 pb-3 pt-2 bg-[#faf9fd]/90')
        $content = $content.Replace(' p-2 hover:', ' p-[0.35rem] hover:')
        $content = $content.Replace(' p-2 active:', ' p-[0.35rem] active:')
        $content = $content.Replace('text-2xl', 'text-[1.35rem]')
        $content = $content.Replace('text-[10px]', 'text-[9px]')
        $content = $content.Replace('mt[-8px]', '-mt-4')
        $content = $content.Replace('p-3 rounded-full', 'p-2 rounded-full')
        
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8
        Write-Host "Updated $($file.Name)"
    }
}
