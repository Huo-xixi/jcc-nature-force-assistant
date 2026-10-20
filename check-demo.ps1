param([switch]$NoPause)

$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

try {
    $python = $null
    if (Test-Path -LiteralPath 'D:\Python\python.exe') {
        $python = 'D:\Python\python.exe'
    }
    else {
        $command = Get-Command python.exe -ErrorAction SilentlyContinue
        if ($command) {
            $python = $command.Source
        }
    }
    if (-not $python) {
        throw '没有找到 Python。'
    }
    Write-Host "[通过] Python：$python" -ForegroundColor Green

    & $python -c 'import fastapi, uvicorn, numpy, PIL' 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "Python 依赖不完整。请执行：`"$python`" -m pip install -r backend\requirements.txt"
    }
    Write-Host '[通过] Python 依赖完整。' -ForegroundColor Green

    $requiredFiles = @(
        'backend\app\main.py',
        'frontend\prototypes\week1\index.html',
        'vision\one_cost_manifest.json',
        'vision\tests\fixtures\varus-leona.png',
        'ppt\index.html',
        'ppt\output\金铲铲阵容智能助手-当前进度演示版-v2.pptx'
    )
    foreach ($relativePath in $requiredFiles) {
        if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot $relativePath))) {
            throw "缺少文件：$relativePath"
        }
    }
    Write-Host '[通过] 程序、识别模板、备用截图和汇报文件齐全。' -ForegroundColor Green

    & $python -B -m unittest discover -s 'vision\tests' -v
    if ($LASTEXITCODE -ne 0) {
        throw '图像识别自检没有通过。'
    }
    Write-Host '[通过] 图像识别测试全部通过。' -ForegroundColor Green
    Write-Host '环境检查完成，可以运行 start-demo.bat。'

    if (-not $NoPause) {
        Read-Host '按 Enter 关闭检查窗口'
    }
}
catch {
    Write-Host ('[错误] ' + $_.Exception.Message) -ForegroundColor Red
    exit 1
}
