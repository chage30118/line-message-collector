const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const webhookRoutes = require('./routes/webhook');
const apiRoutes = require('./routes/api');
const userRoutes = require('./routes/users');

const app = express();
const port = process.env.PORT || 3000;

// 中介軟體設定
app.use(cors());
app.use(express.static('public'));

// 健康檢查端點
app.get('/', (req, res) => {
    res.json({
        message: 'LINE Message Collector API',
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

// Render 健康檢查端點
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 路由設定
app.use('/webhook', webhookRoutes);
app.use('/api', apiRoutes);
app.use('/api', userRoutes);

// 全域錯誤處理
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
    });
});

// 404 處理
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Not found',
        path: req.originalUrl 
    });
});

// 啟動伺服器
app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📱 Webhook URL: http://localhost:${port}/webhook`);
    console.log(`🌐 Web Interface: http://localhost:${port}`);
    console.log(`📊 API Base: http://localhost:${port}/api`);
});

module.exports = app;