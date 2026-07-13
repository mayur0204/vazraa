$key = (Get-Content -Path "c:\vazra\brightcab-main\.env" | Select-String "AISENSY_PROJECT_API_KEY=").ToString().Split("=", 2)[1]

$endpoints = @(
  @{ url = "http://localhost:4000/api/health"; method = "GET"; header = @{} },
  @{ url = "http://localhost:4000/api/admin/stats"; method = "GET"; header = @{} },
  @{ url = "http://localhost:4000/api/super-admin/monitoring"; method = "GET"; header = @{} },
  @{ url = "http://localhost:3002/api/actuator/health"; method = "GET"; header = @{} },
  @{ url = "http://localhost:3002/api/messages/whatsapp/track?phone=9999999999"; method = "GET"; header = @{"X-AiSensy-Project-API-Pwd"=$key} },
  @{ url = "http://localhost:4000/api/messages/whatsapp/track?phone=9999999999"; method = "GET"; header = @{"X-AiSensy-Project-API-Pwd"=$key} }
)

$results = @()
foreach ($req in $endpoints) {
  try {
    $response = Invoke-WebRequest -Uri $req.url -Method $req.method -Headers $req.header -UseBasicParsing -ErrorAction Stop
    $results += "[SUCCESS] $($response.StatusCode) - $($req.url)"
  } catch {
    $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { "Unknown" }
    $results += "[ERROR] $statusCode - $($req.url) - $($_.Exception.Message)"
  }
}

$results | Out-File -FilePath api-test-results.txt -Encoding utf8
