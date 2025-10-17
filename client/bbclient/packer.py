"""将浏览器环境打包为归档文件."""

import logging
import tarfile
import tempfile
import os
from pathlib import Path

# 获取日志记录器
logger = logging.getLogger(__name__)


class Packer:
    """将浏览器环境打包为 tar.gz 归档文件."""
    
    @staticmethod
    def pack_environment(env_path: str, output_path: str) -> str:
        """将环境目录打包为 tar.gz 归档文件.
        
        Args:
            env_path: 环境目录的路径
            output_path: 输出归档文件的路径 (.tar.gz)
            
        Returns:
            创建的归档文件路径
        """
        # 记录打包操作开始
        logger.info(f"Packing environment from {env_path} to {output_path}")
        
        # 确保输出目录存在
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # 创建 tar.gz 归档文件
        with tarfile.open(output_path, "w:gz") as tar:
            # 添加环境目录中的所有文件
            for root, dirs, files in os.walk(env_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    arc_path = os.path.relpath(file_path, env_path)
                    tar.add(file_path, arcname=arc_path)
                    
        # 记录打包操作完成
        logger.info(f"Environment packed successfully to {output_path}")
        return output_path
    
    @staticmethod
    def unpack_environment(archive_path: str, extract_path: str) -> str:
        """解包环境归档文件.
        
        Args:
            archive_path: 归档文件的路径 (.tar.gz)
            extract_path: 解压环境的目标路径
            
        Returns:
            解压后的环境路径
        """
        # 记录解包操作开始
        logger.info(f"Unpacking environment from {archive_path} to {extract_path}")
        
        # 确保解压目录存在
        os.makedirs(extract_path, exist_ok=True)
        
        # 解压 tar.gz 归档文件
        with tarfile.open(archive_path, "r:gz") as tar:
            tar.extractall(path=extract_path)
            
        # 记录解包操作完成
        logger.info(f"Environment unpacked successfully to {extract_path}")
        return extract_path