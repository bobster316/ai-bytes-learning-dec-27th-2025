@echo off
echo ========================================
echo   AI Bytes Project Extractor
echo ========================================
echo.

cd /d "D:\ai-bytes-leaning-22nd-feb-2026 Backup"

powershell -ExecutionPolicy Bypass -Command ^
 "$o='project_snapshot.txt'; ''>$o; $sep='='*80; "^
 "function AS($t){\"$sep`n### $t`n$sep\"|Out-File $o -Append -Encoding utf8} "^
 "function AF($p){if(Test-Path $p){\"--- FILE: $p ---\"|Out-File $o -Append -Encoding utf8;Get-Content $p -Raw -EA SilentlyContinue|Out-File $o -Append -Encoding utf8}} "^
 "AS 'FOLDER STRUCTURE'; Get-ChildItem -Recurse -Depth 3 -Name -Exclude node_modules,.next,.git -EA SilentlyContinue|Where-Object{$_ -notmatch 'node_modules|\.next|\.git'}|Out-File $o -Append -Encoding utf8; "^
 "AS 'ROOT CONFIG'; foreach($f in @('package.json','next.config.js','next.config.mjs','next.config.ts','tsconfig.json','tailwind.config.js','tailwind.config.ts','middleware.ts','middleware.js')){AF $f} "^
 "AS 'APP PAGES AND LAYOUTS'; Get-ChildItem -Path app -Recurse -Include layout.tsx,layout.ts,page.tsx,page.ts,route.tsx,route.ts,loading.tsx,error.tsx -EA SilentlyContinue|ForEach-Object{AF $_.FullName} "^
 "AS 'COMPONENTS LIST'; if(Test-Path components){Get-ChildItem components -Recurse -Name -EA SilentlyContinue|Out-File $o -Append -Encoding utf8} "^
 "AS 'STERLING OR ASSISTANT COMPONENTS'; Get-ChildItem components -Recurse -Include *.tsx,*.ts -EA SilentlyContinue|Where-Object{$_.Name -match 'sterling|assistant|chat|voice'}|ForEach-Object{AF $_.FullName} "^
 "AS 'LIB DIRECTORY'; if(Test-Path lib){Get-ChildItem lib -Recurse -Include *.ts,*.tsx,*.js -EA SilentlyContinue|ForEach-Object{AF $_.FullName}} "^
 "AS 'PLANS'; if(Test-Path plans){Get-ChildItem plans -Recurse -Include *.md,*.txt,*.json,*.ts -EA SilentlyContinue|ForEach-Object{AF $_.FullName}} "^
 "AS 'IMPROVEMENTS'; if(Test-Path Improvements){Get-ChildItem Improvements -Recurse -Include *.md,*.txt,*.json,*.ts -EA SilentlyContinue|ForEach-Object{AF $_.FullName}} "^
 "AS 'OLD HANDOVERS'; if(Test-Path 'Old Handovers'){Get-ChildItem 'Old Handovers' -Recurse -Include *.md,*.txt,*.json -EA SilentlyContinue|ForEach-Object{AF $_.FullName}} "^
 "AS 'SUPABASE'; if(Test-Path supabase){Get-ChildItem supabase -Recurse -Include *.sql,*.ts,*.json,*.toml -EA SilentlyContinue|ForEach-Object{AF $_.FullName}} "^
 "AS 'SCRIPTS'; if(Test-Path scripts){Get-ChildItem scripts -Recurse -Include *.js,*.ts,*.sh -EA SilentlyContinue|ForEach-Object{AF $_.FullName}} "^
 "AS 'ENV VAR NAMES ONLY'; if(Test-Path .env.local){'--- .env.local keys ---'|Out-File $o -Append -Encoding utf8;Get-Content .env.local -EA SilentlyContinue|ForEach-Object{($_ -split '=')[0]}|Out-File $o -Append -Encoding utf8}elseif(Test-Path .env){'--- .env keys ---'|Out-File $o -Append -Encoding utf8;Get-Content .env -EA SilentlyContinue|ForEach-Object{($_ -split '=')[0]}|Out-File $o -Append -Encoding utf8} "^
 "Write-Host ''; Write-Host 'DONE - created project_snapshot.txt' -Fore Green; Write-Host 'Upload that file to Claude' -Fore Yellow;"

echo.
echo Look for project_snapshot.txt in this folder
echo.
pause
