param([string]$Root, [int]$Port = 5173)
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add("http://localhost:$Port/")
$l.Start()
$types = @{ ".html"="text/html; charset=utf-8"; ".js"="text/javascript; charset=utf-8"; ".css"="text/css; charset=utf-8"; ".png"="image/png"; ".jpg"="image/jpeg"; ".svg"="image/svg+xml" }
while ($l.IsListening) {
  $ctx = $l.GetContext()
  $p = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
  if ($p -eq "") { $p = "index.html" }
  $f = Join-Path $Root $p
  if (Test-Path -LiteralPath $f -PathType Leaf) {
    $b = [System.IO.File]::ReadAllBytes($f)
    $ext = [System.IO.Path]::GetExtension($f)
    $ctx.Response.ContentType = $(if ($types[$ext]) { $types[$ext] } else { "application/octet-stream" })
    $ctx.Response.Headers.Add("Cache-Control", "no-store")
    $ctx.Response.OutputStream.Write($b, 0, $b.Length)
  } else { $ctx.Response.StatusCode = 404 }
  $ctx.Response.Close()
}
