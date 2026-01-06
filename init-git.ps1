# Git初始化脚本
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Git 仓库初始化脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Git 是否可用
Write-Host "步骤 1/4: 检查 Git 环境..." -ForegroundColor Yellow
try {
    $null = Get-Command git -ErrorAction Stop
    $gitVersion = git --version
    Write-Host "✅ $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git 未安装或未添加到 PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "请先安装 Git:" -ForegroundColor Yellow
    Write-Host "1. 访问 https://git-scm.com/download/win 下载安装" -ForegroundColor White
    Write-Host "2. 或使用 winget: winget install --id Git.Git -e --source winget" -ForegroundColor White
    Write-Host "3. 安装后重启 PowerShell 并重新运行此脚本" -ForegroundColor White
    Write-Host ""
    Write-Host "详细说明请查看 GIT_SETUP.md 文件" -ForegroundColor Cyan
    exit 1
}

Write-Host ""

# 检查是否已存在.git目录
Write-Host "步骤 2/4: 检查仓库状态..." -ForegroundColor Yellow
if (Test-Path .git) {
    Write-Host "⚠️  Git仓库已存在" -ForegroundColor Yellow
    $response = Read-Host "是否要重新初始化? (y/N)"
    if ($response -ne 'y' -and $response -ne 'Y') {
        Write-Host "已取消操作" -ForegroundColor Yellow
        exit 0
    }
    Write-Host "正在移除现有仓库..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force .git
}

# 初始化Git仓库
Write-Host ""
Write-Host "步骤 3/4: 初始化Git仓库..." -ForegroundColor Yellow
git init
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Git初始化失败" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Git仓库初始化成功！" -ForegroundColor Green

# 检查 Git 用户配置
Write-Host ""
$userName = git config --global user.name 2>&1
$userEmail = git config --global user.email 2>&1

if (-not $userName -or $userName -match "error") {
    Write-Host "⚠️  Git 用户信息未配置" -ForegroundColor Yellow
    Write-Host "提示: 运行以下命令配置用户信息:" -ForegroundColor Cyan
    Write-Host '  git config --global user.name "Your Name"' -ForegroundColor White
    Write-Host '  git config --global user.email "your.email@example.com"' -ForegroundColor White
    Write-Host ""
}

# 添加所有文件
Write-Host "步骤 4/4: 添加文件到暂存区..." -ForegroundColor Yellow
git add .
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  添加文件时出现警告，但继续执行..." -ForegroundColor Yellow
}

# 创建初始提交
Write-Host ""
Write-Host "正在创建初始提交..." -ForegroundColor Yellow

# 使用数组构建提交消息，避免编码问题
$commitLines = @(
    "chore: 初始化项目",
    "",
    "- 完成代码结构优化和重构",
    "- 添加类型安全定义",
    "- 实现错误处理和日志系统",
    "- 添加缓存和限流机制",
    "- 配置测试框架",
    "- 优化Next.js配置"
)
$commitMessage = $commitLines -join "`n"

git commit -m $commitMessage
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  提交时出现警告，但仓库已初始化" -ForegroundColor Yellow
    Write-Host "提示: 可以稍后手动运行: git commit -m '初始提交'" -ForegroundColor Cyan
} else {
    Write-Host "✅ 初始提交创建成功！" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Git 初始化完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "常用命令:" -ForegroundColor Cyan
$cmd1 = '  git status          - 查看仓库状态'
$cmd2 = '  git log             - 查看提交历史'
$cmd3 = '  git add .           - 添加所有更改'
$cmd4 = '  git commit -m msg   - 提交更改'
Write-Host $cmd1 -ForegroundColor White
Write-Host $cmd2 -ForegroundColor White
Write-Host $cmd3 -ForegroundColor White
Write-Host $cmd4 -ForegroundColor White
foreach ($cmd in $commands) {
    Write-Host $cmd -ForegroundColor White
}
Write-Host ""
