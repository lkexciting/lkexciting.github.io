$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$env:GH_CONFIG_DIR = Join-Path $PSScriptRoot '.local-tools\gh-config'
node scripts/sync-notes.mjs
if ($LASTEXITCODE -ne 0) { throw '同步失败' }
node quartz/bootstrap-cli.mjs build
if ($LASTEXITCODE -ne 0) { throw '构建失败，请先修复错误' }
git add -- content
git diff --cached --quiet
if ($LASTEXITCODE -eq 1) {
    git commit -m 'Update course notes'
    if ($LASTEXITCODE -ne 0) { throw '提交失败' }
} elseif ($LASTEXITCODE -ne 0) {
    throw '无法检查待提交的笔记'
} else {
    Write-Host '没有新的笔记变化，检查是否还有待上传的提交。'
}
git push -u origin main
if ($LASTEXITCODE -ne 0) { throw '推送失败，请检查 GitHub 登录状态' }
Write-Host '已推送。GitHub Actions 将自动更新网站。'


