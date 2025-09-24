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
}

module.exports = UserService;