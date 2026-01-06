# Fix Git PATH Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Git PATH Configuration Fix" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Git exists
$gitPath = "C:\Program Files\Git\cmd\git.exe"
if (Test-Path $gitPath) {
    Write-Host "OK: Git found at: $gitPath" -ForegroundColor Green
    Write-Host ""
    Write-Host "Git is installed but not in PATH." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "1. Add Git to PATH permanently (recommended)" -ForegroundColor White
    Write-Host "2. Use Git with full path for now" -ForegroundColor White
    Write-Host "3. Reinstall Git and ensure PATH is added" -ForegroundColor White
    Write-Host ""
    
    $choice = Read-Host "Choose option (1/2/3)"
    
    if ($choice -eq "1") {
        Write-Host ""
        Write-Host "Adding Git to PATH..." -ForegroundColor Yellow
        
        $gitDir = "C:\Program Files\Git\cmd"
        $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
        
        if ($currentPath -notlike "*$gitDir*") {
            $newPath = $currentPath + ";" + $gitDir
            [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
            Write-Host "OK: Git added to PATH" -ForegroundColor Green
            Write-Host ""
            Write-Host "IMPORTANT: Please restart PowerShell for changes to take effect!" -ForegroundColor Yellow
            Write-Host "After restarting, run: .\init-git-simple.ps1" -ForegroundColor Cyan
        } else {
            Write-Host "Git is already in PATH (user level)" -ForegroundColor Yellow
            Write-Host "Please restart PowerShell" -ForegroundColor Yellow
        }
    } elseif ($choice -eq "2") {
        Write-Host ""
        Write-Host "Using Git with full path..." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "You can initialize Git manually:" -ForegroundColor Cyan
        Write-Host '  & "C:\Program Files\Git\cmd\git.exe" init' -ForegroundColor White
        Write-Host '  & "C:\Program Files\Git\cmd\git.exe" add .' -ForegroundColor White
        Write-Host '  & "C:\Program Files\Git\cmd\git.exe" commit -m "initial commit"' -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "To reinstall Git:" -ForegroundColor Cyan
        Write-Host "1. Download from: https://git-scm.com/download/win" -ForegroundColor White
        Write-Host "2. During installation, select 'Git from the command line and also from 3rd-party software'" -ForegroundColor White
        Write-Host "3. This will automatically add Git to PATH" -ForegroundColor White
    }
} else {
    Write-Host "ERROR: Git not found at standard location" -ForegroundColor Red
    Write-Host "Please install Git first" -ForegroundColor Yellow
}

Write-Host ""
