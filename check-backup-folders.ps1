# Script to check all backup folders for missing source code
# This will help us find which backup has the complete app/, lib/, and components/ directories

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Backup Folder Source Code Checker" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$basePath = "K:\Old L Drive"
$folders = @(
    "ai-bytes-learning",
    "ai-bytes-learning 18th dec 25",
    "ai-bytes-learning 20th dec 25",
    "ai-bytes-learning 21st dec 25",
    "ai-bytes-learning 22nd dec 25",
    "ai-bytes-learning 23rd dec 25",
    "ai-bytes-learning-original"
)

$results = @()

foreach ($folder in $folders) {
    $fullPath = Join-Path $basePath $folder
    
    Write-Host "Checking: $folder" -ForegroundColor Yellow
    
    if (Test-Path $fullPath) {
        $result = [PSCustomObject]@{
            Folder = $folder
            HasApp = Test-Path (Join-Path $fullPath "app")
            HasLib = Test-Path (Join-Path $fullPath "lib")
            HasComponents = Test-Path (Join-Path $fullPath "components")
            AppFiles = 0
            LibFiles = 0
            ComponentsFiles = 0
            TsxFiles = 0
            Status = ""
        }
        
        # Count files in each directory
        if ($result.HasApp) {
            $result.AppFiles = (Get-ChildItem -Path (Join-Path $fullPath "app") -Recurse -File -ErrorAction SilentlyContinue | Measure-Object).Count
        }
        
        if ($result.HasLib) {
            $result.LibFiles = (Get-ChildItem -Path (Join-Path $fullPath "lib") -Recurse -File -ErrorAction SilentlyContinue | Measure-Object).Count
        }
        
        if ($result.HasComponents) {
            $result.ComponentsFiles = (Get-ChildItem -Path (Join-Path $fullPath "components") -Recurse -File -ErrorAction SilentlyContinue | Measure-Object).Count
        }
        
        # Count TSX files
        $result.TsxFiles = (Get-ChildItem -Path $fullPath -Filter "*.tsx" -Recurse -File -ErrorAction SilentlyContinue | Measure-Object).Count
        
        # Determine status
        if ($result.HasApp -and $result.HasLib -and $result.HasComponents -and $result.TsxFiles -gt 0) {
            $result.Status = "✅ COMPLETE"
        } elseif ($result.TsxFiles -gt 0) {
            $result.Status = "⚠️  PARTIAL"
        } else {
            $result.Status = "❌ MISSING SOURCE"
        }
        
        $results += $result
        
        Write-Host "  - app/ : $($result.HasApp) ($($result.AppFiles) files)" -ForegroundColor $(if($result.HasApp){"Green"}else{"Red"})
        Write-Host "  - lib/ : $($result.HasLib) ($($result.LibFiles) files)" -ForegroundColor $(if($result.HasLib){"Green"}else{"Red"})
        Write-Host "  - components/ : $($result.HasComponents) ($($result.ComponentsFiles) files)" -ForegroundColor $(if($result.HasComponents){"Green"}else{"Red"})
        Write-Host "  - .tsx files: $($result.TsxFiles)" -ForegroundColor $(if($result.TsxFiles -gt 0){"Green"}else{"Red"})
        Write-Host "  Status: $($result.Status)" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "  ⚠️  Folder not found!" -ForegroundColor Red
        Write-Host ""
    }
}

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  SUMMARY" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$results | Format-Table -AutoSize

Write-Host ""
Write-Host "RECOMMENDATION:" -ForegroundColor Cyan
$completeBackups = $results | Where-Object { $_.Status -eq "✅ COMPLETE" }

if ($completeBackups.Count -gt 0) {
    Write-Host "✅ Found $($completeBackups.Count) complete backup(s)!" -ForegroundColor Green
    Write-Host ""
    Write-Host "To restore, copy these directories from the backup to 'ai-bytes-learning 23rd dec 25':" -ForegroundColor Yellow
    Write-Host "  1. app/" -ForegroundColor White
    Write-Host "  2. lib/" -ForegroundColor White
    Write-Host "  3. components/" -ForegroundColor White
    Write-Host ""
    Write-Host "Best source: $($completeBackups[0].Folder)" -ForegroundColor Green
} else {
    $partialBackups = $results | Where-Object { $_.Status -eq "⚠️  PARTIAL" }
    if ($partialBackups.Count -gt 0) {
        Write-Host "⚠️  No complete backups found, but found partial source code in:" -ForegroundColor Yellow
        foreach ($backup in $partialBackups) {
            Write-Host "  - $($backup.Folder) ($($backup.TsxFiles) .tsx files)" -ForegroundColor White
        }
    } else {
        Write-Host "❌ No source code found in any backup folder." -ForegroundColor Red
        Write-Host "The source code may need to be recovered from:" -ForegroundColor Yellow
        Write-Host "  - Version control (Git)" -ForegroundColor White
        Write-Host "  - Cloud backup" -ForegroundColor White
        Write-Host "  - Recovery software with deeper scan" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "Script complete!" -ForegroundColor Cyan
