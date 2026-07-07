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

  // 测试连接（通过消息传递调用Background Service Worker）
  async function testConnection() {
    const config = {
      modelType: modelTypeSelect.value,
      apiEndpoint: apiEndpointInput.value,
      apiKey: apiKeyInput.value,
      model: modelInput.value
    };

    // 验证必填项
    if (!config.apiEndpoint || !config.apiKey || !config.model) {
      showStatus('error', '请先填写完整的配置信息');
      return;
    }

    showStatus('loading', '测试连接中...');

    try {
      const result = await chrome.runtime.sendMessage({
        action: 'testConnection',
        config: config
      });

      if (result && result.success) {
        showStatus('success', '连接成功！翻译结果：' + result.translation);
      } else {
        showStatus('error', '连接失败：' + (result ? result.error : '未知错误'));
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
