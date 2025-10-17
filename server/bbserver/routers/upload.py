"""BrowserBox 服务端上传路由."""

import logging
from typing import Dict, Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from bbserver.deps import get_api_key, get_browser_pool, BrowserPoolManager
from bbserver.pool import BrowserPool

logger = logging.getLogger(__name__)

# 创建路由实例
router = APIRouter(prefix="/openapi/browserbox/v1", tags=["browserbox"])


class DoTaskRequest(BaseModel):
    """doTask 端点的请求模型."""
    env: str  # 环境元数据的 URL
    api_key: Optional[str] = None
    prompt: Optional[str] = None
    image_url: Optional[str] = None


class DoTaskResponse(BaseModel):
    """doTask 端点的响应模型."""
    code: int
    message: str
    data: Dict[str, Any]


@router.post("/dotask", response_model=DoTaskResponse)
async def do_task(
    request: DoTaskRequest,
    api_key: str = Depends(get_api_key),
    browser_pool_manager: BrowserPoolManager = Depends(get_browser_pool)
):
    """处理 doTask 请求.
    
    Args:
        request: doTask 请求对象
        api_key: 用于身份验证的 API 密钥
        browser_pool_manager: 浏览器池管理器依赖项
        
    Returns:
        任务执行结果的响应
    """
    # 记录接收到的请求
    logger.info(f"Received doTask request for environment: {request.env}")
    
    try:
        # 获取浏览器槽位
        if not await browser_pool_manager.acquire_browser():
            # 如果浏览器池已满，返回 429 错误
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Browser pool exhausted"
            )
            
        try:
            # 在实际实现中，我们会执行以下步骤：
            # 1. 从 request.env 下载环境
            # 2. 解压并加载浏览器环境
            # 3. 执行任务 (prompt)
            # 4. 返回结果
            
            # 目前，我们只是模拟这个过程
            logger.info(f"Processing task with environment: {request.env}")
            
            # 模拟一些工作
            # ... 实际的任务执行逻辑会在这里 ...
            
            # 构造响应对象
            response = DoTaskResponse(
                code=0,
                message="Success",
                data={
                    "image_url": request.image_url or ""
                }
            )
            
            # 记录任务完成
            logger.info("Task completed successfully")
            return response
            
        finally:
            # 释放浏览器槽位
            await browser_pool_manager.release_browser()
            
    except HTTPException:
        # 重新抛出 HTTP 异常
        raise
    except Exception as e:
        # 记录并处理其他异常
        logger.error(f"Error processing task: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )