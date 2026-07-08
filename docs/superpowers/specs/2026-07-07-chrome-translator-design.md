# Chrome浏览器翻译插件设计文档

## 项目概述

开发一个Chrome浏览器翻译插件，基于AI大模型实现划词翻译功能，支持OpenAI和Anthropic两种API协议。

## 功能需求

### 1. 划词翻译功能
- 基于AI大模型实现
- 支持中英互译
- 手动触发翻译（点击小图标）
- 纯文本翻译结果
- 浮动窗口显示结果

### 2. 模型配置功能
- 支持OpenAI和Anthropic两种API协议
- 自定义模型地址和API Key，支持输入模型名称
- 测试模型连通性

### 3. 隐私和安全
- 不保存翻译历史记录
- API Key加密存储
- 最小权限原则

## 技术架构

### 整体架构
Chrome插件采用Manifest V3架构，包含以下核心组件：

1. **Manifest配置文件**：定义插件权限、内容脚本、服务工作者等
2. **Service Worker**：处理后台任务，包括AI模型API调用、配置管理
3. **Content Script**：注入到网页中，处理文本选择、翻译结果显示
4. **Popup页面**：快速配置界面，包含模型选择、API Key输入
5. **Options页面**：详细配置界面，包含模型测试、高级设置
6. **Storage模块**：使用Chrome Storage API存储配置数据

### 数据流
用户选中文本 → Content Script捕获 → 发送到Service Worker → Service Worker调用AI API → 返回翻译结果 → Content Script显示浮动窗口

## 核心组件设计

### 1. Service Worker组件
- 负责与AI模型API通信
- 支持OpenAI和Anthropic两种API协议
- 处理配置管理和存储
- 提供模型连通性测试功能

### 2. Content Script组件
- 监听文本选择事件
- 显示翻译触发图标（小图标）
- 显示翻译结果浮动窗口
- 处理用户交互（点击、关闭等）

### 3. Popup页面
- 快速配置界面
- 模型类型选择（OpenAI/Anthropic）
- API地址输入
- API Key输入
- 保存配置按钮

### 4. Options页面
- 详细配置界面
- 模型测试功能（发送测试请求）
- 高级设置（超时时间、重试次数等）

### 5. Storage模块
- 使用Chrome Storage API
- 存储模型配置（类型、地址、密钥）
- 存储用户偏好设置
- 提供配置读写接口

## 翻译功能设计

### 1. 文本选择监听
- Content Script监听`mouseup`和`keyup`事件
- 检测用户是否选中文本
- 获取选中文本内容和位置

### 2. 翻译触发机制
- 选中文本后显示小图标（翻译按钮）
- 用户点击图标后触发翻译
- 图标位置跟随选中文本

### 3. API调用流程
- Content Script将文本发送到Service Worker
- Service Worker根据配置选择API协议
- 构建请求（OpenAI格式或Anthropic格式）
- 发送请求到配置的API地址
- 处理响应和错误

### 4. 翻译结果显示
- 在选中文本附近显示浮动窗口
- 窗口显示纯文本翻译结果
- 窗口样式：现代风格，圆角边框，阴影效果
- 支持点击外部区域关闭窗口

### 5. 错误处理
- 网络错误提示
- API调用失败提示
- 配置错误提示
- 超时处理

## 配置管理设计

### 1. 配置数据结构
```json
{
  "modelType": "openai",  // openai 或 anthropic
  "apiEndpoint": "https://api.openai.com/v1/chat/completions",
  "apiKey": "sk-xxx",
  "model": "gpt-3.5-turbo",
  "timeout": 10000,
  "maxRetries": 3,
  "sourceLanguage": "auto",
  "targetLanguage": "zh-CN"
}
```

### 2. Popup页面配置
- 模型类型选择下拉框
- API地址输入框
- API Key输入框（密码类型）
- 保存按钮
- 快速测试按钮

### 3. Options页面配置
- 所有Popup页面配置项
- 模型选择下拉框
- 超时时间设置
- 重试次数设置
- 源语言选择
- 目标语言选择
- 完整测试功能

### 4. 存储管理
- 使用Chrome Storage Sync API
- 配置变更自动保存
- 跨设备同步配置
- 配置加密存储（API Key）

### 5. 配置验证
- API地址格式验证
- API Key格式验证
- 必填字段验证
- 配置完整性检查

## 模型测试功能设计

### 1. 测试流程
- 用户点击“测试连接”按钮
- 插件发送一个简单的翻译请求
- 请求内容：“Hello, world!” → 翻译成中文
- 等待响应
- 显示测试结果

### 2. OpenAI API测试请求
使用用户配置的模型名称发送测试请求：
```json
{
  "model": "用户配置的模型名称",
  "messages": [
    {
      "role": "system",
      "content": "You are a translator. Translate the following text to Chinese."
    },
    {
      "role": "user",
      "content": "Hello, world!"
    }
  ]
}
```

### 3. Anthropic API测试请求
使用用户配置的模型名称发送测试请求：
```json
{
  "model": "用户配置的模型名称",
  "max_tokens": 1024,
  "messages": [
    {
      "role": "user",
      "content": "Translate 'Hello, world!' to Chinese."
    }
  ]
}
```

### 4. 测试结果显示
- 成功：显示“连接成功！”和翻译结果
- 失败：显示具体错误信息
- 超时：显示“连接超时，请检查网络或API地址”
- 认证失败：显示“API Key无效，请检查配置”

### 5. 测试状态管理
- 测试进行中：显示加载动画
- 测试完成：显示结果
- 测试失败：显示错误信息

## UI/UX设计

### 1. 翻译触发图标
- 位置：选中文本的右上角
- 样式：圆形图标，蓝色背景，白色翻译图标
- 大小：24x24像素
- 交互：hover时放大，点击时有反馈

### 2. 翻译结果浮动窗口
- 位置：选中文本下方
- 样式：白色背景，圆角边框（8px），阴影效果
- 最大宽度：300px
- 最小宽度：150px
- 内边距：12px
- 字体：系统默认字体，14px
- 关闭按钮：右上角，鼠标点击外部区域也可关闭

### 3. Popup配置页面
- 宽度：320px
- 高度：自动
- 布局：垂直排列
- 输入框：全宽，带标签
- 按钮：主按钮（保存）和次按钮（测试）
- 颜色：蓝色主题

### 4. Options配置页面
- 宽度：600px
- 高度：自动
- 布局：分组卡片式
- 分组：模型配置、高级设置、测试与工具
- 颜色：与Popup页面一致

### 5. 加载状态
- 翻译中：显示加载动画（旋转图标）
- 测试中：显示进度条
- 错误状态：红色提示文字

## 安全性和隐私设计

### 1. API Key安全
- 使用Chrome Storage Sync API加密存储
- 不在日志中记录API Key
- 不在DOM中显示完整API Key
- 提供API Key显示/隐藏切换

### 2. 数据隐私
- 不保存翻译历史记录
- 不收集用户数据
- 不发送遥测数据
- 所有数据本地处理

### 3. 网络安全
- 只与用户配置的API地址通信
- 支持HTTPS
- 不与其他服务器通信
- 严格的CORS策略

### 4. 权限最小化
- 只请求必要的权限
- `storage`：存储配置
- `activeTab`：访问当前标签页
- `scripting`：注入内容脚本
- 不请求不必要的权限

### 5. 错误处理安全
- 不暴露敏感信息
- 错误信息不包含API Key
- 网络错误不泄露配置
- 优雅的错误降级

## 项目结构

```
chrome-translator/
├── manifest.json           # 插件配置文件
├── background.js           # Service Worker
├── content.js              # 内容脚本
├── popup.html              # Popup页面
├── popup.js                # Popup逻辑
├── popup.css               # Popup样式
├── options.html            # Options页面
├── options.js              # Options逻辑
├── options.css             # Options样式
├── lib/
│   ├── api.js              # API调用模块
│   ├── storage.js          # 存储管理模块
│   └── utils.js            # 工具函数
├── icons/
│   ├── icon16.png          # 16x16图标
│   ├── icon32.png          # 32x32图标
│   ├── icon48.png          # 48x48图标
│   └── icon128.png         # 128x128图标
└── docs/
    └── superpowers/
        └── specs/          # 设计文档
```

### 文件职责
- `manifest.json`：定义插件权限、内容脚本、服务工作者
- `background.js`：处理API调用、配置管理
- `content.js`：监听文本选择、显示翻译结果
- `popup.html/js/css`：快速配置界面
- `options.html/js/css`：详细配置界面
- `lib/api.js`：封装OpenAI和Anthropic API调用
- `lib/storage.js`：封装Chrome Storage API
- `lib/utils.js`：通用工具函数

## 开发和测试计划

### 1. 开发阶段
- 阶段1：项目初始化和基础架构
- 阶段2：Service Worker和API调用模块
- 阶段3：Content Script和翻译功能
- 阶段4：Popup配置页面
- 阶段5：Options配置页面
- 阶段6：测试和优化

### 2. 测试策略
- 单元测试：API调用模块、存储模块
- 集成测试：Content Script与Service Worker通信
- 端到端测试：完整翻译流程
- 手动测试：UI交互、配置保存

### 3. 测试用例
- 文本选择和翻译触发
- OpenAI API调用
- Anthropic API调用
- 配置保存和加载
- 模型测试功能
- 错误处理
- 跨浏览器兼容性

### 4. 质量保证
- 代码审查
- 性能优化
- 内存泄漏检查
- 安全性检查

### 5. 发布准备
- 打包插件
- 准备Chrome Web Store材料
- 编写用户文档
- 准备更新日志
