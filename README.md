# 惟元門市 - 進貨帳務管理系統

[![程式碼品質檢查](https://github.com/weeiywun/weeiywun/actions/workflows/ci.yml/badge.svg)](https://github.com/weeiywun/weeiywun/actions/workflows/ci.yml)

一個用於管理中藥材與包裝材料進貨、付款、結算的全功能帳務系統。

## 🚀 功能特色

- ✅ 訂單管理（新增、編輯、刪除、查詢）
- ✅ 廠商彙總與分類
- ✅ 月底結算報表
- ✅ 歷史價格查詢
- ✅ 貨到付款查帳
- ✅ 退換貨記錄
- ✅ 資料雲端同步（Supabase）

## ⚠️ 重要安全提醒

**在部署到生產環境之前，請務必完成以下安全設置：**

1. **啟用 Supabase RLS（Row Level Security）**
   - 參閱：[docs/SUPABASE_RLS_SETUP.md](docs/SUPABASE_RLS_SETUP.md)
   - 這是最重要的安全措施！

2. **移除或加密硬編碼密碼**
   - 當前版本在 `js/auth.js` 中有硬編碼密碼
   - 建議實作後端 API 驗證或使用 Supabase Auth

3. **定期輪換 API 金鑰**
   - Supabase ANON KEY 暴露在前端
   - 需搭配 RLS 保護資料安全

完整安全指南：[docs/SECURITY.md](docs/SECURITY.md)

## 🛠️ 快速開始

### 前置需求

- 瀏覽器（Chrome、Firefox、Safari、Edge）
- Supabase 帳號（用於資料儲存）
- （開發用）Node.js 16+ 與 npm

### 本地開發

```bash
# 1. 克隆專案
git clone https://github.com/weeiywun/weeiywun.git
cd weeiywun

# 2. 安裝開發依賴（選用）
npm install

# 3. 設置環境變數
cp .env.example .env
# 編輯 .env 填入 Supabase URL 與 ANON KEY

# 4. 啟動開發伺服器
npm run dev
# 或直接開啟 index.html
```

### 資料庫設置

1. 在 Supabase 建立專案
2. 執行 SQL schema（參見 `docs/SUPABASE_RLS_SETUP.md`）
3. 啟用 RLS 策略
4. 更新 `js/supabase.js` 中的連線資訊

## 📁 專案結構

```
weeiywun/
├── index.html              # 主頁面
├── style.css               # 樣式
├── js/
│   ├── security.js         # 🔒 安全工具（XSS 防護、UUID）
│   ├── validation.js       # ✅ 資料驗證
│   ├── safe-render.js      # 🖼️ 安全渲染輔助
│   ├── auth.js             # 🔐 身份驗證
│   ├── supabase.js         # 💾 資料庫連接
│   ├── orders.js           # 📋 訂單管理
│   ├── order-form.js       # 📝 訂單表單
│   ├── monthly.js          # 📊 月底結算
│   ├── vendors.js          # 🏢 廠商彙總
│   ├── price.js            # 💰 價格查詢
│   ├── cod.js              # 📦 貨到付款
│   └── ...
├── docs/
│   ├── SECURITY.md         # 安全性指南
│   └── SUPABASE_RLS_SETUP.md # RLS 設置
└── .github/
    └── workflows/
        └── ci.yml          # CI/CD 設定
```

## 🧪 開發工具

```bash
# 程式碼檢查
npm run lint

# 格式化
npm run format

# 執行測試（尚未實作）
npm test

# 驗證（lint + test）
npm run validate
```

## 📝 版本歷史

### v4.7.0 - 安全性與架構優化（當前版本）
- ✅ 新增安全模組（XSS 防護、UUID ID）
- ✅ 新增資料驗證模組
- ✅ 建立開發工具鏈（ESLint、Prettier、CI）
- ✅ 創建安全文檔與部署指南
- ⚠️ 添加安全警告註解

### v4.6.0 - 功能穩定版
- 基本訂單管理功能
- Supabase 整合
- 貨到付款查帳

## 🤝 貢獻指南

1. Fork 此專案
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

## 📄 授權

此專案為私有專案，未授權公開使用。

## 🆘 支援與問題回報

如有問題請開啟 Issue 或聯繫維護團隊。

---

**重要提醒：** 此系統包含敏感的商業資料，請勿將資料庫金鑰或密碼提交到版本控制系統。

