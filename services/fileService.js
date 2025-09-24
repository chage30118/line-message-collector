const { supabase } = require('../config/supabase');

class FileService {
  // 上傳檔案到 Supabase Storage
  static async uploadFile(buffer, fileName, mimeType) {
    try {
      // 產生唯一檔案名稱
      const timestamp = Date.now();
      const fileExtension = this.getFileExtension(fileName);
      const uniqueFileName = `${timestamp}_${fileName}`;
      
      // 根據檔案類型決定資料夾
      const folder = this.getFileFolder(mimeType);
      const filePath = `${folder}/${uniqueFileName}`;

      // 上傳檔案
      const { data, error } = await supabase.storage
        .from('line-files')
        .upload(filePath, buffer, {
          contentType: mimeType,
          duplex: false
        });

      if (error) throw error;

      console.log(`✅ 檔案上傳成功: ${filePath}`);
      return {
        file_id: data.path,
        file_path: filePath,
        original_name: fileName
      };

    } catch (error) {
      console.error('檔案上傳失敗:', error);
      throw error;
    }
  }

  // 取得檔案下載 URL
  static async getFileUrl(filePath) {
    try {
      const { data, error } = await supabase.storage
        .from('line-files')
        .createSignedUrl(filePath, 3600); // 1小時有效

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('取得檔案 URL 失敗:', error);
      return null;
    }
  }

  // 刪除檔案
  static async deleteFile(filePath) {
    try {
      const { error } = await supabase.storage
        .from('line-files')
        .remove([filePath]);

      if (error) throw error;
      console.log(`✅ 檔案刪除成功: ${filePath}`);
      return true;
    } catch (error) {
      console.error('檔案刪除失敗:', error);
      return false;
    }
  }

  // 根據 MIME 類型決定資料夾
  static getFileFolder(mimeType) {
    if (mimeType.startsWith('image/')) {
      return 'images';
    } else if (mimeType.startsWith('audio/')) {
      return 'audio';
    } else if (mimeType.startsWith('video/')) {
      return 'video';
    } else if (mimeType === 'application/pdf') {
      return 'documents/pdf';
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return 'documents/word';
    } else if (mimeType.includes('excel') || mimeType.includes('sheet')) {
      return 'documents/excel';
    } else {
      return 'files';
    }
  }

  // 取得檔案副檔名
  static getFileExtension(fileName) {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }

  // 檢查檔案類型是否允許
  static isAllowedFileType(mimeType) {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'audio/mpeg', 'audio/wav',
      'video/mp4', 'video/quicktime'
    ];

    return allowedTypes.includes(mimeType);
  }

  // 檢查檔案大小是否符合限制
  static isAllowedFileSize(fileSize) {
    const maxSize = 50 * 1024 * 1024; // 50MB
    return fileSize <= maxSize;
  }
}

module.exports = FileService;