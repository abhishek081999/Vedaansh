# Print SHA-256 signing fingerprint for Render (ANDROID_APP_SHA256_FINGERPRINTS)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Keystore = Join-Path $Root "android-twa\android.keystore"

$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
            [System.Environment]::GetEnvironmentVariable("Path", "User")

$keytool = Get-Command keytool -ErrorAction SilentlyContinue
if (-not $keytool) {
  $candidates = @(
    (Get-ChildItem "C:\Program Files\Microsoft\jdk-*\bin\keytool.exe" -ErrorAction SilentlyContinue |
      Sort-Object FullName -Descending |
      Select-Object -First 1 -ExpandProperty FullName),
    "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe"
  ) | Where-Object { $_ -and (Test-Path $_) }

  if ($candidates.Count -eq 0) {
    Write-Host "keytool not found. Install JDK 17 or Android Studio." -ForegroundColor Yellow
    exit 1
  }
  $keytool = $candidates[0]
} else {
  $keytool = $keytool.Source
}

if (-not (Test-Path $Keystore)) {
  Write-Host "Keystore not found. Run: npm run android:apk" -ForegroundColor Yellow
  exit 1
}

Write-Host "Keystore: $Keystore" -ForegroundColor Cyan
Write-Host "Enter the keystore password when prompted." -ForegroundColor Cyan
Write-Host ""
Write-Host "Copy the SHA256 line (with colons) into Render as ANDROID_APP_SHA256_FINGERPRINTS"
Write-Host "Package name for Render: com.vedaansh.app"
Write-Host ""

& $keytool -list -v -keystore $Keystore -alias android
