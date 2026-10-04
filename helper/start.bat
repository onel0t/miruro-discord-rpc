@echo off
cd /d "%~dp0"
call npm install --silent
if exist clientid.txt findstr /r "^[0-9][0-9]*$" clientid.txt >nul || del clientid.txt
if exist clientid.txt goto run
set /p ID=Paste your Discord Application ID: 
>clientid.txt echo %ID%
:run
set /p CLIENT_ID=<clientid.txt
node server.js
