"""BrowserBox 服务端运行路由."""

import logging

from fastapi import APIRouter, Depends, HTTPException, status

# 获取日志记录器
logger = logging.getLogger(__name__)

# 创建路由实例
router = APIRouter(prefix="/openapi/browserbox/v1", tags=["browserbox"])


@router.get("/health")
async def health_check():
    """健康检查端点."""
    # 返回服务健康状态
    return {"status": "healthy"}