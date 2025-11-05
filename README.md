# LINE 客戶訊息收集系統

LINE 訊息記錄與客戶關係管理（CRM）系統 - 自動收集、儲存和管理來自 LINE 客戶的訊息。

## 🎯 專案簡介

這是一個基於 LINE Messaging API 的訊息收集與 CRM 系統，能夠：

- 📨 自動接收並儲存客戶發送的所有訊息（文字、圖片、檔案）
- 👥 自動收集客戶資料（LINE Profile）
- 🏷️ 自動記錄群組名稱
- 🔍 提供完整的查詢介面
- 📊 客戶關係管理（CRM）功能
- 📤 多格式資料匯出

## 🚀 快速開始

### 查看完整文件

**所有專案文件都在 [`/docs`](./docs) 資料夾中！**

👉 **從這裡開始**: [`docs/00-文件索引.md`](./docs/00-文件索引.md)

### 技術架構

**目前版本** (v1.0):
- 前端：Vanilla JavaScript
- 後端：Node.js + Express
- 資料庫：Supabase (PostgreSQL)
- 部署：Render.com

**規劃中** (v2.0 - Vue3 重構):
- 前端：Vue 3 + Element Plus + TailwindCSS
- 後端：Supabase + Vercel Serverless Functions
- 部署：Vercel
- 詳見 [`docs/02-專案重構計劃.md`](./docs/02-專案重構計劃.md)

## 📚 主要文件

| 文件 | 說明 |
|-----|------|
| [00-文件索引](./docs/00-文件索引.md) | 📖 所有文件的導覽和閱讀建議 |
| [01-產品需求文件(PRD)](./docs/01-產品需求文件(PRD).md) | 🎯 完整的產品功能和規格 |
| [02-專案重構計劃](./docs/02-專案重構計劃.md) | 🔧 Vue3 + Supabase 重構計劃 |
| [03-技術選型指南](./docs/03-技術選型指南.md) | 🔍 技術選型詳細比較 |
| [04-LINE雙向訊息收集研究](./docs/04-LINE雙向訊息收集研究.md) | 📡 LINE API 限制和解決方案 |
| [05-三欄式介面設計](./docs/05-三欄式介面設計.md) | 🎨 UI/UX 設計規劃 |

完整文件列表請查看 [`docs/`](./docs) 資料夾。

## ⚡ 安裝與執行

### 環境需求

- Node.js 18+
- npm 或 yarn
- LINE Developer Account
- Supabase Account

### 安裝步驟

```bash
# 1. 複製專案
git clone https://github.com/你的用戶名/line-message-collector.git
cd line-message-collector

# 2. 安裝依賴
npm install

# 3. 設定環境變數（複製 .env.example 並填入資料）
cp .env.example .env

# 4. 啟動開發伺服器
npm run dev
```

詳細步驟請參考 [`docs/07-部署指南.md`](./docs/07-部署指南.md)

## 🛠️ 開發指令

```bash
# 開發模式（自動重啟）
npm run dev

# 生產模式
npm start

# 測試
npm test
```

## 📦 專案結構

```
line-message-collector/
├── app.js                  # 主應用程式入口
├── config/                 # 設定檔
├── controllers/            # 控制器
├── routes/                 # API 路由
├── services/               # 業務邏輯
├── public/                 # 前端介面
├── docs/                   # 📚 完整文件
├── migrations/             # 資料庫遷移
├── .env                    # 環境變數（不提交）
└── package.json
```

## 🎯 主要功能

### ✅ 已實作功能

- 訊息接收與儲存（文字、圖片、檔案、音訊、視訊）
- 用戶資料自動收集（LINE Profile API）
- 群組名稱自動記錄（LINE Bot API）
- 客戶姓名管理系統
- 網頁查詢介面
- 訊息搜尋功能
- 資料匯出（CSV、Excel、JSON、PDF、ZIP）
- 系統限制機制（訊息數/用戶數上限）

### 🚧 規劃中功能（v2.0）

- 三欄式 CRM 介面（客戶列表 | 訊息歷史 | 客戶資訊）
- 客服在系統內發送訊息（雙向記錄）
- 快捷回覆和訊息模板
- 客戶標籤系統
- 統計圖表
- 即時通知
- 團隊協作功能

詳見 [`docs/02-專案重構計劃.md`](./docs/02-專案重構計劃.md)

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

開發前請先閱讀：
- [`docs/06-專案說明(給Claude的指引).md`](./docs/06-專案說明(給Claude的指引).md)

## 📄 授權

MIT License

## 📧 聯絡方式

- GitHub Issues: [專案 Issues 頁面]
- Email: [聯絡信箱]

---

## 🔗 相關連結

- [LINE Developers](https://developers.line.biz/)
- [Supabase 文件](https://supabase.com/docs)
- [Render 文件](https://render.com/docs)
- [Vue 3 文件](https://vuejs.org/)
- [Element Plus 文件](https://element-plus.org/)

---

**最後更新**: 2025-11-05
