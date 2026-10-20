@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0check-demo.ps1"
if errorlevel 1 pause
