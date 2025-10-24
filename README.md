# 指纹浏览器工具

这是一个基于 Node.js 和 Puppeteer 的指纹浏览器工具，支持手动和自动两种模式。

## 功能特性

- **手动模式**: 使用上次的指纹信息（如不存在则随机生成）打开浏览器，人工操作后保存浏览数据和指纹信息
- **自动模式**: 加载指纹信息并执行自动化测试
- **指纹伪装**: 支持 User Agent、视口、语言、时区、平台等浏览器指纹信息
- **数据持久化**: 自动保存和加载浏览器数据及指纹信息

## 安装

1. 确保已安装 Node.js (推荐 v16+)
2. 克隆或下载此项目
3. 安装依赖:

### 使用 npm
```bash
npm install
```

### 使用 pnpm (推荐)
```bash
pnpm install
```

推荐使用 pnpm 来管理依赖，因为它更快且更节省磁盘空间。

## 使用方法

### 手动模式

启动手动模式，使用现有指纹或生成随机指纹打开浏览器，人工操作后保存数据：

```bash
npm run manual
```

或者直接运行：

```bash
node index.js --mode=manual
```

### 自动模式

加载指纹信息并执行自动化测试：

```bash
npm run auto
```

或者直接运行：

```bash
node index.js --mode=auto
```

## 工作原理

### 手动模式流程
1. 检查是否存在之前的指纹信息
2. 如存在则使用，否则生成随机指纹
3. 启动带指纹信息的浏览器供人工操作
4. 浏览器关闭后，保存浏览数据和更新后的指纹信息

### 自动模式流程
1. 加载之前保存的指纹信息
2. 启动带指纹信息的浏览器
3. 执行预定义的自动化测试任务
4. 关闭浏览器

## 数据存储

所有数据都保存在项目目录下的 `config/input` 文件夹中：

- `fingerprint.json`: 浏览器指纹信息
- `user_data/`: 浏览器用户数据目录

## 自定义自动化测试

在自动模式中，您可以自定义要执行的自动化测试任务。在 `index.js` 文件中的 `startAutoMode()` 函数里找到 `// TODO: 在这里添加自动化测试逻辑` 注释，然后添加您的测试代码。

示例：
```javascript
// 导航到网站
await page.goto('https://example.com');

// 点击元素
await page.click('#submit-button');

// 输入文本
await page.type('#username', 'testuser');

// 获取页面信息
const title = await page.title();
console.log('页面标题:', title);
```

## 注意事项

1. 首次运行手动模式时会自动生成随机指纹
2. 必须先运行手动模式创建指纹信息，然后才能使用自动模式
3. 在手动模式下，请通过正常关闭浏览器的方式来保存数据（不要强制终止进程）

## 依赖

- [Puppeteer](https://pptr.dev/) - 控制Chrome/Chromium浏览器
- [Yargs](https://yargs.js.org/) - 命令行参数解析

## 许可证

MIT