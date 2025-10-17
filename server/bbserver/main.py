"""BrowserBox 服务端主入口点."""

import logging
import uvicorn

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from bbserver.routers import upload, run
from bbserver.pool import BrowserPool

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

# 获取日志记录器
logger = logging.getLogger(__name__)

# 创建 FastAPI 应用
app = FastAPI(
    title="BrowserBox Server",
    description="用于管理可复用浏览器环境的服务端",
    version="0.1.0"
)

# 添加 CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 包含路由
app.include_router(upload.router)
app.include_router(run.router)

# 初始化浏览器池
browser_pool = BrowserPool()


@app.on_event("startup")
async def startup_event():
    """应用启动时初始化资源."""
    logger.info("Starting BrowserBox server")
    await browser_pool.initialize()
    logger.info("BrowserBox server started")


@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭时清理资源."""
    logger.info("Shutting down BrowserBox server")
    await browser_pool.shutdown()
    logger.info("BrowserBox server shut down")


@app.get("/")
async def root():
    """根端点."""
    return {"message": "BrowserBox Server is running"}


if __name__ == "__main__":
    # 运行应用
    uvicorn.run(
        "bbserver.main:app",
        host="0.0.0.0",
        port=8000,
        log_level="info",
        reload=True
    )