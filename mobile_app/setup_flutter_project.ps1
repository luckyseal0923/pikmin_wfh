$ErrorActionPreference = "Stop"

if (-not (Get-Command flutter -ErrorAction SilentlyContinue)) {
  Write-Error "Flutter was not found. Install Flutter SDK first, then make sure the flutter command is available in PATH."
}

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $root

try {
  New-Item -ItemType Directory -Force -Path ".setup-backup" | Out-Null
  Copy-Item -LiteralPath "pubspec.yaml" -Destination ".setup-backup\pubspec.yaml" -Force
  Copy-Item -LiteralPath "lib\main.dart" -Destination ".setup-backup\main.dart" -Force
  Copy-Item -LiteralPath "android\app\src\main\AndroidManifest.xml" -Destination ".setup-backup\AndroidManifest.xml" -Force
  Copy-Item -LiteralPath "android\app\src\main\res\values\strings.xml" -Destination ".setup-backup\strings.xml" -Force

  flutter create . --platforms android,ios

  Copy-Item -LiteralPath ".setup-backup\pubspec.yaml" -Destination "pubspec.yaml" -Force
  New-Item -ItemType Directory -Force -Path "lib" | Out-Null
  Copy-Item -LiteralPath ".setup-backup\main.dart" -Destination "lib\main.dart" -Force
  Copy-Item -LiteralPath ".setup-backup\AndroidManifest.xml" -Destination "android\app\src\main\AndroidManifest.xml" -Force
  New-Item -ItemType Directory -Force -Path "android\app\src\main\res\values" | Out-Null
  Copy-Item -LiteralPath ".setup-backup\strings.xml" -Destination "android\app\src\main\res\values\strings.xml" -Force

  flutter pub get
  Write-Host "Flutter prototype setup complete."
  Write-Host "Next: replace YOUR_GOOGLE_MAPS_API_KEY in android/app/src/main/res/values/strings.xml with your Google Maps API key."
}
finally {
  Pop-Location
}
