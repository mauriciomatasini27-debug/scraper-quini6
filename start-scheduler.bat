@echo off
echo Iniciando Scheduler Automatico de Quini 6
echo ===========================================
echo.
echo Presiona Ctrl+C para detener el scheduler
echo.

cd /d "%~dp0"
call npm run scheduler

pause

