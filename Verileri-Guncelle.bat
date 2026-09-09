@echo off
chcp 65001 > nul
title Cari Konum - Veri Senkronizasyonu
cls
echo ====================================================
echo  POLATLAR2025 - Cari Konum Senkronizasyonu
echo ====================================================
echo.
cd /d "%~dp0\sync-agent"
node sync.js
echo.
pause
