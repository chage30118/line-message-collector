const { Client } = require('@line/bot-sdk');
const LimitService = require('../services/limitService');
const UserService = require('../services/userService');
const MessageService = require('../services/messageService');

// LINE Bot 客戶端設定
const lineClient = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
});

class LineHandler {
  // 處理 Webhook 事件
  static async handleEvents(events) {
    const results = [];
    
    for (const event of events) {
      try {
        const result = await this.handleSingleEvent(event);
        results.push(result);
      } catch (error) {
        console.error('處理事件失敗:', error);
        results.push({ error: error.message });
      }
    }
    
    return results;
  }

  // 處理單一事件
  static async handleSingleEvent(event) {
    // 只處理訊息事件
    if (event.type !== 'message') {
      console.log(`忽略非訊息事件: ${event.type}`);
      return { status: 'ignored', reason: 'not_message_event' };
    }

    const lineUserId = event.source.userId;
    
    // 檢查是否可以接受新用戶
    const canAcceptUser = await LimitService.canAcceptNewUser(lineUserId);
    if (!canAcceptUser) {
      console.log(`❌ 已達用戶數量上限，拒絕用戶: ${lineUserId}`);
      return { status: 'rejected', reason: 'user_limit_exceeded' };
    }

    // 檢查訊息數量限制
    const canAcceptMessage = await LimitService.checkMessageLimits();
    if (!canAcceptMessage) {
      console.log(`❌ 已達訊息數量上限，拒絕訊息`);
      return { status: 'rejected', reason: 'message_limit_exceeded' };
    }

    // 取得用戶資訊
    const userProfile = await this.getUserProfile(lineUserId);
    const user = await UserService.getOrCreateUser(lineUserId, userProfile);

    // 根據訊息類型處理
    switch (event.message.type) {
      case 'text':
        return await this.handleTextMessage(event, user);
      
      case 'image':
        return await this.handleImageMessage(event, user);
      
      case 'file':
        return await this.handleFileMessage(event, user);
      
      case 'audio':
        return await this.handleAudioMessage(event, user);
      
      case 'video':
        return await this.handleVideoMessage(event, user);
      
      default:
        console.log(`不支援的訊息類型: ${event.message.type}`);
        return { status: 'ignored', reason: 'unsupported_message_type' };
    }
  }

  // 取得用戶個人資料
  static async getUserProfile(lineUserId) {
    try {
      const profile = await lineClient.getProfile(lineUserId);
      return profile;
    } catch (error) {
      console.warn('取得用戶個人資料失敗:', error.message);
      return null;
    }
  }

  // 處理文字訊息
  static async handleTextMessage(event, user) {
    try {
      const message = await MessageService.handleTextMessage(event, user);
      console.log(`✅ 文字訊息處理完成: ${user.display_name || user.line_user_id}`);
      return { status: 'success', type: 'text', message_id: message.id };
    } catch (error) {
      console.error('處理文字訊息失敗:', error);
      throw error;
    }
  }

  // 處理圖片訊息
  static async handleImageMessage(event, user) {
    try {
      // 下載圖片內容
      const stream = await lineClient.getMessageContent(event.message.id);
      const buffer = await this.streamToBuffer(stream);
      
      const message = await MessageService.handleImageMessage(event, user, buffer);
      console.log(`✅ 圖片訊息處理完成: ${user.display_name || user.line_user_id}`);
      return { status: 'success', type: 'image', message_id: message.id };
    } catch (error) {
      console.error('處理圖片訊息失敗:', error);
      throw error;
    }
  }

  // 處理檔案訊息
  static async handleFileMessage(event, user) {
    try {
      // 下載檔案內容
      const stream = await lineClient.getMessageContent(event.message.id);
      const buffer = await this.streamToBuffer(stream);
      
      const message = await MessageService.handleFileMessage(event, user, buffer);
      console.log(`✅ 檔案訊息處理完成: ${user.display_name || user.line_user_id}`);
      return { status: 'success', type: 'file', message_id: message.id };
    } catch (error) {
      console.error('處理檔案訊息失敗:', error);
      throw error;
    }
  }

  // 處理音訊訊息
  static async handleAudioMessage(event, user) {
    try {
      // 下載音訊內容
      const stream = await lineClient.getMessageContent(event.message.id);
      const buffer = await this.streamToBuffer(stream);
      
      // 建構假的檔案事件來重用檔案處理邏輯
      const fileEvent = {
        ...event,
        message: {
          ...event.message,
          type: 'file',
          fileName: `audio_${event.message.id}.m4a`,
          fileSize: buffer.length
        }
      };
      
      const message = await MessageService.handleFileMessage(fileEvent, user, buffer);
      console.log(`✅ 音訊訊息處理完成: ${user.display_name || user.line_user_id}`);
      return { status: 'success', type: 'audio', message_id: message.id };
    } catch (error) {
      console.error('處理音訊訊息失敗:', error);
      throw error;
    }
  }

  // 處理視訊訊息
  static async handleVideoMessage(event, user) {
    try {
      // 下載視訊內容
      const stream = await lineClient.getMessageContent(event.message.id);
      const buffer = await this.streamToBuffer(stream);
      
      // 建構假的檔案事件來重用檔案處理邏輯
      const fileEvent = {
        ...event,
        message: {
          ...event.message,
          type: 'file',
          fileName: `video_${event.message.id}.mp4`,
          fileSize: buffer.length
        }
      };
      
      const message = await MessageService.handleFileMessage(fileEvent, user, buffer);
      console.log(`✅ 視訊訊息處理完成: ${user.display_name || user.line_user_id}`);
      return { status: 'success', type: 'video', message_id: message.id };
    } catch (error) {
      console.error('處理視訊訊息失敗:', error);
      throw error;
    }
  }

  // 將 Stream 轉換為 Buffer
  static streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }
}

module.exports = LineHandler;