# Supabase 廠商分類同步設定

若要讓不同裝置看到相同的廠商分類，請在 Supabase Dashboard 的 SQL Editor 執行以下 SQL。

這只會新增 `vendor_categories` 資料表，不會修改 `orders` 或 `order_items`，也不會更動任何帳務金額、付款狀態或品項。

```sql
CREATE TABLE IF NOT EXISTS vendor_categories (
  vendor text PRIMARY KEY,
  category text NOT NULL CHECK (category IN ('中藥材', '包裝材', '其他', '物流', '大樓修繕')),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE vendor_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read vendor categories"
ON vendor_categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated insert vendor categories"
ON vendor_categories FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update vendor categories"
ON vendor_categories FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated delete vendor categories"
ON vendor_categories FOR DELETE
TO authenticated
USING (true);
```

## 操作方式

1. 建立表格後，重新整理系統頁面。
2. 在「廠商彙總」選廠商，使用底部「分類」下拉選單移動分類。
3. 在另一台裝置重新整理頁面，即可看到同一套分類。

## 回復預設分類

若把廠商移回原本程式預設分類，系統會刪除該廠商在 `vendor_categories` 的覆寫記錄，回到預設分類。
