# 清空資料和重新測試指南

## 1. 清空所有收集的資料

在 Supabase Dashboard > SQL Editor 中執行以下 SQL：

```sql
-- 1. 清空訊息資料（會自動清理相關檔案記錄）
DELETE FROM messages;

-- 2. 清空用戶資料
DELETE FROM users;

-- 3. 重置自動遞增 ID（可選）
ALTER SEQUENCE messages_id_seq RESTART WITH 1;
ALTER SEQUENCE users_id_seq RESTART WITH 1;

-- 4. 確認資料已清空
SELECT 'messages' as table_name, COUNT(*) as count FROM messages
UNION ALL
SELECT 'users' as table_name, COUNT(*) as count FROM users;
```

## 2. 清空 Supabase Storage Bucket

### 方法一：透過 Dashboard
1. 進入 Supabase Dashboard
2. 點擊左側選單的 "Storage"
3. 選擇 "line-files" bucket
4. 選擇所有檔案和資料夾
5. 點擊右上角的垃圾桶圖示刪除

### 方法二：透過 SQL（如果有很多檔案）
```sql
-- 注意：這個操作會完全清空 Storage
-- 請先確認你想要刪除所有檔案

-- 查看目前有多少檔案
SELECT count(*) FROM storage.objects WHERE bucket_id = 'line-files';

-- 刪除所有檔案（謹慎使用！）
DELETE FROM storage.objects WHERE bucket_id = 'line-files';
```

## 3. 確認群組顯示名稱欄位存在

```sql
-- 檢查 group_display_name 欄位是否存在
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'group_display_name';

-- 如果欄位不存在，請執行：
ALTER TABLE users ADD COLUMN group_display_name TEXT;
```

## 4. 重新測試步驟

1. 執行上述 SQL 清空資料
2. 清空 Storage bucket
3. 重新啟動應用程序或等待 Render 重新部署
4. 發送新的 LINE 訊息進行測試
5. 在用戶列表中手動設定群組顯示名稱
6. 測試各種匯出功能

## 5. 驗證清理結果

```sql
-- 確認所有資料都已清空
SELECT 
    'users' as table_name, 
    COUNT(*) as count,
    MAX(created_at) as last_created
FROM users
UNION ALL
SELECT 
    'messages' as table_name, 
    COUNT(*) as count,
    MAX(created_at) as last_created
FROM messages;

-- 檢查 Storage 檔案數量
SELECT 
    bucket_id,
    COUNT(*) as file_count,
    SUM(metadata->>'size')::bigint as total_size_bytes
FROM storage.objects 
WHERE bucket_id = 'line-files'
GROUP BY bucket_id;
```