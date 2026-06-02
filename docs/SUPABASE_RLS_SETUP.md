# Supabase Row Level Security (RLS) 策略設定指南

## 重要性
目前系統在前端直接暴露 Supabase ANON KEY，**必須**啟用 RLS 保護資料安全。

## 必要策略

### 1. Orders 表格

```sql
-- 啟用 RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 策略 1: 所有已認證用戶可讀取
CREATE POLICY "Allow authenticated read"
ON orders FOR SELECT
TO authenticated
USING (true);

-- 策略 2: 所有已認證用戶可新增
CREATE POLICY "Allow authenticated insert"
ON orders FOR INSERT
TO authenticated
WITH CHECK (true);

-- 策略 3: 所有已認證用戶可更新
CREATE POLICY "Allow authenticated update"
ON orders FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 策略 4: 所有已認證用戶可刪除
CREATE POLICY "Allow authenticated delete"
ON orders FOR DELETE
TO authenticated
USING (true);
```

### 2. Order Items 表格

```sql
-- 啟用 RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 策略 1: 所有已認證用戶可讀取
CREATE POLICY "Allow authenticated read"
ON order_items FOR SELECT
TO authenticated
USING (true);

-- 策略 2: 所有已認證用戶可新增
CREATE POLICY "Allow authenticated insert"
ON order_items FOR INSERT
TO authenticated
WITH CHECK (true);

-- 策略 3: 所有已認證用戶可更新
CREATE POLICY "Allow authenticated update"
ON order_items FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 策略 4: 所有已認證用戶可刪除
CREATE POLICY "Allow authenticated delete"
ON order_items FOR DELETE
TO authenticated
USING (true);
```

### 3. COD Records 表格

```sql
-- 啟用 RLS
ALTER TABLE cod_records ENABLE ROW LEVEL SECURITY;

-- 策略 1: 所有已認證用戶可讀取
CREATE POLICY "Allow authenticated read"
ON cod_records FOR SELECT
TO authenticated
USING (true);

-- 策略 2: 所有已認證用戶可新增
CREATE POLICY "Allow authenticated insert"
ON cod_records FOR INSERT
TO authenticated
WITH CHECK (true);

-- 策略 3: 所有已認證用戶可更新
CREATE POLICY "Allow authenticated update"
ON cod_records FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 策略 4: 所有已認證用戶可刪除
CREATE POLICY "Allow authenticated delete"
ON cod_records FOR DELETE
TO authenticated
USING (true);
```

### 4. Vendor Categories 表格

用於同步不同裝置的廠商分類設定。建立表格的完整 SQL 請參考 `docs/SUPABASE_VENDOR_CATEGORIES.md`。

```sql
-- 啟用 RLS
ALTER TABLE vendor_categories ENABLE ROW LEVEL SECURITY;

-- 策略 1: 所有已認證用戶可讀取
CREATE POLICY "Allow authenticated read vendor categories"
ON vendor_categories FOR SELECT
TO authenticated
USING (true);

-- 策略 2: 所有已認證用戶可新增
CREATE POLICY "Allow authenticated insert vendor categories"
ON vendor_categories FOR INSERT
TO authenticated
WITH CHECK (true);

-- 策略 3: 所有已認證用戶可更新
CREATE POLICY "Allow authenticated update vendor categories"
ON vendor_categories FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 策略 4: 所有已認證用戶可刪除
CREATE POLICY "Allow authenticated delete vendor categories"
ON vendor_categories FOR DELETE
TO authenticated
USING (true);
```

## 進階安全建議

### 選項 A: 使用 Supabase Auth（推薦）
```javascript
// 替換前端密碼驗證為 Supabase Auth
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: userPassword
});
```

### 選項 B: 更嚴格的 RLS（依角色區分權限）
```sql
-- 建立自訂函式檢查使用者角色
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text AS $$
  SELECT role FROM user_roles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- 限制刪除權限僅給管理員
CREATE POLICY "Only admin can delete"
ON orders FOR DELETE
TO authenticated
USING (get_user_role(auth.uid()) = 'admin');
```

## 驗證 RLS 是否生效

### 測試方法：
1. 在 Supabase Dashboard > Table Editor 確認已啟用 RLS
2. 使用匿名請求測試（應該被拒絕）：
```javascript
const { data, error } = await supabase
  .from('orders')
  .select('*')
  
// 如果未登入，應該返回空或錯誤
console.log(error); // 應顯示 RLS policy violation
```

## 當前系統改進建議

### 短期（緊急）
- ✅ 立即在 Supabase 啟用上述 RLS 策略
- ⚠️ 添加後端 API 驗證密碼（移除前端硬編碼）
- ⚠️ 使用環境變數管理 Supabase 金鑰

### 長期（架構改善）
- 🔄 遷移到 Supabase Auth
- 🔄 實作角色權限管理（RBAC）
- 🔄 API 請求限流（Rate Limiting）
- 🔄 稽核日誌（Audit Trail）

## 部署檢查清單
- [ ] Supabase RLS 已啟用所有表格
- [ ] 測試未登入情況下無法存取資料
- [ ] 測試已登入情況下可正常操作
- [ ] 移除或加密前端密碼
- [ ] 定期輪換 API 金鑰
