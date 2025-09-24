const express = require('express');
const router = express.Router();
const UserService = require('../services/userService');

// 更新用戶的群組顯示名稱
router.put('/users/:userId/group-name', async (req, res) => {
  try {
    const { userId } = req.params;
    const { groupDisplayName } = req.body;

    if (!groupDisplayName || groupDisplayName.trim().length === 0) {
      return res.status(400).json({ error: '群組顯示名稱不能為空' });
    }

    const updatedUser = await UserService.updateGroupDisplayName(
      parseInt(userId), 
      groupDisplayName.trim()
    );

    res.json({
      success: true,
      data: updatedUser,
      message: '群組顯示名稱更新成功'
    });
  } catch (error) {
    console.error('更新群組顯示名稱失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// 取得所有用戶列表（包含群組顯示名稱）
router.get('/users/with-group-names', async (req, res) => {
  try {
    const users = await UserService.getAllUsers();
    res.json({
      success: true,
      data: users,
      count: users.length
    });
  } catch (error) {
    console.error('取得用戶列表失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;