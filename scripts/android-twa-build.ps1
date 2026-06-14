# Build Vedaansh Android APK (Trusted Web Activity via Bubblewrap)
# Prerequisites: Node 24+, JDK 17+, Android SDK (Android Studio recommended)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$TwaDir = Join-Path $Root "android-twa"

# npm spawns a fresh shell; reload PATH from registry.
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("Path", "User")

function Test-Command($Name) {
  return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Find-JavaHome {
  if ($env:JAVA_HOME -and (Test-Path (Join-Path $env:JAVA_HOME "bin\java.exe"))) {
    return $env:JAVA_HOME
  }

  $candidates = @(
    (Get-ChildItem "C:\Program Files\Microsoft\jdk-*" -Directory -ErrorAction SilentlyContinue |
      Sort-Object Name -Descending |
      Select-Object -First 1 -ExpandProperty FullName),
    (Get-ChildItem "C:\Program Files\Eclipse Adoptium\jdk-*" -Directory -ErrorAction SilentlyContinue |
      Sort-Object Name -Descending |
      Select-Object -First 1 -ExpandProperty FullName),
    "C:\Program Files\Android\Android Studio\jbr",
    "$env:LOCALAPPDATA\Programs\Android\Android Studio\jbr"
  ) | Where-Object { $_ -and (Test-Path (Join-Path $_ "bin\java.exe")) }

  foreach ($home in $candidates) {
    return $home
  }

  return $null
}

function Ensure-Java {
  if (Test-Command java) {
    return
  }

  $javaHome = Find-JavaHome
  if (-not $javaHome) {
    Write-Host "Java (JDK 17+) is required." -ForegroundColor Yellow
    Write-Host "Install: winget install Microsoft.OpenJDK.17"
    Write-Host "Or install Android Studio (includes JDK + SDK)."
    exit 1
  }

  $env:JAVA_HOME = $javaHome
  $javaBin = Join-Path $javaHome "bin"
  $env:Path = "$javaBin;$env:Path"
  Write-Host "Using Java: $javaHome"
}

function Ensure-AndroidSdk {
  if ($env:ANDROID_HOME -or $env:ANDROID_SDK_ROOT) {
    return
  }

  $defaultSdk = Join-Path $env:LOCALAPPDATA "Android\Sdk"
  if (Test-Path $defaultSdk) {
    $env:ANDROID_HOME = $defaultSdk
    $env:ANDROID_SDK_ROOT = $defaultSdk
    Write-Host "Using Android SDK: $defaultSdk"
    return
  }

  Write-Host "ANDROID_HOME not set and default SDK not found." -ForegroundColor Yellow
  Write-Host "Install Android Studio, then set ANDROID_HOME to your SDK path."
  Write-Host ('Example: $env:ANDROID_HOME = "' + $defaultSdk + '"')
  exit 1
}

Set-Location $TwaDir

Write-Host "== Vedaansh Android APK build ==" -ForegroundColor Cyan
Write-Host ""

Ensure-Java
Ensure-AndroidSdk

$Keystore = Join-Path $TwaDir "android.keystore"
if (-not (Test-Path $Keystore)) {
  Write-Host "Creating signing keystore (android.keystore)..." -ForegroundColor Cyan
  Write-Host "You will be prompted for a keystore password. Save it securely."
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
Write-Host "  Set ANDROID_APP_PACKAGE_NAME and ANDROID_APP_SHA256_FINGERPRINTS on Render"
