# Git Initialization Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Git Repository Initialization" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Git is available
Write-Host "Step 1/4: Checking Git environment..." -ForegroundColor Yellow
try {
    $null = Get-Command git -ErrorAction Stop
    $gitVersion = git --version
    Write-Host "OK $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Git is not installed or not in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Git first:" -ForegroundColor Yellow
    Write-Host "1. Visit https://git-scm.com/download/win to download" -ForegroundColor White
    Write-Host "2. Or use winget: winget install --id Git.Git -e --source winget" -ForegroundColor White
    Write-Host "3. Restart PowerShell after installation" -ForegroundColor White
    Write-Host ""
    Write-Host "See GIT_SETUP.md for details" -ForegroundColor Cyan
    exit 1
}

Write-Host ""

# Check if .git directory exists
Write-Host "Step 2/4: Checking repository status..." -ForegroundColor Yellow
if (Test-Path .git) {
    Write-Host "WARNING: Git repository already exists" -ForegroundColor Yellow
    $response = Read-Host "Do you want to reinitialize? (y/N)"
    if ($response -ne 'y' -and $response -ne 'Y') {
        Write-Host "Operation cancelled" -ForegroundColor Yellow
        exit 0
    }
    Write-Host "Removing existing repository..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force .git
}

# Initialize Git repository
Write-Host ""
Write-Host "Step 3/4: Initializing Git repository..." -ForegroundColor Yellow
git init
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Git initialization failed" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Git repository initialized successfully!" -ForegroundColor Green

# Check Git user configuration
Write-Host ""
$userName = git config --global user.name 2>&1
$userEmail = git config --global user.email 2>&1

if (-not $userName -or $userName -match "error") {
    Write-Host "WARNING: Git user info not configured" -ForegroundColor Yellow
    Write-Host "Tip: Run the following commands to configure:" -ForegroundColor Cyan
    Write-Host '  git config --global user.name "Your Name"' -ForegroundColor White
    Write-Host '  git config --global user.email "your.email@example.com"' -ForegroundColor White
    Write-Host ""
}

# Add all files
Write-Host "Step 4/4: Adding files to staging area..." -ForegroundColor Yellow
git add .
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Some warnings occurred while adding files, continuing..." -ForegroundColor Yellow
}

# Create initial commit
Write-Host ""
Write-Host "Creating initial commit..." -ForegroundColor Yellow

# Build commit message using array to avoid encoding issues
$commitLines = @(
    "chore: initialize project",
    "",
    "- Code structure optimization and refactoring",
    "- Type safety definitions",
    "- Error handling and logging system",
    "- Caching and rate limiting",
    "- Test framework configuration",
    "- Next.js configuration optimization"
)
$commitMessage = $commitLines -join "`n"

git commit -m $commitMessage
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Some warnings occurred during commit, but repository is initialized" -ForegroundColor Yellow
    Write-Host "Tip: You can manually run: git commit -m 'initial commit'" -ForegroundColor Cyan
} else {
    Write-Host "OK: Initial commit created successfully!" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Git Initialization Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Common commands:" -ForegroundColor Cyan
$commands = @(
    '  git status          - View repository status',
    '  git log             - View commit history',
    '  git add .           - Add all changes',
    '  git commit -m msg   - Commit changes'
)
foreach ($cmd in $commands) {
    Write-Host $cmd -ForegroundColor White
}
Write-Host ""
