# LINE API 雙向訊息收集研究
# 客服在 OA Manager 發送訊息的收集方案

**研究日期**: 2025-11-05
**研究目的**: 確認是否能收集客服在 LINE Official Account Manager 發送的訊息

---

## 問題分析

### 需求
客服人員在 **LINE Official Account Manager** (OA Manager) 網頁版回覆客戶，希望這些訊息也能自動收集到 Supabase 資料庫。

### 理想流程
```
客服在 OA Manager 發送訊息
    ↓
LINE 推送事件到 Webhook？
    ↓
系統記錄到 Supabase
```

---

## LINE API 能力研究

### 1. LINE Webhook 會推送什麼事件？

#### ✅ 會推送的事件：

1. **Message events** - 用戶發送訊息
   ```json
   {
     "type": "message",
     "replyToken": "...",
     "source": {
       "userId": "U1234567890abcdef",
       "type": "user"
     },
     "message": {
       "type": "text",
       "text": "Hello"
     }
   }
   ```

2. **Follow event** - 用戶加好友
3. **Unfollow event** - 用戶封鎖
4. **Join event** - Bot 加入群組
5. **Leave event** - Bot 離開群組
6. **Postback event** - 用戶點擊按鈕
7. **Beacon event** - Beacon 觸發

#### ❌ 不會推送的事件：

1. **你自己透過 API 發送的訊息**
2. **你在 OA Manager 發送的訊息**
3. **其他管理者發送的訊息**

### 2. 為什麼不會推送？

**設計原理**：
- Webhook 的目的是讓你知道「用戶做了什麼」
- 不是讓你知道「你自己做了什麼」
- 你自己的操作，應該由你自己的系統記錄

**官方說明**（LINE Developers 文件）：
> Webhook events are sent when users take actions, such as sending messages or adding your LINE Official Account as a friend. Events are not sent for actions taken by the LINE Official Account itself.

---

## 解決方案研究

### 方案 1：透過 API 檢查是否有新訊息 ❌

**概念**：定期呼叫 API 取得聊天記錄

**研究結果**：
- ❌ LINE Messaging API **沒有提供**「取得聊天記錄」的 API
- ❌ 無法取得歷史訊息
- ❌ 這個 API 不存在

**LINE API 只提供**：
- 發送訊息 API
- 取得用戶 Profile API
- 群組管理 API
- 不提供「讀取訊息」API

---

### 方案 2：使用 LINE Bot 模式 ❌

**概念**：切換到 Bot 模式，所有訊息都透過 Bot

**限制**：
- Bot 模式下，OA Manager 的聊天功能會受限
- 需要完全改用程式化方式發送訊息
- 不符合「客服繼續用 OA Manager」的需求

---

### 方案 3：瀏覽器擴充功能監聽 ⚠️

**概念**：開發 Chrome 擴充功能，監聽 OA Manager 的發送動作

**可行性**：技術上可行，但...

**問題**：
1. ⚠️ 複雜度高（需要開發瀏覽器擴充）
2. ⚠️ 穩定性差（OA Manager 更新可能導致失效）
3. ⚠️ 需要每個客服安裝
4. ⚠️ 安全性疑慮（監聽網頁內容）
5. ⚠️ 違反 LINE 服務條款的可能性

**技術概要**：
```javascript
// Chrome Extension - Content Script
// 監聽 LINE OA Manager 的網路請求
chrome.webRequest.onBeforeRequest.addListener(
  function(details) {
    if (details.url.includes('api.line.me/v2/bot/message')) {
      // 攔截請求，取得訊息內容
      // 發送到你的後端記錄
    }
  },
  {urls: ["https://api.line.me/*"]}
);
```

**結論**：不建議

---

### 方案 4：客服發送前先在系統登記 ⚠️

**概念**：建立一個輔助介面，客服發送前先在這裡輸入

**流程**：
```
1. 客服在 CRM 系統輸入訊息
2. 系統記錄到資料庫
3. 客服複製訊息
4. 貼到 OA Manager 發送
```

**問題**：
- ⚠️ 操作繁瑣
- ⚠️ 容易忘記
- ⚠️ 訊息內容可能不一致（複製貼上時修改）

**結論**：不實用

---

### 方案 5：改用 CRM 系統發送（推薦）⭐

**概念**：說服客服改用 CRM 系統的發送介面

**流程**：
```
1. 客服在 CRM 系統輸入訊息
2. 系統呼叫 LINE API 發送
3. 同時記錄到資料庫
4. 客戶在 LINE 收到訊息
```

**優點**：
- ✅ 完整記錄所有訊息（雙向）
- ✅ 統一的介面
- ✅ 可以加入更多功能（快捷回覆、訊息模板）
- ✅ 訊息狀態追蹤
- ✅ 團隊協作功能（未來）

**缺點**：
- ⚠️ 需要說服客服改變習慣
- ⚠️ 需要開發發送介面

**說服客服的理由**：
1. 📊 完整的客戶歷史記錄
2. ⚡ 快捷回覆（提升效率）
3. 📝 訊息模板
4. 📈 統計和分析（回覆速度、訊息量）
5. 👥 多人協作（看到其他人的回覆）
6. 🔍 搜尋和篩選更方便

**實作時間**：約 2-3 天

---

### 方案 6：混合模式（折衷方案）⚠️

**概念**：OA Manager 和 CRM 並存

**流程**：
```
客服可以選擇：
1. 簡單回覆 → 用 OA Manager（不記錄）
2. 重要回覆 → 用 CRM 系統（記錄）
```

**優點**：
- ✅ 彈性
- ✅ 降低轉換阻力

**缺點**：
- ⚠️ 記錄不完整
- ⚠️ 容易混淆
- ⚠️ 最終還是要完全遷移

---

## 結論與建議

### 嚴肅的事實

❌ **技術上無法自動收集 OA Manager 發送的訊息**

LINE API 的設計就是不支援這個功能。這不是技術能力問題，而是 LINE 的 API 政策。

### 可行的路徑

只有兩個真正可行的選擇：

#### 選擇 A：接受現狀 ⚠️
- 只記錄客戶發送的訊息
- 客服回覆不記錄
- CRM 系統功能受限

**適合情境**：
- 主要需求是查詢客戶訊息
- 不太在意客服回覆記錄
- 客服習慣難以改變

#### 選擇 B：改用 CRM 發送 ⭐ **強烈建議**
- 完整的雙向記錄
- 統一的客服介面
- 更多功能可能性

**適合情境**：
- 需要完整的對話記錄
- 願意投資提升客服效率
- 長期規劃

### 我的建議

🎯 **推薦選擇 B：逐步遷移到 CRM 系統發送**

**實施策略**：

**第一階段（1-2 週）**：
1. 開發基礎的 CRM 系統（查詢功能）
2. 只記錄客戶發送的訊息
3. 讓客服熟悉新介面

**第二階段（2-3 週）**：
1. 開發發送功能
2. 加入快捷回覆
3. 訊息模板

**第三階段（並行使用）**：
1. OA Manager 和 CRM 並存
2. 鼓勵使用 CRM
3. 收集回饋

**第四階段（完全遷移）**：
1. 關閉 OA Manager 聊天功能
2. 完全使用 CRM

### 給客服的好處（說服話術）

📈 **效率提升**：
- 快捷回覆：常用訊息一鍵發送
- 訊息模板：標準化回覆
- 客戶資訊一目了然

📊 **資料完整**：
- 完整的對話歷史
- 快速搜尋過往記錄
- 不會遺漏重要資訊

👥 **團隊協作**：
- 看到其他人的回覆
- 交接更順暢
- 避免重複回覆

📈 **個人成長**：
- 回覆速度統計
- 客戶滿意度分析
- 績效追蹤

---

## 技術實作方案（選擇 B）

### 資料庫調整

```sql
-- 加入訊息方向
ALTER TABLE messages ADD COLUMN direction TEXT DEFAULT 'inbound';
-- 'inbound' = 客戶發送
-- 'outbound' = 客服發送

-- 加入發送者
ALTER TABLE messages ADD COLUMN sent_by TEXT;

-- 加入發送狀態
ALTER TABLE messages ADD COLUMN send_status TEXT DEFAULT 'sent';
-- 'sent' = 已發送
-- 'failed' = 失敗
-- 'pending' = 發送中

-- 加入索引
CREATE INDEX idx_messages_direction ON messages(direction);
```

### API 端點

```javascript
// api/send-message.js
export default async function handler(req, res) {
  const { to, message, sentBy } = req.body;

  try {
    // 1. 發送到 LINE
    await lineClient.pushMessage(to, {
      type: 'text',
      text: message
    });

    // 2. 記錄到資料庫
    await supabase.from('messages').insert({
      user_id: userId,
      message_type: 'text',
      text_content: message,
      direction: 'outbound',
      sent_by: sentBy,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    // 記錄失敗狀態
    await supabase.from('messages').insert({
      // ... 同上
      send_status: 'failed'
    });

    return res.status(500).json({ error: error.message });
  }
}
```

### 前端元件

```vue
<!-- MessageSender.vue -->
<template>
  <div class="message-sender">
    <!-- 快捷回覆按鈕 -->
    <el-button-group>
      <el-button @click="insertText('感謝您的訊息，我們會盡快處理')">
        感謝訊息
      </el-button>
      <el-button @click="insertText('請問還有其他問題嗎？')">
        詢問需求
      </el-button>
    </el-button-group>

    <!-- 輸入框 -->
    <el-input
      v-model="message"
      type="textarea"
      :rows="4"
      placeholder="輸入訊息... (Ctrl+Enter 發送)"
      @keydown.ctrl.enter="sendMessage"
    />

    <!-- 發送按鈕 -->
    <el-button
      type="primary"
      :loading="sending"
      @click="sendMessage"
    >
      發送訊息
    </el-button>
  </div>
</template>
```

---

## 最終決策

請根據你的實際情況選擇：

### 🅰️ 選擇 A：只記錄客戶訊息
- 簡單快速
- 功能受限
- 適合快速 POC

### 🅱️ 選擇 B：完整的雙向系統
- 需要更多開發時間
- 功能完整
- 長期投資報酬率高

**我強烈建議選擇 B**，因為：
1. 如果要做 CRM，雙向記錄是必須的
2. 說服客服改變習慣是值得的
3. 長期來看，統一介面更好維護

---

## 參考資料

- [LINE Messaging API 官方文件](https://developers.line.biz/en/docs/messaging-api/)
- [LINE Webhook 事件類型](https://developers.line.biz/en/reference/messaging-api/#webhook-event-objects)
- [LINE Push Message API](https://developers.line.biz/en/reference/messaging-api/#send-push-message)
