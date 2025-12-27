$url = "http://localhost:3000/admin/courses/edit/375"
Write-Host "Testing: $url" -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri $url -Method Head -UseBasicParsing -ErrorAction Stop
    Write-Host "`n✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode) $($response.StatusDescription)" -ForegroundColor Green
    Write-Host "`nThe admin edit route is now working!" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "`n❌ STILL 404" -ForegroundColor Red
        Write-Host "Route not found yet" -ForegroundColor Red
    } else {
        Write-Host "`n⚠️ Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    }
}
