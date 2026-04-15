# 開發者指南

## 環境設置

### 1. 安裝依賴

```bash
npm install
```

### 2. 配置環境變數

複製範例檔案：
```bash
cp .env.example .env
```

編輯 `.env` 填入實際值：
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-actual-key-here
```

**重要：** 永不提交 `.env` 到版本控制！

### 3. 啟動開發伺服器

```bash
npm run dev
```

然後在瀏覽器開啟 `http://localhost:8080`

## 程式碼規範

### JavaScript 編碼標準

1. **使用 const/let，不用 var**
   ```javascript
   // ✅ 正確
   const vendor = 'ABC公司';
   let total = 0;
   
   // ❌ 錯誤
   var vendor = 'ABC公司';
   ```

2. **使用安全的渲染函式**
   ```javascript
   // ✅ 正確 - 使用 escapeHtml
   const { escapeHtml } = window.securityUtils;
   element.innerHTML = `<div>${escapeHtml(userInput)}</div>`;
   
   // ❌ 錯誤 - 直接渲染使用者輸入
   element.innerHTML = `<div>${userInput}</div>`;
   ```

3. **使用 UUID 而非 Date.now()**
   ```javascript
   // ✅ 正確
   const id = window.securityUtils.generateId();
   
   // ❌ 錯誤
   const id = Date.now().toString();
   ```

4. **驗證與清理資料**
   ```javascript
   // ✅ 正確 - 使用驗證模組
   const sanitized = window.OrderValidation.sanitizeOrder(rawOrder);
   const errors = window.OrderValidation.validateOrder(sanitized);
   if (errors.length > 0) {
     // 處理錯誤
   }
   
   // ❌ 錯誤 - 直接使用未驗證資料
   await persist(rawOrder, 'insert');
   ```

### 檔案組織

- **一個檔案專注一個功能模組**
- **共用函式放在 utils.js 或 security.js**
- **新增功能時考慮是否需要拆分模組**

## 測試

### 目前狀態
尚未實作自動化測試。

### 計劃
1. 單元測試（計算邏輯、驗證函式）
2. 整合測試（Supabase 連線）
3. E2E 測試（關鍵流程）

### 手動測試檢查清單
在提交前請確認：
- [ ] 新增訂單功能正常
- [ ] 編輯訂單功能正常
- [ ] 刪除訂單功能正常
- [ ] 付款標記功能正常
- [ ] 月底結算報表正確
- [ ] 廠商彙總正確
- [ ] 價格查詢正常
- [ ] 貨到付款查帳正常
- [ ] 離線模式（Supabase 斷線）正常降級

## Git 工作流

### 分支策略
- `main` - 生產環境
- `develop` - 開發環境
- `feature/*` - 功能分支
- `hotfix/*` - 緊急修復

### Commit 訊息格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

類型（type）：
- `feat`: 新功能
- `fix`: 錯誤修復
- `docs`: 文檔
- `style`: 格式（不影響程式碼運作）
- `refactor`: 重構
- `test`: 測試
- `chore`: 建置或工具

範例：
```
feat(orders): add bulk payment marking

Allow users to mark multiple orders as paid at once
in the monthly view.

Closes #123
```

## 常見問題

### Q: 如何新增一個欄位到訂單？

A: 需要修改以下位置：
1. `js/supabase.js` - 資料庫 schema 映射
2. `js/validation.js` - 驗證邏輯
3. `js/order-form.js` - 表單欄位
4. `js/orders.js` - 顯示邏輯
5. Supabase - 資料表結構

### Q: 如何優化大量資料的效能？

A: 考慮：
1. 實作虛擬滾動（virtual scrolling）
2. 分頁載入
3. Debounce 搜尋
4. 資料快取策略

### Q: XSS 防護怎麼做？

A: 
1. 永遠使用 `window.securityUtils.escapeHtml()` 處理使用者輸入
2. 避免直接使用 `innerHTML`，改用 `textContent`
3. 使用 `js/safe-render.js` 的輔助函式
4. 啟用 Content Security Policy

## 部署前檢查清單

- [ ] 已啟用 Supabase RLS
- [ ] 已移除或加密硬編碼密碼
- [ ] 已測試所有關鍵功能
- [ ] 已執行 `npm run validate`
- [ ] 已更新版本號
- [ ] 已更新 CHANGELOG
- [ ] 環境變數已正確設置
- [ ] 已備份生產資料庫

## 資源連結

- [Supabase 文檔](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [OWASP XSS 防護](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)

## 聯繫方式

如有問題，請：
1. 查看現有 Issues
2. 開啟新 Issue
3. 聯繫維護團隊
