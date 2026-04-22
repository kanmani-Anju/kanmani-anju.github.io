# One-shot push using a Personal Access Token (kanmani-Anju account, repo scope).
# Do NOT commit your PAT. Run locally:
#   $env:GITHUB_PAT = 'ghp_your_token_here'
#   .\scripts\push-with-pat.ps1
#
# Or: .\scripts\push-with-pat.ps1 -Pat 'ghp_...'

param(
  [string] $Pat = $env:GITHUB_PAT
)

$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot ".."))

if (-not $Pat) {
  Write-Host "ERROR: Set GITHUB_PAT or pass -Pat (PAT from github.com/settings/tokens)" -ForegroundColor Red
  exit 1
}

$owner = "kanmani-Anju"
$repo = "kanmani-anju.github.io"
$url = "https://${Pat}@github.com/${owner}/${repo}.git"

Write-Host "[push-with-pat] Pushing main to ${owner}/${repo} ..." -ForegroundColor Cyan
git push $url HEAD:main
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "[push-with-pat] Linking branch to origin/main ..." -ForegroundColor Cyan
git branch --set-upstream-to=origin/main main 2>$null
Write-Host "[push-with-pat] Done. Next: GitHub repo Settings -> Pages -> Source: GitHub Actions" -ForegroundColor Green
