// ── 安全工具測試 ──────────────────────────────────────

const { TestRunner, assertEqual, assertTrue } = require('./test-framework');

// 模擬瀏覽器環境
global.window = {
  securityUtils: {}
};

// 載入被測試的模組（簡化版，實際應用需要更複雜的 mock）
function escapeHtml(unsafe) {
  if (unsafe == null) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function safeNumber(value, defaultValue = 0, min = -Infinity, max = Infinity) {
  const num = parseFloat(value);
  if (isNaN(num)) return defaultValue;
  return Math.max(min, Math.min(max, num));
}

function isValidDate(dateStr) {
  if (!dateStr) return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date);
}

// ── 測試套件 ──────────────────────────────────────────

const runner = new TestRunner();

// HTML Escaping 測試
runner.test('escapeHtml 應該轉義特殊字元', () => {
  assertEqual(escapeHtml('<script>alert("XSS")</script>'), 
              '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
});

runner.test('escapeHtml 應該處理空值', () => {
  assertEqual(escapeHtml(null), '');
  assertEqual(escapeHtml(undefined), '');
});

runner.test('escapeHtml 應該保留一般文字', () => {
  assertEqual(escapeHtml('正常文字'), '正常文字');
});

// UUID 生成測試
runner.test('generateId 應該生成有效的 UUID', () => {
  const id = generateId();
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  assertTrue(uuidPattern.test(id), `生成的 ID ${id} 不符合 UUID 格式`);
});

runner.test('generateId 應該生成不重複的 ID', () => {
  const id1 = generateId();
  const id2 = generateId();
  assertTrue(id1 !== id2, '生成的 ID 應該不同');
});

// 數值驗證測試
runner.test('safeNumber 應該轉換有效數字', () => {
  assertEqual(safeNumber('123'), 123);
  assertEqual(safeNumber(456), 456);
});

runner.test('safeNumber 應該處理無效輸入', () => {
  assertEqual(safeNumber('abc', 0), 0);
  assertEqual(safeNumber(null, 10), 10);
});

runner.test('safeNumber 應該限制範圍', () => {
  assertEqual(safeNumber(150, 0, 0, 100), 100);
  assertEqual(safeNumber(-10, 0, 0, 100), 0);
});

// 日期驗證測試
runner.test('isValidDate 應該驗證正確日期', () => {
  assertTrue(isValidDate('2024-01-15'));
  assertTrue(isValidDate('2024-12-31'));
});

runner.test('isValidDate 應該拒絕錯誤格式', () => {
  assertTrue(!isValidDate('2024/01/15'));
  assertTrue(!isValidDate('15-01-2024'));
  assertTrue(!isValidDate('invalid'));
  assertTrue(!isValidDate(''));
});

// 執行測試
runner.run();
