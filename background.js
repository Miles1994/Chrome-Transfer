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
