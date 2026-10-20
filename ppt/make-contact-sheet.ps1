$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$previewDir = Join-Path $PSScriptRoot 'previews'
$canvas = [System.Drawing.Bitmap]::new(1920, 2820)
$graphics = [System.Drawing.Graphics]::FromImage($canvas)
try {
    $graphics.Clear([System.Drawing.Color]::FromArgb(18, 18, 18))
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $font = [System.Drawing.Font]::new('Arial', 18, [System.Drawing.FontStyle]::Bold)
    $labelBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
    try {
        for ($i = 1; $i -le 10; $i++) {
            $row = [Math]::Floor(($i - 1) / 2)
            $column = ($i - 1) % 2
            $x = 24 + ($column * 948)
            $y = 24 + ($row * 558)
            $path = Join-Path $previewDir ("slide-{0}.png" -f $i.ToString('00'))
            $image = [System.Drawing.Image]::FromFile($path)
            try {
                $graphics.DrawImage($image, $x, $y + 28, 920, 518)
                $graphics.DrawString(("{0:00}" -f $i), $font, $labelBrush, $x, $y)
            } finally {
                $image.Dispose()
            }
        }
    } finally {
        $font.Dispose()
        $labelBrush.Dispose()
    }
    $canvas.Save((Join-Path $previewDir 'contact-sheet.png'), [System.Drawing.Imaging.ImageFormat]::Png)
} finally {
    $graphics.Dispose()
    $canvas.Dispose()
}
