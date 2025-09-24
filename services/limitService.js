const { supabase } = require('../config/supabase');

class LimitService {
  // 檢查是否可以接受新用戶
  static async canAcceptNewUser(lineUserId) {
    try {
      const { data, error } = await supabase.rpc('can_accept_new_user', {
        new_line_user_id: lineUserId
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('檢查用戶限制失敗:', error);
      return false;
    }
  }

  // 檢查訊息限制
  static async checkMessageLimits() {
    try {
      const { data, error } = await supabase.rpc('check_message_limits');
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('檢查訊息限制失敗:', error);
      return false;
    }
  }

  // 取得目前統計資訊
  static async getStats() {
    try {
      const { data, error } = await supabase
        .from('system_stats')
        .select('*');
      
      if (error) throw error;
      
      const stats = {};
      data.forEach(stat => {
        stats[stat.stat_name] = stat.stat_value;
      });
      
      return stats;
    } catch (error) {
      console.error('取得統計資訊失敗:', error);
      return {};
    }
  }

  // 取得限制設定
  static async getLimits() {
    try {
      const { data, error } = await supabase
        .from('message_limits')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      
      const limits = {};
      data.forEach(limit => {
        limits[limit.limit_type] = {
          limit_value: limit.limit_value,
          current_count: limit.current_count
        };
      });
      
      return limits;
    } catch (error) {
      console.error('取得限制設定失敗:', error);
      return {};
    }
  }
}

module.exports = LimitService;