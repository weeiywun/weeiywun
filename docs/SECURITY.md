# 安全性改進須知

## ⚠️ 當前安全風險

### 高風險項目
1. **硬編碼密碼** (`js/auth.js`)
   - 密碼直接寫在前端程式碼中
   - 任何人都可以查看原始碼取得密碼
   
2. **缺少後端驗證**
   - 僅依賴 localStorage 判斷登入狀態
   - 可輕易繞過前端驗證
   
3. **XSS 攻擊風險**
   - 多處使用 `innerHTML` 直接渲染使用者輸入
   - 惡意輸入可執行任意 JavaScript
   
4. **Supabase 金鑰暴露**
   - ANON KEY 直接寫在前端
   - 必須搭配 RLS 保護資料

## ✅ 已實施的改進

### 1. 安全工具模組 (`js/security.js`)
- HTML escaping 防止 XSS
- 安全的 DOM 操作
- UUID ID 生成器
- 輸入驗證與清理

### 2. 資料驗證 (`js/validation.js`)
- 集中式驗證邏輯
- 訂單資料清理
- 統一計算規則

### 3. 環境變數範本 (`.env.example`)
- 配置管理指南
- 安全最佳實踐

### 4. RLS 策略文檔 (`docs/SUPABASE_RLS_SETUP.md`)
- Supabase 安全設置指南
- 必要的資料庫策略

## 🔧 下一步改進建議

### 緊急（本週內）
1. **啟用 Supabase RLS**
   - 依照 `docs/SUPABASE_RLS_SETUP.md` 設置
   - 測試確認策略生效

2. **實作後端 API 身份驗證**
   ```
   前端 → 後端 API → 驗證密碼 → 返回 JWT Token
   前端存 Token → 每次請求帶上 Token → 後端驗證
   ```

3. **移除硬編碼密碼**
   - 刪除 `js/auth.js` 中的 PWD 常數
   - 改為呼叫後端 API

### 短期（本月內）
1. **全面替換 innerHTML**
   - 使用 `security.js` 的安全函式
   - 逐步重構所有渲染邏輯

2. **加入 Content Security Policy (CSP)**
   ```html
   <meta http-equiv="Content-Security-Policy" 
         content="default-src 'self'; script-src 'self' https://cdn.tailwindcss.com">
   ```

3. **實作請求限流**
   - 防止暴力破解
   - API 呼叫次數限制

### 長期（本季內）
1. **遷移到 Supabase Auth**
   - 專業的身份驗證系統
   - 支援 MFA、社交登入

2. **角色權限管理**
   - 區分管理員/員工/訪客
   - 細緻的權限控制

3. **安全稽核**
   - 定期檢視程式碼
   - 第三方安全掃描

## 📚 參考資源

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Auth 文檔](https://supabase.com/docs/guides/auth)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [XSS 防護指南](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
