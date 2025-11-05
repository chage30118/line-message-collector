const { supabase } = require('../config/supabase');

class UserService {
  // 取得或建立用戶 (整合 LINE Profile API)
  static async getOrCreateUser(lineUserId, userProfile = null, groupDisplayName = null) {
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
        const updateData = {};
        
        // 更新用戶基本資訊 (來自 LINE Profile API)
        if (userProfile) {
          updateData.display_name = userProfile.displayName;
          updateData.picture_url = userProfile.pictureUrl;
          updateData.status_message = userProfile.statusMessage;
          updateData.language = userProfile.language;
          updateData.updated_at = new Date().toISOString();
          
          console.log(`🔄 更新用戶 LINE 資料: ${userProfile.displayName || lineUserId}`);
        }
        
        // 更新群組名稱（如果提供且尚未設定）
        if (groupDisplayName && !existingUser.group_display_name) {
          updateData.group_display_name = groupDisplayName;
          console.log(`🏷️ 為用戶設定群組名稱: ${userProfile?.displayName || lineUserId} -> ${groupDisplayName}`);
        }
        
        // 分析並建議客戶姓名（如果尚未設定）
        if (userProfile && !existingUser.customer_name) {
          const suggestion = this.analyzeCustomerNameFromProfile(userProfile);
          if (suggestion) {
            updateData.suggested_name = suggestion;
            console.log(`💡 建議客戶姓名: ${userProfile.displayName} -> ${suggestion}`);
          }
        }
        
        // 如果有更新資料，才執行更新
        if (Object.keys(updateData).length > 0) {
          const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update(updateData)
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
        group_display_name: groupDisplayName || null,
        is_active: true
      };
      
      if (groupDisplayName) {
        console.log(`🆕 建立新用戶並設定群組名稱: ${userProfile?.displayName || lineUserId} -> ${groupDisplayName}`);
      }

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

  // 智能分析客戶姓名（輔助功能）
  static async analyzeCustomerNameFromMessage(user, messageText) {
    try {
      // 常見的自我介紹模式
      const patterns = [
        /我是([^，。！？\s]+)/,
        /我叫([^，。！？\s]+)/,
        /叫我([^，。！？\s]+)/,
        /姓名[：:]\s*([^，。！？\s]+)/,
        /名字[：:]\s*([^，。！？\s]+)/,
        // 更嚴格的單獨名稱匹配
        /^([A-Za-z\u4e00-\u9fa5]{2,8})$/, // 只允許中英文，2-8個字符
      ];

      for (const pattern of patterns) {
        const match = messageText.match(pattern);
        if (match && match[1] && match[1].length >= 2 && match[1].length <= 8) {
          const possibleName = match[1].trim();
          
          // 避免誤判常見詞彙和商品名稱
          const excludeWords = [
            '今天', '昨天', '明天', '什麼', '怎麼', '哪裡', '這樣', '那樣',
            '公司', '店面', '手機', '電話', '地址', '時間', '價格', '數量',
            '商品', '產品', '服務', '訂單', '購買', '付款', '配送'
          ];
          
          if (!excludeWords.some(word => possibleName.includes(word))) {
            console.log(`🤖 AI建議客戶姓名: ${possibleName} (來自訊息: "${messageText.substring(0, 20)}...")`);
            
            // 只建議，不自動設定。需要客服確認
            return {
              suggested: true,
              name: possibleName,
              source: 'message_analysis',
              confidence: 'medium'
            };
          }
        }
      }

      // 從 display_name 提取建議
      if (user.display_name) {
        const extractedName = this.extractNameFromDisplayName(user.display_name);
        if (extractedName) {
          console.log(`🤖 AI建議客戶姓名: ${extractedName} (來自LINE名稱: ${user.display_name})`);
          return {
            suggested: true,
            name: extractedName,
            source: 'display_name_analysis',
            confidence: 'high'
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('智能分析客戶姓名失敗:', error);
      return null;
    }
  }

  // 從 LINE Profile 分析可能的客戶姓名
  static analyzeCustomerNameFromProfile(userProfile) {
    if (!userProfile || !userProfile.displayName) return null;

    try {
      const displayName = userProfile.displayName.trim();
      
      // 1. 檢查是否為明顯的真實姓名模式
      const namePatterns = {
        // 中文姓名模式 (2-4個中文字)
        chineseName: /^[\u4e00-\u9fa5]{2,4}$/,
        // 英文姓名模式
        englishName: /^[A-Za-z\s]{2,20}$/,
        // 姓名 + 常見後綴
        nameWithSuffix: /^([\u4e00-\u9fa5A-Za-z\s]{2,10})\s*[-–—]?\s*(先生|小姐|女士|老師|經理|主任)$/
      };

      // 檢查中文姓名
      if (namePatterns.chineseName.test(displayName)) {
        return {
          suggested_name: displayName,
          source: 'profile_chinese_name',
          confidence: 'high'
        };
      }

      // 檢查帶後綴的姓名
      const suffixMatch = displayName.match(namePatterns.nameWithSuffix);
      if (suffixMatch) {
        return {
          suggested_name: suffixMatch[1].trim(),
          source: 'profile_name_with_suffix',
          confidence: 'medium'
        };
      }

      // 檢查英文姓名
      if (namePatterns.englishName.test(displayName) && !displayName.toLowerCase().includes('user')) {
        return {
          suggested_name: displayName,
          source: 'profile_english_name',
          confidence: 'medium'
        };
      }

      // 2. 清理顯示名稱，移除非姓名元素
      const cleanedName = this.extractNameFromDisplayName(displayName);
      if (cleanedName) {
        return {
          suggested_name: cleanedName,
          source: 'profile_cleaned_name',
          confidence: 'low'
        };
      }

      return null;
    } catch (error) {
      console.error('分析 Profile 姓名失敗:', error);
      return null;
    }
  }

  // 從 display_name 提取可能的客戶姓名
  static extractNameFromDisplayName(displayName) {
    if (!displayName || displayName.length < 2) return null;

    // 移除常見的後綴和前綴
    const patterns = [
      // 後綴模式
      { pattern: /(.+?)[-–—]?(公用手機|手機|的手機|iPhone|Android)$/, group: 1 },
      { pattern: /(.+?)[-–—]?(老闆|主管|經理|助理|秘書)$/, group: 1 },
      { pattern: /(.+?)[-–—]?(媽媽|爸爸|姐姐|哥哥|弟弟|妹妹)$/, group: 1 },
      // 移除表情符號和數字
      { pattern: /^(.+?)[🐶🐱😊👍💪❤️💯\d\s]*$/, group: 1 },
      // 移除英文後綴
      { pattern: /^(.+?)\s*(phone|mobile|cell|work|home)$/i, group: 1 }
    ];

    for (const { pattern, group } of patterns) {
      const match = displayName.match(pattern);
      if (match && match[group]) {
        const cleanName = match[group].trim();
        
        // 檢查清理後的名稱是否合理
        if (cleanName.length >= 2 && cleanName.length <= 10 && cleanName !== displayName) {
          return cleanName;
        }
      }
    }

    return null;
  }
}

module.exports = UserService;

module.exports = UserService;