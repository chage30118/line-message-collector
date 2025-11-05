# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

LINE 客戶訊息收集與 CRM 系統 - 透過 LINE Messaging API 接收並儲存客戶訊息（文字、圖片、檔案），支援自動收集用戶資料、群組名稱,並提供完整的查詢與匯出功能。

**技術棧**: Node.js + Express + Supabase (PostgreSQL)
**部署平台**: Render.com
**LINE SDK**: @line/bot-sdk v7.5.2

## 常用開發命令

```bash
# 安裝依賴
npm install

# 開發模式（使用 nodemon 自動重啟）
npm run dev

# 生產模式
npm start

# 測試（目前無測試框架，使用獨立測試檔案）
node test_api.js
node test_profile_api.js
```

## 核心架構

### 系統流程

```
LINE Bot → Webhook (/webhook) → LineHandler
                                      ↓
                    LimitService (檢查限制)
                                      ↓
                    GroupService (取得群組/用戶資料)
                                      ↓
                    UserService (建立/更新用戶)
                                      ↓
                    MessageService (儲存訊息)
                                      ↓
                    FileService (處理檔案)
                                      ↓
                    Supabase Database
```

### 關鍵架構設計

1. **訊息接收流程** (`controllers/lineHandler.js`)
   - 每個 webhook 事件依序處理（非並行）
   - 先檢查限制（用戶數、訊息數）
   - 透過 LINE API 獲取用戶 Profile 和群組資料
   - 建立或更新用戶記錄（含 `group_display_name`）
   - 儲存訊息和檔案

2. **群組名稱自動收集** (`services/groupService.js`)
   - 使用 `lineClient.getGroupSummary(groupId)` 獲取群組名稱
   - 使用 `lineClient.getProfile(userId)` 獲取用戶 LINE 顯示名稱
   - 群組名稱儲存在 `users` 表的 `group_display_name` 欄位
   - 支援一對一聊天、群組、多人聊天室(room)

3. **用戶資料管理** (`services/userService.js`)
   - `line_user_id`: LINE 用戶 ID（唯一識別）
   - `display_name`: LINE 顯示名稱（從 Profile API 獲取）
   - `customer_name`: 客戶姓名（管理員手動設定）
   - `group_display_name`: 群組名稱（自動收集）

4. **限制機制** (`services/limitService.js`)
   - 訊息總數限制：預設 1000 則（環境變數 `MAX_MESSAGES`）
   - 用戶數量限制：預設 100 位（環境變數 `MAX_USERS`）
   - 超限會拒絕新用戶和新訊息

5. **檔案處理** (`services/fileService.js`)
   - 支援類型：圖片、音訊、視訊、檔案
   - 從 LINE API 下載檔案內容
   - 上傳至 Supabase Storage (`line-message-files` bucket)
   - 檔案資訊儲存在 `messages` 表

### 資料庫架構 (Supabase)

**主要資料表**:
- `users`: 用戶資料（包含 `line_user_id`, `display_name`, `customer_name`, `group_display_name`）
- `messages`: 訊息記錄（包含 `text_content`, `file_id`, `file_name` 等）
- Storage bucket `line-message-files`: 檔案儲存

### API 端點結構

```
POST   /webhook                    # LINE Webhook 接收端點
GET    /api/messages               # 查詢訊息列表
GET    /api/users                  # 查詢用戶列表
PUT    /api/users/:id              # 更新用戶資料
GET    /api/customers              # 客戶管理 API
GET    /api/export/csv             # 匯出 CSV
GET    /api/export/excel           # 匯出 Excel
GET    /api/export/json            # 匯出 JSON
GET    /api/export/pdf             # 匯出 PDF
GET    /api/export/zip             # 匯出 ZIP（含圖片）
GET    /health                     # 健康檢查（用於 Render.com）
```

## 環境變數設定

必要的環境變數（`.env` 檔案，**不可提交到 Git**）:

```env
# LINE Bot 設定
LINE_CHANNEL_ACCESS_TOKEN=你的ACCESS_TOKEN
LINE_CHANNEL_SECRET=你的CHANNEL_SECRET

# Supabase 設定
SUPABASE_URL=你的SUPABASE_URL
SUPABASE_ANON_KEY=你的SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY=你的SUPABASE_SERVICE_KEY

# 系統限制
MAX_MESSAGES=1000
MAX_USERS=100

# 環境
NODE_ENV=development
PORT=3000
```

## 重要文件指引

專案有完整的文件體系，位於 `/docs` 資料夾：

- **`docs/00-文件索引.md`**: 所有文件的導覽
- **`docs/01-產品需求文件(PRD).md`**: 完整的產品功能規格（~200頁）
- **`docs/02-專案重構計劃.md`**: Vue3 + Supabase 重構計劃（~150頁）
- **`docs/06-專案說明(給Claude的指引).md`**: 原有的開發指南

## 開發注意事項

### 程式碼風格
- 使用 ES6+ 語法（`const`、`async/await`、解構賦值）
- 所有 Service 使用 `class` 和 `static` 方法
- 錯誤處理使用 `try/catch`，並記錄 `console.log`/`console.error`
- 使用繁體中文註解和日誌訊息

### LINE API 使用限制
- `lineClient.getProfile(userId)` 僅在用戶未封鎖機器人時有效
- `lineClient.getGroupSummary(groupId)` 需機器人在群組內才能調用
- **無法獲取「聯絡人姓名」**（LINE API 不提供此功能）
- 詳見 `docs/11-LINE聯絡人名稱解決方案.md`

### 安全性
- **絕對不可**將 `.env` 提交到 Git
- 所有敏感資料必須透過環境變數設定
- Supabase API Key 已在 `.gitignore` 中排除

### 部署相關
- Render.com 免費方案會在 15 分鐘無活動後休眠
- 使用 `/health` 端點進行健康檢查
- Webhook URL 格式: `https://你的服務.onrender.com/webhook`

## 專案結構說明

```
line-message-collector/
├── app.js                     # Express 應用入口
├── config/
│   └── supabase.js           # Supabase 客戶端設定
├── controllers/
│   ├── lineHandler.js        # LINE Webhook 事件處理邏輯
│   └── customerController.js # 客戶管理控制器
├── routes/
│   ├── webhook.js            # LINE Webhook 路由
│   ├── api.js                # 訊息和匯出 API
│   ├── users.js              # 用戶管理 API
│   └── customers.js          # 客戶管理 API
├── services/
│   ├── messageService.js     # 訊息處理業務邏輯
│   ├── userService.js        # 用戶管理業務邏輯
│   ├── groupService.js       # 群組資料和 LINE Profile API
│   ├── fileService.js        # 檔案上傳與下載
│   ├── limitService.js       # 限制檢查邏輯
│   └── exportService.js      # 資料匯出（CSV/Excel/JSON/PDF）
├── public/
│   ├── index.html            # 訊息查詢介面
│   ├── customer-management.html  # 客戶管理介面
│   └── script.js             # 前端 JavaScript
├── docs/                      # 📚 完整專案文件（13個文件，約550頁）
└── migrations/                # 資料庫遷移檔案
```

## 重構規劃 (v2.0)

專案規劃進行 Vue3 重構，詳見 `docs/02-專案重構計劃.md`：

**目標技術棧**:
- 前端：Vue 3 + Element Plus + TailwindCSS
- 後端：Supabase + Vercel Serverless Functions
- 部署：Vercel

**規劃功能**:
- 三欄式 CRM 介面（客戶列表 | 訊息歷史 | 客戶資訊）
- 客服在系統內發送訊息（雙向記錄）
- 快捷回覆和訊息模板
- 客戶標籤系統

## 測試方式

目前專案使用獨立測試腳本（無測試框架）：

```bash
# 測試 API 端點
node test_api.js

# 測試 LINE Profile API
node test_profile_api.js
node test_profile_integration.js

# 測試群組邏輯
node test_group_logic.js

# 測試用戶資料
node test_users.js
```

## 除錯技巧

1. **Webhook 無法接收訊息**
   - 檢查 LINE Developer Console 的 Webhook URL 設定
   - 確認 Webhook 驗證已通過
   - 查看 Render.com 部署日誌

2. **無法獲取用戶資料**
   - 確認用戶未封鎖機器人
   - 檢查 `LINE_CHANNEL_ACCESS_TOKEN` 是否正確
   - 查看 `groupService.js` 的日誌輸出

3. **檔案上傳失敗**
   - 確認 Supabase Storage bucket `line-message-files` 存在
   - 檢查 `SUPABASE_SERVICE_KEY` 權限設定
   - 查看 `fileService.js` 的錯誤訊息

## Git 工作流程

```bash
# 查看狀態
git status

# 提交變更
git add .
git commit -m "描述變更內容"

# 推送到遠端
git push origin main
```

詳細 Git 設定請參考 `docs/08-Git設定指南.md`。

## 相關連結

- [LINE Developers](https://developers.line.biz/)
- [LINE Messaging API Reference](https://developers.line.biz/en/reference/messaging-api/)
- [Supabase 文件](https://supabase.com/docs)
- [Render 文件](https://render.com/docs)

---

**最後更新**: 2025-11-05
**專案版本**: v1.0
