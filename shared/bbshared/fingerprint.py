"""浏览器指纹工具."""

from dataclasses import dataclass
from typing import List, Dict, Any


@dataclass
class BrowserFingerprint:
    """浏览器指纹信息."""
    user_agent: str
    viewport: Dict[str, int]
    browser_args: List[str]
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式.
        
        Returns:
            包含指纹信息的字典
        """
        return {
            "user_agent": self.user_agent,
            "viewport": self.viewport,
            "browser_args": self.browser_args
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'BrowserFingerprint':
        """从字典创建指纹对象.
        
        Args:
            data: 包含指纹信息的字典
            
        Returns:
            浏览器指纹对象
        """
        return cls(
            user_agent=data.get("user_agent", ""),
            viewport=data.get("viewport", {"width": 1920, "height": 1080}),
            browser_args=data.get("browser_args", [])
        )