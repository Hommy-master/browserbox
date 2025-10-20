"""BrowserBox 服务端上传路由."""

import asyncio
import logging
import os
import tempfile
from typing import Dict, Any, Optional
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from playwright.async_api import async_playwright

from bbserver.deps import get_api_key, get_browser_pool, BrowserPoolManager
from bbserver.environment import EnvironmentManager

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
            # 创建环境管理器
            env_manager = EnvironmentManager()
            
            # 1. 从env指定的URL中下载浏览器环境信息，保存为bb_env.tar.gz
            archive_path = await env_manager.download_environment(request.env)
            
            # 2. 解压环境包
            env_path = env_manager.unpack_environment(archive_path)
            
            # 3. 从浏览器池中获取浏览器并使用bb_env.tar.gz来初始化
            result = await _execute_task_with_environment(env_path, request.prompt)
            
            # 构造响应对象
            response = DoTaskResponse(
                code=0,
                message="Success",
                data={
                    "result": result,
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


async def _execute_task_with_environment(env_path: str, prompt: Optional[str] = None) -> str:
    """使用指定环境执行任务.
    
    Args:
        env_path: 浏览器环境路径
        prompt: 任务提示
        
    Returns:
        任务执行结果
    """
    # 启动 Playwright
    playwright = await async_playwright().start()
    
    try:
        # 获取用户数据目录
        user_data_dir = os.path.join(env_path, "user_data")
        
        # 启动带有持久化上下文的浏览器（有头模式用于调试）
        context = await playwright.chromium.launch_persistent_context(
            user_data_dir=user_data_dir,
            headless=False,  # 有头模式，方便调试
            viewport={"width": 1920, "height": 1080}
        )
        
        try:
            # 创建新页面
            page = await context.new_page()
            
            # 如果有提示，则执行相应操作
            if prompt:
                # 这里可以添加具体的任务执行逻辑
                # 例如：导航到特定页面、执行操作等
                # await page.goto("https://www.example.com")
                result = f"Executed task with prompt: {prompt}"
            else:
                # 默认操作
                # await page.goto("https://www.example.com")
                result = "Executed default task"
                
            # 等待一段时间以便观察（调试模式）
            await asyncio.sleep(2)
            
            return result
            
        finally:
            # 关闭浏览器上下文
            await context.close()
            
    finally:
        # 停止 Playwright
        await playwright.stop()