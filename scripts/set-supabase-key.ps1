#requires -Version 5.1
# Reads the Supabase publishable key with HIDDEN input and writes it to
# .env.local. The key is never echoed, logged, or written to history.
# Run with:  npm run set:key
#        or: powershell -NoProfile -ExecutionPolicy Bypass -File scripts\set-supabase-key.ps1

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $root '.env.local'
$url = 'https://hjgarepgjoikjlblkpxs.supabase.co'

Write-Host ''
Write-Host 'Brew & Bean - set Supabase publishable key' -ForegroundColor Cyan
Write-Host 'Input is hidden and never printed or logged.' -ForegroundColor DarkGray
Write-Host ''

$secure = Read-Host -Prompt 'Paste your Supabase publishable key (sb_publishable_...)' -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
try {
  $key = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
}
finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
}

if ($null -eq $key) { $key = '' }
$key = $key.Trim()

if ([string]::IsNullOrWhiteSpace($key)) {
  Write-Host ''
  Write-Host 'No key entered. Nothing changed.' -ForegroundColor Yellow
  exit 1
}
if ($key -like 'sb_secret_*') {
  Write-Host ''
  Write-Host 'That looks like a SECRET key. Use the publishable key only. Nothing changed.' -ForegroundColor Red
  exit 1
}
$isNewKey = $key.StartsWith('sb_publishable_')
$isLegacyKey = $key.StartsWith('eyJ')
if (-not ($isNewKey -or $isLegacyKey)) {
  Write-Host ''
  Write-Host 'Warning: value looks like neither an "sb_publishable_..." key nor a legacy "eyJ..." anon key. Continuing anyway.' -ForegroundColor Yellow
}
elseif ($isLegacyKey) {
  Write-Host ''
  Write-Host 'Detected a legacy JWT anon key (eyJ...). That is supported.' -ForegroundColor DarkGray
}

if (Test-Path -LiteralPath $envPath) {
  $lines = @(Get-Content -LiteralPath $envPath)
}
else {
  $lines = @()
}

$hasUrl = $false
$hasKey = $false
$out = @()
foreach ($line in $lines) {
  if ($line -match '^\s*VITE_SUPABASE_URL\s*=') {
    $hasUrl = $true
    $out += "VITE_SUPABASE_URL=$url"
  }
  elseif ($line -match '^\s*VITE_SUPABASE_ANON_KEY\s*=') {
    $hasKey = $true
    $out += "VITE_SUPABASE_ANON_KEY=$key"
  }
  else {
    $out += $line
  }
}
if (-not $hasUrl) { $out += "VITE_SUPABASE_URL=$url" }
if (-not $hasKey) { $out += "VITE_SUPABASE_ANON_KEY=$key" }

[System.IO.File]::WriteAllLines($envPath, [string[]]$out)

$prefix = 'sb_publishable_'
if (-not $key.StartsWith($prefix)) {
  $prefix = $key.Substring(0, [Math]::Min(4, $key.Length))
}

Write-Host ''
Write-Host ("Saved to {0}" -f $envPath) -ForegroundColor Green
Write-Host ("Key fingerprint: {0}... (length={1})" -f $prefix, $key.Length) -ForegroundColor Green
Write-Host ''
Write-Host 'Next:  npm run verify:supabase' -ForegroundColor Cyan
Write-Host 'Then:  restart the dev server (npm run dev)' -ForegroundColor Cyan
Write-Host ''

Remove-Variable key, secure, ptr -ErrorAction SilentlyContinue
