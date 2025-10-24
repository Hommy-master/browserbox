const fs = require('fs').promises;
const path = require('path');
const { info, error } = require('./log');

/**
 * 配置加载模块
 */

/**
 * 加载自动化配置文件
 * @param {string} configPath 配置文件路径
 * @returns {Object|null} 配置对象或null
 */
async function loadAutomationConfig(configPath) {
  try {
    info(`Loading automation config from: ${configPath}`);
    const data = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(data);
    info('Automation config loaded successfully');
    return config;
  } catch (err) {
    error('Failed to load automation config:', err.message);
    return null;
  }
}

/**
 * 获取默认配置文件路径
 * @returns {string} 默认配置文件路径
 */
function getDefaultConfigPath() {
  return path.join(process.cwd(), 'config', 'automation.json');
}

module.exports = {
  loadAutomationConfig,
  getDefaultConfigPath
};