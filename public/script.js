// 全域變數
let currentPage = 1;
let currentLimit = 20;
let allMessages = [];
let allUsers = [];

// 更新用戶的群組顯示名稱
async function updateGroupDisplayName(userId, groupDisplayName) {
    try {
        if (!groupDisplayName || groupDisplayName.trim().length === 0) {
            showNotification('⚠️ 群組顯示名稱不能為空', 'error');
            return;
        }

        showNotification('🔄 正在更新群組顯示名稱...', 'info');

        const response = await fetch(`/api/users/${userId}/group-name`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                groupDisplayName: groupDisplayName.trim()
            })
        });

        const result = await response.json();

        if (response.ok) {
            showNotification(`✅ 群組顯示名稱更新成功: ${groupDisplayName}`, 'success');
            // 重新載入用戶列表
            setTimeout(() => loadUsers(), 1000);
        } else {
            throw new Error(result.error || '更新失敗');
        }
    } catch (error) {
        console.error('更新群組顯示名稱失敗:', error);
        showNotification(`❌ 更新失敗: ${error.message}`, 'error');
    }
}

// 通知系統
console.log('Defining showNotification function');
function showNotification(message, type = 'info') {
    console.log('showNotification called with:', message, type);
    // 移除現有通知
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // 創建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;

    // 添加到頁面
    document.body.appendChild(notification);

    // 3秒後自動移除
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

// 頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', function() {
    loadStats();
    loadMessages();
    
    // 每30秒自動更新統計資訊
    setInterval(loadStats, 30000);
});

// 切換頁籤
function showTab(tabName) {
    // 隱藏所有頁籤內容
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // 移除所有導航按鈕的 active 類別
    document.querySelectorAll('.nav-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 顯示選中的頁籤
    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');
    
    // 載入對應資料
    switch(tabName) {
        case 'messages':
            if (allMessages.length === 0) loadMessages();
            break;
        case 'users':
            if (allUsers.length === 0) loadUsers();
            break;
        case 'search':
            // 搜尋頁籤不需要預載入資料
            break;
    }
}

// 載入統計資訊
async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        
        // 更新統計顯示
        document.getElementById('totalMessages').textContent = data.stats.total_messages || 0;
        document.getElementById('totalUsers').textContent = data.stats.total_users || 0;
        document.getElementById('totalFiles').textContent = data.stats.total_files || 0;
        
        // 更新限制顯示
        const messageLimit = data.limits.max_messages;
        const userLimit = data.limits.max_users;
        
        document.getElementById('messageLimit').textContent = 
            `${messageLimit.current_count}/${messageLimit.limit_value}`;
        document.getElementById('userLimit').textContent = 
            `${userLimit.current_count}/${userLimit.limit_value}`;
            
        // 檢查是否接近限制
        checkLimits(data.limits);
        
    } catch (error) {
        console.error('載入統計資訊失敗:', error);
    }
}

// 檢查限制狀態
function checkLimits(limits) {
    const messageLimit = limits.max_messages;
    const userLimit = limits.max_users;
    
    // 訊息達到90%時警告
    if (messageLimit.current_count / messageLimit.limit_value >= 0.9) {
        document.getElementById('messageLimit').style.color = '#ff6b6b';
    }
    
    // 用戶達到90%時警告
    if (userLimit.current_count / userLimit.limit_value >= 0.9) {
        document.getElementById('userLimit').style.color = '#ff6b6b';
    }
}

// 載入訊息列表
async function loadMessages() {
    try {
        showLoading('messageList');
        
        const offset = (currentPage - 1) * currentLimit;
        const response = await fetch(`/api/messages?limit=${currentLimit}&offset=${offset}`);
        const data = await response.json();
        
        allMessages = data.messages;
        displayMessages(allMessages);
        updatePagination(data.count);
        
    } catch (error) {
        console.error('載入訊息失敗:', error);
        showError('messageList', '載入訊息失敗');
    }
}

// 顯示訊息列表
function displayMessages(messages) {
    const container = document.getElementById('messageList');
    
    if (messages.length === 0) {
        container.innerHTML = '<div class="loading">目前沒有訊息</div>';
        return;
    }
    
    const html = messages.map(message => {
        const user = message.users;
        const timestamp = new Date(message.timestamp).toLocaleString('zh-TW');
        
        return `
            <div class="message-item">
                <div class="message-header">
                    <div class="user-info">
                        ${user.picture_url ? 
                            `<img src="${user.picture_url}" alt="用戶頭像" class="user-avatar">` : 
                            '<div class="user-avatar" style="background: #ddd; display: flex; align-items: center; justify-content: center;">👤</div>'
                        }
                        <div>
                            <div class="user-name">${user.display_name || '未知用戶'}</div>
                            ${user.group_display_name ? 
                                `<div class="group-name" style="font-size: 0.8rem; color: #007bff; font-weight: 500;">🏷️ ${user.group_display_name}</div>` : 
                                ''
                            }
                            <div style="font-size: 0.8rem; color: #666;">${user.line_user_id}</div>
                        </div>
                    </div>
                    <div class="message-type ${message.message_type}">${getMessageTypeText(message.message_type)}</div>
                </div>
                
                <div class="message-content">
                    ${renderMessageContent(message)}
                </div>
                
                <div class="message-timestamp">${timestamp}</div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// 渲染訊息內容
function renderMessageContent(message) {
    switch (message.message_type) {
        case 'text':
            return `<div class="message-text">${escapeHtml(message.text_content)}</div>`;
        
        case 'image':
        case 'file':
        case 'audio':
        case 'video':
            return `
                <div class="file-info">
                    <div class="file-icon">${getFileIcon(message.message_type, message.file_type)}</div>
                    <div class="file-details">
                        <h4>${message.file_name}</h4>
                        <p>大小: ${formatFileSize(message.file_size)}</p>
                        <p>類型: ${message.file_type}</p>
                    </div>
                    <button class="download-btn" onclick="downloadFile('${message.file_id}', '${message.file_name}')">
                        📥 下載
                    </button>
                </div>
            `;
        
        default:
            return '<div>未知訊息類型</div>';
    }
}

// 載入用戶列表
async function loadUsers() {
    try {
        showLoading('userList');
        
        const response = await fetch('/api/users');
        const data = await response.json();
        
        allUsers = data.users;
        displayUsers(allUsers);
        
    } catch (error) {
        console.error('載入用戶失敗:', error);
        showError('userList', '載入用戶失敗');
    }
}

// 顯示用戶列表
function displayUsers(users) {
    const container = document.getElementById('userList');
    
    if (users.length === 0) {
        container.innerHTML = '<div class="loading">目前沒有用戶</div>';
        return;
    }
    
    const html = users.map(user => {
        const createdAt = new Date(user.created_at).toLocaleDateString('zh-TW');
        
        return `
            <div class="user-card" data-user-id="${user.id}">
                ${user.picture_url ? 
                    `<img src="${user.picture_url}" alt="用戶頭像" class="user-avatar">` : 
                    '<div class="user-avatar" style="background: #ddd; display: flex; align-items: center; justify-content: center; font-size: 2rem;">👤</div>'
                }
                <h3>${user.display_name || '未知用戶'}</h3>
                <div class="group-name-section">
                    <p><strong>群組名稱:</strong></p>
                    <div class="group-name-input-container">
                        <input type="text" 
                               class="group-name-input" 
                               value="${user.group_display_name || ''}" 
                               placeholder="輸入群組中的顯示名稱"
                               onchange="updateGroupDisplayName(${user.id}, this.value)">
                        <button class="update-name-btn" onclick="updateGroupDisplayName(${user.id}, this.parentElement.querySelector('.group-name-input').value)">
                            💾 更新
                        </button>
                    </div>
                </div>
                <p><strong>用戶 ID:</strong> ${user.line_user_id}</p>
                <p><strong>加入時間:</strong> ${createdAt}</p>
                <p><strong>語言:</strong> ${user.language || '未知'}</p>
                ${user.status_message ? `<p><strong>狀態:</strong> ${user.status_message}</p>` : ''}
                <button class="user-messages-btn" onclick="showUserMessages('${user.line_user_id}')">
                    📝 查看訊息
                </button>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// 查看特定用戶的訊息
async function showUserMessages(lineUserId) {
    try {
        // 切換到訊息頁籤
        showTab('messages');
        
        // 載入該用戶的訊息
        const response = await fetch(`/api/messages/user/${lineUserId}`);
        const data = await response.json();
        
        displayMessages(data.messages);
        
        // 更新頁面標題顯示正在查看特定用戶
        const user = allUsers.find(u => u.line_user_id === lineUserId);
        const userName = user ? user.display_name : lineUserId;
        
        // 顯示成功訊息
        showNotification(`✅ 正在顯示用戶 ${userName} 的訊息 (${data.count} 則)`, 'success');
        
    } catch (error) {
        console.error('載入用戶訊息失敗:', error);
        showNotification('❌ 載入用戶訊息失敗', 'error');
    }
}

// 搜尋訊息
async function searchMessages() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    
    if (!searchTerm) {
        showNotification('⚠️ 請輸入搜尋條件', 'error');
        return;
    }
    
    try {
        showLoading('searchResults');
        
        // 這裡簡單實作前端搜尋，實際應用中應該在後端實作
        const response = await fetch('/api/messages?limit=1000');
        const data = await response.json();
        
        const filteredMessages = data.messages.filter(message => {
            const userName = message.users.display_name || '';
            const groupName = message.users.group_display_name || '';
            const textContent = message.text_content || '';
            const fileName = message.file_name || '';
            
            return userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   textContent.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   fileName.toLowerCase().includes(searchTerm.toLowerCase());
        });
        
        displaySearchResults(filteredMessages, searchTerm);
        
    } catch (error) {
        console.error('搜尋失敗:', error);
        showError('searchResults', '搜尋失敗');
    }
}

// 顯示搜尋結果
function displaySearchResults(messages, searchTerm) {
    const container = document.getElementById('searchResults');
    
    if (messages.length === 0) {
        container.innerHTML = `<div class="loading">找不到包含 "${searchTerm}" 的訊息</div>`;
        return;
    }
    
    const html = `
        <h3>搜尋結果: "${searchTerm}" (${messages.length} 則)</h3>
        <div style="margin-top: 1rem;">
            ${messages.map(message => {
                const user = message.users;
                const timestamp = new Date(message.timestamp).toLocaleString('zh-TW');
                
                return `
                    <div class="message-item">
                        <div class="message-header">
                            <div class="user-info">
                                ${user.picture_url ? 
                                    `<img src="${user.picture_url}" alt="用戶頭像" class="user-avatar">` : 
                                    '<div class="user-avatar" style="background: #ddd; display: flex; align-items: center; justify-content: center;">👤</div>'
                                }
                                <div>
                                    <div class="user-name">${user.display_name || '未知用戶'}</div>
                                    ${user.group_display_name ? 
                                        `<div class="group-name" style="font-size: 0.8rem; color: #007bff; font-weight: 500;">🏷️ ${user.group_display_name}</div>` : 
                                        ''
                                    }
                                    <div style="font-size: 0.8rem; color: #666;">${user.line_user_id}</div>
                                </div>
                            </div>
                            <div class="message-type ${message.message_type}">${getMessageTypeText(message.message_type)}</div>
                        </div>
                        
                        <div class="message-content">
                            ${renderMessageContent(message)}
                        </div>
                        
                        <div class="message-timestamp">${timestamp}</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    container.innerHTML = html;
}

// 下載檔案
function downloadFile(fileId, fileName) {
    const downloadUrl = `/api/files/${encodeURIComponent(fileId)}`;
    
    // 建立隱藏的下載連結
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 匯出資料
function exportData() {
    const exportOptions = [
        { value: 'users-csv', text: '📋 用戶資料 (CSV)' },
        { value: 'messages-csv', text: '💬 訊息資料 (CSV)' },
        { value: 'excel', text: '📊 完整資料 (Excel)' },
        { value: 'json', text: '💾 完整資料 (JSON)' },
        { value: 'images-zip', text: '📷 圖片檔案 (ZIP)' },
        { value: 'pdf', text: '📄 統計報告 (PDF)' }
    ];

    let optionsHtml = exportOptions.map(option => 
        `<button class="export-btn" onclick="downloadExport('${option.value}')">${option.text}</button>`
    ).join('');

    const exportModal = `
        <div class="modal-overlay" onclick="closeExportModal()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>📤 選擇匯出格式</h3>
                    <button class="close-btn" onclick="closeExportModal()">×</button>
                </div>
                <div class="modal-body">
                    <p>請選擇要匯出的資料格式：</p>
                    <div class="export-options">
                        ${optionsHtml}
                    </div>
                    <div class="export-info">
                        <small>
                            • CSV 格式適合在 Excel 中開啟<br>
                            • Excel 格式包含多個工作表和統計資料<br>
                            • JSON 格式適合程式化處理<br>
                            • ZIP 格式包含所有收集到的圖片檔案<br>
                            • PDF 格式生成統計報告和訊息摘要
                        </small>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', exportModal);
}

// 下載匯出檔案
async function downloadExport(type) {
    console.log('downloadExport called with type:', type);
    console.log('typeof showNotification:', typeof showNotification);
    const loadingText = '⏳ 正在產生匯出檔案...';
    showNotification(loadingText, 'info');

    try {
        let url;
        switch (type) {
            case 'users-csv':
                url = '/api/export/users/csv';
                break;
            case 'messages-csv':
                url = '/api/export/messages/csv';
                break;
            case 'excel':
                url = '/api/export/excel';
                break;
            case 'json':
                url = '/api/export/json';
                break;
            case 'images-zip':
                url = '/api/export/images/zip';
                break;
            case 'pdf':
                url = '/api/export/pdf';
                break;
            default:
                throw new Error('不支援的匯出格式');
        }

        // 先檢查端點是否可用
        const testResponse = await fetch(url, { method: 'HEAD' });
        
        if (!testResponse.ok) {
            if (testResponse.status === 404) {
                throw new Error('沒有找到圖片檔案，請先發送一些圖片到LINE Bot');
            }
            throw new Error(`伺服器錯誤 (${testResponse.status})`);
        }

        // 創建隱藏的下載連結
        const link = document.createElement('a');
        link.href = url;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 延遲顯示成功訊息
        setTimeout(() => {
            showNotification('✅ 匯出成功！檔案已開始下載', 'success');
            closeExportModal();
        }, 800);

    } catch (error) {
        console.error('匯出失敗:', error);
        let errorMessage = '❌ 匯出失敗: ' + error.message;
        
        showNotification(errorMessage, 'error');
        closeExportModal();
    }
}

// 關閉匯出視窗
function closeExportModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// 分頁控制
function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        loadMessages();
    }
}

function nextPage() {
    currentPage++;
    loadMessages();
}

function updatePagination(messageCount) {
    document.getElementById('pageInfo').textContent = `第 ${currentPage} 頁`;
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = messageCount < currentLimit;
}

// 工具函數
function showLoading(containerId) {
    document.getElementById(containerId).innerHTML = '<div class="loading">載入中...</div>';
}

function showError(containerId, message) {
    document.getElementById(containerId).innerHTML = `<div class="loading" style="color: #ff6b6b;">${message}</div>`;
}

function getMessageTypeText(type) {
    const types = {
        'text': '文字',
        'image': '圖片',
        'file': '檔案',
        'audio': '音訊',
        'video': '視訊'
    };
    return types[type] || type;
}

function getFileIcon(messageType, fileType) {
    if (messageType === 'image') return '🖼️';
    if (messageType === 'audio') return '🎵';
    if (messageType === 'video') return '🎬';
    
    if (fileType?.includes('pdf')) return '📄';
    if (fileType?.includes('word')) return '📝';
    if (fileType?.includes('excel')) return '📊';
    
    return '📁';
}

function formatFileSize(bytes) {
    if (!bytes) return '未知';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}