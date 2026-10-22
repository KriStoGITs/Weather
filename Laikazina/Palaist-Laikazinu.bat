@echo off
setlocal
cd /d "C:\Users\gurda\Desktop\Laikazina"
if errorlevel 1 (
  echo Nav atrasta C:\xampp\htdocs\Laikazina mape.
  pause
  exit /b 1
)
if not exist ".env" (
  echo Saja projekta mape nav .env faila.
  pause
  exit /b 1
)
set "OPENWEATHER_API_KEY="
set "PORT=4174"
set "HOST=127.0.0.1"
echo Projekts: C:\xampp\htdocs\Laikazina
echo Atver parluuka http://127.0.0.1:4174
echo Atstaj so logu atvertu, kamer izmanto lietotni.
node --env-file=".env" server.js
pause
endlocal
