# Console diagnostics for GitHub push issues. Run: .\scripts\diagnose-push.ps1
$ErrorActionPreference = "Continue"
Set-Location (Resolve-Path (Join-Path $PSScriptRoot ".."))

function Log($m, $c = "White") { Write-Host $m -ForegroundColor $c }

Log "`n========== KANMANI PUSH DIAGNOSTICS ==========" Cyan
Log "Time: $(Get-Date -Format o)" Gray

Log "`n[1] Branch / remote" Cyan
git status -sb
git remote -v
git log --oneline -1

Log "`n[2] Credential helper" Cyan
git config --global credential.helper 2>$null
git config credential.helper 2>$null

Log "`n[3] GitHub CLI" Cyan
try { gh auth status 2>&1 } catch { Log "gh not available or not logged in" Yellow }

Log "`n[4] Env (tokens)" Cyan
Log ("GITHUB_TOKEN: " + ($(if ($env:GITHUB_TOKEN) { "set (len $($env:GITHUB_TOKEN.Length))" } else { "not set" })))
Log ("GITHUB_PAT: " + ($(if ($env:GITHUB_PAT) { "set" } else { "not set" })))

Log "`n[5] Windows cmdkey (git/github)" Cyan
cmdkey /list 2>$null | Select-String -Pattern "git|GitHub" -CaseSensitive:$false

Log "`n[6] SSH GitHub (batch)" Cyan
$sshOut = ssh -o BatchMode=yes -o ConnectTimeout=5 -T git@github.com 2>&1
Log ($sshOut | Out-String) Gray

Log "`n[7] Test push (expect 403 if wrong account)" Cyan
$pushOut = git push -u origin main 2>&1
Log ($pushOut | Out-String) $(if ($LASTEXITCODE -eq 0) { "Green" } else { "Yellow" })
Log "git push exit: $LASTEXITCODE" $(if ($LASTEXITCODE -eq 0) { "Green" } else { "Red" })

Log "`n========== NEXT STEPS ==========" Cyan
if ($LASTEXITCODE -ne 0) {
  Log "Push failed. Fix ONE of these:" Yellow
  Log "  A) Create a PAT on the kanmani-Anju account (repo scope). Then run:" White
  Log "     `$env:GITHUB_PAT = 'ghp_...'" Gray
  Log "     .\scripts\push-with-pat.ps1" Gray
  Log "  B) Or: Credential Manager -> remove ALL GitHub entries -> git push -> sign in as kanmani-Anju" White
  Log "  C) Or: invite jemshithjemc as collaborator (write) on the repo" White
} else {
  Log "Push succeeded. Enable Pages: Settings -> Pages -> GitHub Actions." Green
}
