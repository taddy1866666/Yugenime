@echo off
echo Starting Yugenime Full Stack...
echo.

start "Backend Server" cmd /k "cd server && npm start"
timeout /t 3 /nobreak >nul
start "Frontend Dev" cmd /k "npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Press any key to close this window (servers will continue running)
pause >nul
