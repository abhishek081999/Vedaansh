# Build Vedaansh Android APK (Trusted Web Activity via Bubblewrap + Gradle)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$TwaDir = Join-Path $Root "android-twa"
$ManifestFile = Join-Path $TwaDir "twa-manifest.json"
$Keystore = Join-Path $TwaDir "android.keystore"
$BubblewrapConfig = Join-Path $env:USERPROFILE ".bubblewrap\config.json"
$SignedApk = Join-Path $TwaDir "vedaansh-release.apk"

$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("Path", "User")

function Find-JavaHome {
  if ($env:JAVA_HOME -and (Test-Path (Join-Path $env:JAVA_HOME "bin\java.exe"))) {
    return $env:JAVA_HOME
  }

  $candidates = @(
    (Get-ChildItem "C:\Program Files\Microsoft\jdk-*" -Directory -ErrorAction SilentlyContinue |
      Sort-Object Name -Descending |
      Select-Object -First 1 -ExpandProperty FullName),
    "C:\Program Files\Android\Android Studio\jbr"
  ) | Where-Object { $_ -and (Test-Path (Join-Path $_ "bin\java.exe")) }

  return $candidates | Select-Object -First 1
}

function Find-AndroidSdk {
  if ($env:ANDROID_HOME -and (Test-Path $env:ANDROID_HOME)) { return $env:ANDROID_HOME }
  if ($env:ANDROID_SDK_ROOT -and (Test-Path $env:ANDROID_SDK_ROOT)) { return $env:ANDROID_SDK_ROOT }
  $defaultSdk = Join-Path $env:LOCALAPPDATA "Android\Sdk"
  if (Test-Path $defaultSdk) { return $defaultSdk }
  return $null
}

function Find-BuildToolsBin($AndroidSdk) {
  $buildTools = Join-Path $AndroidSdk "build-tools"
  $latest = Get-ChildItem $buildTools -Directory -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending |
    Select-Object -First 1
  if (-not $latest) { return $null }
  return $latest.FullName
}

function Ensure-BubblewrapConfig($JavaHome, $AndroidSdk) {
  $configDir = Split-Path $BubblewrapConfig -Parent
  if (-not (Test-Path $configDir)) {
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
  }

  $payload = @{
    jdkPath = $JavaHome
    androidSdkPath = $AndroidSdk
  } | ConvertTo-Json

  $utf8NoBom = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllText($BubblewrapConfig, $payload, $utf8NoBom)
}

function Get-KeystorePassword {
  if ($env:BUBBLEWRAP_KEYSTORE_PASSWORD) {
    if (-not $env:BUBBLEWRAP_KEY_PASSWORD) {
      $env:BUBBLEWRAP_KEY_PASSWORD = $env:BUBBLEWRAP_KEYSTORE_PASSWORD
    }
    return $env:BUBBLEWRAP_KEYSTORE_PASSWORD
  }

  Write-Host ""
  Write-Host "Enter keystore password (same as when android.keystore was created)." -ForegroundColor Cyan
  Write-Host "Tip: or set `$env:BUBBLEWRAP_KEYSTORE_PASSWORD before running npm run android:apk" -ForegroundColor DarkGray
  # Plain Read-Host works when npm spawns powershell -File; -AsSecureString often gets empty stdin.
  $plain = Read-Host "Keystore password"
  if ([string]::IsNullOrWhiteSpace($plain)) {
    Write-Host "Password required to sign the APK." -ForegroundColor Yellow
    Write-Host "Example: `$env:BUBBLEWRAP_KEYSTORE_PASSWORD='your-password'; npm run android:sign" -ForegroundColor Yellow
    exit 1
  }
  return $plain
}

function Stop-GradleDaemons {
  $gradlew = Join-Path $TwaDir "gradlew.bat"
  if (Test-Path $gradlew) {
    Write-Host "Stopping Gradle daemons..."
    & $gradlew --stop 2>$null
    Start-Sleep -Seconds 2
  }
}

Set-Location $TwaDir

Write-Host "== Vedaansh Android APK build ==" -ForegroundColor Cyan
Write-Host ""

$javaHome = Find-JavaHome
if (-not $javaHome) {
  Write-Host "Java (JDK 17+) is required. Install: winget install Microsoft.OpenJDK.17" -ForegroundColor Yellow
  exit 1
}

$androidSdk = Find-AndroidSdk
if (-not $androidSdk) {
  Write-Host "Android SDK not found. Install Android Studio first." -ForegroundColor Yellow
  exit 1
}

$env:JAVA_HOME = $javaHome
$env:ANDROID_HOME = $androidSdk
$env:ANDROID_SDK_ROOT = $androidSdk
$env:Path = "$(Join-Path $javaHome 'bin');$env:Path"

Write-Host "Using Java: $javaHome"
Write-Host "Using Android SDK: $androidSdk"
Ensure-BubblewrapConfig $javaHome $androidSdk

if (-not (Test-Path $Keystore)) {
  Write-Host "Keystore missing at android-twa\android.keystore" -ForegroundColor Yellow
  Write-Host "Create it with: npm run android:fingerprint (after generating keystore via keytool)"
  exit 1
}

if (-not (Test-Path $ManifestFile)) {
  Write-Host "Missing android-twa\twa-manifest.json" -ForegroundColor Yellow
  exit 1
}

Write-Host ""
Write-Host "Step 1/3: Sync Android project (bubblewrap update)..." -ForegroundColor Cyan
npx --yes @bubblewrap/cli update --manifest="twa-manifest.json" --appVersionName="1.0.0"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Step 2/3: Compile APK (Gradle, may take several minutes)..." -ForegroundColor Cyan
Stop-GradleDaemons
& .\gradlew.bat --no-daemon clean assembleRelease
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "Gradle build failed. If you see EBUSY / file locked:" -ForegroundColor Yellow
  Write-Host "  1. Close Android Studio"
  Write-Host "  2. Run: cd android-twa; .\gradlew.bat --stop"
  Write-Host "  3. Retry: npm run android:apk"
  exit $LASTEXITCODE
}

$unsignedApk = Join-Path $TwaDir "app\build\outputs\apk\release\app-release-unsigned.apk"
if (-not (Test-Path $unsignedApk)) {
  Write-Host "Gradle finished but unsigned APK not found." -ForegroundColor Yellow
  exit 1
}

$buildToolsBin = Find-BuildToolsBin $androidSdk
if (-not $buildToolsBin) {
  Write-Host "Android build-tools not found under SDK." -ForegroundColor Yellow
  exit 1
}

$zipalign = Join-Path $buildToolsBin "zipalign.exe"
$apksigner = Join-Path $buildToolsBin "apksigner.bat"
$alignedApk = Join-Path $TwaDir "app-release-aligned.apk"

Write-Host ""
Write-Host "Step 3/3: Sign APK..." -ForegroundColor Cyan
$password = Get-KeystorePassword

& $zipalign -f -p 4 $unsignedApk $alignedApk
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$env:BUBBLEWRAP_KEYSTORE_PASSWORD = $password
$env:BUBBLEWRAP_KEY_PASSWORD = $password

& $apksigner sign `
  --ks $Keystore `
  --ks-key-alias android `
  --ks-pass "pass:$password" `
  --key-pass "pass:$password" `
  --out $SignedApk `
  $alignedApk

if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& $apksigner verify --verbose $SignedApk | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Signed APK verification failed." -ForegroundColor Yellow
  exit 1
}

Remove-Item $alignedApk -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "APK ready (install this on your phone):" -ForegroundColor Green
Write-Host $SignedApk
Write-Host ""
Write-Host "Unsigned build artifact:" -ForegroundColor DarkGray
Write-Host $unsignedApk
Write-Host ""
Write-Host "Fingerprint for Render: npm run android:fingerprint"
