param(
    [switch]$NoBrowser,
    [switch]$NoPause,
    [int]$Port = 8000,
    [switch]$SelfTest
)

$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

function Find-Python {
    if (Test-Path -LiteralPath 'D:\Python\python.exe') {
        return 'D:\Python\python.exe'
    }
    $command = Get-Command python.exe -ErrorAction SilentlyContinue
    if ($command) {
        return $command.Source
    }
    throw '没有找到 Python。请先运行“环境检查.bat”。'
}

function Test-DemoHealth {
    try {
        $response = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/health" -TimeoutSec 1
        return $response.status -eq 'ok'
    }
    catch {
        return $false
    }
}

try {
    $python = Find-Python
    $serverProcess = $null
    if ($SelfTest) {
        $NoBrowser = $true
        $NoPause = $true
    }
    & $python -c 'import fastapi, uvicorn, numpy, PIL' 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Python 依赖不完整。请执行：`"$python`" -m pip install -r backend\requirements.txt"
    }

    if (Test-DemoHealth) {
        Write-Host '[通过] 识别服务已经运行，直接复用。' -ForegroundColor Green
    }
    else {
        Write-Host '正在启动金铲铲识别服务……'
        $startParameters = @{
            FilePath = $python
            ArgumentList = @('-m', 'uvicorn', 'app.main:app', '--app-dir', 'backend', '--host', '127.0.0.1', '--port', "$Port")
            WorkingDirectory = $PSScriptRoot
            PassThru = $true
        }
        if ($SelfTest) {
            $startParameters.WindowStyle = 'Hidden'
        }
        $serverProcess = Start-Process @startParameters

        $deadline = (Get-Date).AddSeconds(15)
        do {
            Start-Sleep -Milliseconds 400
            if (Test-DemoHealth) {
                break
            }
        } while ((Get-Date) -lt $deadline)

        if (-not (Test-DemoHealth)) {
            throw '识别服务未能在 15 秒内启动，请查看服务窗口中的报错。'
        }
        Write-Host '[通过] 识别服务启动成功。' -ForegroundColor Green
    }

    if (-not $NoBrowser) {
        Start-Process -FilePath (Join-Path $PSScriptRoot 'frontend\prototypes\week1\index.html')
        Write-Host '[通过] 演示网页已经打开。' -ForegroundColor Green
    }

    Write-Host '演示期间请不要关闭识别服务窗口。'
    if ($SelfTest -and $serverProcess -and -not $serverProcess.HasExited) {
        Stop-Process -Id $serverProcess.Id -Force
        $serverProcess.WaitForExit()
        Write-Host '[通过] 冷启动自检完成，临时服务已关闭。' -ForegroundColor Green
    }
    if (-not $NoPause) {
        Read-Host '按 Enter 关闭当前启动窗口'
    }
}
catch {
    Write-Host ('[错误] ' + $_.Exception.Message) -ForegroundColor Red
    exit 1
}
