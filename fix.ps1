$lines = Get-Content 'login.html' -Encoding UTF8
$newlines = @()
foreach ($line in $lines) {
  if ($line -match 'login-password') {
    $newlines += '          <input type="password" id="login-password" class="form-control" placeholder="********" required>'
  } else {
    $newlines += $line
  }
}
$newlines | Set-Content 'login.html' -Encoding UTF8

$lines2 = Get-Content 'register.html' -Encoding UTF8
$newlines2 = @()
foreach ($line in $lines2) {
  if ($line -match 'register-password') {
    $newlines2 += '          <input type="password" id="register-password" class="form-control" placeholder="********" required>'
  } else {
    $newlines2 += $line
  }
}
$newlines2 | Set-Content 'register.html' -Encoding UTF8
