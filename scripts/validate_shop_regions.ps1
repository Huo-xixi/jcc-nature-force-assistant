param(
    [Parameter(Mandatory = $true)]
    [string]$ScreenshotDirectory,

    [string]$ConfigPath = (Join-Path $PSScriptRoot '..\vision\configs\emulator-shop-1920x1092.json')
)

Add-Type -AssemblyName System.Drawing

$config = Get-Content -LiteralPath $ConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json
$expectedWidth = [int]$config.environment.game_content_size_px.width
$expectedHeight = [int]$config.environment.game_content_size_px.height
$regions = @($config.regions)
$results = @()

Get-ChildItem -LiteralPath $ScreenshotDirectory -File |
    Where-Object { $_.Extension -match '^\.(png|jpg|jpeg|bmp)$' -and $_.Name -notmatch '-annotated\.' } |
    Sort-Object Name |
    ForEach-Object {
        $image = [System.Drawing.Image]::FromFile($_.FullName)
        $resolutionOk = $image.Width -eq $expectedWidth -and $image.Height -eq $expectedHeight
        $boundsOk = $true

        foreach ($region in $regions) {
            $rect = $region.rect_xywh
            $x = [int]$rect[0]
            $y = [int]$rect[1]
            $width = [int]$rect[2]
            $height = [int]$rect[3]
            if ($x -lt 0 -or $y -lt 0 -or $width -le 0 -or $height -le 0 -or
                ($x + $width) -gt $image.Width -or ($y + $height) -gt $image.Height) {
                $boundsOk = $false
            }
        }

        $results += [PSCustomObject]@{
            File = $_.Name
            Width = $image.Width
            Height = $image.Height
            Resolution = if ($resolutionOk) { 'PASS' } else { 'FAIL' }
            RegionBounds = if ($boundsOk) { 'PASS' } else { 'FAIL' }
            Result = if ($resolutionOk -and $boundsOk) { 'PASS' } else { 'FAIL' }
        }
        $image.Dispose()
    }

$results | Format-Table -AutoSize
$failed = @($results | Where-Object { $_.Result -ne 'PASS' }).Count
Write-Output ('SUMMARY total={0} passed={1} failed={2}' -f $results.Count, ($results.Count - $failed), $failed)

if ($results.Count -eq 0 -or $failed -gt 0) {
    exit 1
}

