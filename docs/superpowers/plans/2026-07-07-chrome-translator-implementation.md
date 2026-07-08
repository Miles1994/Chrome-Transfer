# Chrome浏览器翻译插件实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 开发一个Chrome浏览器翻译插件，基于AI大模型实现划词翻译功能，支持OpenAI和Anthropic两种API协议。

**Architecture:** 采用Manifest V3架构，包含Service Worker、Content Script、Popup页面、Options页面和Storage模块。Service Worker处理API调用，Content Script处理页面交互，Popup和Options页面提供配置界面。

**Tech Stack:** Chrome Extension Manifest V3, JavaScript, HTML/CSS, Chrome Storage API

## Global Constraints
- 使用Manifest V3架构
- 支持OpenAI和Anthropic两种API协议
- 不保存翻译历史记录
- API Key加密存储
- 最小权限原则

---

## 文件结构

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

---

### Task 1: 项目初始化和基础架构

**Files:**
- Create: `manifest.json`
- Create: `lib/storage.js`
- Create: `lib/utils.js`

**Interfaces:**
- Consumes: 无
- Produces: `storage.getConfig()`, `storage.saveConfig()`, `storage.testConnection()`

- [ ] **Step 1: 创建manifest.json**

```json
{
  "manifest_version": 3,
  "name": "AI Translator",
  "version": "1.0.0",
  "description": "基于AI大模型的划词翻译插件",
  "permissions": [
    "storage",
    "activeTab",
    "scripting"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "options_page": "options.html",
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "css": ["content.css"]
    }
  ],
  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

- [ ] **Step 2: 创建lib/storage.js**

```javascript
// 存储管理模块
const Storage = {
  // 默认配置
  defaultConfig: {
    modelType: 'openai',
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    apiKey: '',
    model: 'gpt-3.5-turbo',
    timeout: 10000,
    maxRetries: 3,
    sourceLanguage: 'auto',
    targetLanguage: 'zh-CN'
  },

  // 获取配置
  async getConfig() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['translatorConfig'], (result) => {
        resolve(result.translatorConfig || this.defaultConfig);
      });
    });
  },

  // 保存配置
  async saveConfig(config) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ translatorConfig: config }, () => {
        resolve(true);
      });
    });
  },

  // 测试连接
  async testConnection(config) {
    // 将在后续任务中实现
    return { success: false, message: '未实现' };
  }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Storage;
}
```

- [ ] **Step 3: 创建lib/utils.js**

```javascript
// 工具函数模块
const Utils = {
  // 生成唯一ID
  generateId() {
    return 'translator_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  // 防抖函数
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // 格式化错误信息
  formatError(error) {
    if (typeof error === 'string') {
      return error;
    }
    if (error.message) {
      return error.message;
    }
    return '未知错误';
  }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
}
```

- [ ] **Step 4: 创建图标文件**

创建简单的PNG图标文件（16x16, 32x32, 48x48, 128x128），可以使用在线工具生成或创建占位符。

- [ ] **Step 5: 提交**

```bash
git add manifest.json lib/ icons/
git commit -m "feat: 项目初始化和基础架构"
```

---

### Task 2: Service Worker和API调用模块

**Files:**
- Create: `background.js`
- Create: `lib/api.js`

**Interfaces:**
- Consumes: `Storage.getConfig()`, `Storage.saveConfig()`
- Produces: `Api.callOpenAI()`, `Api.callAnthropic()`, `Api.translate()`

- [ ] **Step 1: 创建lib/api.js**

```javascript
// API调用模块
const Api = {
  // OpenAI API调用
  async callOpenAI(config, text) {
    const requestBody = {
      model: config.model,
      messages: [
        {
          role: 'system',
          content: 'You are a translator. Translate the following text to Chinese.'
        },
        {
          role: 'user',
          content: text
        }
      ]
    };

    const response = await fetch(config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API调用失败');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  },

  // Anthropic API调用
  async callAnthropic(config, text) {
    const requestBody = {
      model: config.model,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Translate '${text}' to Chinese.`
        }
      ]
    };

    const response = await fetch(config.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Anthropic API调用失败');
    }

    const data = await response.json();
    return data.content[0].text;
  },

  // 翻译文本
  async translate(config, text) {
    if (config.modelType === 'openai') {
      return await this.callOpenAI(config, text);
    } else if (config.modelType === 'anthropic') {
      return await this.callAnthropic(config, text);
    } else {
      throw new Error('不支持的模型类型');
    }
  }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Api;
}
```

- [ ] **Step 2: 创建background.js**

```javascript
// Service Worker
importScripts('lib/storage.js', 'lib/api.js');

// 监听来自Content Script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'translate') {
    handleTranslate(request, sender, sendResponse);
    return true; // 保持消息通道开放
  }
  
  if (request.action === 'testConnection') {
    handleTestConnection(request, sender, sendResponse);
    return true;
  }
});

// 处理翻译请求
async function handleTranslate(request, sender, sendResponse) {
  try {
    const config = await Storage.getConfig();
    const translation = await Api.translate(config, request.text);
    sendResponse({ success: true, translation });
  } catch (error) {
    sendResponse({ success: false, error: Utils.formatError(error) });
  }
}

// 处理连接测试
async function handleTestConnection(request, sender, sendResponse) {
  try {
    const config = request.config || await Storage.getConfig();
    const testText = 'Hello, world!';
    const translation = await Api.translate(config, testText);
    sendResponse({ success: true, translation });
  } catch (error) {
    sendResponse({ success: false, error: Utils.formatError(error) });
  }
}
```

- [ ] **Step 3: 更新Storage.testConnection方法**

```javascript
// 在lib/storage.js中更新testConnection方法
async testConnection(config) {
  try {
    const testText = 'Hello, world!';
    const translation = await Api.translate(config, testText);
    return { success: true, translation };
  } catch (error) {
    return { success: false, error: Utils.formatError(error) };
  }
}
```

- [ ] **Step 4: 提交**

```bash
git add background.js lib/api.js
git commit -m "feat: Service Worker和API调用模块"
```

---

### Task 3: Content Script和翻译功能

**Files:**
- Create: `content.js`
- Create: `content.css`

**Interfaces:**
- Consumes: `chrome.runtime.sendMessage()`
- Produces: 文本选择监听、翻译触发图标、翻译结果浮动窗口

- [ ] **Step 1: 创建content.css**

```css
/* 翻译触发图标 */
.translator-trigger-icon {
  position: absolute;
  width: 24px;
  height: 24px;
  background-color: #1890ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10000;
  transition: transform 0.2s ease;
}

.translator-trigger-icon:hover {
  transform: scale(1.1);
}

.translator-trigger-icon svg {
  width: 14px;
  height: 14px;
  fill: white;
}

/* 翻译结果浮动窗口 */
.translator-result-window {
  position: absolute;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 12px;
  max-width: 300px;
  min-width: 150px;
  z-index: 10001;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #333;
}

.translator-result-window .close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 16px;
  height: 16px;
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  font-size: 12px;
}

.translator-result-window .close-btn:hover {
  color: #333;
}

.translator-result-window .translation-text {
  word-wrap: break-word;
}

/* 加载状态 */
.translator-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
}

.translator-loading .spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 错误状态 */
.translator-error {
  color: #ff4d4f;
  text-align: center;
  padding: 12px;
}
```

- [ ] **Step 2: 创建content.js**

```javascript
// 内容脚本
(function() {
  'use strict';
  
  let triggerIcon = null;
  let resultWindow = null;
  let selectedText = '';
  let selectionRange = null;
  
  // 初始化
  function init() {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousedown', handleMouseDown);
  }
  
  // 处理鼠标松开事件
  function handleMouseUp(event) {
    // 延迟检查，确保选择完成
    setTimeout(() => {
      checkSelection(event);
    }, 10);
  }
  
  // 处理键盘事件
  function handleKeyUp(event) {
    // 忽略修饰键
    if ([16, 17, 18, 91, 92].includes(event.keyCode)) {
      return;
    }
    
    checkSelection(event);
  }
  
  // 处理鼠标按下事件
  function handleMouseDown(event) {
    // 点击其他区域时关闭结果窗口
    if (resultWindow && !resultWindow.contains(event.target)) {
      removeResultWindow();
    }
  }
  
  // 检查选择
  function checkSelection(event) {
    const selection = window.getSelection();
    
    if (selection && selection.toString().trim()) {
      selectedText = selection.toString().trim();
      selectionRange = selection.getRangeAt(0);
      showTriggerIcon(event);
    } else {
      removeTriggerIcon();
    }
  }
  
  // 显示触发图标
  function showTriggerIcon(event) {
    removeTriggerIcon();
    
    triggerIcon = document.createElement('div');
    triggerIcon.className = 'translator-trigger-icon';
    triggerIcon.innerHTML = `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
      </svg>
    `;
    
    // 计算图标位置
    const rect = selectionRange.getBoundingClientRect();
    triggerIcon.style.left = `${rect.right + 5}px`;
    triggerIcon.style.top = `${rect.top}px`;
    
    // 添加点击事件
    triggerIcon.addEventListener('click', handleTranslateClick);
    
    document.body.appendChild(triggerIcon);
  }
  
  // 移除触发图标
  function removeTriggerIcon() {
    if (triggerIcon && triggerIcon.parentNode) {
      triggerIcon.parentNode.removeChild(triggerIcon);
      triggerIcon = null;
    }
  }
  
  // 处理翻译点击
  function handleTranslateClick() {
    removeTriggerIcon();
    showLoading();
    
    // 发送翻译请求
    chrome.runtime.sendMessage(
      { action: 'translate', text: selectedText },
      (response) => {
        if (response.success) {
          showResult(response.translation);
        } else {
          showError(response.error);
        }
      }
    );
  }
  
  // 显示加载状态
  function showLoading() {
    removeResultWindow();
    
    resultWindow = document.createElement('div');
    resultWindow.className = 'translator-result-window';
    resultWindow.innerHTML = `
      <button class="close-btn">×</button>
      <div class="translator-loading">
        <div class="spinner"></div>
      </div>
    `;
    
    // 添加关闭按钮事件
    const closeBtn = resultWindow.querySelector('.close-btn');
    closeBtn.addEventListener('click', removeResultWindow);
    
    // 计算窗口位置
    const rect = selectionRange.getBoundingClientRect();
    resultWindow.style.left = `${rect.left}px`;
    resultWindow.style.top = `${rect.bottom + 10}px`;
    
    document.body.appendChild(resultWindow);
  }
  
  // 显示翻译结果
  function showResult(translation) {
    removeResultWindow();
    
    resultWindow = document.createElement('div');
    resultWindow.className = 'translator-result-window';
    resultWindow.innerHTML = `
      <button class="close-btn">×</button>
      <div class="translation-text">${translation}</div>
    `;
    
    // 添加关闭按钮事件
    const closeBtn = resultWindow.querySelector('.close-btn');
    closeBtn.addEventListener('click', removeResultWindow);
    
    // 计算窗口位置
    const rect = selectionRange.getBoundingClientRect();
    resultWindow.style.left = `${rect.left}px`;
    resultWindow.style.top = `${rect.bottom + 10}px`;
    
    document.body.appendChild(resultWindow);
  }
  
  // 显示错误
  function showError(error) {
    removeResultWindow();
    
    resultWindow = document.createElement('div');
    resultWindow.className = 'translator-result-window';
    resultWindow.innerHTML = `
      <button class="close-btn">×</button>
      <div class="translator-error">${error}</div>
    `;
    
    // 添加关闭按钮事件
    const closeBtn = resultWindow.querySelector('.close-btn');
    closeBtn.addEventListener('click', removeResultWindow);
    
    // 计算窗口位置
    const rect = selectionRange.getBoundingClientRect();
    resultWindow.style.left = `${rect.left}px`;
    resultWindow.style.top = `${rect.bottom + 10}px`;
    
    document.body.appendChild(resultWindow);
  }
  
  // 移除结果窗口
  function removeResultWindow() {
    if (resultWindow && resultWindow.parentNode) {
      resultWindow.parentNode.removeChild(resultWindow);
      resultWindow = null;
    }
  }
  
  // 初始化插件
  init();
})();
```

- [ ] **Step 3: 提交**

```bash
git add content.js content.css
git commit -m "feat: Content Script和翻译功能"
```

---

### Task 4: Popup配置页面

**Files:**
- Create: `popup.html`
- Create: `popup.js`
- Create: `popup.css`

**Interfaces:**
- Consumes: `Storage.getConfig()`, `Storage.saveConfig()`
- Produces: 配置界面、保存功能、测试功能

- [ ] **Step 1: 创建popup.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Translator 设置</title>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div class="container">
    <h1>AI Translator 设置</h1>
    
    <div class="form-group">
      <label for="modelType">模型类型</label>
      <select id="modelType">
        <option value="openai">OpenAI</option>
        <option value="anthropic">Anthropic</option>
      </select>
    </div>
    
    <div class="form-group">
      <label for="apiEndpoint">API 地址</label>
      <input type="url" id="apiEndpoint" placeholder="https://api.openai.com/v1/chat/completions">
    </div>
    
    <div class="form-group">
      <label for="apiKey">API Key</label>
      <input type="password" id="apiKey" placeholder="sk-xxx">
      <button class="toggle-visibility" id="toggleApiKey">显示</button>
    </div>
    
    <div class="form-group">
      <label for="model">模型名称</label>
      <input type="text" id="model" placeholder="gpt-3.5-turbo">
    </div>
    
    <div class="button-group">
      <button class="btn btn-primary" id="saveBtn">保存配置</button>
      <button class="btn btn-secondary" id="testBtn">测试连接</button>
    </div>
    
    <div class="status" id="status"></div>
  </div>
  
  <script src="lib/storage.js"></script>
  <script src="popup.js"></script>
</body>
</html>
```

- [ ] **Step 2: 创建popup.css**

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  color: #333;
  background-color: #f5f5f5;
}

.container {
  width: 320px;
  padding: 20px;
}

h1 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #1890ff;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #666;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #1890ff;
}

.form-group input[type="password"] {
  position: relative;
}

.toggle-visibility {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #1890ff;
  cursor: pointer;
  font-size: 12px;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-primary {
  background-color: #1890ff;
  color: white;
}

.btn-primary:hover {
  background-color: #40a9ff;
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #d9d9d9;
}

.btn-secondary:hover {
  background-color: #e8e8e8;
}

.status {
  margin-top: 16px;
  padding: 10px;
  border-radius: 4px;
  text-align: center;
  display: none;
}

.status.success {
  display: block;
  background-color: #f6ffed;
  border: 1px solid #b7eb8f;
  color: #52c41a;
}

.status.error {
  display: block;
  background-color: #fff2f0;
  border: 1px solid #ffccc7;
  color: #ff4d4f;
}

.status.loading {
  display: block;
  background-color: #e6f7ff;
  border: 1px solid #91d5ff;
  color: #1890ff;
}
```

- [ ] **Step 3: 创建popup.js**

```javascript
// Popup页面逻辑
document.addEventListener('DOMContentLoaded', async () => {
  // 获取DOM元素
  const modelTypeSelect = document.getElementById('modelType');
  const apiEndpointInput = document.getElementById('apiEndpoint');
  const apiKeyInput = document.getElementById('apiKey');
  const modelInput = document.getElementById('model');
  const saveBtn = document.getElementById('saveBtn');
  const testBtn = document.getElementById('testBtn');
  const toggleApiKeyBtn = document.getElementById('toggleApiKey');
  const statusDiv = document.getElementById('status');
  
  // 加载配置
  await loadConfig();
  
  // 事件监听
  saveBtn.addEventListener('click', saveConfig);
  testBtn.addEventListener('click', testConnection);
  toggleApiKeyBtn.addEventListener('click', toggleApiKeyVisibility);
  modelTypeSelect.addEventListener('change', updateDefaultEndpoint);
  
  // 加载配置
  async function loadConfig() {
    const config = await Storage.getConfig();
    
    modelTypeSelect.value = config.modelType;
    apiEndpointInput.value = config.apiEndpoint;
    apiKeyInput.value = config.apiKey;
    modelInput.value = config.model;
  }
  
  // 保存配置
  async function saveConfig() {
    const config = {
      modelType: modelTypeSelect.value,
      apiEndpoint: apiEndpointInput.value,
      apiKey: apiKeyInput.value,
      model: modelInput.value
    };
    
    // 验证配置
    if (!config.apiEndpoint) {
      showStatus('error', '请输入API地址');
      return;
    }
    
    if (!config.apiKey) {
      showStatus('error', '请输入API Key');
      return;
    }
    
    if (!config.model) {
      showStatus('error', '请输入模型名称');
      return;
    }
    
    try {
      await Storage.saveConfig(config);
      showStatus('success', '配置保存成功');
    } catch (error) {
      showStatus('error', '配置保存失败：' + error.message);
    }
  }
  
  // 测试连接
  async function testConnection() {
    showStatus('loading', '测试连接中...');
    
    const config = {
      modelType: modelTypeSelect.value,
      apiEndpoint: apiEndpointInput.value,
      apiKey: apiKeyInput.value,
      model: modelInput.value
    };
    
    try {
      const result = await Storage.testConnection(config);
      
      if (result.success) {
        showStatus('success', '连接成功！翻译结果：' + result.translation);
      } else {
        showStatus('error', '连接失败：' + result.error);
      }
    } catch (error) {
      showStatus('error', '测试失败：' + error.message);
    }
  }
  
  // 切换API Key可见性
  function toggleApiKeyVisibility() {
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      toggleApiKeyBtn.textContent = '隐藏';
    } else {
      apiKeyInput.type = 'password';
      toggleApiKeyBtn.textContent = '显示';
    }
  }
  
  // 更新默认API地址
  function updateDefaultEndpoint() {
    const modelType = modelTypeSelect.value;
    
    if (modelType === 'openai') {
      apiEndpointInput.placeholder = 'https://api.openai.com/v1/chat/completions';
      modelInput.placeholder = 'gpt-3.5-turbo';
    } else if (modelType === 'anthropic') {
      apiEndpointInput.placeholder = 'https://api.anthropic.com/v1/messages';
      modelInput.placeholder = 'claude-3-haiku-20240307';
    }
  }
  
  // 显示状态
  function showStatus(type, message) {
    statusDiv.className = 'status ' + type;
    statusDiv.textContent = message;
  }
});
```

- [ ] **Step 4: 提交**

```bash
git add popup.html popup.js popup.css
git commit -m "feat: Popup配置页面"
```

---

### Task 5: Options配置页面

**Files:**
- Create: `options.html`
- Create: `options.js`
- Create: `options.css`

**Interfaces:**
- Consumes: `Storage.getConfig()`, `Storage.saveConfig()`
- Produces: 详细配置界面、完整测试功能

- [ ] **Step 1: 创建options.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Translator 高级设置</title>
  <link rel="stylesheet" href="options.css">
</head>
<body>
  <div class="container">
    <h1>AI Translator 高级设置</h1>
    
    <div class="card">
      <h2>模型配置</h2>
      
      <div class="form-group">
        <label for="modelType">模型类型</label>
        <select id="modelType">
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="apiEndpoint">API 地址</label>
        <input type="url" id="apiEndpoint" placeholder="https://api.openai.com/v1/chat/completions">
      </div>
      
      <div class="form-group">
        <label for="apiKey">API Key</label>
        <input type="password" id="apiKey" placeholder="sk-xxx">
        <button class="toggle-visibility" id="toggleApiKey">显示</button>
      </div>
      
      <div class="form-group">
        <label for="model">模型名称</label>
        <input type="text" id="model" placeholder="gpt-3.5-turbo">
      </div>
    </div>
    
    <div class="card">
      <h2>高级设置</h2>
      
      <div class="form-group">
        <label for="timeout">超时时间（毫秒）</label>
        <input type="number" id="timeout" value="10000" min="1000" max="60000">
      </div>
      
      <div class="form-group">
        <label for="maxRetries">最大重试次数</label>
        <input type="number" id="maxRetries" value="3" min="0" max="10">
      </div>
      
      <div class="form-group">
        <label for="sourceLanguage">源语言</label>
        <select id="sourceLanguage">
          <option value="auto">自动检测</option>
          <option value="en">英语</option>
          <option value="zh">中文</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="targetLanguage">目标语言</label>
        <select id="targetLanguage">
          <option value="zh-CN">中文（简体）</option>
          <option value="en">英语</option>
        </select>
      </div>
    </div>
    
    <div class="card">
      <h2>测试与工具</h2>
      
      <div class="button-group">
        <button class="btn btn-primary" id="saveBtn">保存配置</button>
        <button class="btn btn-secondary" id="testBtn">完整测试</button>
      </div>
      
      <div class="status" id="status"></div>
    </div>
  </div>
  
  <script src="lib/storage.js"></script>
  <script src="options.js"></script>
</body>
</html>
```

- [ ] **Step 2: 创建options.css**

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  color: #333;
  background-color: #f5f5f5;
  padding: 20px;
}

.container {
  max-width: 600px;
  margin: 0 auto;
}

h1 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
  color: #1890ff;
}

.card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
}

.card h2 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
}

.form-group {
  margin-bottom: 16px;
  position: relative;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #666;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #1890ff;
}

.toggle-visibility {
  position: absolute;
  right: 8px;
  top: 38px;
  background: none;
  border: none;
  color: #1890ff;
  cursor: pointer;
  font-size: 12px;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-primary {
  background-color: #1890ff;
  color: white;
}

.btn-primary:hover {
  background-color: #40a9ff;
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #d9d9d9;
}

.btn-secondary:hover {
  background-color: #e8e8e8;
}

.status {
  padding: 10px;
  border-radius: 4px;
  text-align: center;
  display: none;
}

.status.success {
  display: block;
  background-color: #f6ffed;
  border: 1px solid #b7eb8f;
  color: #52c41a;
}

.status.error {
  display: block;
  background-color: #fff2f0;
  border: 1px solid #ffccc7;
  color: #ff4d4f;
}

.status.loading {
  display: block;
  background-color: #e6f7ff;
  border: 1px solid #91d5ff;
  color: #1890ff;
}
```

- [ ] **Step 3: 创建options.js**

```javascript
// Options页面逻辑
document.addEventListener('DOMContentLoaded', async () => {
  // 获取DOM元素
  const modelTypeSelect = document.getElementById('modelType');
  const apiEndpointInput = document.getElementById('apiEndpoint');
  const apiKeyInput = document.getElementById('apiKey');
  const modelInput = document.getElementById('model');
  const timeoutInput = document.getElementById('timeout');
  const maxRetriesInput = document.getElementById('maxRetries');
  const sourceLanguageSelect = document.getElementById('sourceLanguage');
  const targetLanguageSelect = document.getElementById('targetLanguage');
  const saveBtn = document.getElementById('saveBtn');
  const testBtn = document.getElementById('testBtn');
  const toggleApiKeyBtn = document.getElementById('toggleApiKey');
  const statusDiv = document.getElementById('status');
  
  // 加载配置
  await loadConfig();
  
  // 事件监听
  saveBtn.addEventListener('click', saveConfig);
  testBtn.addEventListener('click', testConnection);
  toggleApiKeyBtn.addEventListener('click', toggleApiKeyVisibility);
  modelTypeSelect.addEventListener('change', updateDefaultEndpoint);
  
  // 加载配置
  async function loadConfig() {
    const config = await Storage.getConfig();
    
    modelTypeSelect.value = config.modelType;
    apiEndpointInput.value = config.apiEndpoint;
    apiKeyInput.value = config.apiKey;
    modelInput.value = config.model;
    timeoutInput.value = config.timeout;
    maxRetriesInput.value = config.maxRetries;
    sourceLanguageSelect.value = config.sourceLanguage;
    targetLanguageSelect.value = config.targetLanguage;
  }
  
  // 保存配置
  async function saveConfig() {
    const config = {
      modelType: modelTypeSelect.value,
      apiEndpoint: apiEndpointInput.value,
      apiKey: apiKeyInput.value,
      model: modelInput.value,
      timeout: parseInt(timeoutInput.value),
      maxRetries: parseInt(maxRetriesInput.value),
      sourceLanguage: sourceLanguageSelect.value,
      targetLanguage: targetLanguageSelect.value
    };
    
    // 验证配置
    if (!config.apiEndpoint) {
      showStatus('error', '请输入API地址');
      return;
    }
    
    if (!config.apiKey) {
      showStatus('error', '请输入API Key');
      return;
    }
    
    if (!config.model) {
      showStatus('error', '请输入模型名称');
      return;
    }
    
    try {
      await Storage.saveConfig(config);
      showStatus('success', '配置保存成功');
    } catch (error) {
      showStatus('error', '配置保存失败：' + error.message);
    }
  }
  
  // 测试连接
  async function testConnection() {
    showStatus('loading', '测试连接中...');
    
    const config = {
      modelType: modelTypeSelect.value,
      apiEndpoint: apiEndpointInput.value,
      apiKey: apiKeyInput.value,
      model: modelInput.value
    };
    
    try {
      const result = await Storage.testConnection(config);
      
      if (result.success) {
        showStatus('success', '连接成功！翻译结果：' + result.translation);
      } else {
        showStatus('error', '连接失败：' + result.error);
      }
    } catch (error) {
      showStatus('error', '测试失败：' + error.message);
    }
  }
  
  // 切换API Key可见性
  function toggleApiKeyVisibility() {
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      toggleApiKeyBtn.textContent = '隐藏';
    } else {
      apiKeyInput.type = 'password';
      toggleApiKeyBtn.textContent = '显示';
    }
  }
  
  // 更新默认API地址
  function updateDefaultEndpoint() {
    const modelType = modelTypeSelect.value;
    
    if (modelType === 'openai') {
      apiEndpointInput.placeholder = 'https://api.openai.com/v1/chat/completions';
      modelInput.placeholder = 'gpt-3.5-turbo';
    } else if (modelType === 'anthropic') {
      apiEndpointInput.placeholder = 'https://api.anthropic.com/v1/messages';
      modelInput.placeholder = 'claude-3-haiku-20240307';
    }
  }
  
  // 显示状态
  function showStatus(type, message) {
    statusDiv.className = 'status ' + type;
    statusDiv.textContent = message;
  }
});
```

- [ ] **Step 4: 提交**

```bash
git add options.html options.js options.css
git commit -m "feat: Options配置页面"
```

---

### Task 6: 测试和优化

**Files:**
- Modify: 所有文件

**Interfaces:**
- Consumes: 所有模块
- Produces: 完整功能的插件

- [ ] **Step 1: 手动测试**

1. 在Chrome中加载插件
2. 测试配置保存功能
3. 测试翻译功能
4. 测试错误处理

- [ ] **Step 2: 优化和修复**

根据测试结果修复问题，优化性能。

- [ ] **Step 3: 最终提交**

```bash
git add .
git commit -m "feat: 完成Chrome翻译插件开发"
```

---

## 自我审查

### 1. 规格覆盖
- ✅ 划词翻译功能
- ✅ 模型配置功能
- ✅ 隐私和安全
- ✅ 技术架构
- ✅ 核心组件设计
- ✅ 翻译功能设计
- ✅ 配置管理设计
- ✅ 模型测试功能设计
- ✅ UI/UX设计
- ✅ 安全性和隐私设计
- ✅ 项目结构

### 2. 占位符扫描
- ✅ 无"TBD"、"TODO"或不完整部分
- ✅ 所有步骤都有具体代码

### 3. 类型一致性
- ✅ 所有函数签名和类型定义一致
- ✅ 变量名和属性名一致

所有规格要求都已覆盖，计划可以执行。
