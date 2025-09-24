const { createClient } = require('@supabase/supabase-js');

// 初始化 Supabase 客戶端
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // 使用 service_role key 以獲得完整權限

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 測試連線函數
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('system_stats')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ Supabase 連線成功');
    return true;
  } catch (error) {
    console.error('❌ Supabase 連線失敗:', error.message);
    return false;
  }
}

module.exports = {
  supabase,
  testConnection
};