@echo off
REM Script to run Taskmaster UI with a custom project path on Windows
REM Usage: run-with-project.bat "C:\path\to\your\project" [dev|start]

if "%~1"=="" (
    echo Usage: %0 ^<project-path^> [dev^|start]
    echo Example: %0 "C:\Users\john\my-project" dev
    echo Example: %0 "..\other-project" start
    exit /b 1
)

set "PROJECT_PATH=%~1"
set "MODE=%~2"
if "%MODE%"=="" set "MODE=dev"

REM Check if project path exists
if not exist "%PROJECT_PATH%" (
    echo Error: Project path '%PROJECT_PATH%' does not exist
    exit /b 1
)

REM Check if .taskmaster directory exists in the project
if not exist "%PROJECT_PATH%\.taskmaster" (
    echo Warning: .taskmaster directory not found in '%PROJECT_PATH%'
    echo Make sure this is a Taskmaster project or run 'task-master init' in the target project
)

REM Get absolute path
for %%i in ("%PROJECT_PATH%") do set "PROJECT_ABSOLUTE=%%~fi"

echo 🚀 Starting Taskmaster UI for project: %PROJECT_ABSOLUTE%
echo 📋 Looking for tasks in: %PROJECT_ABSOLUTE%\.taskmaster\tasks\tasks.json
echo 🌐 UI will be available at: http://localhost:3001
echo.

REM Set environment variable and run the appropriate script
set "TASKMASTER_PROJECT_ROOT=%PROJECT_ABSOLUTE%"

if "%MODE%"=="start" (
    npm run start
) else (
    npm run dev
) 