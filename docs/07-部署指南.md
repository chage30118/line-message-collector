# Render 部署說明

## 環境變數設定

在 Render 設定以下環境變數：

### LINE Bot 設定
```
LINE_CHANNEL_ACCESS_TOKEN=37Dg+lKDfEB3EZQFWedubrsjQZ1iettYA+mTzTCRwN/2F0QTkiQJGEtnEjaFJvk09hVcHxObRGxrygi8rVtgBjgTX+WLzVqc1YB2a0UKa06G/DxVlfofD/SilEDccrW7i1fJi4AlE238P1+YtTkNewdB04t89/1O/w1cDnyilFU=
LINE_CHANNEL_SECRET=a93a947b8d88626db538ae0c54605115
```

### Supabase 設定
```
SUPABASE_URL=https://pkaausgckqagwjkboobs.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrYWF1c2dja3FhZ3dqa2Jvb2JzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MDY4NDQsImV4cCI6MjA3NDE4Mjg0NH0.4QUyODKmSTuBbpqaKcNTx1rNRsax_NObs4N4DbpDDOA
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrYWF1c2dja3FhZ3dqa2Jvb2JzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODYwNjg0NCwiZXhwIjoyMDc0MTgyODQ0fQ.0XFrZfleOqyamMwsdIl8szrUwysmuEv5icskBM47p8A
```

### 系統設定
```
MAX_MESSAGES=1000
MAX_USERS=100
NODE_ENV=production
```

注意：PORT 會由 Render 自動設定，不需要手動指定。

## 部署步驟

1. **在 GitHub 上建立 repository**
   - 將專案上傳到 GitHub
   - 確保不包含 `.env` 檔案

2. **在 Render 上建立服務**
   - 前往 https://render.com
   - 點擊 "New" → "Web Service"
   - 連接你的 GitHub repository
   - 選擇 `line-message-collector` repository

3. **設定環境變數**
   - 在 Render 服務設定中，新增上述所有環境變數
   - 確保敏感資料（如 token 和 secret）都正確設定

4. **部署**
   - Render 會自動檢測 `render.yaml` 設定
   - 等待部署完成

5. **獲取 Webhook URL**
   - 部署完成後，你會得到一個類似這樣的 URL：
   - `https://your-app-name.onrender.com`
   - Webhook URL 會是：`https://your-app-name.onrender.com/webhook`

6. **更新 LINE Developer Console**
   - 前往 LINE Developer Console
   - 更新 Webhook URL 為新的 Render URL
   - 啟用 webhook

## 驗證部署

- 訪問 `https://your-app-name.onrender.com` 應該看到 API 狀態
- 訪問 `https://your-app-name.onrender.com/health` 應該看到健康檢查回應
- 發送訊息到 LINE Bot 應該能夠收到並儲存到 Supabase

## 注意事項

- Render 免費方案會在閒置 15 分鐘後進入睡眠狀態
- 第一次請求可能需要幾秒鐘來喚醒服務
- 免費方案提供 750 小時/月的運行時間
- 如需 24/7 運行，建議升級到付費方案（$7/月）