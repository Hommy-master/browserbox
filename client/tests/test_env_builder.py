"""环境构建器测试."""

# 不使用外部依赖的简单测试示例
import unittest
import sys
import os

# 将客户端目录添加到路径中，以便导入 bbclient 模块
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from bbclient.env_builder import EnvBuilder


class TestEnvBuilder(unittest.TestCase):
    """EnvBuilder 类的测试用例."""
    
    def test_init(self):
        """测试 EnvBuilder 初始化."""
        builder = EnvBuilder()
        self.assertIsNotNone(builder.output_dir)
        self.assertIsNone(builder.context)
        self.assertIsNone(builder.fingerprint)
        
    def test_init_with_output_dir(self):
        """测试带输出目录的 EnvBuilder 初始化."""
        output_dir = "/tmp/test"
        builder = EnvBuilder(output_dir=output_dir)
        self.assertEqual(builder.output_dir, output_dir)


if __name__ == '__main__':
    unittest.main()