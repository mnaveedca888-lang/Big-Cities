Add-Type -AssemblyName System.IO.Compression.FileSystem
$path = 'C:\Users\LBG\Desktop\React router\src\Images\Historical Events (1).docx'
$zip = [System.IO.Compression.ZipFile]::OpenRead($path)
try {
  $entry = $zip.Entries | Where-Object { $_.FullName -eq 'word/document.xml' }
  if (-not $entry) { throw 'word/document.xml not found' }
  $reader = New-Object System.IO.StreamReader($entry.Open())
  $xmlText = $reader.ReadToEnd()
  $reader.Dispose()
  [xml]$xml = $xmlText
  $ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
  $ns.AddNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main')
  $nodes = $xml.SelectNodes('//w:t', $ns)
  foreach ($node in $nodes) {
    $text = $node.InnerText
    if ($text) { Write-Output $text }
  }
}
finally {
  $zip.Dispose()
}
