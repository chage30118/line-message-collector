# 資料庫更新指南

## 添加群組顯示名稱欄位

請在 Supabase Dashboard 中執行以下 SQL：

```sql
-- 添加群組顯示名稱欄位
ALTER TABLE users ADD COLUMN group_display_name TEXT;

-- 添加註釋
COMMENT ON COLUMN users.group_display_name IS '用戶在群組中的顯示名稱或暱稱';
```

## 更新步驟

1. 登入 Supabase Dashboard
2. 進入你的專案
3. 點擊左側選單的 "SQL Editor"
4. 貼上上面的 SQL 代碼
5. 點擊 "Run" 執行

## 驗證更新

執行以下查詢來驗證欄位已成功添加：

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'group_display_name';
```

應該會看到類似這樣的結果：
```
column_name         | data_type | is_nullable
group_display_name  | text      | YES
```