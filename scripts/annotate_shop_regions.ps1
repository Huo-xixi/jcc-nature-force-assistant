param(
    [Parameter(Mandatory = $true)]
    [string]$InputPath,

    [Parameter(Mandatory = $true)]
    [string]$OutputPath,

    [string]$ConfigPath = (Join-Path $PSScriptRoot '..\vision\configs\emulator-shop-1920x1092.json')
)

Add-Type -AssemblyName System.Drawing

$config = Get-Content -LiteralPath $ConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json
$image = [System.Drawing.Bitmap]::FromFile($InputPath)
$canvas = New-Object System.Drawing.Bitmap($image.Width, $image.Height)
$graphics = [System.Drawing.Graphics]::FromImage($canvas)
$graphics.DrawImage($image, 0, 0, $image.Width, $image.Height)

$shopPen = New-Object System.Drawing.Pen([System.Drawing.Color]::Orange, 5)
$slotPen = New-Object System.Drawing.Pen([System.Drawing.Color]::Lime, 4)
$labelBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(210, 0, 0, 0))
$textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$font = New-Object System.Drawing.Font('Arial', 18, [System.Drawing.FontStyle]::Bold)

# Coordinate origin is the upper-left corner of the screenshot.
$shopValues = $config.shop_region.rect_xywh
$shopRegion = [System.Drawing.Rectangle]::new($shopValues[0], $shopValues[1], $shopValues[2], $shopValues[3])
$slots = @($config.regions | ForEach-Object {
    $values = $_.rect_xywh
    [System.Drawing.Rectangle]::new($values[0], $values[1], $values[2], $values[3])
})

$graphics.DrawRectangle($shopPen, $shopRegion)
$graphics.FillRectangle($labelBrush, 340, 844, 310, 34)
$graphics.DrawString(('SHOP ROI  x={0} y={1}' -f $shopRegion.X, $shopRegion.Y), $font, $textBrush, 345, 847)

for ($index = 0; $index -lt $slots.Count; $index++) {
    $slot = $slots[$index]
    $graphics.DrawRectangle($slotPen, $slot)
    $graphics.FillRectangle($labelBrush, $slot.X + 5, $slot.Y + 5, 86, 31)
    $graphics.DrawString(('SLOT {0}' -f ($index + 1)), $font, $textBrush, $slot.X + 9, $slot.Y + 7)
}

$canvas.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)

$font.Dispose()
$textBrush.Dispose()
$labelBrush.Dispose()
$slotPen.Dispose()
$shopPen.Dispose()
$graphics.Dispose()
$canvas.Dispose()
$image.Dispose()

