@echo off
chcp 65001 > nul
title Cari Konum - Uygulama Sunucusu
cls
echo ====================================================
echo  Cari Konum Mobil PWA Baslatiliyor...
echo ====================================================
echo.
cd /d "%~dp0\web"
echo Tarayicinizda acmak icin: http://localhost:3000
echo Mobilden ayni Wi-Fi uzerinden acmak icin Network adresini kullanabilirsiniz.
echo.
npm.cmd run dev
pause
