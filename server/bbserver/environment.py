"""浏览器环境管理模块."""

import asyncio
import logging
import os
import tarfile
import tempfile
from pathlib import Path
from typing import Optional
import aiohttp  # 需要安装: pip install aiohttp

logger = logging.getLogger(__name__)


class EnvironmentManager:
    """管理浏览器环境的下载、解压和存储."""
    
    def __init__(self, download_dir: Optional[str] = None):
        """
        初始化环境管理器.
        
        Args:
            download_dir: 下载目录路径，默认为临时目录
        """
        self.download_dir = download_dir or tempfile.gettempdir()
        os.makedirs(self.download_dir, exist_ok=True)
        
    async def download_environment(self, env_url: str) -> str:
        """从URL下载浏览器环境包.
        
        Args:
            env_url: 环境包的URL
            
        Returns:
            下载的环境包文件路径
            
        Raises:
            Exception: 下载失败时抛出异常
        """
        # 生成本地文件路径
        filename = "bb_env.tar.gz"
        local_path = os.path.join(self.download_dir, filename)
        
        logger.info(f"Downloading environment from {env_url} to {local_path}")
        
        try:
            # 使用aiohttp下载文件
            async with aiohttp.ClientSession() as session:
                async with session.get(env_url) as response:
                    response.raise_for_status()
                    
                    # 写入文件
                    with open(local_path, 'wb') as f:
                        async for chunk in response.content.iter_chunked(8192):
                            f.write(chunk)
                            
            logger.info(f"Environment downloaded successfully to {local_path}")
            return local_path
            
        except Exception as e:
            logger.error(f"Failed to download environment from {env_url}: {e}")
            raise
    
    def unpack_environment(self, archive_path: str, extract_path: Optional[str] = None) -> str:
        """解压浏览器环境包.
        
        Args:
            archive_path: 环境包文件路径
            extract_path: 解压目录路径，默认为临时目录下的子目录
            
        Returns:
            解压后的环境目录路径
            
        Raises:
            Exception: 解压失败时抛出异常
        """
        if extract_path is None:
            extract_path = os.path.join(self.download_dir, "extracted_env")
            
        logger.info(f"Unpacking environment from {archive_path} to {extract_path}")
        
        try:
            # 确保解压目录存在
            os.makedirs(extract_path, exist_ok=True)
            
            # 解压 tar.gz 归档文件
            with tarfile.open(archive_path, "r:gz") as tar:
                tar.extractall(path=extract_path)
                
            logger.info(f"Environment unpacked successfully to {extract_path}")
            return extract_path
            
        except Exception as e:
            logger.error(f"Failed to unpack environment from {archive_path}: {e}")
            raise
    
    async def setup_environment(self, env_url: str) -> str:
        """下载并解压浏览器环境.
        
        Args:
            env_url: 环境包的URL
            
        Returns:
            解压后的环境目录路径
        """
        # 下载环境包
        archive_path = await self.download_environment(env_url)
        
        # 解压环境包
        extract_path = os.path.join(self.download_dir, f"env_{os.path.basename(archive_path)}")
        env_path = self.unpack_environment(archive_path, extract_path)
        
        return env_path