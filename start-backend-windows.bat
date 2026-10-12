@echo off
cd /d "%~dp0backend"
echo Demarrage du backend Java Spring Boot sur http://localhost:8080
where mvn >nul 2>nul
if errorlevel 1 (
  echo Maven 3.9+ est requis pour ce mode de lancement. Utilise start-docker-windows.bat si tu as Docker Desktop.
  pause
  exit /b 1
)
mvn spring-boot:run
pause
