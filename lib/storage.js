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
    try {
      const testText = 'Hello, world!';
      const translation = await Api.translate(config, testText);
      return { success: true, translation };
    } catch (error) {
      return { success: false, error: Utils.formatError(error) };
    }
  }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Storage;
}