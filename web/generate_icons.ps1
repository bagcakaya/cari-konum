Add-Type -AssemblyName System.Drawing

function Create-AppIcon([int]$size, [string]$targetPath) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    # Background rounded rect / gradient
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $rect,
        [System.Drawing.Color]::FromArgb(15, 23, 42), # Dark Slate (900)
        [System.Drawing.Color]::FromArgb(30, 58, 138), # Deep Royal Blue
        90.0
    )
    $g.FillRectangle($brush, $rect)

    # Outer radar ring
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(60, 59, 130, 246), [float]($size * 0.04))
    $g.DrawEllipse($pen, [float]($size * 0.08), [float]($size * 0.08), [float]($size * 0.84), [float]($size * 0.84))
    
    # Inner radar ring
    $pen2 = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(120, 59, 130, 246), [float]($size * 0.03))
    $g.DrawEllipse($pen2, [float]($size * 0.22), [float]($size * 0.22), [float]($size * 0.56), [float]($size * 0.56))

    # Center Pin Body (Vibrant Red-500)
    $pinBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(239, 68, 68))
    $cx = [float]($size / 2)
    $cy = [float]($size * 0.40)
    $radius = [float]($size * 0.24)
    $g.FillEllipse($pinBrush, [float]($cx - $radius), [float]($cy - $radius), [float]($radius * 2), [float]($radius * 2))

    # Pin triangle pointer
    $pt1 = New-Object System.Drawing.PointF([float]($cx - $radius * 0.88), [float]($cy + $radius * 0.35))
    $pt2 = New-Object System.Drawing.PointF([float]($cx + $radius * 0.88), [float]($cy + $radius * 0.35))
    $pt3 = New-Object System.Drawing.PointF([float]($cx), [float]($size * 0.82))
    [System.Drawing.PointF[]]$poly = @($pt1, $pt2, $pt3)
    $g.FillPolygon($pinBrush, $poly)

    # Pin Center Ring (White)
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $innerR = [float]($radius * 0.52)
    $g.FillEllipse($whiteBrush, [float]($cx - $innerR), [float]($cy - $innerR), [float]($innerR * 2), [float]($innerR * 2))

    # Inner Radar Center Dot (Dark Slate)
    $centerDot = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 23, 42))
    $dotR = [float]($innerR * 0.52)
    $g.FillEllipse($centerDot, [float]($cx - $dotR), [float]($cy - $dotR), [float]($dotR * 2), [float]($dotR * 2))

    $g.Dispose()
    $bmp.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "Created icon: $targetPath"
}

$iconsDir = Join-Path $PSScriptRoot "public\icons"
if (!(Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir -Force | Out-Null
}

Create-AppIcon 192 (Join-Path $iconsDir "icon-192.png")
Create-AppIcon 512 (Join-Path $iconsDir "icon-512.png")
Create-AppIcon 192 (Join-Path $PSScriptRoot "public\apple-touch-icon.png")
Create-AppIcon 192 (Join-Path $PSScriptRoot "public\favicon.png")
