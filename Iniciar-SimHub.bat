@echo off
setlocal

REM Vai para a pasta do projeto onde este .bat esta salvo
cd /d "%~dp0"

REM Abre backend e frontend em janelas separadas
start "SimHub API" cmd /k "cd /d ""%~dp0backend"" && npm run dev"
start "SimHub Frontend" cmd /k "cd /d ""%~dp0"" && npm run dev"

REM Aguarda alguns segundos e abre o navegador
timeout /t 5 /nobreak >nul
start "" "http://localhost:5173"

endlocal