const fs = require('fs').promises;
const path = require('path');

// 配置目录路径
const CONFIG_DIR = path.join(process.cwd(), 'config');
const INPUT_DIR = path.join(CONFIG_DIR, 'input');
const FINGERPRINT_FILE = path.join(INPUT_DIR, 'fingerprint.json');
const USER_DATA_DIR = path.join(INPUT_DIR, 'user_data');

/**
 * 确保配置目录存在
 */
async function ensureConfigDir() {
  try {
    await fs.access(CONFIG_DIR);
  } catch {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
  }
  
  try {
    await fs.access(INPUT_DIR);
  } catch {
    await fs.mkdir(INPUT_DIR, { recursive: true });
  }
}

/**
 * 加载指纹信息
 * @returns {Object|null} 指纹对象或null
 */
async function loadFingerprint() {
  try {
    await fs.access(FINGERPRINT_FILE);
    const data = await fs.readFile(FINGERPRINT_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * 保存指纹信息
 * @param {Object} fingerprint 指纹对象
 */
async function saveFingerprint(fingerprint) {
  await ensureConfigDir();
  await fs.writeFile(FINGERPRINT_FILE, JSON.stringify(fingerprint, null, 2));
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

module.exports = {
  CONFIG_DIR,
  INPUT_DIR,
  FINGERPRINT_FILE,
  USER_DATA_DIR,
  ensureConfigDir,
  loadFingerprint,
  sleep,
  saveFingerprint
};