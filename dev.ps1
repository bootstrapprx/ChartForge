# dev.ps1 - Unified Dev Mode for Windows

Write-Host "Starting Unified Dev Mode..." -ForegroundColor Green

# 1. Start Docker Services
Write-Host "Starting Docker services (Postgres, Ollama, Backend, Frontend)..." -ForegroundColor Cyan
docker-compose -f ./docker-compose.dev.yml up -d --build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to start Docker services. Please ensure Docker Desktop is running."
    exit $LASTEXITCODE
}

# 2. Backend is now running in Docker
Write-Host "Backend is running in Docker container." -ForegroundColor Cyan

# 3. Frontend is now running in Docker
Write-Host "Frontend is running in Docker container." -ForegroundColor Cyan

Write-Host "Unified Dev Mode is running!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173"
Write-Host "Backend:  http://localhost:8000"
Write-Host "Ollama:   http://localhost:11434"
Write-Host "Postgres: localhost:5432"
Write-Host "Note: Services are running in the background. Check backend/backend.log and frontend/frontend.log for output."
