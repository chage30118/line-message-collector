const express = require('express');
const { middleware } = require('@line/bot-sdk');
const LineHandler = require('../controllers/lineHandler');

const router = express.Router();

// LINE Webhook 中間件設定
const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

// Webhook 端點
router.post('/', middleware(lineConfig), async (req, res) => {
  try {
    console.log('📨 收到 Webhook 請求:', {
      events: req.body.events.length,
      timestamp: new Date().toISOString()
    });

    // 處理所有事件
    const results = await LineHandler.handleEvents(req.body.events);
    
    // 記錄處理結果
    console.log('✅ Webhook 處理完成:', {
      total: results.length,
      success: results.filter(r => r.status === 'success').length,
      rejected: results.filter(r => r.status === 'rejected').length,
      ignored: results.filter(r => r.status === 'ignored').length
    });

    res.json({ 
      status: 'ok', 
      processed: results.length,
      results: results 
    });

  } catch (error) {
    console.error('❌ Webhook 處理失敗:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// 測試端點
router.get('/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Webhook endpoint is working',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;