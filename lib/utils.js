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