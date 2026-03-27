# Save image from clipboard to file
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$clipboard = [System.Windows.Forms.Clipboard]::GetImage()

if ($clipboard -ne $null) {
    $outputPath = "k:\recover\from_23rd\public\images\course-thumbnail.png"
    
    # Create directory if it doesn't exist
    $dir = Split-Path -Parent $outputPath
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    
    $clipboard.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host "✅ Image saved to: $outputPath" -ForegroundColor Green
} else {
    Write-Host "❌ No image found in clipboard. Please copy an image first." -ForegroundColor Red
}
