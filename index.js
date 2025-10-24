const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { startManualMode } = require('./manual');
const { startAutoMode } = require('./auto');
const { info, error } = require('./log');

/**
 * 主函数
 */
async function main() {
  // 解析命令行参数
  const argv = yargs(hideBin(process.argv))
    .option('mode', {
      alias: 'm',
      type: 'string',
      description: 'Running mode: manual or auto',
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
    error('Invalid mode. Please use "manual" or "auto"');
    process.exit(1);
  }
}

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  error('Unhandled Promise rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  error('Uncaught exception:', error);
  process.exit(1);
});

// 启动主函数
main().catch(console.error);