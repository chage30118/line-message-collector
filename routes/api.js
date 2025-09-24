const express = require('express');
const LimitService = require('../services/limitService');
const UserService = require('../services/userService');
const MessageService = require('../services/messageService');
const FileService = require('../services/fileService');

const router = express.Router();

// 取得系統統計資訊
router.get('/stats', async (req, res) => {
  try {
    const stats = await LimitService.getStats();
    const limits = await LimitService.getLimits();
    
    res.json({
      stats,
      limits,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('取得統計資訊失敗:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// 取得所有用戶
router.get('/users', async (req, res) => {
  try {
    const users = await UserService.getAllUsers();
    res.json({
      users,
      count: users.length
    });
  } catch (error) {
    console.error('取得用戶列表失敗:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// 取得所有訊息
router.get('/messages', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const userId = req.query.user_id;
    
    let messages;
    if (userId) {
      messages = await MessageService.getMessagesByUser(userId, limit);
    } else {
      messages = await MessageService.getAllMessages(limit, offset);
    }
    
    res.json({
      messages,
      count: messages.length,
      limit,
      offset
    });
  } catch (error) {
    console.error('取得訊息列表失敗:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// 根據用戶 ID 取得訊息
router.get('/messages/user/:lineUserId', async (req, res) => {
  try {
    const { lineUserId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    const messages = await MessageService.getMessagesByUser(lineUserId, limit);
    
    res.json({
      user_id: lineUserId,
      messages,
      count: messages.length
    });
  } catch (error) {
    console.error('取得用戶訊息失敗:', error);
    res.status(500).json({ error: 'Failed to get user messages' });
  }
});

// 檔案下載
router.get('/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // 取得檔案 URL
    const fileUrl = await FileService.getFileUrl(fileId);
    
    if (!fileUrl) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // 重定向到檔案 URL
    res.redirect(fileUrl);
  } catch (error) {
    console.error('檔案下載失敗:', error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// 測試 API 端點
router.get('/test', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API is working',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/stats - 取得統計資訊',
      'GET /api/users - 取得用戶列表',
      'GET /api/messages - 取得訊息列表',
      'GET /api/messages/user/:lineUserId - 取得特定用戶訊息',
      'GET /api/files/:fileId - 下載檔案'
    ]
  });
});

module.exports = router;