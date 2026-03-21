@echo off
REM ============================================================
REM smoke-test.example.cmd
REM Минимальная проверка работоспособности workflow после импорта.
REM
REM ВАЖНО: это пример. n8n должен быть запущен локально.
REM Полный список проверок — в automation/n8n/docs/smoke-tests.md
REM ============================================================

set N8N_HOST=http://localhost:5678

echo.
echo ========================================
echo  Smoke-test: business-ai n8n workflows
echo ========================================

echo.
echo [1/4] Проверка доступности n8n...
curl -s -o nul -w "%%{http_code}" %N8N_HOST%/healthz | findstr "200" >nul
if errorlevel 1 (
    echo FAIL — n8n не доступен на %N8N_HOST%
    exit /b 1
)
echo PASS — n8n запущен.

echo.
echo [2/4] Проверка наличия workflow в n8n UI...
echo Открой вручную: %N8N_HOST%
echo Убедись, что присутствуют все три workflow:
echo   - Discovery — Manual Intake
echo   - Market Signals — Normalize
echo   - Opportunity — Build
echo.
echo Нажми любую клавишу после проверки...
pause >nul

echo.
echo [3/4] Проверка структуры workflow JSON в репо...
set WORKFLOWS_DIR=%~dp0..\automation\n8n\workflows

if exist "%WORKFLOWS_DIR%\wf.discovery.manual-intake.v1.json" (
    echo PASS — wf.discovery.manual-intake.v1.json найден
) else (
    echo FAIL — wf.discovery.manual-intake.v1.json отсутствует
)

if exist "%WORKFLOWS_DIR%\wf.market-signals.normalize.v1.json" (
    echo PASS — wf.market-signals.normalize.v1.json найден
) else (
    echo FAIL — wf.market-signals.normalize.v1.json отсутствует
)

if exist "%WORKFLOWS_DIR%\wf.opportunity.build.v1.json" (
    echo PASS — wf.opportunity.build.v1.json найден
) else (
    echo FAIL — wf.opportunity.build.v1.json отсутствует
)

echo.
echo [4/4] Ручные проверки (выполни в n8n UI):
echo   - Для каждого workflow: открой, убедись что trigger настроен
echo   - wf.market-signals.normalize.v1: запусти тестовый прогон с примером raw signal
echo   - wf.opportunity.build.v1: убедись что все шаги видны в редакторе
echo   - Ни один workflow не активирован без прохождения всех проверок
echo.
echo Подробные критерии — automation\n8n\docs\smoke-tests.md

echo.
echo Smoke-test завершён. Все FAIL нужно исправить до активации.
