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
