const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const UserService = require('./userService');
const MessageService = require('./messageService');

class ExportService {
  constructor() {
    this.tempDir = path.join(__dirname, '../temp');
    this.ensureTempDir();
  }

  // 確保臨時目錄存在
  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  // 匯出用戶資料為 CSV
  async exportUsersToCSV() {
    try {
      const users = await UserService.getAllUsers();
      const fileName = `users_export_${Date.now()}.csv`;
      const filePath = path.join(this.tempDir, fileName);

      const csvWriter = createCsvWriter({
        path: filePath,
        header: [
          { id: 'id', title: 'ID' },
          { id: 'line_user_id', title: 'LINE用戶ID' },
          { id: 'display_name', title: '顯示名稱' },
          { id: 'picture_url', title: '頭像URL' },
          { id: 'status_message', title: '狀態訊息' },
          { id: 'language', title: '語言' },
          { id: 'first_message_at', title: '首次訊息時間' },
          { id: 'last_message_at', title: '最後訊息時間' },
          { id: 'message_count', title: '訊息數量' },
          { id: 'created_at', title: '建立時間' },
          { id: 'updated_at', title: '更新時間' }
        ]
      });

      await csvWriter.writeRecords(users);
      console.log(`✅ 用戶CSV匯出成功: ${fileName}`);
      
      return {
        fileName,
        filePath,
        recordCount: users.length
      };
    } catch (error) {
      console.error('匯出用戶CSV失敗:', error);
      throw error;
    }
  }

  // 匯出訊息資料為 CSV
  async exportMessagesToCSV(limit = 1000) {
    try {
      const messages = await MessageService.getAllMessages(limit, 0);
      const fileName = `messages_export_${Date.now()}.csv`;
      const filePath = path.join(this.tempDir, fileName);

      const csvWriter = createCsvWriter({
        path: filePath,
        header: [
          { id: 'id', title: 'ID' },
          { id: 'line_message_id', title: 'LINE訊息ID' },
          { id: 'user_display_name', title: '用戶名稱' },
          { id: 'line_user_id', title: 'LINE用戶ID' },
          { id: 'message_type', title: '訊息類型' },
          { id: 'content', title: '訊息內容' },
          { id: 'file_name', title: '檔案名稱' },
          { id: 'file_size', title: '檔案大小' },
          { id: 'file_url', title: '檔案URL' },
          { id: 'timestamp', title: '時間戳記' },
          { id: 'created_at', title: '建立時間' }
        ]
      });

      // 準備匯出資料
      const exportData = messages.map(msg => ({
        ...msg,
        user_display_name: msg.users?.display_name || '未知用戶',
        line_user_id: msg.users?.line_user_id || '未知',
        timestamp: new Date(msg.timestamp).toLocaleString('zh-TW'),
        created_at: new Date(msg.created_at).toLocaleString('zh-TW')
      }));

      await csvWriter.writeRecords(exportData);
      console.log(`✅ 訊息CSV匯出成功: ${fileName}`);
      
      return {
        fileName,
        filePath,
        recordCount: messages.length
      };
    } catch (error) {
      console.error('匯出訊息CSV失敗:', error);
      throw error;
    }
  }

  // 匯出完整資料為 Excel
  async exportToExcel() {
    try {
      const [users, messages] = await Promise.all([
        UserService.getAllUsers(),
        MessageService.getAllMessages(1000, 0)
      ]);

      const fileName = `line_data_export_${Date.now()}.xlsx`;
      const filePath = path.join(this.tempDir, fileName);

      const workbook = new ExcelJS.Workbook();
      
      // 用戶工作表
      const usersSheet = workbook.addWorksheet('用戶資料');
      usersSheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'LINE用戶ID', key: 'line_user_id', width: 30 },
        { header: '顯示名稱', key: 'display_name', width: 20 },
        { header: '頭像URL', key: 'picture_url', width: 50 },
        { header: '狀態訊息', key: 'status_message', width: 30 },
        { header: '語言', key: 'language', width: 10 },
        { header: '首次訊息時間', key: 'first_message_at', width: 20 },
        { header: '最後訊息時間', key: 'last_message_at', width: 20 },
        { header: '訊息數量', key: 'message_count', width: 15 },
        { header: '建立時間', key: 'created_at', width: 20 },
        { header: '更新時間', key: 'updated_at', width: 20 }
      ];

      // 格式化用戶資料
      const formattedUsers = users.map(user => ({
        ...user,
        first_message_at: user.first_message_at ? new Date(user.first_message_at).toLocaleString('zh-TW') : '',
        last_message_at: user.last_message_at ? new Date(user.last_message_at).toLocaleString('zh-TW') : '',
        created_at: new Date(user.created_at).toLocaleString('zh-TW'),
        updated_at: new Date(user.updated_at).toLocaleString('zh-TW')
      }));

      usersSheet.addRows(formattedUsers);

      // 訊息工作表
      const messagesSheet = workbook.addWorksheet('訊息資料');
      messagesSheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'LINE訊息ID', key: 'line_message_id', width: 25 },
        { header: '用戶名稱', key: 'user_display_name', width: 20 },
        { header: 'LINE用戶ID', key: 'line_user_id', width: 30 },
        { header: '訊息類型', key: 'message_type', width: 15 },
        { header: '訊息內容', key: 'content', width: 50 },
        { header: '檔案名稱', key: 'file_name', width: 30 },
        { header: '檔案大小', key: 'file_size', width: 15 },
        { header: '檔案URL', key: 'file_url', width: 50 },
        { header: '時間戳記', key: 'timestamp', width: 20 },
        { header: '建立時間', key: 'created_at', width: 20 }
      ];

      // 格式化訊息資料
      const formattedMessages = messages.map(msg => ({
        ...msg,
        user_display_name: msg.users?.display_name || '未知用戶',
        line_user_id: msg.users?.line_user_id || '未知',
        timestamp: new Date(msg.timestamp).toLocaleString('zh-TW'),
        created_at: new Date(msg.created_at).toLocaleString('zh-TW')
      }));

      messagesSheet.addRows(formattedMessages);

      // 統計工作表
      const statsSheet = workbook.addWorksheet('統計資料');
      statsSheet.columns = [
        { header: '項目', key: 'item', width: 30 },
        { header: '數值', key: 'value', width: 20 }
      ];

      const stats = [
        { item: '總用戶數', value: users.length },
        { item: '總訊息數', value: messages.length },
        { item: '文字訊息數', value: messages.filter(m => m.message_type === 'text').length },
        { item: '圖片訊息數', value: messages.filter(m => m.message_type === 'image').length },
        { item: '檔案訊息數', value: messages.filter(m => m.message_type === 'file').length },
        { item: '音訊訊息數', value: messages.filter(m => m.message_type === 'audio').length },
        { item: '視訊訊息數', value: messages.filter(m => m.message_type === 'video').length },
        { item: '匯出時間', value: new Date().toLocaleString('zh-TW') }
      ];

      statsSheet.addRows(stats);

      // 設定標題行樣式
      [usersSheet, messagesSheet, statsSheet].forEach(sheet => {
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
      });

      await workbook.xlsx.writeFile(filePath);
      console.log(`✅ Excel匯出成功: ${fileName}`);
      
      return {
        fileName,
        filePath,
        userCount: users.length,
        messageCount: messages.length
      };
    } catch (error) {
      console.error('匯出Excel失敗:', error);
      throw error;
    }
  }

  // 匯出為 JSON
  async exportToJSON() {
    try {
      const [users, messages] = await Promise.all([
        UserService.getAllUsers(),
        MessageService.getAllMessages(1000, 0)
      ]);

      const fileName = `line_data_export_${Date.now()}.json`;
      const filePath = path.join(this.tempDir, fileName);

      const exportData = {
        export_info: {
          timestamp: new Date().toISOString(),
          user_count: users.length,
          message_count: messages.length
        },
        users,
        messages
      };

      await promisify(fs.writeFile)(filePath, JSON.stringify(exportData, null, 2), 'utf-8');
      console.log(`✅ JSON匯出成功: ${fileName}`);
      
      return {
        fileName,
        filePath,
        userCount: users.length,
        messageCount: messages.length
      };
    } catch (error) {
      console.error('匯出JSON失敗:', error);
      throw error;
    }
  }

  // 清理臨時檔案
  async cleanupTempFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        await promisify(fs.unlink)(filePath);
        console.log(`🗑️ 臨時檔案已清理: ${path.basename(filePath)}`);
      }
    } catch (error) {
      console.error('清理臨時檔案失敗:', error);
    }
  }
}

module.exports = new ExportService();