# Initialize Git Now (refreshes PATH in current session)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Git Repository Initialization" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Refresh PATH in current session
Write-Host "Refreshing PATH in current session..." -ForegroundColor Yellow
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Check if Git is now available
Write-Host "Step 1/4: Checking Git environment..." -ForegroundColor Yellow
try {
    $null = Get-Command git -ErrorAction Stop
    $gitVersion = git --version
    Write-Host "OK $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "WARNING: Git still not found in PATH" -ForegroundColor Yellow
    Write-Host "Using full path to Git executable..." -ForegroundColor Yellow
    $script:gitExe = "C:\Program Files\Git\cmd\git.exe"
    if (-not (Test-Path $script:gitExe)) {
        Write-Host "ERROR: Git not found" -ForegroundColor Red
        exit 1
    }
    Write-Host "OK: Using Git at $script:gitExe" -ForegroundColor Green
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
if ($script:gitExe) {
    & $script:gitExe init
} else {
    git init
}
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Git initialization failed" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Git repository initialized successfully!" -ForegroundColor Green

# Check Git user configuration
Write-Host ""
$userName = if ($script:gitExe) { & $script:gitExe config --global user.name 2>&1 } else { git config --global user.name 2>&1 }
$userEmail = if ($script:gitExe) { & $script:gitExe config --global user.email 2>&1 } else { git config --global user.email 2>&1 }

if (-not $userName -or $userName -match "error") {
    Write-Host "WARNING: Git user info not configured" -ForegroundColor Yellow
    Write-Host "Tip: Run the following commands to configure:" -ForegroundColor Cyan
    Write-Host '  git config --global user.name "Your Name"' -ForegroundColor White
    Write-Host '  git config --global user.email "your.email@example.com"' -ForegroundColor White
    Write-Host ""
}

# Add all files
Write-Host "Step 4/4: Adding files to staging area..." -ForegroundColor Yellow
if ($script:gitExe) {
    & $script:gitExe add .
} else {
    git add .
}
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

if ($script:gitExe) {
    & $script:gitExe commit -m $commitMessage
} else {
    git commit -m $commitMessage
}
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
