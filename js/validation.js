// ── 資料驗證模組 ────────────────────────────────────────

/**
 * 訂單驗證規則
 */
const OrderValidation = {
  // 驗證完整訂單
  validateOrder(order) {
    const errors = [];
    
    if (!order.date || !window.securityUtils.isValidDate(order.date)) {
      errors.push('日期格式錯誤');
    }
    
    if (!order.vendor || order.vendor.trim().length === 0) {
      errors.push('廠商名稱不可為空');
    }
    
    if (!Array.isArray(order.items) || order.items.length === 0) {
      errors.push('至少需要一個商品項目');
    } else {
      order.items.forEach((item, idx) => {
        const itemErrors = this.validateItem(item);
        itemErrors.forEach(err => errors.push(`品項 ${idx + 1}: ${err}`));
      });
    }
    
    if (typeof order.total !== 'number' || order.total < 0) {
      errors.push('訂單總金額錯誤');
    }
    
    return errors;
  },
  
  // 驗證單個品項
  validateItem(item) {
    const errors = [];
    
    if (!item.name || item.name.trim().length === 0) {
      errors.push('商品名稱不可為空');
    }
    
    if (typeof item.qty !== 'number' || isNaN(item.qty)) {
      errors.push('數量必須是數字');
    }
    
    if (typeof item.price !== 'number' || isNaN(item.price) || item.price < 0) {
      errors.push('單價必須是非負數字');
    }
    
    return errors;
  },
  
  // 計算訂單總額（標準化計算邏輯）
  calculateTotal(items) {
    if (!Array.isArray(items)) return 0;
    
    return Math.round(
      items.reduce((sum, item) => {
        const qty = window.securityUtils.safeNumber(item.qty, 0);
        const price = window.securityUtils.safeNumber(item.price, 0);
        return sum + (qty * price);
      }, 0)
    );
  },
  
  // 清理訂單資料
  sanitizeOrder(order) {
    const utils = window.securityUtils;
    
    return {
      id: order.id || utils.generateId(),
      date: utils.sanitizeString(order.date, 10),
      orderId: utils.sanitizeString(order.orderId, 100),
      vendor: utils.sanitizeString(order.vendor, 200),
      items: Array.isArray(order.items) ? order.items.map(this.sanitizeItem) : [],
      total: utils.safeNumber(order.total, 0, 0),
      status: ['paid', 'pending'].includes(order.status) ? order.status : 'pending',
      paidDate: utils.sanitizeString(order.paidDate, 10),
      payMethod: utils.sanitizeString(order.payMethod, 50),
      payNote: utils.sanitizeString(order.payNote, 500),
      note: utils.sanitizeString(order.note, 1000),
      type: utils.sanitizeString(order.type, 50),
      refundOf: utils.sanitizeString(order.refundOf, 50)
    };
  },
  
  // 清理品項資料
  sanitizeItem(item) {
    const utils = window.securityUtils;
    
    return {
      name: utils.sanitizeString(item.name, 200),
      qty: utils.safeNumber(item.qty, 0, -9999, 99999),
      price: utils.safeNumber(item.price, 0, 0, 9999999),
      unit: utils.sanitizeString(item.unit || '斤', 10)
    };
  }
};

// 導出到全局
window.OrderValidation = OrderValidation;
