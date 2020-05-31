@echo off
title jHTTP Server
:loop
node .\main.js
echo ENDED SERVER, RESTARTING
goto loop