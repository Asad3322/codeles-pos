@echo off
setlocal

set "ROOT=%~dp0.."
set "APP=%ROOT%\app"
set "NODE=%ROOT%\runtime\node.exe"

cd /d "%APP%"

set "NODE_ENV=production"
set "HOSTNAME=127.0.0.1"
set "PORT=3000"

"%NODE%" "server.js"

endlocal
