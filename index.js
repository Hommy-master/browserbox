const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// 配置目录路径
const CONFIG_DIR = path.join(process.cwd(), 'config');
const INPUT_DIR = path.join(CONFIG_DIR, 'input');
const FINGERPRINT_FILE = path.join(INPUT_DIR, 'fingerprint.json');
const USER_DATA_DIR = path.join(INPUT_DIR, 'user_data');

/**
 * 生成随机指纹信息
 * @returns {Object} 指纹对象
 */
function generateRandomFingerprint() {
  const userAgents = [
    // Chrome on Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    
    // Chrome on macOS
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 12_6_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_7_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    
    // Chrome on Linux
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Fedora; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    
    // Firefox on Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/120.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0',
    'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:109.0) Gecko/20100101 Firefox/121.0',
    
    // Firefox on macOS
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 13.0; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 12.6; rv:109.0) Gecko/20100101 Firefox/121.0',
    
    // Firefox on Linux
    'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (X11; Fedora; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/121.0',
    
    // Safari on macOS
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 12_6_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6.1 Safari/605.1.15',
    
    // Edge on Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36 Edg/118.0.0.0',
    'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    
    // Opera
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 OPR/105.0.0.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0',
    
    // Mobile browsers
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Android 14; Mobile; rv:109.0) Gecko/121.0 Firefox/121.0',
    'Mozilla/5.0 (Android 13; Mobile; rv:109.0) Gecko/119.0 Firefox/119.0',
    'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.43 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.43 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.43 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.43 Mobile Safari/537.36',
    
    // Additional Chrome versions
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36',
    
    // Additional Firefox versions
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/118.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/117.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/116.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/114.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/113.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/112.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/111.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/110.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/109.0',
    
    // Additional Edge versions
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36 Edg/117.0.0.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36 Edg/116.0.0.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.0.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.0.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 Edg/113.0.0.0',
    
    // Additional Safari versions
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Safari/605.1.15',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.5 Safari/605.1.15',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Safari/605.1.15',
    
    // Additional mobile devices
    'Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.43 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.43 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 11; SM-A525F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.43 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 11; Redmi Note 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.43 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 10; LM-Q720) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.43 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 9; SM-J730F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.43 Mobile Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 15_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPad; CPU OS 16_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (iPad; CPU OS 15_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Mobile/15E148 Safari/604.1'
  ];
  
  const languages = ['en-US', 'en-GB', 'zh-CN', 'ja-JP', 'ko-KR'];
  const timezones = ['America/New_York', 'Europe/London', 'Asia/Shanghai', 'Asia/Tokyo', 'Australia/Sydney'];
  
  // 固定分辨率
  const resolution = { width: 1920, height: 1080 };
  
  return {
    userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
    viewport: {
      width: resolution.width,
      height: resolution.height,
      deviceScaleFactor: Math.random() > 0.5 ? 2 : 1,
      isMobile: Math.random() > 0.7 ? true : false,
      hasTouch: Math.random() > 0.8 ? true : false,
      isLandscape: Math.random() > 0.5 ? true : false
    },
    language: languages[Math.floor(Math.random() * languages.length)],
    timezone: timezones[Math.floor(Math.random() * timezones.length)],
    platform: Math.random() > 0.6 ? 'Win32' : (Math.random() > 0.5 ? 'MacIntel' : 'Linux x86_64'),
    cookies: [],
    localStorage: {},
    sessionStorage: {}
  };
}

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

/**
 * 应用指纹到浏览器页面
 * @param {Page} page Puppeteer页面对象
 * @param {Object} fingerprint 指纹对象
 */
async function applyFingerprint(page, fingerprint) {
  // 设置User Agent
  await page.setUserAgent(fingerprint.userAgent);
  
  // 设置视口
  await page.setViewport(fingerprint.viewport);
  
  // 设置语言
  await page.evaluateOnNewDocument((lang, tz) => {
    Object.defineProperty(navigator, 'language', {
      get: () => lang
    });
    
    Object.defineProperty(navigator, 'languages', {
      get: () => [lang]
    });
    
    // 设置时区
    Intl.DateTimeFormat = new Proxy(Intl.DateTimeFormat, {
      construct(target, args) {
        if (args.length === 0) {
          args.push(tz);
        } else if (args.length === 1) {
          args.push({ timeZone: tz });
        } else if (args.length === 2) {
          args[1].timeZone = tz;
        }
        return new target(...args);
      }
    });
    
    Date = new Proxy(Date, {
      construct(target, args) {
        const date = new target(...args);
        date.getTimezoneOffset = () => {
          const utc = new target(date.toLocaleString("en-US", { timeZone: "UTC" }));
          const tzDate = new target(date.toLocaleString("en-US", { timeZone: tz }));
          return (utc.getTime() - tzDate.getTime()) / (1000 * 60);
        };
        return date;
      }
    });
  }, fingerprint.language, fingerprint.timezone);
  
  // 设置平台
  await page.evaluateOnNewDocument((platform) => {
    Object.defineProperty(navigator, 'platform', {
      get: () => platform
    });
  }, fingerprint.platform);
  
  // 应用cookies
  if (fingerprint.cookies && fingerprint.cookies.length > 0) {
    for (const cookie of fingerprint.cookies) {
      try {
        await page.setCookie(cookie);
      } catch (error) {
        console.warn('Failed to set cookie:', error.message);
      }
    }
  }
  
  // 应用localStorage
  if (fingerprint.localStorage && Object.keys(fingerprint.localStorage).length > 0) {
    await page.evaluateOnNewDocument((storage) => {
      for (const key in storage) {
        localStorage.setItem(key, storage[key]);
      }
    }, fingerprint.localStorage);
  }
  
  // 应用sessionStorage
  if (fingerprint.sessionStorage && Object.keys(fingerprint.sessionStorage).length > 0) {
    await page.evaluateOnNewDocument((storage) => {
      for (const key in storage) {
        sessionStorage.setItem(key, storage[key]);
      }
    }, fingerprint.sessionStorage);
  }
}

/**
 * 从页面提取指纹信息
 * @param {Page} page Puppeteer页面对象
 * @param {Object} baseFingerprint 基础指纹对象
 * @returns {Object} 更新后的指纹对象
 */
async function extractFingerprintFromPage(page, baseFingerprint) {
  // 获取cookies
  const cookies = await page.cookies();
  
  // 获取localStorage
  const localStorage = await page.evaluate(() => {
    const json = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      json[key] = localStorage.getItem(key);
    }
    return json;
  });
  
  // 获取sessionStorage
  const sessionStorage = await page.evaluate(() => {
    const json = {};
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      json[key] = sessionStorage.getItem(key);
    }
    return json;
  });
  
  return {
    ...baseFingerprint,
    cookies,
    localStorage,
    sessionStorage
  };
}

/**
 * 启动手动模式
 */
async function startManualMode() {
  console.log('启动手动模式...');
  
  // 确保配置目录存在
  await ensureConfigDir();
  
  // 加载指纹信息（如果存在）
  let fingerprint = await loadFingerprint();
  
  // 如果没有指纹信息，则生成随机指纹
  if (!fingerprint) {
    console.log('未找到现有指纹信息，生成随机指纹...');
    fingerprint = generateRandomFingerprint();
    await saveFingerprint(fingerprint);
  } else {
    console.log('使用现有指纹信息...');
  }
  
  // 启动浏览器
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: USER_DATA_DIR,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });
  
  const page = await browser.newPage();
  
  // 应用指纹
  await applyFingerprint(page, fingerprint);
  
  // 隐藏webdriver特征
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
  });
  
  console.log('浏览器已启动，请开始操作...');
  console.log(`User Agent: ${fingerprint.userAgent}`);
  console.log(`Viewport: ${fingerprint.viewport.width}x${fingerprint.viewport.height}`);
  
  // 导航到空白页
  await page.goto('about:blank');
  
  // 监听浏览器关闭事件
  browser.on('disconnected', async () => {
    console.log('浏览器已关闭，正在保存数据...');
    
    try {
      // 重新连接以获取最新数据
      const pages = await browser.pages();
      if (pages.length > 0) {
        const currentPage = pages[0];
        // 提取更新后的指纹
        const updatedFingerprint = await extractFingerprintFromPage(currentPage, fingerprint);
        await saveFingerprint(updatedFingerprint);
        console.log('指纹信息已保存到:', FINGERPRINT_FILE);
      }
    } catch (error) {
      console.error('保存指纹信息时出错:', error.message);
      // 即使出错也保存原始指纹
      await saveFingerprint(fingerprint);
    }
    
    console.log('数据保存完成。');
    process.exit(0);
  });
  
  // 等待用户关闭浏览器
  console.log('请手动关闭浏览器以保存数据和指纹信息。');
}

/**
 * 启动自动模式
 */
async function startAutoMode() {
  console.log('启动自动模式...');
  
  // 加载指纹信息
  const fingerprint = await loadFingerprint();
  
  if (!fingerprint) {
    console.error('未找到指纹信息，请先运行手动模式创建指纹！');
    process.exit(1);
  }
  
  console.log('加载指纹信息...');
  
  // 启动浏览器
  const browser = await puppeteer.launch({
    headless: false, // 为了演示效果设为false，实际可以设为true
    userDataDir: USER_DATA_DIR,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });
  
  const page = await browser.newPage();
  
  // 应用指纹
  await applyFingerprint(page, fingerprint);
  
  // 隐藏webdriver特征
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
  });
  
  console.log('浏览器已启动，执行自动化测试...');
  console.log(`User Agent: ${fingerprint.userAgent}`);
  
  // TODO: 在这里添加自动化测试逻辑
  // 示例：
  try {
    // 导航到示例网站
    await page.goto('https://example.com');
    console.log('已导航到 https://example.com');
    
    // 添加更多自动化测试步骤...
    // await page.click('#some-button');
    // await page.type('#input-field', 'test data');
    // const result = await page.evaluate(() => document.title);
    // console.log('页面标题:', result);
    
    console.log('自动化测试执行完毕');
  } catch (error) {
    console.error('自动化测试执行出错:', error.message);
  }
  
  // 关闭浏览器
  await browser.close();
  console.log('浏览器已关闭');
}

/**
 * 主函数
 */
async function main() {
  // 解析命令行参数
  const argv = yargs(hideBin(process.argv))
    .option('mode', {
      alias: 'm',
      type: 'string',
      description: '运行模式: manual 或 auto',
      demandOption: true
    })
    .help()
    .alias('help', 'h')
    .argv;
  
  const mode = argv.mode.toLowerCase();
  
  if (mode === 'manual') {
    await startManualMode();
  } else if (mode === 'auto') {
    await startAutoMode();
  } else {
    console.error('无效的模式。请使用 "manual" 或 "auto"');
    process.exit(1);
  }
}

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});

// 启动主函数
main().catch(console.error);