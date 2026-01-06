# Manual Git Initialization (using full path)
Write-Host "Initializing Git repository..." -ForegroundColor Yellow

$gitExe = "C:\Program Files\Git\cmd\git.exe"

if (-not (Test-Path $gitExe)) {
    Write-Host "ERROR: Git not found at $gitExe" -ForegroundColor Red
    Write-Host "Please install Git or run .\fix-git-path.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "Using Git at: $gitExe" -ForegroundColor Green
Write-Host ""

# Initialize repository
Write-Host "Step 1: Initializing repository..." -ForegroundColor Yellow
& $gitExe init
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to initialize repository" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Repository initialized" -ForegroundColor Green

# Add files
Write-Host ""
Write-Host "Step 2: Adding files..." -ForegroundColor Yellow
& $gitExe add .
Write-Host "OK: Files added" -ForegroundColor Green

# Create commit
Write-Host ""
Write-Host "Step 3: Creating initial commit..." -ForegroundColor Yellow
$commitMessage = "chore: initialize project`n`n- Code structure optimization`n- Type safety definitions`n- Error handling and logging`n- Caching and rate limiting`n- Test framework configuration`n- Next.js optimization"
& $gitExe commit -m $commitMessage

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK: Initial commit created" -ForegroundColor Green
} else {
    Write-Host "WARNING: Commit may have failed (check if files were added)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Git Initialization Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Note: To use 'git' command directly, add Git to PATH:" -ForegroundColor Cyan
Write-Host "  Run: .\fix-git-path.ps1" -ForegroundColor White
Write-Host ""
