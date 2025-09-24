const { supabase } = require('../config/supabase');

class UserService {
  // 取得或建立用戶
  static async getOrCreateUser(lineUserId, userProfile = null) {
    try {
      // 先查詢用戶是否已存在
      const { data: existingUser, error: selectError } = await supabase
        .from('users')
        .select('*')
        .eq('line_user_id', lineUserId)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        throw selectError;
      }

      // 用戶已存在，更新資訊並返回
      if (existingUser) {
        if (userProfile) {
          const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({
              display_name: userProfile.displayName,
              picture_url: userProfile.pictureUrl,
              status_message: userProfile.statusMessage,
              language: userProfile.language,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingUser.id)
            .select()
            .single();

          if (updateError) throw updateError;
          return updatedUser;
        }
        return existingUser;
      }

      // 用戶不存在，建立新用戶
      const userData = {
        line_user_id: lineUserId,
        display_name: userProfile?.displayName || null,
        picture_url: userProfile?.pictureUrl || null,
        status_message: userProfile?.statusMessage || null,
        language: userProfile?.language || null,
        is_active: true
      };

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (insertError) throw insertError;
      console.log(`✅ 新用戶建立成功: ${newUser.display_name || lineUserId}`);
      return newUser;

    } catch (error) {
      console.error('用戶操作失敗:', error);
      throw error;
    }
  }

  // 取得所有用戶
  static async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('取得用戶列表失敗:', error);
      return [];
    }
  }

  // 停用用戶
  static async deactivateUser(lineUserId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('line_user_id', lineUserId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('停用用戶失敗:', error);
      throw error;
    }
  }

  // 更新用戶的群組顯示名稱
  static async updateGroupDisplayName(userId, groupDisplayName) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ 
          group_display_name: groupDisplayName,
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      console.log(`✅ 更新群組顯示名稱: ${groupDisplayName}`);
      return data;
    } catch (error) {
      console.error('更新群組顯示名稱失敗:', error);
      throw error;
    }
  }

  // 自動分析訊息中的名稱
  static async analyzeNameFromMessage(user, messageText) {
    try {
      // 常見的自我介紹模式
      const patterns = [
        /我是([^，。！？\s]+)/,
        /這是([^，。！？\s]+)/,
        /叫我([^，。！？\s]+)/,
        /^([A-Za-z0-9\u4e00-\u9fa5\/\-\_\+]+)$/, // 單獨的名稱
      ];

      for (const pattern of patterns) {
        const match = messageText.match(pattern);
        if (match && match[1] && match[1].length > 1 && match[1].length < 30) {
          const possibleName = match[1].trim();
          
          // 避免誤判常見詞彙
          const commonWords = ['今天', '昨天', '明天', '什麼', '怎麼', '哪裡', '這樣', '那樣'];
          if (!commonWords.includes(possibleName)) {
            console.log(`🔍 發現可能的群組名稱: ${possibleName} (來自用戶: ${user.display_name})`);
            
            // 如果用戶還沒有群組顯示名稱，自動設定
            if (!user.group_display_name) {
              await this.updateGroupDisplayName(user.id, possibleName);
              return possibleName;
            }
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('分析訊息中的名稱失敗:', error);
      return null;
    }
  }
}

module.exports = UserService;