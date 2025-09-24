const { Client } = require('@line/bot-sdk');

// LINE Bot 客戶端設定
const lineClient = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
});

class GroupService {
  // 獲取群組摘要資訊
  static async getGroupSummary(groupId) {
    try {
      // 調用 LINE Bot API 獲取群組摘要
      const groupSummary = await lineClient.getGroupSummary(groupId);
      
      console.log(`✅ 獲取群組摘要成功: ${groupId}`, {
        groupName: groupSummary.groupName,
        pictureUrl: groupSummary.pictureUrl
      });
      
      return {
        groupId: groupId,
        groupName: groupSummary.groupName,
        pictureUrl: groupSummary.pictureUrl
      };
    } catch (error) {
      console.warn(`⚠️ 獲取群組摘要失敗: ${groupId}`, error.message);
      return {
        groupId: groupId,
        groupName: null,
        pictureUrl: null
      };
    }
  }

  // 從webhook事件中提取群組資訊
  static extractGroupInfoFromEvent(event) {
    // 檢查事件來源是否為群組
    if (event.source && event.source.type === 'group') {
      return {
        isFromGroup: true,
        groupId: event.source.groupId,
        userId: event.source.userId
      };
    }
    
    // 一對一聊天
    if (event.source && event.source.type === 'user') {
      return {
        isFromGroup: false,
        groupId: null,
        userId: event.source.userId
      };
    }
    
    // 多人聊天室 (room)
    if (event.source && event.source.type === 'room') {
      return {
        isFromGroup: false, // room不是group，但也是多人聊天
        roomId: event.source.roomId,
        userId: event.source.userId
      };
    }
    
    return {
      isFromGroup: false,
      groupId: null,
      userId: event.source?.userId || null
    };
  }

  // 獲取並快取群組名稱
  static async getGroupDisplayName(groupId) {
    if (!groupId) return null;
    
    try {
      // 這裡可以加入快取邏輯，避免重複API調用
      const groupInfo = await this.getGroupSummary(groupId);
      return groupInfo.groupName;
    } catch (error) {
      console.error(`獲取群組名稱失敗: ${groupId}`, error);
      return null;
    }
  }
}

module.exports = GroupService;