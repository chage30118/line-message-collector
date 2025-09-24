# Git 和部署準備指令

## 1. 初始化 Git Repository
```bash
cd D:\linemessagetest\line-message-collector
git init
git add .
git commit -m "Initial commit: LINE Message Collector"
```

## 2. 創建 GitHub Repository
1. 前往 GitHub.com 並登入
2. 點擊右上角的 "+" 號，選擇 "New repository"
3. Repository 名稱：`line-message-collector`
4. Description: `LINE Message Collector - 客戶訊息收集系統`
5. 設為 **Public**（Render 免費方案需要 public repository）
6. **不要**勾選 "Add a README file"（我們已經有了）
7. **不要**勾選 ".gitignore" 和 "license"（我們已經有了）
8. 點擊 "Create repository"

## 3. 連接並推送到 GitHub
```bash
git remote add origin https://github.com/你的用戶名/line-message-collector.git
git branch -M main
git push -u origin main
```

## 4. 在 Render 創建新專案
1. 登入你的 Render Dashboard: https://dashboard.render.com
2. 點擊左上角的 "New +" 按鈕
3. 選擇 "Web Service"
4. 在 "Create a new Web Service" 頁面：
   - 點擊 "Connect a repository"
   - **如果是第一次**: 授權 Render 訪問你的 GitHub
   - **如果已連接**: 直接選擇 repository
5. 選擇你剛創建的 GitHub repository: `line-message-collector`
6. 設定服務詳細資訊：
   - **Name**: `line-message-collector` (可自定義，會成為URL的一部分)
   - **Environment**: `Node`
   - **Region**: `Oregon` (免費方案預設)
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

## 5. 設定環境變數
在 Render 的 Environment Variables 區段添加：

```
LINE_CHANNEL_ACCESS_TOKEN=你的ACCESS_TOKEN
LINE_CHANNEL_SECRET=你的CHANNEL_SECRET
SUPABASE_URL=你的SUPABASE_URL
SUPABASE_ANON_KEY=你的SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY=你的SUPABASE_SERVICE_KEY
MAX_MESSAGES=1000
MAX_USERS=100
NODE_ENV=production
```

## 6. 部署並獲取 URL
- 部署完成後，你會得到一個 URL，例如：
- `https://line-message-collector-xxx.onrender.com`
- Webhook URL 將是：`https://line-message-collector-xxx.onrender.com/webhook`

## 7. 更新 LINE Developer Console
- 前往 LINE Developer Console
- 更新 Webhook URL 為新的 Render URL
- 確保 webhook 已啟用

## 重要提醒
- 不要將 `.env` 檔案上傳到 GitHub
- 所有敏感資料都要在 Render 的環境變數中設定
- Render 免費方案會在 15 分鐘無活動後休眠
- 已移除所有 localtunnel 相關設定，確保安全性