const express = require('express');
const router = express.Router();
const {
    getCustomersNeedingNames,
    batchUpdateCustomerNames,
    exportCustomerData,
    importCustomerData,
    getCustomerStats
} = require('../controllers/customerController');

// 獲取需要設定姓名的客戶列表
router.get('/needing-names', getCustomersNeedingNames);

// 批量更新客戶姓名
router.post('/batch-update', batchUpdateCustomerNames);

// 匯出客戶資料
router.get('/export', exportCustomerData);

// 匯入客戶資料
router.post('/import', importCustomerData);

// 獲取客戶統計資料
router.get('/stats', getCustomerStats);

module.exports = router;