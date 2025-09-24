const { supabase } = require('../config/supabase');
const UserService = require('./userService');
const FileService = require('./fileService');

class MessageService {
  // 儲存訊息
  static async saveMessage(messageData) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          line_message_id: messageData.line_message_id,
          user_id: messageData.user_id,
          message_type: messageData.message_type,
          text_content: messageData.text_content || null,
          file_id: messageData.file_id || null,
          file_name: messageData.file_name || null,
          file_size: messageData.file_size || null,
          file_type: messageData.file_type || null,
          timestamp: messageData.timestamp,
          processed: true,
          metadata: messageData.metadata || null
        })
        .select()
        .single();

      if (error) throw error;
      
      console.log(`✅ 訊息儲存成功: ${messageData.message_type} - ${messageData.line_message_id}`);
      return data;
    } catch (error) {
      console.error('訊息儲存失敗:', error);
      throw error;
    }
  }

  // 處理文字訊息
  static async handleTextMessage(event, user) {
    const messageData = {
      line_message_id: event.message.id,
      user_id: user.id,
      message_type: 'text',
      text_content: event.message.text,
      timestamp: new Date(event.timestamp).toISOString()
    };

    // 嘗試從訊息中分析用戶的群組名稱
    try {
      await UserService.analyzeNameFromMessage(user, event.message.text);
    } catch (error) {
      console.warn('分析用戶名稱時發生錯誤:', error);
    }

    return await this.saveMessage(messageData);
  }

  // 處理圖片訊息
  static async handleImageMessage(event, user, imageBuffer) {
    try {
      // 上傳圖片到 Storage
      const fileName = `image_${event.message.id}.jpg`;
      const uploadResult = await FileService.uploadFile(
        imageBuffer, 
        fileName, 
        'image/jpeg'
      );

      const messageData = {
        line_message_id: event.message.id,
        user_id: user.id,
        message_type: 'image',
        file_id: uploadResult.file_id,
        file_name: fileName,
        file_size: imageBuffer.length,
        file_type: 'image/jpeg',
        timestamp: new Date(event.timestamp).toISOString()
      };

      return await this.saveMessage(messageData);
    } catch (error) {
      console.error('處理圖片訊息失敗:', error);
      throw error;
    }
  }

  // 處理檔案訊息
  static async handleFileMessage(event, user, fileBuffer) {
    try {
      const fileName = event.message.fileName;
      const fileSize = event.message.fileSize;
      
      // 檢查檔案大小
      if (!FileService.isAllowedFileSize(fileSize)) {
        throw new Error('檔案大小超過限制 (50MB)');
      }

      // 根據檔案名稱推斷 MIME 類型
      const mimeType = this.getMimeTypeFromFileName(fileName);
      
      // 檢查檔案類型
      if (!FileService.isAllowedFileType(mimeType)) {
        throw new Error(`不支援的檔案類型: ${mimeType}`);
      }

      // 上傳檔案到 Storage
      const uploadResult = await FileService.uploadFile(
        fileBuffer, 
        fileName, 
        mimeType
      );

      const messageData = {
        line_message_id: event.message.id,
        user_id: user.id,
        message_type: 'file',
        file_id: uploadResult.file_id,
        file_name: fileName,
        file_size: fileSize,
        file_type: mimeType,
        timestamp: new Date(event.timestamp).toISOString()
      };

      return await this.saveMessage(messageData);
    } catch (error) {
      console.error('處理檔案訊息失敗:', error);
      throw error;
    }
  }

  // 取得所有訊息
  static async getAllMessages(limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          users (
            line_user_id,
            display_name,
            picture_url
          )
        `)
        .order('timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('取得訊息列表失敗:', error);
      return [];
    }
  }

  // 根據用戶取得訊息
  static async getMessagesByUser(lineUserId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          users!inner (
            line_user_id,
            display_name,
            picture_url
          )
        `)
        .eq('users.line_user_id', lineUserId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('取得用戶訊息失敗:', error);
      return [];
    }
  }

  // 根據檔案名稱推斷 MIME 類型
  static getMimeTypeFromFileName(fileName) {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    const mimeTypes = {
      // 圖片
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      
      // 文件
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'txt': 'text/plain',
      
      // 音訊
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      
      // 視訊
      'mp4': 'video/mp4',
      'mov': 'video/quicktime'
    };

    return mimeTypes[extension] || 'application/octet-stream';
  }
}

module.exports = MessageService;