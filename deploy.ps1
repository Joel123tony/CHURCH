$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Starting Deployment Process..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Step 1: Check status
Write-Host "`n[1/4] Checking Git status..." -ForegroundColor Yellow
git status

# Step 2: Add files
Write-Host "`n[2/4] Adding files to staging..." -ForegroundColor Yellow
try {
    git add .
} catch {
    Write-Host "❌ Error: Failed to add files (git add .)" -ForegroundColor Red
    exit 1
}

# Check if there's actually anything to commit
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "✅ No changes to commit. Working tree is clean." -ForegroundColor Green
} else {
    # Step 3: Commit
    Write-Host "`n[3/4] Committing changes..." -ForegroundColor Yellow
    try {
        git commit -m "Update new song system"
    } catch {
        Write-Host "❌ Error: Failed to commit files." -ForegroundColor Red
        exit 1
    }
}

# Step 4: Push to GitHub
Write-Host "`n[4/4] Pushing to GitHub (origin main)..." -ForegroundColor Yellow
try {
    git push origin main
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error: git push failed. Please check your connection or remote repository." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error: Failed to push to GitHub." -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✅ Code successfully pushed to GitHub!" -ForegroundColor Green
Write-Host "▶ Netlify will now automatically deploy the frontend." -ForegroundColor Green
Write-Host "▶ Render will automatically deploy the backend IF 'Auto-Deploy' is enabled in your Render dashboard." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
