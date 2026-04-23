param(
    [string]$JwtToken,
    [string]$FamilyId,
    [string]$WeekStart = "2026-04-14"
)

# Solicitar variables si no se pasaron como argumento
if (-not $JwtToken) { $JwtToken = Read-Host "JWT_TOKEN (F12 > Local Storage > accessToken)" }
if (-not $FamilyId) { $FamilyId = Read-Host "FAMILY_ID" }

# Ruta de JMeter instalado via plugin de IntelliJ
$JMeterBin = "$env:APPDATA\JetBrains\IntelliJIdea2025.3\apache-jmeter-5.6.3\bin\jmeter.bat"
if (-not (Test-Path $JMeterBin)) {
    Write-Host "ERROR: No se encontro JMeter en: $JMeterBin" -ForegroundColor Red
    exit 1
}

$Timestamp  = Get-Date -Format "yyyyMMdd_HHmmss"
$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$ResultsDir = Join-Path $ScriptDir "results"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " FamilyTask - Performance Tests Runner"    -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Timestamp : $Timestamp"
Write-Host "Family ID : $FamilyId"
Write-Host "Week Start: $WeekStart"
Write-Host "Resultados: $ResultsDir"
Write-Host ""

New-Item -ItemType Directory -Path $ResultsDir -Force | Out-Null

$modules = @("auth","tasks","family","habits","rewards","redemptions","reports","invitations")
$summary = @()

foreach ($module in $modules) {
    $jmxFile = Join-Path $ScriptDir "$module-load-test.jmx"

    if (-not (Test-Path $jmxFile)) {
        Write-Host "[$module] SKIP" -ForegroundColor Yellow
        continue
    }

    $outDir    = Join-Path $ResultsDir "$module\$Timestamp"
    $jtlFile   = Join-Path $outDir "results.jtl"
    $reportDir = Join-Path $outDir "report"
    $logFile   = Join-Path $outDir "jmeter.log"

    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
    Write-Host "[$module] Ejecutando..." -ForegroundColor White

    $jmeterArgs = @(
        "-n",
        "-t",  $jmxFile,
        "-l",  $jtlFile,
        "-e",
        "-o",  $reportDir,
        "-JJWT_TOKEN=$JwtToken",
        "-JFAMILY_ID=$FamilyId",
        "-JWEEK_START=$WeekStart",
        "-JBASE_HOST=localhost",
        "-JBASE_PORT=8080",
        "-j",  $logFile
    )

    $proc = Start-Process -FilePath $JMeterBin -ArgumentList $jmeterArgs -Wait -PassThru -NoNewWindow

    if ($proc.ExitCode -eq 0) {
        Write-Host "[$module] OK  -> $reportDir\index.html" -ForegroundColor Green
        $summary += [PSCustomObject]@{ Module=$module; Status="OK"; Path="$reportDir\index.html" }
    } else {
        Write-Host "[$module] ERR -> $logFile" -ForegroundColor Red
        $summary += [PSCustomObject]@{ Module=$module; Status="ERR"; Path=$logFile }
    }
    Write-Host ""
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Resumen"                                  -ForegroundColor Cyan
Write-Host ""
foreach ($r in $summary) {
    if ($r.Status -eq "OK") {
        Write-Host "  OK   $($r.Module)" -ForegroundColor Green
        Write-Host "       $($r.Path)"
    } else {
        Write-Host "  ERR  $($r.Module)" -ForegroundColor Red
        Write-Host "       $($r.Path)"
    }
}
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
