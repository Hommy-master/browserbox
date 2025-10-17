"""使用 Playwright 构建浏览器环境."""

import asyncio
import json
import logging
import os
import tempfile
from pathlib import Path
from typing import Optional, List, Dict, Any
from dataclasses import dataclass

from playwright.async_api import async_playwright, BrowserContext

logger = logging.getLogger(__name__)


@dataclass
class BrowserFingerprint:
    """浏览器指纹信息."""
    user_agent: str
    viewport: Dict[str, int]
    browser_args: List[str]
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典."""
        return {
            "user_agent": self.user_agent,
            "viewport": self.viewport,
            "browser_args": self.browser_args
        }


class EnvBuilder:
    """构建和保存浏览器环境."""
    
    def __init__(self, output_dir: Optional[str] = None):
        """
        初始化环境构建器.
        
        Args:
            output_dir: 保存环境的目录路径
        """
        self.output_dir = output_dir or tempfile.mkdtemp()
        self.context: Optional[BrowserContext] = None
        self.fingerprint: Optional[BrowserFingerprint] = None
        
    async def create_environment(self) -> BrowserContext:
        """创建新的浏览器环境."""
        logger.info("Creating new browser environment")
        
        playwright = await async_playwright().start()
        
        # 启动带有持久化上下文的浏览器以保存状态
        user_data_dir = os.path.join(self.output_dir, "user_data")
        os.makedirs(user_data_dir, exist_ok=True)
        
        self.context = await playwright.chromium.launch_persistent_context(
            user_data_dir=user_data_dir,
            headless=False,  # 显示浏览器供用户交互
        )
        
        # 设置基本指纹信息
        page = await self.context.new_page()
        await page.goto("about:blank")
        
        # 获取浏览器指纹信息
        user_agent = await page.evaluate("() => navigator.userAgent")
        viewport = {"width": 1920, "height": 1080}
        browser_args = ["--no-sandbox", "--disable-dev-shm-usage"]
        
        self.fingerprint = BrowserFingerprint(
            user_agent=user_agent,
            viewport=viewport,
            browser_args=browser_args
        )
        
        logger.info(f"Browser environment created with fingerprint: {self.fingerprint}")
        return self.context
    
    async def save_environment(self, env_path: str) -> str:
        """保存当前浏览器环境.
        
        Args:
            env_path: 保存环境的路径
            
        Returns:
            保存的环境元数据文件路径
        """
        # 检查是否存在可保存的环境
        if not self.context or not self.fingerprint:
            raise RuntimeError("No environment to save. Create environment first.")
            
        logger.info(f"Saving environment to {env_path}")
        
        # 确保目录存在
        os.makedirs(env_path, exist_ok=True)
        
        # 保存用户数据
        user_data_src = os.path.join(self.output_dir, "user_data")
        user_data_dst = os.path.join(env_path, "user_data")
        
        # 如果目标目录已存在，则删除
        if os.path.exists(user_data_dst):
            import shutil
            shutil.rmtree(user_data_dst)
            
        # 复制用户数据目录
        if os.path.exists(user_data_src):
            import shutil
            shutil.copytree(user_data_src, user_data_dst)
        
        # 保存指纹信息
        fingerprint_data = self.fingerprint.to_dict()
        metadata_path = os.path.join(env_path, "env.json")
        
        with open(metadata_path, "w", encoding="utf-8") as f:
            json.dump(fingerprint_data, f, indent=2)
            
        logger.info(f"Environment saved. Metadata at {metadata_path}")
        return metadata_path
    
    async def close(self):
        """关闭浏览器上下文."""
        # 如果存在浏览器上下文则关闭它
        if self.context:
            await self.context.close()
            logger.info("Browser context closed")