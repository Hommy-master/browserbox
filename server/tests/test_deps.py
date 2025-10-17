"""服务端依赖项测试."""

import unittest
import sys
import os

# 将服务端目录添加到路径中，以便导入 bbserver 模块
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from bbserver.deps import BrowserPoolManager


class TestBrowserPoolManager(unittest.TestCase):
    """BrowserPoolManager 类的测试用例."""
    
    def test_init(self):
        """测试 BrowserPoolManager 初始化."""
        pool_manager = BrowserPoolManager(max_browsers=10)
        self.assertEqual(pool_manager.max_browsers, 10)
        self.assertEqual(pool_manager.active_browsers, 0)
        
    def test_init_default(self):
        """测试使用默认值的 BrowserPoolManager 初始化."""
        pool_manager = BrowserPoolManager()
        self.assertEqual(pool_manager.max_browsers, 100)
        self.assertEqual(pool_manager.active_browsers, 0)


if __name__ == '__main__':
    unittest.main()