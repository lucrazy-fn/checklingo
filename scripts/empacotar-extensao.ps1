param(
  [string]$Version = "1.0.0"
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$Source = Join-Path $RepoRoot "extension"
$StageRoot = Join-Path $RepoRoot ".packaging"
$Packages = Join-Path $RepoRoot "store\packages"
$Downloads = Join-Path $RepoRoot "site\downloads"

if (-not (Test-Path -LiteralPath (Join-Path $Source "manifest.json"))) {
  throw "Manifesto do Firefox não encontrado."
}
if (-not (Test-Path -LiteralPath (Join-Path $Source "manifest.chromium.json"))) {
  throw "Manifesto do Chromium não encontrado."
}

$resolvedRepo = [IO.Path]::GetFullPath($RepoRoot)
$resolvedStage = [IO.Path]::GetFullPath($StageRoot)
if (-not $resolvedStage.StartsWith($resolvedRepo, [StringComparison]::OrdinalIgnoreCase)) {
  throw "A pasta temporária precisa ficar dentro do repositório."
}

if (Test-Path -LiteralPath $StageRoot) {
  Remove-Item -LiteralPath $StageRoot -Recurse -Force
}
New-Item -ItemType Directory -Path $StageRoot, $Packages -Force | Out-Null

function New-StorePackage {
  param(
    [ValidateSet("firefox", "chromium")]
    [string]$Browser
  )

  $stage = Join-Path $StageRoot $Browser
  New-Item -ItemType Directory -Path $stage -Force | Out-Null

  Get-ChildItem -LiteralPath $Source -Force |
    Where-Object { $_.Name -notin @("manifest.json", "manifest.chromium.json") } |
    Copy-Item -Destination $stage -Recurse -Force

  $manifest = if ($Browser -eq "firefox") {
    Join-Path $Source "manifest.json"
  } else {
    Join-Path $Source "manifest.chromium.json"
  }
  Copy-Item -LiteralPath $manifest -Destination (Join-Path $stage "manifest.json") -Force

  $versioned = Join-Path $Packages "checklingo-$Browser-v$Version.zip"
  $download = Join-Path $Downloads "checklingo-$Browser.zip"

  Remove-Item -LiteralPath $versioned -Force -ErrorAction SilentlyContinue
  Compress-Archive -Path (Join-Path $stage "*") -DestinationPath $versioned -CompressionLevel Optimal
  Copy-Item -LiteralPath $versioned -Destination $download -Force

  Write-Output $versioned
}

New-StorePackage -Browser "firefox"
New-StorePackage -Browser "chromium"

Remove-Item -LiteralPath $StageRoot -Recurse -Force

