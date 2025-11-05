# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案概述

LINE 客戶訊息收集系統 - 透過 LINE Message API 收集客戶訊息（文字、圖片、檔案），並儲存至 Supabase 資料庫的 Webhook 服務。

**專案類型**: Node.js + Express + Supabase
**部署平台**: Render.com
**主要目的**: 小型測試環境，具備訊息量限制功能

## 系統架構

```
LINE Bot ↔ Webhook Server (Node.js + Express) ↔ Supabase Database
                     ↓
            HTML查詢介面 ← Supabase API
```

## 專案結構

```
line-message-collector/
├── app.js                 # 主應用程式入口
├── config/                # 設定檔
├── controllers/           # 控制器邏輯
├── routes/                # API 路由
├── services/              # 業務邏輯服務
├── migrations/            # 資料庫遷移
├── public/                # 靜態檔案（HTML查詢介面）
├── temp/                  # 暫存檔案
└── test_*.js             # 測試檔案
```

## 常用開發命令

### 安裝依賴
```bash
npm install
```

### 本地開發
```bash
# 使用 nodemon 自動重啟
npm run dev

# 或直接執行
npm start
```

### 測試
```bash
# 測試 API
node test_api.js

# 測試群組邏輯
node test_group_logic.js

# 測試用戶資料
node test_users.js

# 測試 LINE Profile API
node test_profile_api.js
node test_profile_integration.js
node test_profile_standalone.js
```

## 環境變數設定

專案需要 `.env` 檔案（**不要提交到 Git**）：

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
```

## 核心功能

1. **訊息接收處理**
   - 文字訊息收集與儲存
   - 圖片檔案接收與儲存
   - 其他檔案類型（PDF、Word等）接收與儲存

2. **限制機制**
   - 總訊息數量限制：1000則
   - 指定用戶數量限制：100位客戶
   - 超限自動停止收集

3. **查詢介面**
   - HTML網頁查詢系統
   - 訊息內容展示
   - 檔案下載功能

## 主要依賴套件

- `@line/bot-sdk` - LINE 官方 SDK
- `@supabase/supabase-js` - Supabase 官方客戶端
- `express` - Web 應用框架
- `dotenv` - 環境變數管理
- `cors` - CORS 支援
- `multer` - 檔案上傳處理
- `axios` - HTTP 請求
- `exceljs`, `csv-writer` - 資料匯出
- `pdfkit` - PDF 生成

## 部署流程

### Git 設定
```bash
cd D:/linemessagetest/line-message-collector
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/你的用戶名/line-message-collector.git
git push -u origin main
```

### Render 部署
1. 連接 GitHub repository
2. 設定環境變數（同 .env 內容）
3. Build Command: `npm install`
4. Start Command: `npm start`
5. 獲取 Webhook URL: `https://你的服務.onrender.com/webhook`
6. 在 LINE Developer Console 更新 Webhook URL

## 重要文件說明

- `SETUP.md` - Git 和部署準備指令
- `DEPLOY.md` - 詳細部署說明
- `DATABASE_UPDATE.md` - 資料庫更新指引
- `RESET_DATA_GUIDE.md` - 資料重置指南
- `GROUP_NAME_COMPLETENESS_REPORT.md` - 群組名稱完整性報告
- `LINE_CONTACT_NAME_SOLUTION.md` - LINE 聯絡人名稱解決方案
- `LINE_PROFILE_API_ANALYSIS.md` - LINE Profile API 分析

## 開發注意事項

### 安全性
- **絕對不要**將 `.env` 檔案提交到 Git
- 所有敏感資料都要透過環境變數設定
- 使用 `.gitignore` 排除敏感檔案

### 部署限制
- Render 免費方案會在 15 分鐘無活動後休眠
- 第一次請求可能需要等待服務喚醒（約 30-60 秒）

### 程式碼風格
- 使用 ES6+ 語法
- async/await 處理異步操作
- 適當的錯誤處理和日誌記錄

## 除錯技巧

1. **檢查服務狀態**
   - 查看 Render 部署日誌
   - 確認環境變數設定正確

2. **本地測試**
   - 使用測試腳本驗證功能
   - 檢查 Supabase 連線狀態

3. **Webhook 測試**
   - 確認 LINE Webhook URL 設定正確
   - 檢查 Webhook 驗證是否通過
   - 使用 LINE Developer Console 的測試工具

## Webhook 端點

- `POST /webhook` - LINE 訊息接收端點
- `GET /` - 查詢介面（如果有實作）
