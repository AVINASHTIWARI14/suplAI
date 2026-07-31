# Stop anything on port 8000, then start SuplAI API
$conn = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if ($conn) {
  $conn | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
  }
  Start-Sleep -Seconds 2
  Write-Host "Stopped old process on port 8000"
}

Set-Location $PSScriptRoot\..
python scripts/seed_database.py
Write-Host "Starting API at http://127.0.0.1:8000"
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
