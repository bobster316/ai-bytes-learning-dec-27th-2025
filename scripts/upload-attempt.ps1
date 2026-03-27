
$apiKey = $env:HEYGEN_API_KEY
$filePath = Resolve-Path "temp_avatar.png"
$url = "https://upload.heygen.com/v1/asset"

Write-Host "Uploading $filePath to $url..."

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers @{ "X-Api-Key" = $apiKey } -InFile $filePath -ContentType "image/png"
    # Note: The above sends raw body. HeyGen expects multipart/form-data with 'file' field?
    # HeyGen API docs for /v1/asset usually require multipart.
    # Invoke-RestMethod -InFile sends binary body, not multipart.
    
    # We need multipart. PowerShell 7+ has -Form, but older PS doesn't.
    # Let's try constructing multipart manually or using a different approach if this is complex in PS.
    
    # Actually, let's use a .NET approach in PS for multipart if -Form isn't available, 
    # BUT assuming modern environment, let's try just the file content first in case the API supports raw binary (some do).
    
    # If raw fails, we will try the validation script verify-v2-options which seemed to work for other things? No that was video gen.
    
    Write-Host $response
} catch {
    Write-Host "Error:" $_.Exception.Message
    Write-Host "Status Code:" $_.Exception.Response.StatusCode.value__
    $stream = $_.Exception.Response.GetResponseStream()
    if ($stream) {
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Host "Body:" $reader.ReadToEnd()
    }
}
