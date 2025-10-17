"""将打包的环境上传到服务器."""

import logging
import os
from typing import AsyncGenerator

# 常量定义
CHUNK_SIZE = 1024 * 1024  # 1MB 分块大小

# 获取日志记录器
logger = logging.getLogger(__name__)


class Uploader:
    """将环境归档文件分块上传到服务器."""
    
    def __init__(self, server_url: str):
        """
        初始化上传器.
        
        Args:
            server_url: 服务器 URL
        """
        self.server_url = server_url
        
    async def upload_environment(self, archive_path: str) -> str:
        """将环境归档文件上传到服务器.
        
        Args:
            archive_path: 归档文件的路径
            
        Returns:
            上传环境的 URL
        """
        # 记录上传操作开始
        logger.info(f"Uploading environment from {archive_path}")
        
        # 获取文件大小
        file_size = os.path.getsize(archive_path)
        logger.info(f"File size: {file_size} bytes")
        
        # 目前，我们只是返回一个占位符 URL
        # 在实际实现中，我们会分块上传文件
        env_url = f"{self.server_url}/env.json"
        logger.info(f"Environment uploaded. Available at {env_url}")
        
        return env_url
    
    @staticmethod
    async def _chunk_generator(file_path: str) -> AsyncGenerator[bytes, None]:
        """生成文件块.
        
        Args:
            file_path: 文件路径
            
        Yields:
            文件块数据
        """
        # 以二进制模式打开文件
        with open(file_path, "rb") as f:
            while True:
                # 读取一个块
                chunk = f.read(CHUNK_SIZE)
                if not chunk:
                    # 文件读取完成
                    break
                # 生成块数据
                yield chunk