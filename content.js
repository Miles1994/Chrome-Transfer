// 内容脚本 - 处理文本选择和翻译显示
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
    // 忽略修饰键（Shift、Ctrl、Alt、Meta）
    if ([16, 17, 18, 91, 92].includes(event.keyCode)) {
      return;
    }

    checkSelection(event);
  }

  // 处理鼠标按下事件
  function handleMouseDown(event) {
    // 点击非插件区域时关闭结果窗口和触发图标
    if (resultWindow && !resultWindow.contains(event.target)) {
      removeResultWindow();
    }
    if (triggerIcon && !triggerIcon.contains(event.target)) {
      removeTriggerIcon();
    }
  }

  // 检查文本选择
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

  // 计算元素的绝对定位坐标（考虑滚动偏移）
  function getAbsolutePosition(rect) {
    return {
      left: rect.left + window.scrollX,
      top: rect.top + window.scrollY,
      right: rect.right + window.scrollX,
      bottom: rect.bottom + window.scrollY
    };
  }

  // 确保窗口不超出视口边界，并返回修正后的坐标
  function clampToViewport(left, top, width, height) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    // 右边界检查
    if (left + width > scrollX + viewportWidth) {
      left = scrollX + viewportWidth - width - 10;
    }
    // 下边界检查
    if (top + height > scrollY + viewportHeight) {
      top = scrollY + viewportHeight - height - 10;
    }
    // 左边界检查
    if (left < scrollX) {
      left = scrollX + 10;
    }
    // 上边界检查
    if (top < scrollY) {
      top = scrollY + 10;
    }

    return { left, top };
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

    // 计算图标位置（需要考虑页面滚动偏移）
    const rect = selectionRange.getBoundingClientRect();
    const pos = getAbsolutePosition(rect);
    triggerIcon.style.left = `${pos.right + 5}px`;
    triggerIcon.style.top = `${pos.top}px`;

    // 添加点击事件
    triggerIcon.addEventListener('click', handleTranslateClick);
    // 阻止冒泡，避免触发 mousedown 关闭逻辑
    triggerIcon.addEventListener('mousedown', (e) => e.stopPropagation());

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
    const textToTranslate = selectedText;
    removeTriggerIcon();
    showLoading();

    // 发送翻译请求到 background service worker
    chrome.runtime.sendMessage(
      { action: 'translate', text: textToTranslate },
      (response) => {
        // 处理 chrome.runtime.lastError
        if (chrome.runtime.lastError) {
          showError(chrome.runtime.lastError.message || '通信失败');
          return;
        }
        if (response && response.success) {
          showResult(response.translation);
        } else {
          showError(response ? response.error : '翻译请求失败');
        }
      }
    );
  }

  // 计算结果窗口位置（相对于选择区域）
  function calculateWindowPosition() {
    const rect = selectionRange.getBoundingClientRect();
    const pos = getAbsolutePosition(rect);
    return { left: pos.left, top: pos.bottom + 10 };
  }

  // 创建结果窗口的基础结构
  function createResultWindow() {
    removeResultWindow();

    resultWindow = document.createElement('div');
    resultWindow.className = 'translator-result-window';

    // 添加关闭按钮事件
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.textContent = '\u00d7'; // × 符号，避免 innerHTML 安全问题
    closeBtn.addEventListener('click', removeResultWindow);
    // 阻止冒泡
    resultWindow.addEventListener('mousedown', (e) => e.stopPropagation());
    resultWindow.appendChild(closeBtn);

    // 定位窗口
    const pos = calculateWindowPosition();
    resultWindow.style.left = `${pos.left}px`;
    resultWindow.style.top = `${pos.top}px`;

    document.body.appendChild(resultWindow);

    return resultWindow;
  }

  // 显示加载状态
  function showLoading() {
    const window = createResultWindow();

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'translator-loading';

    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    loadingDiv.appendChild(spinner);

    const loadingText = document.createElement('div');
    loadingText.className = 'loading-text';
    loadingText.textContent = '翻译中...';
    loadingDiv.appendChild(loadingText);

    window.appendChild(loadingDiv);
  }

  // 显示翻译结果
  function showResult(translation) {
    const window = createResultWindow();

    const contentDiv = document.createElement('div');
    contentDiv.className = 'translation-content';

    const textDiv = document.createElement('div');
    textDiv.className = 'translation-text';
    textDiv.textContent = translation; // 使用 textContent 防止 XSS
    contentDiv.appendChild(textDiv);

    window.appendChild(contentDiv);

    // 延迟一帧后检查是否超出视口并调整位置
    requestAnimationFrame(() => {
      adjustWindowPosition(window);
    });
  }

  // 显示错误信息
  function showError(error) {
    const window = createResultWindow();

    const errorDiv = document.createElement('div');
    errorDiv.className = 'translator-error';

    const errorIcon = document.createElement('div');
    errorIcon.className = 'error-icon';
    errorIcon.textContent = '⚠️';
    errorDiv.appendChild(errorIcon);

    const errorText = document.createElement('div');
    errorText.className = 'error-text';
    errorText.textContent = error; // 使用 textContent 防止 XSS
    errorDiv.appendChild(errorText);

    window.appendChild(errorDiv);
  }

  // 调整窗口位置，确保不超出视口
  function adjustWindowPosition(windowEl) {
    if (!windowEl) return;

    const rect = windowEl.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    let left = parseFloat(windowEl.style.left) || 0;
    let top = parseFloat(windowEl.style.top) || 0;

    const clamped = clampToViewport(left, top, width, height);
    windowEl.style.left = `${clamped.left}px`;
    windowEl.style.top = `${clamped.top}px`;
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
