$ErrorActionPreference = 'Stop'
$templatePath = 'C:\Users\Huoyubai\.agents\skills\guizang-ppt-skill\assets\template-swiss.html'
$outputPath = Join-Path $PSScriptRoot 'index.html'
$slidesPath = Join-Path $PSScriptRoot 'slides.html'

$template = [System.IO.File]::ReadAllText($templatePath)
$slides = [System.IO.File]::ReadAllText($slidesPath)
$template = $template.Replace('<title>[必填] 替换为 PPT 标题 · Deck Title</title>', '<title>金铲铲阵容智能助手 · 自然之力赛季成果汇报</title>')
$template = [System.Text.RegularExpressions.Regex]::Replace(
    $template,
    '<script src="https://unpkg\.com/lucide@latest/dist/umd/lucide\.min\.js"></script>\r?\n<script>lucide\.createIcons\(\);</script>',
    '<script>window.lucide?.createIcons?.();</script>'
)
$pattern = '(?s)<!-- SLIDES_HERE.*?(?=\r?\n</div>\r?\n\r?\n<div id="nav">)'
$result = [System.Text.RegularExpressions.Regex]::Replace($template, $pattern, $slides.TrimEnd())

if ($result -eq $template) {
    throw '未找到模板幻灯片插入区域。'
}

[System.IO.File]::WriteAllText($outputPath, $result, [System.Text.UTF8Encoding]::new($false))
