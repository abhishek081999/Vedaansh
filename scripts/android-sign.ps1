# Sign existing unsigned APK only (skip Gradle rebuild)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$TwaDir = Join-Path $Root "android-twa"
$Keystore = Join-Path $TwaDir "android.keystore"
$SignedApk = Join-Path $TwaDir "vedaansh-release.apk"
$UnsignedApk = Join-Path $TwaDir "app\build\outputs\apk\release\app-release-unsigned.apk"
$AlignedApk = Join-Path $TwaDir "app-release-aligned.apk"

$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("Path", "User")

function Find-AndroidSdk {
  if ($env:ANDROID_HOME -and (Test-Path $env:ANDROID_HOME)) { return $env:ANDROID_HOME }
  $defaultSdk = Join-Path $env:LOCALAPPDATA "Android\Sdk"
  if (Test-Path $defaultSdk) { return $defaultSdk }
  return $null
}

function Get-KeystorePassword {
  if ($env:BUBBLEWRAP_KEYSTORE_PASSWORD) { return $env:BUBBLEWRAP_KEYSTORE_PASSWORD }
  Write-Host "Enter keystore password:" -ForegroundColor Cyan
  Write-Host "Or: `$env:BUBBLEWRAP_KEYSTORE_PASSWORD='your-password'; npm run android:sign" -ForegroundColor DarkGray
  $plain = Read-Host "Keystore password"
  if ([string]::IsNullOrWhiteSpace($plain)) { exit 1 }
  return $plain
}

if (-not (Test-Path $UnsignedApk)) {
  Write-Host "Unsigned APK not found. Run: npm run android:apk" -ForegroundColor Yellow
  exit 1
}

$androidSdk = Find-AndroidSdk
if (-not $androidSdk) { Write-Host "Android SDK not found." -ForegroundColor Yellow; exit 1 }

$buildTools = Get-ChildItem (Join-Path $androidSdk "build-tools") -Directory |
  Sort-Object Name -Descending | Select-Object -First 1
if (-not $buildTools) { Write-Host "Android build-tools not found." -ForegroundColor Yellow; exit 1 }

$zipalign = Join-Path $buildTools.FullName "zipalign.exe"
$apksigner = Join-Path $buildTools.FullName "apksigner.bat"
$password = Get-KeystorePassword

Set-Location $TwaDir

& $zipalign -f -p 4 $UnsignedApk $AlignedApk
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& $apksigner sign `
  --ks $Keystore `
  --ks-key-alias android `
  --ks-pass "pass:$password" `
  --key-pass "pass:$password" `
  --out $SignedApk `
  $AlignedApk

if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Remove-Item $AlignedApk -ErrorAction SilentlyContinue
Write-Host ""
Write-Host "APK ready:" -ForegroundColor Green
Write-Host $SignedApk
