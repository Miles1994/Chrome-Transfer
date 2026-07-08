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
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenAI API调用失败');
      } else {
        const errorText = await response.text();
        throw new Error(`API返回错误 (${response.status}) [${config.apiEndpoint}]: ${errorText.substring(0, 200)}`);
      }
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await response.text();
      throw new Error(`API返回非JSON响应: ${responseText.substring(0, 200)}`);
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
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Anthropic API调用失败');
      } else {
        const errorText = await response.text();
        throw new Error(`API返回错误 (${response.status}) [${config.apiEndpoint}]: ${errorText.substring(0, 200)}`);
      }
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await response.text();
      throw new Error(`API返回非JSON响应: ${responseText.substring(0, 200)}`);
    }

    const data = await response.json();
    return data.content[0].text;
  },

  // 翻译文本
  async translate(config, text) {
    // 处理URL：如果用户输入的是baseURL，自动补全端点路径
    const processedConfig = { ...config };
    
    if (processedConfig.modelType === 'openai') {
      // 如果URL不包含端点路径，自动补全
      if (!processedConfig.apiEndpoint.includes('/chat/completions')) {
        // 移除末尾的斜杠
        const baseUrl = processedConfig.apiEndpoint.replace(/\/+$/, '');
        processedConfig.apiEndpoint = baseUrl + '/chat/completions';
      }
    } else if (processedConfig.modelType === 'anthropic') {
      // 如果URL不包含端点路径，自动补全
      if (!processedConfig.apiEndpoint.includes('/messages')) {
        // 移除末尾的斜杠
        const baseUrl = processedConfig.apiEndpoint.replace(/\/+$/, '');
        processedConfig.apiEndpoint = baseUrl + '/messages';
      }
    }

    if (processedConfig.modelType === 'openai') {
      return await this.callOpenAI(processedConfig, text);
    } else if (processedConfig.modelType === 'anthropic') {
      return await this.callAnthropic(processedConfig, text);
    } else {
      throw new Error('不支持的模型类型');
    }
  }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Api;
}
