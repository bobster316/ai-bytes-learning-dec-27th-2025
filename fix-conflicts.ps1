# Automatic Merge Conflict Fixer for PowerShell
# This script removes merge conflict markers automatically

Write-Host "🔧 Automatic Merge Conflict Fixer" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Files to fix
$files = @(
    "lib/ai/course-generator.ts",
    "lib/database/course-operations.ts"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "📝 Fixing: $file" -ForegroundColor Yellow
        
        # Read the file
        $content = Get-Content $file -Raw
        
        # Remove conflict markers using regex
        # Pattern: Remove everything from <<<<<<< HEAD to ======= (keep content after)
        $content = $content -replace '(?ms)^<<<<<<< HEAD.*?^=======[^\r\n]*[\r\n]+', ''
        # Remove the end marker >>>>>>> hash
        $content = $content -replace '(?m)^>>>>>>> [a-f0-9]{40}[\r\n]*', ''
        
        # Write back to file
        Set-Content -Path $file -Value $content -NoNewline
        
        Write-Host "✅ Fixed: $file" -ForegroundColor Green
    }
    else {
        Write-Host "⚠️  Not found: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✨ Done! All conflicts resolved automatically." -ForegroundColor Green
Write-Host "Run 'npm run dev' to test." -ForegroundColor Cyan
