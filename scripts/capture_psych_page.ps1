param(
  [Parameter(Mandatory = $true)]
  [int]$Page,
  [Parameter(Mandatory = $true)]
  [string]$OutputPath,
  [string]$BaseUrl = "http://127.0.0.1:8123"
)

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
  public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
}
"@

$temp = "C:\Users\User\thermo-lookup\edge-temp-page-$Page"
Remove-Item $temp -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $temp | Out-Null

$url = "$BaseUrl/assets/ASHRAE-PSYCHROMETRIC-CHART.pdf#page=$Page"
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$args = @(
  "--user-data-dir=$temp",
  "--guest",
  "--no-first-run",
  "--disable-sync",
  "--disable-features=msEdgeWelcomePage,SigninIntercept,msImplicitSignin,EdgeIdentitySupport",
  "--new-window",
  "--window-position=0,0",
  "--window-size=1400,1000",
  $url
)

$p = Start-Process $edge -ArgumentList $args -PassThru
Start-Sleep -Seconds 6
$p.Refresh()

if ($p.MainWindowHandle -ne 0) {
  [System.Windows.Forms.SendKeys]::SendWait('^{HOME}')
  Start-Sleep -Milliseconds 800
  if ($Page -gt 1) {
    for ($i = 1; $i -lt $Page; $i += 1) {
      [System.Windows.Forms.SendKeys]::SendWait('{PGDN}')
      Start-Sleep -Milliseconds 900
    }
  }
  Start-Sleep -Seconds 2
}

$rect = New-Object Win32+RECT
$ok = [Win32]::GetWindowRect($p.MainWindowHandle, [ref]$rect)
if ($ok -and $p.MainWindowHandle -ne 0) {
  $w = $rect.Right - $rect.Left
  $h = $rect.Bottom - $rect.Top
  $bmp = New-Object System.Drawing.Bitmap $w, $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.CopyFromScreen($rect.Left, $rect.Top, 0, 0, $bmp.Size)
  $bmp.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose()
  $bmp.Dispose()
}

Stop-Process -Id $p.Id -Force
