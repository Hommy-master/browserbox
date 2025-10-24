/**
 * 日志模块
 * 提供统一的日志输出功能，包含时间戳、文件名和行号
 */

/**
 * 格式化时间
 * @returns {string} 格式化后的时间字符串，格式为：YYYY-MM-DD HH:MM:SS
 */
function formatTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 获取调用栈信息
 * @returns {Object} 包含文件名和行号的对象
 */
function getCallerInfo() {
  const originalPrepareStackTrace = Error.prepareStackTrace;
  Error.prepareStackTrace = (err, stack) => stack;
  
  const err = new Error();
  const stack = err.stack;
  
  Error.prepareStackTrace = originalPrepareStackTrace;
  
  // 获取调用日志函数的栈帧（跳过当前函数和log函数）
  const callerFrame = stack[2];
  
  if (callerFrame) {
    const fileName = callerFrame.getFileName();
    const lineNumber = callerFrame.getLineNumber();
    
    // 提取文件名（不含路径）
    const shortFileName = fileName ? fileName.split('/').pop().split('\\').pop() : 'unknown';
    
    return {
      file: shortFileName,
      line: lineNumber
    };
  }
  
  return {
    file: 'unknown',
    line: 0
  };
}

/**
 * 通用日志输出函数
 * @param {string} level 日志级别
 * @param {...any} args 日志内容
 */
function logMessage(level, ...args) {
  const time = formatTime();
  const callerInfo = getCallerInfo();
  const prefix = `[${time}] [${level.toUpperCase()}] [${callerInfo.file}:${callerInfo.line}]`;
  
  console.log(prefix, ...args);
}

/**
 * 输出info级别日志
 * @param {...any} args 日志内容
 */
function info(...args) {
  logMessage('info', ...args);
}

/**
 * 输出error级别日志
 * @param {...any} args 日志内容
 */
function error(...args) {
  logMessage('error', ...args);
}

/**
 * 输出warn级别日志
 * @param {...any} args 日志内容
 */
function warn(...args) {
  logMessage('warn', ...args);
}

/**
 * 输出debug级别日志
 * @param {...any} args 日志内容
 */
function debug(...args) {
  logMessage('debug', ...args);
}

module.exports = {
  info,
  error,
  warn,
  debug
};