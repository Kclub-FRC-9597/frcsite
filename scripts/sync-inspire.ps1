#Requires -Version 5.1
<#
.SYNOPSIS
    inspire 子模块「拉取合并 → 部署 → 提交推送」一键脚本。

.DESCRIPTION
    等价于手工依次执行：
      1) git submodule update --init public/inspire
      2) cd public/inspire
         git checkout main && git fetch origin && git merge --ff-only origin/main
         （GitHub 连不上时自动改用本地开发克隆兜底，结果一致）
      3) npm run deploy
      4) git add public/inspire && git commit && git push origin main

    子模块没有新提交时默认直接退出（不部署、不推送）；要用 -Force 强制走完流程。

.PARAMETER SkipDeploy
    跳过我第 3 步（部署），只做同步 + 提交。

.PARAMETER SkipPush
    跳过我第 4 步的推送，只在本地提交。

.PARAMETER Force
    子模块无新提交时也继续执行部署与推送（例如父仓库还有别的待推送提交）。

.PARAMETER DevClone
    GitHub 不可达时用于兜底的本地开发克隆路径。
    默认 E:\Git\BK_course_and_training

.PARAMETER Branch
    子模块跟踪的分支，默认 main。

.EXAMPLE
    npm run sync:inspire

.EXAMPLE
    pwsh -File scripts/sync-inspire.ps1 -SkipPush
#>
[CmdletBinding()]
param(
    [switch]$SkipDeploy,
    [switch]$SkipPush,
    [switch]$Force,
    [string]$DevClone = 'E:\Git\BK_course_and_training',
    [string]$Branch = 'main'
)

$ErrorActionPreference = 'Continue'

# 让 git 等外部命令输出的中文按 UTF-8 解码（否则提交信息会显示成乱码）
try {
    [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
    $OutputEncoding = New-Object System.Text.UTF8Encoding($false)
}
catch {
    Write-Host "  [!]  控制台编码设置失败（不影响功能）：$($_.Exception.Message)" -ForegroundColor Yellow
}

$SubmodulePath = 'public/inspire'

# ---------- 输出helper ----------
function Write-Step { param([string]$m) Write-Host "`n=== $m ===" -ForegroundColor Cyan }
function Write-Ok { param([string]$m) Write-Host "  [OK] $m" -ForegroundColor Green }
function Write-Note { param([string]$m) Write-Host "  [-]  $m" -ForegroundColor Gray }
function Write-Warn2 { param([string]$m) Write-Host "  [!]  $m" -ForegroundColor Yellow }
function Write-Err2 { param([string]$m) Write-Host "  [X]  $m" -ForegroundColor Red }

# ---------- git 包装：始终返回 退出码 + 文本 ----------
function Invoke-Git {
    param(
        [Parameter(Mandatory = $true)][string]$Dir,
        [Parameter(Mandatory = $true)][string[]]$GitArgs
    )
    $raw = & git -C $Dir @GitArgs 2>&1
    $code = $LASTEXITCODE
    $text = ($raw | ForEach-Object { "$_" }) -join "`n"
    [pscustomobject]@{ Text = $text.Trim(); Code = $code }
}

function Get-Rev {
    param([string]$Dir, [string]$Ref)
    $r = Invoke-Git -Dir $Dir -GitArgs @('rev-parse', '--verify', '--quiet', "$Ref`^{commit}")
    if ($r.Code -ne 0) { return $null }
    return $r.Text
}

function Short-Sha {
    param([string]$Sha)
    if ([string]::IsNullOrWhiteSpace($Sha)) { return '?' }
    if ($Sha.Length -ge 7) { return $Sha.Substring(0, 7) }
    return $Sha
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$subDir = Join-Path $repoRoot ($SubmodulePath -replace '/', '\')

# ---------- 0. 环境检查 ----------
Write-Step '0/5 环境检查'
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { Write-Err2 '未找到 git，请先安装'; exit 1 }
if (-not (Test-Path $repoRoot)) { Write-Err2 "仓库根目录不存在：$repoRoot"; exit 1 }
$isRepo = Invoke-Git -Dir $repoRoot -GitArgs @('rev-parse', '--git-dir')
if ($isRepo.Code -ne 0) { Write-Err2 "不是 git 仓库：$repoRoot"; exit 1 }
Write-Ok "仓库：$repoRoot"

# ---------- 1. 初始化子模块 ----------
Write-Step '1/5 初始化子模块'
$r = Invoke-Git -Dir $repoRoot -GitArgs @('submodule', 'update', '--init', '--', $SubmodulePath)
if ($r.Code -ne 0) { Write-Err2 "子模块初始化失败：`n$($r.Text)"; exit 1 }
if (-not (Test-Path $subDir)) { Write-Err2 "子模块目录不存在：$subDir"; exit 1 }
Write-Ok "子模块：$SubmodulePath"

# 子模块工作区必须干净，否则 merge 可能被中断
$dirty = Invoke-Git -Dir $subDir -GitArgs @('status', '--porcelain')
if ($dirty.Text) {
    Write-Err2 "子模块工作区有未提交改动，请先提交或 stash："
    Write-Host $dirty.Text -ForegroundColor DarkGray
    exit 1
}

$beforeSha = Get-Rev -Dir $subDir -Ref 'HEAD'
Write-Note "当前指针：$(Short-Sha $beforeSha)"

# ---------- 2. 拉取 + 合并 ----------
Write-Step '2/5 拉取独立仓库最新提交'

$fetchedFromOrigin = $false
for ($i = 1; $i -le 3; $i++) {
    $r = Invoke-Git -Dir $subDir -GitArgs @('fetch', 'origin', '--prune')
    if ($r.Code -eq 0) { $fetchedFromOrigin = $true; break }
    Write-Warn2 "第 $i 次从 GitHub 拉取失败：$($r.Text)"
    if ($i -lt 3) { Start-Sleep -Seconds 2 }
}

$targetSha = $null
$targetLabel = ''
if ($fetchedFromOrigin) {
    $targetSha = Get-Rev -Dir $subDir -Ref "origin/$Branch"
    $targetLabel = "origin/$Branch"
    if (-not $targetSha) { Write-Err2 "找不到 origin/$Branch"; exit 1 }
    Write-Ok "已从 GitHub 拉取（origin/$Branch = $(Short-Sha $targetSha)）"
}
else {
    Write-Warn2 'GitHub 不可达，改用本地开发克隆兜底'
    if (-not (Test-Path $DevClone)) { Write-Err2 "开发克隆不存在：$DevClone"; exit 1 }
    $r = Invoke-Git -Dir $subDir -GitArgs @('fetch', $DevClone, $Branch)
    if ($r.Code -ne 0) { Write-Err2 "兜底拉取失败：`n$($r.Text)"; exit 1 }
    $targetSha = Get-Rev -Dir $subDir -Ref 'FETCH_HEAD'
    $targetLabel = "$DevClone $Branch"
    Write-Ok "已从本地克隆拉取（$targetLabel = $(Short-Sha $targetSha)）"
    Write-Warn2 '提示：该提交可能尚未推到 GitHub，父仓库推送前请确认开发端已 push'
}

if ($beforeSha -eq $targetSha) {
    if (-not $Force) {
        Write-Ok "子模块已是最新（$(Short-Sha $targetSha)），无需同步 —— 结束"
        Write-Note '如需强制走完「部署 + 推送」，加 -Force'
        exit 0
    }
    Write-Warn2 "子模块已是最新（$(Short-Sha $targetSha)），但指定了 -Force，继续执行"
}
else {
    # 回到跟踪分支（--remote / 手工 checkout 会留下 detached HEAD）
    $curBranch = (Invoke-Git -Dir $subDir -GitArgs @('rev-parse', '--abbrev-ref', 'HEAD')).Text
    if ($curBranch -ne $Branch) {
        Write-Note "子模块当前在 $curBranch，切换到 $Branch"
        $r = Invoke-Git -Dir $subDir -GitArgs @('checkout', $Branch)
        if ($r.Code -ne 0) { Write-Err2 "切换分支失败：`n$($r.Text)"; exit 1 }
    }
    $localSha = Get-Rev -Dir $subDir -Ref 'HEAD'
    if ($localSha -eq $targetSha) {
        Write-Ok "$Branch 已是目标提交（$(Short-Sha $targetSha)）"
    }
    else {
        $r = Invoke-Git -Dir $subDir -GitArgs @('merge', '--ff-only', $targetSha)
        if ($r.Code -ne 0) {
            Write-Err2 "快进合并失败（$Branch 与 $targetLabel 历史可能已分叉）："
            Write-Host $r.Text -ForegroundColor DarkGray
            Write-Note "请手工处理：cd $SubmodulePath && git merge $targetSha"
            exit 1
        }
        Write-Ok "已合并：$(Short-Sha $beforeSha) -> $(Short-Sha $targetSha)"
    }

    Write-Host ''
    Write-Host '  本次带来的提交 / 文件：' -ForegroundColor Gray
    $log = Invoke-Git -Dir $subDir -GitArgs @('log', '--oneline', '--no-decorate', "$beforeSha..$targetSha")
    if ($log.Text) { $log.Text -split "`n" | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkGray } }
}

$newSha = Get-Rev -Dir $subDir -Ref 'HEAD'
$shortSha = Short-Sha $newSha

# ---------- 3. 部署 ----------
if ($SkipDeploy) {
    Write-Step '3/5 部署（已跳过）'
}
else {
    Write-Step '3/5 部署到 Cloudflare'
    Push-Location $repoRoot
    try {
        & npm run deploy
        $deployCode = $LASTEXITCODE
    }
    finally {
        Pop-Location
    }
    if ($deployCode -ne 0) { Write-Err2 "部署失败（exit $deployCode），已中止（未提交、未推送）"; exit 1 }
    Write-Ok '部署完成'
}

# ---------- 4. 提交父仓库指针 ----------
Write-Step '4/5 提交父仓库子模块指针'
$r = Invoke-Git -Dir $repoRoot -GitArgs @('add', '--', $SubmodulePath)
if ($r.Code -ne 0) { Write-Err2 "git add 失败：`n$($r.Text)"; exit 1 }

$staged = Invoke-Git -Dir $repoRoot -GitArgs @('diff', '--cached', '--quiet', '--', $SubmodulePath)
if ($staged.Code -eq 0) {
    Write-Warn2 "父仓库指针无变化（已指向 $shortSha），跳过提交"
}
else {
    $r = Invoke-Git -Dir $repoRoot -GitArgs @('commit', '-m', "chore: sync inspire 子模块最新改动 ($shortSha)")
    if ($r.Code -ne 0) { Write-Err2 "提交失败：`n$($r.Text)"; exit 1 }
    Write-Ok "已提交：chore: sync inspire 子模块最新改动 ($shortSha)"
}

# ---------- 5. 推送 ----------
if ($SkipPush) {
    Write-Step '5/5 推送（已跳过）'
}
else {
    Write-Step '5/5 推送到 origin'
    $pushed = $false
    for ($i = 1; $i -le 3; $i++) {
        $r = Invoke-Git -Dir $repoRoot -GitArgs @('push', 'origin', $Branch)
        if ($r.Code -eq 0) { $pushed = $true; Write-Ok $r.Text; break }
        Write-Warn2 "第 $i 次推送失败：$($r.Text)"
        if ($i -lt 3) { Start-Sleep -Seconds 3 }
    }
    if (-not $pushed) {
        Write-Err2 '推送失败（GitHub 连不上？）—— 本地提交已保留，稍后手工 git push origin main'
        exit 1
    }
}

# ---------- 汇总 ----------
Write-Host ''
Write-Host '完成 ✅' -ForegroundColor Green
Write-Note "子模块指针：$shortSha"
$status = Invoke-Git -Dir $repoRoot -GitArgs @('status', '--short', '--branch')
if ($status.Text) { $status.Text -split "`n" | ForEach-Object { Write-Note $_ } }
exit 0
