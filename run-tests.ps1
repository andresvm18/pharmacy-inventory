Write-Host "Running unit tests..." -ForegroundColor Green
dotnet test PharmacyInventory.Tests/PharmacyInventory.Tests.csproj --verbosity normal

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ All tests passed!" -ForegroundColor Green
    Write-Host "Safe to push to repository" -ForegroundColor Green
} else {
    Write-Host "❌ Tests failed! Fix errors before pushing" -ForegroundColor Red
    exit 1
}