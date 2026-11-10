@echo off
setlocal DisableDelayedExpansion
title Snow Rider Controls Setup
set "task_source=%~dp0Extension"

for %%F in (manifest.json content.js movement.js panel.js loadouts.js invincibility.js wasm-patch.js "START HERE.html") do (
  if not exist "%task_source%\%%~F" goto missing_files
)

:choose_folder
set "task_destination=%USERPROFILE%\Downloads\Snow Rider Controls-%RANDOM%-%RANDOM%"
if exist "%task_destination%" goto choose_folder

robocopy "%task_source%" "%task_destination%" /E /COPY:DAT /DCOPY:T /R:0 /W:0 /NFL /NDL /NJH /NJS
if errorlevel 8 goto copy_failed
for %%F in (manifest.json content.js movement.js panel.js loadouts.js invincibility.js wasm-patch.js "START HERE.html") do (
  if not exist "%task_destination%\%%~F" goto copy_failed
)

echo.
echo Copied Snow Rider Controls to:
echo "%task_destination%"
echo.
echo In Chrome: chrome://extensions - Developer mode - Load unpacked.
echo Select the folder above. Keep it after removing the USB.
start "" explorer.exe "%task_destination%"
start "" "%task_destination%\START HERE.html"
echo.
pause
exit /b 0

:missing_files
echo Keep this setup file beside the complete Extension folder.
pause
exit /b 1

:copy_failed
echo Copy failed. You can copy the Extension folder into Downloads manually.
echo A partial copy may be at "%task_destination%".
pause
exit /b 1
