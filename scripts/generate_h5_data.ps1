param(
    [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
)

$ErrorActionPreference = "Stop"

function Get-DocText {
    param([string]$DocPath)

    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::OpenRead($DocPath)
    try {
        $entry = $zip.GetEntry("word/document.xml")
        if (-not $entry) {
            throw "word/document.xml not found in $DocPath"
        }
        $reader = New-Object System.IO.StreamReader($entry.Open())
        try {
            [xml]$xml = $reader.ReadToEnd()
        } finally {
            $reader.Close()
        }
    } finally {
        $zip.Dispose()
    }

    $ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
    $ns.AddNamespace("w", "http://schemas.openxmlformats.org/wordprocessingml/2006/main")
    return (($xml.SelectNodes("//w:t", $ns) | ForEach-Object { $_."#text" }) -join "")
}

function Get-MatchValue {
    param(
        [string]$Text,
        [string]$StartMarker,
        [string]$EndMarker
    )

    $pattern = [Regex]::Escape($StartMarker) + "(.+?)" + [Regex]::Escape($EndMarker)
    $match = [Regex]::Match($Text, $pattern)
    if (-not $match.Success) {
        return ""
    }
    return ($match.Groups[1].Value -replace "\s+", " ").Trim()
}

function Get-TailValue {
    param(
        [string]$Text,
        [string]$StartMarker
    )

    $pattern = [Regex]::Escape($StartMarker) + "(.+)$"
    $match = [Regex]::Match($Text, $pattern)
    if (-not $match.Success) {
        return ""
    }
    return ($match.Groups[1].Value -replace "\s+", " ").Trim()
}

function Get-KeywordTokens {
    param([string]$ResearchText)

    if ([string]::IsNullOrWhiteSpace($ResearchText)) {
        return @()
    }

    $clean = $ResearchText -replace "[（(][^）)]*[）)]", " "
    $clean = $clean -replace '[、，,；;。/:：·“”"''\s]', '|'
    $tokens = $clean.Split("|", [System.StringSplitOptions]::RemoveEmptyEntries) |
        ForEach-Object { $_.Trim() } |
        Where-Object { $_.Length -ge 2 } |
        Select-Object -Unique

    return @($tokens | Select-Object -First 14)
}

function Get-DirectionCareerTags {
    param([string]$Direction)

    switch ($Direction) {
        "包装设计" { return @("包装", "品牌", "视觉", "文创", "材料", "结构", "安全", "可持续") }
        "传达与媒体设计" { return @("数字媒体", "动画", "交互", "沉浸", "影像", "展示", "新媒体", "叙事") }
        "产品设计" { return @("产品", "工业设计", "服务设计", "创新", "装备", "家电", "机器人", "用户体验") }
        "环境设计" { return @("环境", "空间", "景观", "城乡", "建筑", "乡村", "低碳", "文旅") }
        default { return @("设计") }
    }
}

$docPath = Get-ChildItem -Path $ProjectRoot -Recurse -File -Filter *.docx |
    Sort-Object FullName |
    Select-Object -First 1 -ExpandProperty FullName

if (-not $docPath) {
    throw "No docx file found under project root"
}

$assistantDir = Split-Path $docPath -Parent
$photoBase = Get-ChildItem -Path $assistantDir -Directory |
    Where-Object {
        (Get-ChildItem -Path $_.FullName -Recurse -File | Where-Object { $_.Extension -in ".jpg", ".jpeg", ".png" } | Measure-Object).Count -gt 0
    } |
    Select-Object -First 1 -ExpandProperty FullName

if (-not $photoBase) {
    throw "Photo directory not found beside docx"
}

$assetsRoot = Join-Path $ProjectRoot "app\src\main\assets\h5"
$photoOutputDir = Join-Path $assetsRoot "photos"
$dataOutputDir = Join-Path $assetsRoot "data"
$outputFile = Join-Path $dataOutputDir "mentors.json"

New-Item -ItemType Directory -Force -Path $photoOutputDir | Out-Null
New-Item -ItemType Directory -Force -Path $dataOutputDir | Out-Null

$docText = Get-DocText -DocPath $docPath
$photoFiles = Get-ChildItem -Path $photoBase -Recurse -File |
    Where-Object { $_.Extension -in ".jpg", ".jpeg", ".png" } |
    Sort-Object FullName

$mentorRaw = @()
foreach ($file in $photoFiles) {
    $relative = $file.DirectoryName.Substring($photoBase.Length).TrimStart("\\")
    $parts = $relative.Split("\\")
    $direction = if ($parts.Length -ge 1) { $parts[0] } else { "" }
    $title = if ($parts.Length -ge 2) { $parts[1] } else { "" }
    $name = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
    $index = $docText.IndexOf($name)

    if ($index -lt 0) {
        throw "Name [$name] not found in docx text"
    }

    $mentorRaw += [PSCustomObject]@{
        name = $name
        direction = $direction
        title = $title
        sourcePath = $file.FullName
        ext = $file.Extension.ToLower()
        index = $index
    }
}

$extraBoundaryNames = @("柯胜海", "傅丽华")
$boundaryNames = @($mentorRaw | ForEach-Object { $_.name }) + $extraBoundaryNames
$boundaries = @()
foreach ($boundaryName in ($boundaryNames | Select-Object -Unique)) {
    $boundaryIndex = $docText.IndexOf($boundaryName)
    if ($boundaryIndex -ge 0) {
        $boundaries += [PSCustomObject]@{
            name = $boundaryName
            index = $boundaryIndex
        }
    }
}
$boundaries = $boundaries | Sort-Object index
$boundaryIndices = @($boundaries | ForEach-Object { $_.index })
$boundaryIndexMap = @{}
foreach ($boundary in $boundaries) {
    if (-not $boundaryIndexMap.ContainsKey($boundary.name)) {
        $boundaryIndexMap[$boundary.name] = $boundary.index
    }
}

$mentorRaw = $mentorRaw | ForEach-Object {
    if ($boundaryIndexMap.ContainsKey($_.name)) {
        $_.index = $boundaryIndexMap[$_.name]
    }
    $_
} | Sort-Object index
$directApplyNames = @("田飞", "何铭锋")
$mentors = @()

for ($i = 0; $i -lt $mentorRaw.Count; $i++) {
    $current = $mentorRaw[$i]
    $currentBoundaryPos = [Array]::IndexOf($boundaryIndices, $current.index)
    if ($currentBoundaryPos -lt 0) {
        $currentBoundaryPos = [Array]::IndexOf($boundaryIndices, $docText.IndexOf($current.name))
    }
    $nextIndex = if ($currentBoundaryPos -ge 0 -and $currentBoundaryPos -lt $boundaryIndices.Count - 1) {
        $boundaryIndices[$currentBoundaryPos + 1]
    } else {
        $docText.Length
    }
    $segment = $docText.Substring($current.index, [Math]::Max(0, $nextIndex - $current.index))

    $researchAreas = Get-MatchValue -Text $segment -StartMarker "研究方向：" -EndMarker "籍贯："
    $origin = Get-MatchValue -Text $segment -StartMarker "籍贯：" -EndMarker "出生年份："
    $birthYear = Get-MatchValue -Text $segment -StartMarker "出生年份：" -EndMarker "邮箱："
    $email = Get-MatchValue -Text $segment -StartMarker "邮箱：" -EndMarker "备注："
    $notes = Get-TailValue -Text $segment -StartMarker "备注："

    if ([string]::IsNullOrWhiteSpace($researchAreas)) { $researchAreas = "待补充" }
    if ([string]::IsNullOrWhiteSpace($origin)) { $origin = "未公开" }
    if ([string]::IsNullOrWhiteSpace($birthYear)) { $birthYear = "未公开" }
    if ([string]::IsNullOrWhiteSpace($email)) { $email = "未公开" }
    if ([string]::IsNullOrWhiteSpace($notes)) { $notes = "待补充" }

    $id = "mentor-{0:d3}" -f ($i + 1)
    $outputPhoto = "$id$($current.ext)"
    $outputPhotoPath = Join-Path $photoOutputDir $outputPhoto
    Copy-Item -Path $current.sourcePath -Destination $outputPhotoPath -Force

    $skillTags = Get-KeywordTokens -ResearchText $researchAreas
    $careerTags = Get-DirectionCareerTags -Direction $current.direction

    $mentors += [PSCustomObject]@{
        id = $id
        name = $current.name
        direction = $current.direction
        title = $current.title
        researchAreas = $researchAreas
        origin = $origin
        birthYear = $birthYear
        email = $email
        notes = $notes
        photoPath = "photos/$outputPhoto"
        allowDirectApply = ($directApplyNames -contains $current.name)
        skillTags = @($skillTags)
        careerTags = @($careerTags)
        searchText = "$($current.name) $($current.direction) $($researchAreas) $($notes)"
    }
}

$payload = [PSCustomObject]@{
    generatedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    source = "导师助手/湖南工业大学包装艺术设计学院研究生导师基本信息.docx"
    count = $mentors.Count
    mentors = $mentors
}

$json = $payload | ConvertTo-Json -Depth 8
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($outputFile, $json, $utf8NoBom)

Write-Output "Generated $($mentors.Count) mentors to $outputFile"
