"""使用 Playwright 构建浏览器环境."""

import asyncio
import json
import logging
import os
import tempfile
import shutil
import time
import re
from pathlib import Path
from typing import Optional, List, Dict, Any
from dataclasses import dataclass

from playwright.async_api import async_playwright, BrowserContext, Playwright

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
        self.output_dir = output_dir or os.path.join(os.getcwd(), "bb_temp")
        self.context: Optional[BrowserContext] = None
        self.fingerprint: Optional[BrowserFingerprint] = None
        self.playwright: Optional[Playwright] = None
        
    async def create_environment(self) -> BrowserContext:
        """创建新的浏览器环境."""
        logger.info("Creating new browser environment")
        
        self.playwright = await async_playwright().start()
        
        # 启动带有持久化上下文的浏览器以保存状态
        user_data_dir = os.path.join(self.output_dir, "user_data")
        os.makedirs(user_data_dir, exist_ok=True)
        
        self.context = await self.playwright.chromium.launch_persistent_context(
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
            shutil.rmtree(user_data_dst)
            
        # 复制用户数据目录，带重试机制处理文件锁定问题
        if os.path.exists(user_data_src):
            self._copy_user_data_with_retry(user_data_src, user_data_dst)
        
        # 保存指纹信息
        fingerprint_data = self.fingerprint.to_dict()
        metadata_path = os.path.join(env_path, "env.json")
        
        with open(metadata_path, "w", encoding="utf-8") as f:
            json.dump(fingerprint_data, f, indent=2)
            
        logger.info(f"Environment saved. Metadata at {metadata_path}")
        return metadata_path
    
    def _should_ignore_file(self, file_path: str) -> bool:
        """判断是否应该忽略特定文件.
        
        Args:
            file_path: 文件路径
            
        Returns:
            True 如果应该忽略该文件，否则 False
        """
        # 获取文件名
        file_name = os.path.basename(file_path)
        
        # 忽略常见的临时文件、锁文件和日志文件
        ignore_patterns = [
            '.tmp', '.log', '.lock', 'lockfile', 
            'webview-thread-*', 'webview-*',
            'CrashpadMetrics*', 'CrashpadMetrics*',
            'DIPS*', 'DIPS-wal', 'DIPS-log',
            '*.tmp', '*.log', '*.lock',
            # 添加UUID格式的临时文件模式
            '*-*-*-*-*'
        ]
        
        for pattern in ignore_patterns:
            if pattern.endswith('*'):
                # 前缀匹配
                if pattern == '*-*-*-*-*':
                    # 特殊处理UUID格式的文件名 (8-4-4-4-12格式)
                    if re.match(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\..*$', file_name):
                        return True
                elif file_name.startswith(pattern[:-1]):
                    return True
            else:
                # 完全匹配
                if file_name == pattern:
                    return True
                    
        return False
    
    def _copy_user_data_with_retry(self, src: str, dst: str, max_retries: int = 5):
        """带重试机制的用户数据复制方法，用于处理文件锁定问题.
        
        Args:
            src: 源目录路径
            dst: 目标目录路径
            max_retries: 最大重试次数
        """
        for attempt in range(max_retries):
            try:
                # 使用自定义的复制函数，可以忽略特定文件
                self._copytree_ignore_locked(src, dst)
                logger.debug(f"Successfully copied user data from {src} to {dst}")
                return
            except Exception as e:
                logger.warning(f"Copy error encountered (attempt {attempt + 1}/{max_retries}): {e}")
                
                # 如果是最后一次尝试，重新抛出异常
                if attempt == max_retries - 1:
                    raise
                
                # 等待一段时间再重试
                time.sleep(0.5)
        
        # 如果所有尝试都失败了
        raise RuntimeError(f"Failed to copy user data after {max_retries} attempts")
    
    def _copytree_ignore_locked(self, src: str, dst: str):
        """复制目录树，忽略被锁定的文件.
        
        Args:
            src: 源目录路径
            dst: 目标目录路径
        """
        def copy_function(src_file, dst_file):
            """自定义复制函数，带错误处理."""
            try:
                shutil.copy2(src_file, dst_file)
            except FileNotFoundError as e:
                # 文件在复制过程中被删除是正常的，特别是在临时文件的情况下
                logger.debug(f"File not found during copy (likely temporary file deleted): {src_file}")
                return
            except (OSError, shutil.Error) as e:
                # 检查是否是应该忽略的文件
                if self._should_ignore_file(src_file):
                    logger.debug(f"Ignoring file copy error for {src_file}: {e}")
                    return
                # 如果不是可忽略的文件，重新抛出异常
                raise
        
        # 创建目标目录
        os.makedirs(dst, exist_ok=True)
        
        # 遍历源目录
        for root, dirs, files in os.walk(src):
            # 计算相对路径
            rel_path = os.path.relpath(root, src)
            dst_root = os.path.join(dst, rel_path) if rel_path != '.' else dst
            
            # 创建子目录
            for dir_name in dirs:
                dst_dir = os.path.join(dst_root, dir_name)
                os.makedirs(dst_dir, exist_ok=True)
            
            # 复制文件
            for file_name in files:
                src_file = os.path.join(root, file_name)
                dst_file = os.path.join(dst_root, file_name)
                
                # 如果是应该忽略的文件，跳过
                if self._should_ignore_file(src_file):
                    logger.debug(f"Skipping ignored file: {src_file}")
                    continue
                
                # 尝试复制文件
                try:
                    copy_function(src_file, dst_file)
                except Exception as e:
                    logger.warning(f"Failed to copy {src_file} to {dst_file}: {e}")
                    # 重新抛出异常，让上层处理
                    raise
    
    async def close(self):
        """关闭浏览器上下文和 Playwright 实例."""
        # 如果存在浏览器上下文则关闭它
        if self.context:
            try:
                await self.context.close()
                logger.info("Browser context closed")
            except Exception as e:
                # 如果上下文已经关闭，忽略错误
                logger.debug(f"Browser context already closed or error during close: {e}")
            
        # 如果存在 Playwright 实例则停止它
        if self.playwright:
            try:
                await self.playwright.stop()
                logger.info("Playwright instance stopped")
            except Exception as e:
                # 如果 Playwright 已经停止，忽略错误
                logger.debug(f"Playwright instance already stopped or error during stop: {e}")