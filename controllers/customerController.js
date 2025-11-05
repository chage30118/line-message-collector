// 客戶姓名管理 API 控制器
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// 獲取所有需要設定姓名的客戶
const getCustomersNeedingNames = async (req, res) => {
    try {
        // 獲取沒有設定 customer_name 的用戶
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .or('customer_name.is.null,customer_name.eq.')
            .order('last_message_at', { ascending: false });

        if (error) {
            throw error;
        }

        // 為每個用戶添加最近的消息作為參考
        const usersWithMessages = await Promise.all(
            users.map(async (user) => {
                const { data: messages } = await supabase
                    .from('messages')
                    .select('text, timestamp')
                    .eq('user_id', user.user_id)
                    .order('timestamp', { ascending: false })
                    .limit(3);

                return {
                    ...user,
                    recent_messages: messages || []
                };
            })
        );

        res.json({
            success: true,
            customers: usersWithMessages
        });
    } catch (error) {
        console.error('獲取客戶列表失敗:', error);
        res.status(500).json({
            success: false,
            message: '獲取客戶列表失敗',
            error: error.message
        });
    }
};

// 批量更新客戶姓名
const batchUpdateCustomerNames = async (req, res) => {
    try {
        const { updates } = req.body; // 預期格式: [{ user_id, customer_name }]

        if (!Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: '請提供有效的更新資料'
            });
        }

        const results = [];
        
        for (const update of updates) {
            const { user_id, customer_name } = update;
            
            if (!user_id || !customer_name) {
                results.push({
                    user_id,
                    success: false,
                    message: '缺少必要資料'
                });
                continue;
            }

            try {
                const { error } = await supabase
                    .from('users')
                    .update({ 
                        customer_name: customer_name.trim(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_id', user_id);

                if (error) {
                    throw error;
                }

                results.push({
                    user_id,
                    success: true,
                    customer_name
                });
            } catch (error) {
                results.push({
                    user_id,
                    success: false,
                    message: error.message
                });
            }
        }

        const successCount = results.filter(r => r.success).length;
        
        res.json({
            success: true,
            message: `成功更新 ${successCount} 位客戶姓名`,
            results
        });
    } catch (error) {
        console.error('批量更新失敗:', error);
        res.status(500).json({
            success: false,
            message: '批量更新失敗',
            error: error.message
        });
    }
};

// 匯出客戶資料為 CSV
const exportCustomerData = async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('user_id, display_name, customer_name, created_at, last_message_at')
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        // 生成 CSV 內容
        const csvHeader = 'user_id,display_name,customer_name,created_at,last_message_at\n';
        const csvRows = users.map(user => {
            return [
                user.user_id,
                `"${user.display_name || ''}"`,
                `"${user.customer_name || ''}"`,
                user.created_at,
                user.last_message_at || ''
            ].join(',');
        }).join('\n');

        const csvContent = csvHeader + csvRows;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="customer_data.csv"');
        res.send('\ufeff' + csvContent); // 加入 BOM 支援中文
    } catch (error) {
        console.error('匯出資料失敗:', error);
        res.status(500).json({
            success: false,
            message: '匯出資料失敗',
            error: error.message
        });
    }
};

// 匯入客戶資料從 CSV
const importCustomerData = async (req, res) => {
    try {
        const { csvData } = req.body;
        
        if (!csvData) {
            return res.status(400).json({
                success: false,
                message: '請提供 CSV 資料'
            });
        }

        // 解析 CSV 資料
        const lines = csvData.split('\n').filter(line => line.trim());
        const header = lines[0];
        const dataLines = lines.slice(1);

        if (!header.includes('user_id') || !header.includes('customer_name')) {
            return res.status(400).json({
                success: false,
                message: 'CSV 格式錯誤，需要 user_id 和 customer_name 欄位'
            });
        }

        const headerCols = header.split(',');
        const userIdIndex = headerCols.findIndex(col => col.includes('user_id'));
        const customerNameIndex = headerCols.findIndex(col => col.includes('customer_name'));

        const updates = [];
        const errors = [];

        for (let i = 0; i < dataLines.length; i++) {
            const cols = dataLines[i].split(',');
            const user_id = cols[userIdIndex]?.replace(/"/g, '').trim();
            const customer_name = cols[customerNameIndex]?.replace(/"/g, '').trim();

            if (!user_id || !customer_name) {
                errors.push(`第 ${i + 2} 行資料不完整`);
                continue;
            }

            updates.push({ user_id, customer_name });
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: '沒有有效的更新資料',
                errors
            });
        }

        // 批量更新
        const results = [];
        for (const update of updates) {
            try {
                const { error } = await supabase
                    .from('users')
                    .update({ 
                        customer_name: update.customer_name,
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_id', update.user_id);

                if (error) {
                    throw error;
                }

                results.push({
                    user_id: update.user_id,
                    success: true
                });
            } catch (error) {
                results.push({
                    user_id: update.user_id,
                    success: false,
                    message: error.message
                });
            }
        }

        const successCount = results.filter(r => r.success).length;

        res.json({
            success: true,
            message: `成功匯入 ${successCount} 位客戶資料`,
            total: updates.length,
            results,
            errors
        });
    } catch (error) {
        console.error('匯入資料失敗:', error);
        res.status(500).json({
            success: false,
            message: '匯入資料失敗',
            error: error.message
        });
    }
};

// 獲取客戶統計資料
const getCustomerStats = async (req, res) => {
    try {
        const { data: totalUsers, error: totalError } = await supabase
            .from('users')
            .select('user_id', { count: 'exact', head: true });

        const { data: namedUsers, error: namedError } = await supabase
            .from('users')
            .select('user_id', { count: 'exact', head: true })
            .not('customer_name', 'is', null)
            .neq('customer_name', '');

        if (totalError || namedError) {
            throw totalError || namedError;
        }

        const totalCount = totalUsers || 0;
        const namedCount = namedUsers || 0;
        const unnamedCount = totalCount - namedCount;

        res.json({
            success: true,
            stats: {
                total_customers: totalCount,
                named_customers: namedCount,
                unnamed_customers: unnamedCount,
                completion_rate: totalCount > 0 ? Math.round((namedCount / totalCount) * 100) : 0
            }
        });
    } catch (error) {
        console.error('獲取統計資料失敗:', error);
        res.status(500).json({
            success: false,
            message: '獲取統計資料失敗',
            error: error.message
        });
    }
};

module.exports = {
    getCustomersNeedingNames,
    batchUpdateCustomerNames,
    exportCustomerData,
    importCustomerData,
    getCustomerStats
};