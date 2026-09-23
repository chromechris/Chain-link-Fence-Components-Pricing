@echo off
rem Double-click to refresh feed.json / feed.csv with Claude web research and push to GitHub.
rem Needs Node.js and an Anthropic API key (set ANTHROPIC_API_KEY as a Windows environment
rem variable, or put it in a file named .env in this folder as ANTHROPIC_API_KEY=sk-ant-...).
cd /d "%~dp0"
if exist .env for /f "usebackq tokens=1,* delims==" %%a in (".env") do set "%%a=%%b"
if not exist node_modules (echo Installing dependencies... & call npm install)
node update-feed.js research --push
echo.
pause
