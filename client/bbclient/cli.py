"""BrowserBox 客户端命令行接口."""

import argparse
import asyncio
import logging
import os
import sys
import tempfile
from pathlib import Path

from bbclient.env_builder import EnvBuilder
from bbclient.packer import Packer
from bbclient.uploader import Uploader

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

# 获取日志记录器
logger = logging.getLogger(__name__)


async def main_async():
    """主异步函数."""
    # 创建参数解析器
    parser = argparse.ArgumentParser(description="BrowserBox Client")
    parser.add_argument(
        "--output-dir",
        default=None,
        help="保存浏览器环境的目录 (默认: 当前目录下的 bb_env)"
    )
    parser.add_argument(
        "--server-url",
        default="http://localhost:8000",
        help="上传环境的服务器 URL"
    )
    parser.add_argument(
        "--pack-only",
        action="store_true",
        help="仅打包环境，不上传"
    )
    
    # 解析命令行参数
    args = parser.parse_args()
    
    # 创建环境构建器
    builder = EnvBuilder(output_dir=args.output_dir)
    
    try:
        # 创建浏览器环境
        logger.info("Starting browser environment creation")
        context = await builder.create_environment()
        
        # 等待用户与浏览器交互
        logger.info("Browser is open. Perform your actions now.")
        logger.info("Close ALL browser windows/tabs when finished to save the environment.")
        
        # 更可靠地等待浏览器关闭
        # 循环检查是否有页面存在，如果没有页面则认为浏览器已关闭
        try:
            while len(context.pages) > 0:
                await asyncio.sleep(1)
        except Exception:
            # 如果访问 pages 出错，说明上下文已关闭
            pass
            
        logger.info("Browser has been closed. Saving environment...")
        
        # 保存环境
        save_path = args.output_dir or os.path.join(os.getcwd(), "bb_env")
        metadata_path = await builder.save_environment(save_path)
        logger.info(f"Environment saved to {save_path}")
        
        # 打包环境
        archive_path = os.path.join(os.getcwd(), "bb_env.tar.gz")
        Packer.pack_environment(save_path, archive_path)
        logger.info(f"Environment packed to {archive_path}")
        
        # 如果不是仅打包模式，则上传环境
        if not args.pack_only:
            # 上传环境
            uploader = Uploader(args.server_url)
            env_url = await uploader.upload_environment(archive_path)
            logger.info(f"Environment uploaded. Access it at: {env_url}")
        
    except Exception as e:
        # 记录错误并返回错误码
        logger.error(f"Error occurred: {e}", exc_info=True)
        return 1
    finally:
        # 关闭浏览器环境
        await builder.close()
        
    return 0


def main():
    """主入口点."""
    try:
        # 运行异步主函数
        return asyncio.run(main_async())
    except KeyboardInterrupt:
        # 处理用户中断 (Ctrl+C)
        logger.info("Operation cancelled by user")
        return 130  # Ctrl+C 的标准退出码
    except Exception as e:
        # 记录未预期的错误
        logger.error(f"Unexpected error: {e}", exc_info=True)
        return 1


if __name__ == "__main__":
    # 运行主函数并退出
    sys.exit(main())