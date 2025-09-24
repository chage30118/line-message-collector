-- 添加群組顯示名稱欄位
ALTER TABLE users ADD COLUMN group_display_name TEXT;

-- 添加註釋
COMMENT ON COLUMN users.group_display_name IS '用戶在群組中的顯示名稱或暱稱';