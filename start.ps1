# VitePress Auto-Restart Script
# 文件编码需为utf-16 LE

# 配置内存限制（单位：MB）
$MEMORY_LIMIT_MB = 12288 

# 检查当前目录
$currentDir = Split-Path -Path (Get-Location) -Leaf
if ($currentDir -ne "yyx-dev.github.io") {
    Write-Host "当前目录为 $currentDir，请将脚本移动至 yyx-dev.github.io 执行" -ForegroundColor Red
    Start-Sleep -Seconds 3
    exit 1
}

# 检查并安装依赖
if (-not (Test-Path "node_modules\vitepress")) {
    Write-Host "未检测到node_modules，自动下载中" -ForegroundColor Yellow
    $env:HTTP_PROXY="http://127.0.0.1:7897";
    $env:HTTPS_PROXY="http://127.0.0.1:7897"
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "npm install 失败" -ForegroundColor Red
        Start-Sleep -Seconds 3
        exit 1
    }
}

# 检测设备类型和电池状态
$waitSeconds = 8
$battery = Get-WmiObject -Query "SELECT BatteryStatus FROM Win32_Battery" -ErrorAction SilentlyContinue

if ($battery) {
    if ($battery.BatteryStatus -eq 2) {
        # 正在充电
        $waitSeconds = 15
    } else {
        # 未充电
        $waitSeconds = 20
    }
} else {
    # 台式机
    $waitSeconds = 8
}

# 延迟后打开浏览器
Write-Host "等待 ${waitSeconds} 秒后自动打开浏览器" -ForegroundColor Green

Start-Process -NoNewWindow powershell -ArgumentList @"
Start-Sleep -Seconds $waitSeconds
Start-Process http://localhost:5173
"@

# 将当前窗口移至第二桌面
try {
    if (-not (Get-Module -ListAvailable -Name VirtualDesktop)) {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Install-Module -Name VirtualDesktop -Force -AllowClobber -Scope CurrentUser -ErrorAction Stop
        Write-Host "请重新启动脚本" -ForegroundColor Green
        Start-Sleep -Seconds 3
        exit 1
    }
    Import-Module VirtualDesktop -WarningAction SilentlyContinue -ErrorAction Stop # 忽略动词警告

    $desktopList = Get-DesktopList
    if ($desktopList.Count -lt 3) {
        $null = New-Desktop
        Write-Host "正在创建第三个虚拟桌面" -ForegroundColor Green
    }

    $windowHandle = (Get-Process -Id $PID).MainWindowHandle
    if ($windowHandle -ne 0) {
        $thirdDesktop = Get-Desktop -Index 2
        # 将当前窗口移至第三桌面
        Write-Host "将当前窗口移至第三桌面" -ForegroundColor Green
        Move-Window -HWND $windowHandle -Desktop $thirdDesktop -ErrorAction Stop
        # 激活并跳转到第三桌面
        # Switch-Desktop -Desktop $thirdDesktop
    } else {
        throw "无法获取当前控制台的窗口句柄"
    }
} catch {
    Write-Host "错误信息: $_" -ForegroundColor DarkYellow
}

function Send-Notification {
    param(
        [Parameter(Mandatory = $false)]
        [string]$Title,
        [Parameter(Mandatory = $true)]
        [string]$Message,
        [Parameter(Mandatory = $false)]
        [int]$Duration = 3
    )

    if ([System.Environment]::OSVersion.Version.Major -ge 10) {
        Add-Type -AssemblyName System.Windows.Forms
        $notify = New-Object System.Windows.Forms.NotifyIcon
        $notify.Visible = $true
        $notify.Icon = [System.Drawing.SystemIcons]::Information
        $notify.ShowBalloonTip($Duration, $Title, $Message, [System.Windows.Forms.ToolTipIcon]::Info)
        $notify.Dispose()
    } else {
        msg $env:USERNAME /time:$Duration $msgBody 2>$null
    }
}

do {
    $env:NODE_OPTIONS="--max-old-space-size=$MEMORY_LIMIT_MB"
    
    # 在后台启动内存监控
    $monitorJob = Start-Job -ScriptBlock {
        param($LimitMB)

        # 内存监控函数
        function Get-ProcessMemoryUsage {
            param([string]$ProcessName = "node")
            try {
                $processes = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
                if ($processes) {
                    $totalMemoryMB = ($processes | Measure-Object -Property WorkingSet64 -Sum).Sum / 1MB
                    return [math]::Round($totalMemoryMB, 2)
                }
            } catch {}
            return 0
        }
        
        $thresholdMB = $LimitMB / 2
        while ($true) {
            Start-Sleep -Seconds 10
            $currentMemoryMB = Get-ProcessMemoryUsage
            if ($currentMemoryMB -ge $thresholdMB -and $currentMemoryMB -gt 0) {
                Write-Host "内存达到阈值: ${currentMemoryMB}MB / ${LimitMB}MB" -ForegroundColor Yellow
                
                # 尝试终止进程
                try {
                    $processes = Get-Process -Name node -ErrorAction SilentlyContinue
                    foreach ($proc in $processes) {
                        try {
                            $cmdLine = (Get-WmiObject Win32_Process -Filter "ProcessId = $($proc.Id)").CommandLine
                            if ($cmdLine -and ($cmdLine.Contains("vitepress") -or $cmdLine.Contains("docs:dev"))) {
                                Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
                                Start-Sleep -Seconds 10
                            }
                        } catch {}
                    }
                } catch {}
                break
            }
        }
    } -ArgumentList $MEMORY_LIMIT_MB
    
    Write-Host "启动 VitePress dev 服务器..." -ForegroundColor Green
    npm run docs:dev
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "VitePress 正常退出" -ForegroundColor Green
        exit 0
    } elseif ($LASTEXITCODE -eq 1) {
        $msgTitle = "VitePress错误"
        $msgBody = "错误码: $LASTEXITCODE"
        Send-Notification -Title $msgTitle -Message $msgBody -Duration 3
        pause
    } else {
        $msgTitle = "VitePress内存不足"
        $msgBody = "错误码: $LASTEXITCODE，即将自动重启"
        Send-Notification -Title $msgTitle -Message $msgBody -Duration 3
    }
} while ($true)