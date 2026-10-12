@echo off
cd /d "%~dp0"
echo ======================================================
echo BioSim Lab Pro - lancement Docker
echo ======================================================
where docker >nul 2>nul
if errorlevel 1 (
  echo Docker n'est pas installe ou n'est pas disponible dans le PATH.
  echo Installe Docker Desktop, demarre-le, puis relance ce fichier.
  pause
  exit /b 1
)
docker compose up --build
pause
