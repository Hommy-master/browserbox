"""BrowserBox 服务端共享依赖."""

import logging
from typing import AsyncGenerator

from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyHeader

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

logger = logging.getLogger(__name__)

# API 密钥安全验证
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def get_api_key(api_key_header: str = Depends(api_key_header)):
    """获取并验证 API 密钥.
    
    Args:
        api_key_header: 请求头中的 API 密钥
        
    Returns:
        API 密钥字符串
    """
    # 目前我们不验证 API 密钥
    # 在实际实现中，您需要根据数据库或配置文件进行检查
    if api_key_header:
        logger.info("API key provided")
    else:
        logger.info("No API key provided")
        
    return api_key_header


class BrowserPoolManager:
    """管理浏览器池以支持并发操作."""
    
    def __init__(self, max_browsers: int = 100):
        """
        初始化浏览器池管理器.
        
        Args:
            max_browsers: 最大浏览器实例数
        """
        self.max_browsers = max_browsers
        self.active_browsers = 0
        self.logger = logging.getLogger(__name__)
        
    async def acquire_browser(self) -> bool:
        """从池中获取一个浏览器槽位.
        
        Returns:
            如果成功获取则返回 True，否则返回 False
        """
        # 检查是否有可用的浏览器槽位
        if self.active_browsers < self.max_browsers:
            self.active_browsers += 1
            self.logger.info(f"Acquired browser slot. Active browsers: {self.active_browsers}/{self.max_browsers}")
            return True
        else:
            # 浏览器池已满
            self.logger.warning(f"Browser pool exhausted. Active browsers: {self.active_browsers}/{self.max_browsers}")
            return False
            
    async def release_browser(self):
        """将浏览器槽位释放回池中."""
        # 释放浏览器槽位
        if self.active_browsers > 0:
            self.active_browsers -= 1
            self.logger.info(f"Released browser slot. Active browsers: {self.active_browsers}/{self.max_browsers}")


# 全局浏览器池管理器实例
browser_pool = BrowserPoolManager()


async def get_browser_pool() -> AsyncGenerator[BrowserPoolManager, None]:
    """依赖项：获取浏览器池管理器.
    
    Yields:
        浏览器池管理器实例
    """
    yield browser_pool