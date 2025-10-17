# 使用 uv 设置 BrowserBox 项目的 PowerShell 脚本

Write-Host "使用 uv 设置 BrowserBox 项目..."

# 为客户端和服务端创建虚拟环境
Write-Host "正在创建虚拟环境..."
uv venv client\.venv
uv venv server\.venv

# 安装客户端依赖
Write-Host "正在安装客户端依赖..."
Set-Location client
uv pip install -e .
uv pip install -e .[dev]
Set-Location ..

# 安装服务端依赖
Write-Host "正在安装服务端依赖..."
Set-Location server
uv pip install -e .
uv pip install -e .[dev]
Set-Location ..

# 安装 Playwright 浏览器
Write-Host "正在安装 Playwright 浏览器..."
Set-Location client
uv run playwright install chromium
Set-Location ..

Set-Location server
uv run playwright install chromium
Set-Location ..

Write-Host "设置完成!"
Write-Host ""
Write-Host "运行客户端:"
Write-Host "  cd client"
Write-Host "  .venv\Scripts\activate"
Write-Host "  bbclient --help"
Write-Host ""
Write-Host "运行服务端:"
Write-Host "  cd server"
Write-Host "  .venv\Scripts\activate"
Write-Host "  python -m bbserver.main"
Write-Host ""