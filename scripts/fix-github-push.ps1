# Fixes "remote origin already exists" confusion and ensures URL is correct.
# For 403 "denied to jemshithjemc": clear cached GitHub login, then push as kanmani-Anju (or a collaborator).

$ErrorActionPreference = "Stop"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot ".."))

$repoUrl = "https://github.com/kanmani-Anju/kanmani-anju.github.io.git"

Write-Host "Current remotes:" -ForegroundColor Cyan
git remote -v

if (-not (git remote get-url origin 2>$null)) {
  git remote add origin $repoUrl
  Write-Host "Added origin -> $repoUrl" -ForegroundColor Green
} else {
  git remote set-url origin $repoUrl
  Write-Host "Set origin -> $repoUrl" -ForegroundColor Green
}

Write-Host ""
Write-Host "Next (403 fix): Git is using the wrong GitHub account." -ForegroundColor Yellow
Write-Host "1. Open: Windows Credential Manager -> Windows Credentials" -ForegroundColor White
Write-Host "   Remove entries for git:https://github.com (or GitHub-related)." -ForegroundColor White
Write-Host "2. Or run (PowerShell) to erase GitHub HTTPS creds for this host:" -ForegroundColor White
Write-Host '   echo url=https://github.com | git credential-manager erase' -ForegroundColor Gray
Write-Host "3. Then push and sign in as the kanmani-Anju account (or use a PAT with repo scope):" -ForegroundColor White
Write-Host "   git push -u origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "Optional: add jemshithjemc as Collaborator (Write) on the GitHub repo, then push again." -ForegroundColor DarkYellow
