# BrowserBox

BrowserBox 是一个用于创建可复用浏览器环境的工具。它由一个客户端（创建和打包浏览器环境）和一个服务端（加载和执行这些环境中的任务）组成。

## 项目结构

```
browserbox/                 ← Git 仓库根目录
├── README.md
├── client/                  ← Python 包：bbclient
│   ├── bbclient/
│   │   ├── __init__.py
│   │   ├── env_builder.py   ← 创建持久化环境
│   │   ├── packer.py        ← 打包为 tar.gz
│   │   ├── uploader.py      ← 分片上传
│   │   └── cli.py           ← 命令行入口
│   ├── pyproject.toml       ← Poetry 配置
│   └── tests/
├── server/                  ← Python 包：bbserver
│   ├── bbserver/
│   │   ├── __init__.py
│   │   ├── main.py          ← FastAPI 启动文件
│   │   ├── pool.py          ← 并发浏览器池
│   │   ├── deps.py          ← 共享依赖
│   │   └── routers/
│   │       ├── upload.py
│   │       └── run.py
│   ├── pyproject.toml
│   ├── Dockerfile           ← Docker 容器配置
│   └── tests/
├── shared/                  ← 客户端和服务端共用
    ├── bbshared/
    │   ├── __init__.py
    │   ├── fingerprint.py   ← 用户代理(UA)、视口(viewport)、浏览器参数
    │   └── const.py         ← 常量（接口地址、块大小等）
    └── pyproject.toml       ← 以 "extra" 形式被 client/server 引用
```

## 功能特性

1. **客户端**: 创建包含用户数据和浏览器指纹的可复用浏览器环境
2. **服务端**: 支持并发执行浏览器任务（最多支持100个并发浏览器）
3. **跨平台**: 客户端支持 Windows、Linux 和 macOS
4. **容器化**: 服务端可部署为 Docker 容器（仅支持 Linux x86_64）

## 环境要求

- Python 3.8+
- [uv](https://github.com/astral-sh/uv) （用于包管理）
- Playwright
- FastAPI
- Uvicorn

## 安装说明

### 使用 uv 安装（推荐）

```bash
# 运行安装脚本
./setup.sh  # Windows系统使用: .\setup.ps1
```

### 手动安装

#### 客户端

```bash
cd client
pip install -e .
playwright install chromium
```

#### 服务端

```bash
cd server
pip install -e .
playwright install chromium
```

## 使用方法

### 客户端

```bash
bbclient --server-url http://localhost:8000
```

执行后将：
1. 打开浏览器供用户操作
2. 浏览器关闭时保存浏览器环境
3. 将环境打包为 tar.gz 格式
4. 上传到指定的服务端

### 服务端

```bash
cd server
python -m bbserver.main
```

服务端将在 `http://localhost:8000` 启动，并提供以下 API 接口：

```
POST /openapi/browserbox/v1/dotask
```

## API 接口规范

### POST /openapi/browserbox/v1/dotask

**请求体:**
```json
{
  "env": "http://example.com/env.json",
  "api_key": "xxx",
  "prompt": "",
  "image_url": "xxx"
}
```

**响应:**
```json
{
  "code": 0,
  "message": "Success",
  "data": {
    "image_url": "xxx"
  }
}
```

## Docker 部署

构建并运行服务端 Docker 容器：

```bash
cd server
docker build -t browserbox-server .
docker run -p 8000:8000 browserbox-server
```

## 开发说明

本项目使用以下技术：
- `uv` 用于包管理
- `playwright` 用于浏览器自动化
- `fastapi` 用于服务端 API
- `pytest` 用于测试

## 测试

```bash
cd client
python -m pytest tests/

cd server
python -m pytest tests/
```

## 许可证

MIT