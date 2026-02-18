param(
    [string]$PhotoDir = "docs/photos",
    [int]$MaxKb = 200
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$maxBytes = $MaxKb * 1024
$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageDecoders() |
    Where-Object { $_.MimeType -eq "image/jpeg" } |
    Select-Object -First 1

if (-not $jpegCodec) {
    throw "JPEG codec not found."
}

function Save-Jpeg {
    param(
        [System.Drawing.Image]$Image,
        [string]$Path,
        [int]$Quality
    )

    $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
        [System.Drawing.Imaging.Encoder]::Quality,
        [long]$Quality
    )
    try {
        $Image.Save($Path, $jpegCodec, $encoderParams)
    } finally {
        $encoderParams.Dispose()
    }
}

function Save-Png {
    param(
        [System.Drawing.Image]$Image,
        [string]$Path
    )

    $Image.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
}

function Resize-Image {
    param(
        [System.Drawing.Image]$Source,
        [double]$Scale
    )

    $newWidth = [Math]::Max(1, [int][Math]::Round($Source.Width * $Scale))
    $newHeight = [Math]::Max(1, [int][Math]::Round($Source.Height * $Scale))

    $bitmap = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.DrawImage($Source, 0, 0, $newWidth, $newHeight)
    } finally {
        $graphics.Dispose()
    }

    return $bitmap
}

function Compress-ImageToBudget {
    param(
        [string]$Path
    )

    $file = Get-Item $Path
    if ($file.Length -le $maxBytes) {
        return $false
    }

    $extension = $file.Extension.ToLowerInvariant()
    $tempPath = "$Path.__tmp__"

    $bytes = [System.IO.File]::ReadAllBytes($Path)
    $stream = New-Object System.IO.MemoryStream(,$bytes)
    $original = [System.Drawing.Image]::FromStream($stream)
    try {
        $scales = @(1.0, 0.96, 0.92, 0.88, 0.84, 0.8, 0.76, 0.72, 0.68, 0.64, 0.6, 0.56)
        $qualities = @(85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35)

        $bestBytes = [long]::MaxValue
        $bestFileBytes = $null

        foreach ($scale in $scales) {
            $scaled = $null
            if ($scale -eq 1.0) {
                $scaled = $original
            } else {
                $scaled = Resize-Image -Source $original -Scale $scale
            }

            try {
                if ($extension -eq ".png") {
                    Save-Png -Image $scaled -Path $tempPath
                    $tmpLength = (Get-Item $tempPath).Length
                    if ($tmpLength -lt $bestBytes) {
                        $bestBytes = $tmpLength
                        $bestFileBytes = [System.IO.File]::ReadAllBytes($tempPath)
                    }
                    if ($tmpLength -le $maxBytes) {
                        break
                    }
                } else {
                    foreach ($quality in $qualities) {
                        Save-Jpeg -Image $scaled -Path $tempPath -Quality $quality
                        $tmpLength = (Get-Item $tempPath).Length
                        if ($tmpLength -lt $bestBytes) {
                            $bestBytes = $tmpLength
                            $bestFileBytes = [System.IO.File]::ReadAllBytes($tempPath)
                        }
                        if ($tmpLength -le $maxBytes) {
                            break
                        }
                    }
                    if ($bestBytes -le $maxBytes) {
                        break
                    }
                }
            } finally {
                if ($scaled -ne $original) {
                    $scaled.Dispose()
                }
                if (Test-Path $tempPath) {
                    Remove-Item -Force $tempPath
                }
            }
        }

        if ($bestFileBytes -and $bestBytes -lt $file.Length) {
            [System.IO.File]::WriteAllBytes($Path, $bestFileBytes)
            return $true
        }

        return $false
    } finally {
        $original.Dispose()
        $stream.Dispose()
        if (Test-Path $tempPath) {
            Remove-Item -Force $tempPath
        }
    }
}

$targets = Get-ChildItem -Path $PhotoDir -File |
    Where-Object { $_.Extension -in ".jpg", ".jpeg", ".png" } |
    Sort-Object Length -Descending

$changed = 0
foreach ($photo in $targets) {
    $before = $photo.Length
    $updated = Compress-ImageToBudget -Path $photo.FullName
    if ($updated) {
        $after = (Get-Item $photo.FullName).Length
        $changed++
        Write-Output ("Compressed: {0} ({1} KB -> {2} KB)" -f $photo.Name, [int]($before / 1KB), [int]($after / 1KB))
    }
}

$remainLarge = Get-ChildItem -Path $PhotoDir -File |
    Where-Object { $_.Extension -in ".jpg", ".jpeg", ".png" -and $_.Length -gt $maxBytes }

Write-Output ("Compressed files: {0}" -f $changed)
Write-Output ("Still > {0}KB: {1}" -f $MaxKb, $remainLarge.Count)
if ($remainLarge.Count -gt 0) {
    $remainLarge | ForEach-Object {
        Write-Output (" - {0}: {1} KB" -f $_.Name, [int]($_.Length / 1KB))
    }
}
