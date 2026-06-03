# Troubleshooting

This document records environment-specific failures and safer alternatives for this project.

## PowerShell Command Pitfalls

### Do Not Use Bash Heredoc Syntax

Avoid:

```powershell
node - <<'NODE'
```

PowerShell treats `<` as a redirection operator, so Bash-style heredocs fail with a parser error.

Use a short inline command instead:

```powershell
node -e "const fs=require('fs'); console.log('ok')"
```

For larger checks, prefer existing tests or a small committed helper instead of shell heredocs.

### Do Not Use `Invoke-WebRequest -SkipHttpErrorCheck`

This PowerShell environment does not support `-SkipHttpErrorCheck`.

Use `try/catch` and read the response from the exception:

```powershell
try {
  $r = Invoke-WebRequest -Uri "http://127.0.0.1:3000/api/jobs" -UseBasicParsing -TimeoutSec 5
} catch {
  if ($_.Exception.Response) {
    $status = [int]$_.Exception.Response.StatusCode
    $contentType = $_.Exception.Response.ContentType
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $body = $reader.ReadToEnd()
    $reader.Close()
  }
}
```

### Avoid `Get-CimInstance Win32_Process`

In this environment, process detail queries with `Get-CimInstance Win32_Process` can fail with access denied.

Prefer:

```powershell
Get-Process -Name node -ErrorAction SilentlyContinue
netstat -ano | Select-String ":3000"
```

If command-line detail is needed, start future dev servers with explicit stdout/stderr log files.

## Local Next.js Server Issues

### Port 3000 Can Be Held By an Unstoppable Process

In one session, `http://127.0.0.1:3000` returned HTML 500 pages for `/` and `/api/jobs`, and the process holding port 3000 could not be stopped:

```powershell
Stop-Process -Id 35164 -Force
taskkill /PID 35164 /F
```

Both failed with access denied.

When this happens, do not keep trying the same termination commands. Start a clean dev server on another port and use that URL:

```powershell
Start-Process -FilePath npm.cmd -ArgumentList 'run','dev','--','--hostname','127.0.0.1','--port','3012' -WorkingDirectory 'C:\ws\uma-syukai-app' -RedirectStandardOutput 'C:\ws\uma-syukai-app\tmp\next-3012.out.log' -RedirectStandardError 'C:\ws\uma-syukai-app\tmp\next-3012.err.log' -WindowStyle Hidden
```

Before browser testing, verify the API returns JSON:

```powershell
$r = Invoke-WebRequest -Uri "http://127.0.0.1:3012/api/jobs" -UseBasicParsing -TimeoutSec 5
$r.Headers["Content-Type"]
```

Expected:

```text
application/json
```

### HTML API Responses Cause JSON Parse Failures

If the browser shows:

```text
Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

the app attempted to parse an HTML error page as JSON. Check the API endpoint directly:

```powershell
Invoke-WebRequest -Uri "http://127.0.0.1:<port>/api/jobs" -UseBasicParsing -TimeoutSec 5
```

The response must be `Content-Type: application/json`. If it is `text/html`, the browser is likely pointed at a broken or stale dev server.

## In-App Browser Connection

If browser automation setup fails with:

```text
node_repl kernel exited unexpectedly
windows sandbox failed: spawn setup refresh
```

do not repeat the same browser setup cell indefinitely. Use direct HTTP checks with `Invoke-WebRequest` and ask the user to switch the in-app browser to a verified-good URL if needed.
