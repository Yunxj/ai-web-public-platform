# Git 环境检查脚本
Write-Host "正在检查 Git 环境..." -ForegroundColor Cyan
Write-Host ""

# 检查 Git 是否可用
try {
    $gitVersion = git --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Git 已安装: $gitVersion" -ForegroundColor Green
        
        # 检查 Git 配置
        Write-Host ""
        Write-Host "Git 配置信息:" -ForegroundColor Cyan
        $userName = git config --global user.name 2>&1
        $userEmail = git config --global user.email 2>&1
        
        if ($userName -and $userName -notmatch "error") {
            Write-Host "  用户名: $userName" -ForegroundColor Green
        } else {
            Write-Host "  用户名: 未配置" -ForegroundColor Yellow
            Write-Host "  提示: 运行 'git config --global user.name \"Your Name\"' 进行配置" -ForegroundColor Yellow
        }
        
        if ($userEmail -and $userEmail -notmatch "error") {
            Write-Host "  邮箱: $userEmail" -ForegroundColor Green
        } else {
            Write-Host "  邮箱: 未配置" -ForegroundColor Yellow
            Write-Host "  提示: 运行 'git config --global user.email \"your.email@example.com\"' 进行配置" -ForegroundColor Yellow
        }
        
        # 检查是否已初始化 Git 仓库
        Write-Host ""
        if (Test-Path .git) {
            Write-Host "✅ Git 仓库已初始化" -ForegroundColor Green
            Write-Host ""
            Write-Host "可以使用以下命令查看状态:" -ForegroundColor Cyan
            Write-Host "  git status" -ForegroundColor White
        } else {
            Write-Host "⚠️  Git 仓库未初始化" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "运行以下命令初始化仓库:" -ForegroundColor Cyan
            Write-Host "  .\init-git.ps1" -ForegroundColor White
            Write-Host "  或" -ForegroundColor Gray
            Write-Host "  git init" -ForegroundColor White
        }
    }
} catch {
    Write-Host "❌ Git 未安装或未添加到 PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "请参考 GIT_SETUP.md 文件进行安装" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "快速安装方法:" -ForegroundColor Cyan
    Write-Host "1. 访问 https://git-scm.com/download/win 下载安装" -ForegroundColor White
    Write-Host "2. 或使用 winget: winget install --id Git.Git -e --source winget" -ForegroundColor White
    Write-Host "3. 安装后重启 PowerShell" -ForegroundColor White
}

Write-Host ""
