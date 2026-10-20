$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$outputDir = Join-Path $PSScriptRoot 'images'
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

function New-SwissFrame {
    param(
        [Parameter(Mandatory)][string]$Source,
        [Parameter(Mandatory)][string]$Destination,
        [System.Drawing.Rectangle]$Crop = [System.Drawing.Rectangle]::Empty
    )

    $sourceImage = [System.Drawing.Image]::FromFile($Source)
    try {
        $sourceRect = if ($Crop.IsEmpty) {
            [System.Drawing.Rectangle]::new(0, 0, $sourceImage.Width, $sourceImage.Height)
        } else {
            $Crop
        }

        $canvas = [System.Drawing.Bitmap]::new(1680, 720)
        try {
            $graphics = [System.Drawing.Graphics]::FromImage($canvas)
            try {
                $graphics.Clear([System.Drawing.Color]::FromArgb(250, 250, 248))
                $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
                $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

                $dotBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(32, 0, 47, 167))
                try {
                    for ($y = 16; $y -lt 720; $y += 24) {
                        for ($x = 16; $x -lt 1680; $x += 24) {
                            $graphics.FillRectangle($dotBrush, $x, $y, 2, 2)
                        }
                    }
                } finally {
                    $dotBrush.Dispose()
                }

                $maxW = 1560.0
                $maxH = 620.0
                $scale = [Math]::Min($maxW / $sourceRect.Width, $maxH / $sourceRect.Height)
                $drawW = [int][Math]::Round($sourceRect.Width * $scale)
                $drawH = [int][Math]::Round($sourceRect.Height * $scale)
                $drawX = [int][Math]::Round((1680 - $drawW) / 2)
                $drawY = [int][Math]::Round((720 - $drawH) / 2)
                $destRect = [System.Drawing.Rectangle]::new($drawX, $drawY, $drawW, $drawH)

                $keyline = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(212, 212, 210), 2)
                try {
                    $graphics.DrawRectangle($keyline, $drawX - 1, $drawY - 1, $drawW + 1, $drawH + 1)
                } finally {
                    $keyline.Dispose()
                }

                $graphics.DrawImage($sourceImage, $destRect, $sourceRect, [System.Drawing.GraphicsUnit]::Pixel)
            } finally {
                $graphics.Dispose()
            }
            $canvas.Save($Destination, [System.Drawing.Imaging.ImageFormat]::Png)
        } finally {
            $canvas.Dispose()
        }
    } finally {
        $sourceImage.Dispose()
    }
}

$prototypeDir = Join-Path $projectRoot 'docs\member-b\week1\screenshots'
$prototypeNames = @(
    '01-home.png',
    '02-resources.png',
    '03-recommendations.png',
    '04-detail.png',
    '05-confirmation.png'
)

for ($i = 0; $i -lt $prototypeNames.Count; $i++) {
    $number = $i + 1
    New-SwissFrame `
        -Source (Join-Path $prototypeDir $prototypeNames[$i]) `
        -Destination (Join-Path $outputDir ("06-prototype-{0}.png" -f $number))
}

$shopCrop = [System.Drawing.Rectangle]::new(335, 840, 1268, 251)
New-SwissFrame `
    -Source (Join-Path $projectRoot 'data\raw\screenshots\member-b\shop-original-1920x1092.png') `
    -Destination (Join-Path $outputDir '06-prototype-6.png') `
    -Crop $shopCrop

New-SwissFrame `
    -Source (Join-Path $projectRoot 'data\raw\screenshots\member-b\shop-regions-verified-1920x1092.png') `
    -Destination (Join-Path $outputDir '07-shop-annotated.png') `
    -Crop $shopCrop
