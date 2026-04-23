@echo off
setlocal enabledelayedexpansion

echo.
echo ==========================================
echo  FamilyTask - Performance Tests Runner
echo ==========================================
echo.

REM Ruta de JMeter (instalado via plugin de IntelliJ)
set JMETER_BIN=%APPDATA%\JetBrains\IntelliJIdea2025.3\apache-jmeter-5.6.3\bin
if exist "!JMETER_BIN!\jmeter.bat" (
    set PATH=!PATH!;!JMETER_BIN!
)

REM Verificar que jmeter este disponible
where jmeter >nul 2>&1
if !errorlevel! neq 0 (
    echo ERROR: No se encontro jmeter en:
    echo   !JMETER_BIN!
    echo Verifica que IntelliJ haya descargado el plugin de JMeter.
    exit /b 1
)

REM Recibir variables como argumentos o solicitarlas
if "%~1"=="" (
    set /p JWT_TOKEN="JWT_TOKEN (F12 ^> Local Storage ^> accessToken): "
) else (
    set JWT_TOKEN=%~1
)

if "%~2"=="" (
    set /p FAMILY_ID="FAMILY_ID: "
) else (
    set FAMILY_ID=%~2
)

set WEEK_START=2026-04-14
if not "%~3"=="" set WEEK_START=%~3

REM Generar timestamp
for /f "tokens=2 delims==" %%a in ('wmic OS Get LocalDateTime /value 2^>nul') do (
    if not "%%a"=="" set DT=%%a
)
set TIMESTAMP=!DT:~0,8!_!DT:~8,6!

set SCRIPT_DIR=%~dp0
set RESULTS_DIR=!SCRIPT_DIR!results

echo.
echo Timestamp : !TIMESTAMP!
echo Family ID : !FAMILY_ID!
echo Week Start: !WEEK_START!
echo Resultados: !RESULTS_DIR!
echo.

if not exist "!RESULTS_DIR!" mkdir "!RESULTS_DIR!"

REM Correr cada modulo en orden
call :run_test auth
call :run_test tasks
call :run_test family
call :run_test habits
call :run_test rewards
call :run_test redemptions
call :run_test reports
call :run_test invitations

echo.
echo ==========================================
echo  Tests completados
echo.
echo  Reportes generados:
for /d %%m in (!RESULTS_DIR!\*) do (
    if exist "%%m\!TIMESTAMP!\report\index.html" (
        echo    %%~nxm ^> %%m\!TIMESTAMP!\report\index.html
    )
)
echo ==========================================
goto :eof

:run_test
set MODULE=%~1
set JMX=!SCRIPT_DIR!!MODULE!-load-test.jmx
set OUT=!RESULTS_DIR!\!MODULE!\!TIMESTAMP!

if not exist "!JMX!" (
    echo [!MODULE!] SKIP - !MODULE!-load-test.jmx no encontrado
    echo.
    goto :eof
)

echo [!MODULE!] Ejecutando...
if not exist "!OUT!" mkdir "!OUT!"

jmeter -n ^
  -t "!JMX!" ^
  -l "!OUT!\results.jtl" ^
  -e -o "!OUT!\report" ^
  -JJWT_TOKEN=!JWT_TOKEN! ^
  -JFAMILY_ID=!FAMILY_ID! ^
  -JWEEK_START=!WEEK_START! ^
  -JBASE_HOST=localhost ^
  -JBASE_PORT=8080 ^
  -j "!OUT!\jmeter.log"

if !errorlevel! == 0 (
    echo [!MODULE!] OK  → !OUT!\report\index.html
) else (
    echo [!MODULE!] ERR → Revisa !OUT!\jmeter.log
)
echo.
goto :eof
