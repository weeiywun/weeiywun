// ── 資料驗證測試 ──────────────────────────────────────

const { TestRunner, assertEqual, assertDeepEqual, assertTrue } = require('./test-framework');

// 模擬 securityUtils
global.window = {
  securityUtils: {
    safeNumber: (value, defaultValue = 0, min = -Infinity, max = Infinity) => {
      const num = parseFloat(value);
      if (isNaN(num)) return defaultValue;
      return Math.max(min, Math.min(max, num));
    },
    sanitizeString: (str, maxLength = 1000) => {
      if (str == null) return '';
      return String(str).trim().slice(0, maxLength);
    },
    isValidDate: (dateStr) => {
      if (!dateStr) return false;
      const regex = /^\d{4}-\d{2}-\d{2}$/;
      return regex.test(dateStr);
    },
    generateId: () => 'test-uuid-123'
  }
};

// 載入驗證邏輯（簡化版）
const OrderValidation = {
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
  }
};

// ── 測試套件 ──────────────────────────────────────────

const runner = new TestRunner();

// 總額計算測試
runner.test('calculateTotal 應該正確計算訂單總額', () => {
  const items = [
    { name: '商品A', qty: 2, price: 100 },
    { name: '商品B', qty: 3, price: 50 }
  ];
  assertEqual(OrderValidation.calculateTotal(items), 350);
});

runner.test('calculateTotal 應該四捨五入', () => {
  const items = [
    { name: '商品A', qty: 1.5, price: 100.6 }
  ];
  assertEqual(OrderValidation.calculateTotal(items), 151); // 150.9 -> 151
});

runner.test('calculateTotal 應該處理空陣列', () => {
  assertEqual(OrderValidation.calculateTotal([]), 0);
  assertEqual(OrderValidation.calculateTotal(null), 0);
});

runner.test('calculateTotal 應該處理負數（退貨）', () => {
  const items = [
    { name: '退貨', qty: -2, price: 100 }
  ];
  assertEqual(OrderValidation.calculateTotal(items), -200);
});

// 品項驗證測試
runner.test('validateItem 應該驗證有效品項', () => {
  const item = { name: '測試商品', qty: 1, price: 100 };
  const errors = OrderValidation.validateItem(item);
  assertEqual(errors.length, 0);
});

runner.test('validateItem 應該拒絕空名稱', () => {
  const item = { name: '', qty: 1, price: 100 };
  const errors = OrderValidation.validateItem(item);
  assertTrue(errors.length > 0);
  assertTrue(errors[0].includes('名稱'));
});

runner.test('validateItem 應該拒絕無效數量', () => {
  const item = { name: '商品', qty: 'abc', price: 100 };
  const errors = OrderValidation.validateItem(item);
  assertTrue(errors.some(e => e.includes('數量')));
});

runner.test('validateItem 應該拒絕負價格', () => {
  const item = { name: '商品', qty: 1, price: -100 };
  const errors = OrderValidation.validateItem(item);
  assertTrue(errors.some(e => e.includes('單價')));
});

// 執行測試
runner.run();
