@echo off
cd /d "%~dp0frontend"
echo Installation des dependances web puis lancement de Vite...
where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js / npm n'est pas installe. Utilise le lancement Docker si disponible.
  pause
  exit /b 1
)
if not exist node_modules call npm install
if errorlevel 1 goto error
call npm run dev
pause
exit /b 0
:error
echo Echec de l'installation. Verifie l'acces internet et les versions Node.js.
pause
exit /b 1
