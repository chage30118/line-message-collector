// 測試工具：模擬 LINE Webhook 請求
require('dotenv').config();
const crypto = require('crypto');

// 模擬 LINE 簽名
function generateLineSignature(body, secret) {
    return crypto
        .createHmac('SHA256', secret)
        .update(body)
        .digest('base64');
}

// 測試用的 LINE 事件
const testEvent = {
    events: [{
        type: "message",
        message: {
            type: "text",
            id: "test123",
            text: "測試訊息"
        },
        source: {
            type: "user",
            userId: "U1234567890abcdef1234567890abcdef"
        },
        timestamp: Date.now(),
        mode: "active"
    }]
};

const testBody = JSON.stringify(testEvent);
const signature = generateLineSignature(testBody, process.env.LINE_CHANNEL_SECRET);

console.log('測試請求資料:');
console.log('Body:', testBody);
console.log('Signature:', signature);
console.log('');
console.log('請使用以下指令測試:');
console.log(`curl -X POST http://localhost:3002/webhook \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -H "x-line-signature: ${signature}" \\`);
console.log(`  -d '${testBody}'`);