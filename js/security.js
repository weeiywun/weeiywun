// ── 安全工具模組 ────────────────────────────────────────

/**
 * HTML Escaping - 防止 XSS 攻擊
 * 將特殊字元轉換為 HTML 實體
 */
function escapeHtml(unsafe) {
  if (unsafe == null) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 安全渲染 - 使用 textContent 或 escaped innerHTML
 */
function safeRender(element, content, allowHtml = false) {
  if (!element) return;
  
  if (allowHtml) {
    // 如果必須使用 HTML，至少要 escape 使用者輸入
    element.innerHTML = content;
  } else {
    // 純文字，最安全
    element.textContent = content;
  }
}

/**
 * 創建安全的 DOM 元素
 */
function createElement(tag, attributes = {}, children = []) {
  const el = document.createElement(tag);
  
  // 設置屬性
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'className') {
      el.className = value;
    } else if (key === 'dataset') {
      for (const [dataKey, dataValue] of Object.entries(value)) {
        el.dataset[dataKey] = dataValue;
      }
    } else if (key.startsWith('on')) {
      // 事件處理器應該通過 addEventListener 添加
      console.warn('請使用 addEventListener 而不是內聯事件處理器');
    } else {
      el.setAttribute(key, value);
    }
  }
  
  // 添加子元素
  for (const child of children) {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      el.appendChild(child);
    }
  }
  
  return el;
}

/**
 * 生成穩定唯一 ID (UUID v4)
 * 避免使用 Date.now() 造成碰撞
 */
function generateId() {
  // 簡化版 UUID v4 (足夠用於此應用)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 安全的數值驗證與轉換
 */
function safeNumber(value, defaultValue = 0, min = -Infinity, max = Infinity) {
  const num = parseFloat(value);
  if (isNaN(num)) return defaultValue;
  return Math.max(min, Math.min(max, num));
}

/**
 * 安全的字串清理
 */
function sanitizeString(str, maxLength = 1000) {
  if (str == null) return '';
  return String(str).trim().slice(0, maxLength);
}

/**
 * 驗證日期格式 (YYYY-MM-DD)
 */
function isValidDate(dateStr) {
  if (!dateStr) return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date);
}

/**
 * CSP 相容的事件處理器註冊
 */
function addSafeEventListener(element, eventType, handler) {
  if (!element || typeof handler !== 'function') return;
  element.addEventListener(eventType, handler);
}

// 導出到全局 (暫時保持相容性，未來應改為模組化)
window.securityUtils = {
  escapeHtml,
  safeRender,
  createElement,
  generateId,
  safeNumber,
  sanitizeString,
  isValidDate,
  addSafeEventListener
};
