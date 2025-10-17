#!/bin/bash

# 使用 uv 设置 BrowserBox 项目的 Bash 脚本

echo "使用 uv 设置 BrowserBox 项目..."

# 为客户端和服务端创建虚拟环境
echo "正在创建虚拟环境..."
uv venv client/.venv
uv venv server/.venv

# 安装客户端依赖
echo "正在安装客户端依赖..."
cd client
uv pip install -e .
uv pip install -e .[dev]
cd ..

# 安装服务端依赖
echo "正在安装服务端依赖..."
cd server
uv pip install -e .
uv pip install -e .[dev]
cd ..

# 安装 Playwright 浏览器
echo "正在安装 Playwright 浏览器..."
cd client
uv run playwright install chromium
cd ..

cd server
uv run playwright install chromium
cd ..

echo "设置完成!"
echo ""
echo "运行客户端:"
echo "  cd client"
echo "  source .venv/bin/activate  # Windows 系统: .venv\Scripts\activate"
echo "  bbclient --help"
echo ""
echo "运行服务端:"
echo "  cd server"
echo "  source .venv/bin/activate  # Windows 系统: .venv\Scripts\activate"
echo "  python -m bbserver.main"
echo ""