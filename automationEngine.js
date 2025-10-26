const fs = require('fs').promises;
const path = require('path');
const { info, error, warn } = require('./log');
const { sleep } = require('./utils');

/**
 * 自动化执行引擎模块
 */

/**
 * 确保目录存在
 * @param {string} filePath 文件路径
 */
async function ensureDirectoryExists(filePath) {
  const dir = path.dirname(filePath);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

/**
 * 执行单个自动化步骤
 * @param {Object} page Puppeteer页面对象
 * @param {Object} step 步骤配置
 */
async function executeStep(page, step) {
  info(`Executing step: ${step.stepId} - ${step.description}`);
  
  try {
    // 根据动作类型执行相应操作
    switch (step.action) {
      case 'goto':
        await page.goto(step.parameters.url, {
          waitUntil: step.waitFor?.type || 'networkidle2',
          timeout: step.waitFor?.timeout || 30000
        });
        break;
        
      case 'type':
        await page.type(
          step.parameters.selector,
          step.parameters.text,
          step.parameters.options || {}
        );
        break;
        
      case 'click':
        // 等待元素可点击
        await page.waitForSelector(step.parameters.selector, {
          visible: true,
          timeout: step.parameters.timeout || 10000
        });
        // 尝试多种点击方式
        try {
          await page.click(step.parameters.selector);
        } catch (clickError) {
          // 如果直接点击失败，尝试使用evaluate点击
          info(`Direct click failed, trying evaluate click for: ${step.parameters.selector}`);
          const element = await page.$(step.parameters.selector);
          if (element) {
            await page.evaluate(el => el.click(), element);
          } else {
            throw new Error(`Element not found: ${step.parameters.selector}`);
          }
        }
        break;
        
      case 'waitForNavigation':
        await page.waitForNavigation({
          waitUntil: step.parameters.waitUntil || 'networkidle2',
          timeout: step.parameters.timeout || 30000
        });
        break;
        
      case 'screenshot':
        // 确保截图目录存在
        await ensureDirectoryExists(step.parameters.path);
        await page.screenshot({ path: step.parameters.path });
        info(`Screenshot saved to: ${step.parameters.path}`);
        break;
        
      case 'wait':
        await sleep(step.parameters.duration);
        break;
        
      default:
        warn(`Unknown action type: ${step.action}`);
        break;
    }
    
    // 等待元素出现（如果配置了waitFor.selector）
    if (step.waitFor && step.waitFor.selector) {
      await page.waitForSelector(step.waitFor.selector, {
        timeout: step.waitFor.timeout || 5000
      });
    }
    
    info(`Step ${step.stepId} completed successfully`);
  } catch (err) {
    error(`Error executing step ${step.stepId}:`, err.message);
    throw err;
  }
}

/**
 * 执行自动化流程
 * @param {Object} page Puppeteer页面对象
 * @param {Object} config 自动化配置
 */
async function executeAutomation(page, config) {
  info(`Starting automation: ${config.name}`);
  info(`Description: ${config.description}`);
  
  let hasError = false;
  
  // 按顺序执行每个步骤
  for (const step of config.steps) {
    try {
      await executeStep(page, step);
    } catch (err) {
      hasError = true;
      error(`Automation step failed: ${step.stepId}`, err.message);
      
      // 错误处理
      if (config.errorHandling.screenshotOnError) {
        try {
          await ensureDirectoryExists(config.errorHandling.screenshotPath);
          await page.screenshot({ path: config.errorHandling.screenshotPath });
          info(`Error screenshot saved to: ${config.errorHandling.screenshotPath}`);
        } catch (screenshotErr) {
          error('Failed to take error screenshot:', screenshotErr.message);
        }
      }
      
      // 根据配置决定是否继续执行
      if (!config.errorHandling.continueOnError) {
        throw err;
      }
    }
  }
  
  if (!hasError) {
    info('All automation steps completed successfully');
  } else {
    warn('Automation completed with errors');
  }
}

module.exports = {
  executeAutomation
};