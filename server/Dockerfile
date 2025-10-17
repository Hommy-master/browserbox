# BrowserBox 服务端 Dockerfile
FROM python:3.9-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# 复制项目文件
COPY . .

# 安装 Python 依赖
RUN pip install --no-cache-dir -e .

# 安装 Playwright 浏览器
RUN playwright install-deps
RUN playwright install chromium

# 暴露端口
EXPOSE 8000

# 运行应用
CMD ["python", "-m", "bbserver.main"]