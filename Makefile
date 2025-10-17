# BrowserBox 项目 Makefile

# 变量定义
CLIENT_DIR = client
SERVER_DIR = server
SHARED_DIR = shared

# 默认目标
.PHONY: help
help:
	@echo "BrowserBox Makefile"
	@echo ""
	@echo "可用目标:"
	@echo "  setup            - 使用 uv 设置项目"
	@echo "  install-client   - 安装客户端依赖"
	@echo "  install-server   - 安装服务端依赖"
	@echo "  test-client      - 运行客户端测试"
	@echo "  test-server      - 运行服务端测试"
	@echo "  run-client       - 运行客户端"
	@echo "  run-server       - 运行服务端"
	@echo "  clean            - 清理临时文件"
	@echo "  docker-build     - 构建服务端 Docker 镜像"
	@echo "  docker-run       - 在 Docker 容器中运行服务端"

# 使用 uv 设置项目
.PHONY: setup
setup:
	@if command -v uv >/dev/null 2>&1; then \
		echo "使用 uv 设置中..."; \
		uv venv $(CLIENT_DIR)/.venv; \
		uv venv $(SERVER_DIR)/.venv; \
		cd $(CLIENT_DIR) && uv pip install -e . && cd ..; \
		cd $(SERVER_DIR) && uv pip install -e . && cd ..; \
		cd $(CLIENT_DIR) && uv run playwright install chromium && cd ..; \
		cd $(SERVER_DIR) && uv run playwright install chromium && cd ..; \
		echo "设置完成!"; \
	else \
		echo "未找到 uv。请先安装 uv: https://github.com/astral-sh/uv"; \
		exit 1; \
	fi

# 安装客户端依赖
.PHONY: install-client
install-client:
	cd $(CLIENT_DIR) && pip install -e .

# 安装服务端依赖
.PHONY: install-server
install-server:
	cd $(SERVER_DIR) && pip install -e .

# 运行客户端测试
.PHONY: test-client
test-client:
	cd $(CLIENT_DIR) && python -m pytest tests/

# 运行服务端测试
.PHONY: test-server
test-server:
	cd $(SERVER_DIR) && python -m pytest tests/

# 运行客户端
.PHONY: run-client
run-client:
	cd $(CLIENT_DIR) && python -m bbclient.cli

# 运行服务端
.PHONY: run-server
run-server:
	cd $(SERVER_DIR) && python -m bbserver.main

# 清理临时文件
.PHONY: clean
clean:
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	rm -rf $(CLIENT_DIR)/.venv $(SERVER_DIR)/.venv

# 构建服务端 Docker 镜像
.PHONY: docker-build
docker-build:
	cd $(SERVER_DIR) && docker build -t browserbox-server .

# 在 Docker 容器中运行服务端
.PHONY: docker-run
docker-run:
	docker run -p 8000:8000 browserbox-server