@echo off
REM ============================================================
REM deploy-n8n.example.cmd
REM Импорт workflow из репо в локальный n8n через CLI.
REM
REM ВАЖНО: это пример. Отредактируй пути перед использованием.
REM Не хранить секреты в этом файле.
REM ============================================================

REM Путь к папке с workflow JSON файлами
set WORKFLOWS_DIR=%~dp0..\automation\n8n\workflows

REM Адрес локального n8n (по умолчанию)
set N8N_HOST=http://localhost:5678

echo.
echo [1/3] Проверка запуска n8n...
curl -s -o nul -w "%%{http_code}" %N8N_HOST%/healthz | findstr "200" >nul
if errorlevel 1 (
    echo ОШИБКА: n8n не запущен на %N8N_HOST%
    echo Запусти n8n командой: npx n8n
    exit /b 1
)
echo OK — n8n доступен.

echo.
echo [2/3] Импорт workflow...
echo Файлы для импорта:
dir /b "%WORKFLOWS_DIR%\*.json"

echo.
echo Импортируй вручную через n8n UI:
echo   1. Открой %N8N_HOST%
echo   2. Workflows - Add workflow - Import from file
echo   3. Выбери каждый .json файл из папки:
echo      %WORKFLOWS_DIR%
echo.
echo Или используй n8n CLI (если установлен глобально):
REM n8n import:workflow --input="%WORKFLOWS_DIR%\wf.discovery.manual-intake.v1.json"
REM n8n import:workflow --input="%WORKFLOWS_DIR%\wf.market-signals.normalize.v1.json"
REM n8n import:workflow --input="%WORKFLOWS_DIR%\wf.opportunity.build.v1.json"

echo.
echo [3/3] После импорта:
echo   - Проверь, что все 3 workflow появились в n8n UI
echo   - Запусти smoke-test: scripts\smoke-test.example.cmd
echo   - НЕ активируй workflow до прохождения smoke-test

echo.
echo Готово.
