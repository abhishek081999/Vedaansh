# Build Vedaansh Android APK (Trusted Web Activity via Bubblewrap)
# Prerequisites: Node 24+, JDK 17+, Android SDK (Android Studio recommended)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$TwaDir = Join-Path $Root "android-twa"

Set-Location $TwaDir

function Test-Command($Name) {
  return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

Write-Host "== Vedaansh Android APK build ==" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Command java)) {
  Write-Host "Java (JDK 17+) is required." -ForegroundColor Yellow
  Write-Host "Install: winget install Microsoft.OpenJDK.17"
  Write-Host "Or install Android Studio (includes JDK + SDK)."
  exit 1
}

if (-not $env:ANDROID_HOME -and -not $env:ANDROID_SDK_ROOT) {
  $defaultSdk = Join-Path $env:LOCALAPPDATA "Android\Sdk"
  if (Test-Path $defaultSdk) {
    $env:ANDROID_HOME = $defaultSdk
    Write-Host "Using Android SDK: $defaultSdk"
  } else {
    Write-Host "ANDROID_HOME not set and default SDK not found." -ForegroundColor Yellow
    Write-Host "Install Android Studio, then set ANDROID_HOME to your SDK path."
    Write-Host "Example: `$env:ANDROID_HOME = `"$env:LOCALAPPDATA\Android\Sdk`""
    exit 1
  }
}

$Keystore = Join-Path $TwaDir "android.keystore"
if (-not (Test-Path $Keystore)) {
  Write-Host "Creating signing keystore (android.keystore)..." -ForegroundColor Cyan
  Write-Host "You will be prompted for a keystore password — save it securely."
  keytool -genkeypair -v `
    -keystore android.keystore `
    -alias android `
    -keyalg RSA `
    -keysize 2048 `
    -validity 10000 `
    -dname "CN=Vedaansh, OU=Mobile, O=Vedaansh, L=India, ST=India, C=IN"
}

Write-Host ""
Write-Host "Generating Android project from twa-manifest.json..." -ForegroundColor Cyan
npx --yes @bubblewrap/cli update --manifest="."

Write-Host ""
Write-Host "Building signed APK + AAB..." -ForegroundColor Cyan
Write-Host "If prompted, enter the keystore password you set above."
npx --yes @bubblewrap/cli build --manifest="." --skipPwaValidation

$Apk = Get-ChildItem -Path $TwaDir -Filter "*.apk" -Recurse -ErrorAction SilentlyContinue |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1

$Aab = Get-ChildItem -Path $TwaDir -Filter "*.aab" -Recurse -ErrorAction SilentlyContinue |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1

Write-Host ""
if ($Apk) {
  Write-Host "APK ready: $($Apk.FullName)" -ForegroundColor Green
}
if ($Aab) {
  Write-Host "AAB ready (Play Store): $($Aab.FullName)" -ForegroundColor Green
}

Write-Host ""
Write-Host "Next: add SHA-256 fingerprint to production env for domain verification:"
Write-Host "  npx @bubblewrap/cli fingerprint list --manifest=android-twa"
Write-Host "  Set ANDROID_APP_PACKAGE_NAME + ANDROID_APP_SHA256_FINGERPRINTS on Render"
