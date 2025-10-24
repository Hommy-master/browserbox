const puppeteer = require('puppeteer');
const { USER_DATA_DIR, loadFingerprint, sleep } = require('./utils');
const { info, error, warn } = require('./log');
const { loadAutomationConfig, getDefaultConfigPath } = require('./configLoader');
const { executeAutomation } = require('./automationEngine');



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
        warn('Failed to set cookie:', error.message);
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
 * 启动自动模式
 */
async function startAutoMode() {
  info('Starting auto mode...');
  
  // 加载指纹信息
  const fingerprint = await loadFingerprint();
  
  if (!fingerprint) {
    error('Fingerprint not found, please run manual mode first to create fingerprint!');
    process.exit(1);
  }
  
  info('Loading fingerprint...');
  
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
  
  const pages = await browser.pages();
  const page = pages.length > 0 ? pages[0] : await browser.newPage();
  
  // 应用指纹
  await applyFingerprint(page, fingerprint);
  
  // 隐藏webdriver特征
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
  });
  
  info('Browser started, executing automation tests...');
  info(`User Agent: ${fingerprint.userAgent}`);
  
  // 加载自动化配置并执行
  try {
    const configPath = getDefaultConfigPath();
    const config = await loadAutomationConfig(configPath);
    
    if (config) {
      await executeAutomation(page, config);
    } else {
      warn('No automation config found, skipping automation');
    }
  } catch (err) {
    error('Error executing automation:', err.message);
  }
  
  // 关闭浏览器
  await browser.close();
  info('Browser closed');
}

module.exports = { startAutoMode };