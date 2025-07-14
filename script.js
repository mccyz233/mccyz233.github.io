document.addEventListener('DOMContentLoaded', function() {
    // 获取API数据并渲染账户列表
    fetchAccountData();
    
    // 复制功能 - 会在渲染账户列表后添加事件监听器
    setupCopyButtons();
});

// 从API获取账户数据
async function fetchAccountData(retryCount = 0) {
    const accountsGrid = document.querySelector('.accounts-grid');
    
    // 显示加载状态
    if (accountsGrid) {
        accountsGrid.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>加载账户中...</span>
            </div>
        `;
    }
    
    try {
        const getApiPath = () => {
            // 分成多个片段
            const p1 = 'aHR0c';
            const p2 = 'HM6Ly9h';
            const p3 = 'LmM5OC5';
            const p4 = 'ldS9hcGk';
            const p5 = 'vYXBwaW';
            const p6 = 'RzLmpzb24=';
            
            let parts = [p3, p1, p6, p2, p5, p4];
            parts = [parts[1], parts[3], parts[0], parts[5], parts[4], parts[2]];
            
            try {
                return atob(parts.join(''));
            } catch (e) {
                return 'data:text/plain,{"error":"API_ERROR"}';
            }
        };
        
        const apiPath = getApiPath();
        const response = await fetch(apiPath);
        
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.ids && Array.isArray(data.ids)) {
            renderAccounts(data.ids);
        } else {
            throw new Error('API数据格式不正确');
        }
    } catch (error) {
        console.error('获取API数据失败:', error);
        
        // 显示错误信息
        if (accountsGrid) {
            // 如果重试次数小于3，则尝试重试
            if (retryCount < 3) {
                accountsGrid.innerHTML = `
                    <div class="loading">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>加载失败，正在重试 (${retryCount + 1}/3)...</span>
                    </div>
                `;
                
                // 延迟2秒后重试
                setTimeout(() => {
                    fetchAccountData(retryCount + 1);
                }, 2000);
            } else {
                // 超过重试次数，显示最终错误
                accountsGrid.innerHTML = `
                    <div class="loading error">
                        <i class="fas fa-times-circle"></i>
                        <span>账户数据加载失败，请稍后刷新页面重试</span>
                        <button class="btn retry-btn" onclick="fetchAccountData()">重新加载</button>
                    </div>
                `;
            }
        }
    }
}

// 渲染账户列表
function renderAccounts(accounts) {
    const accountsGrid = document.querySelector('.accounts-grid');
    if (!accountsGrid) return;
    
    // 清空现有内容
    accountsGrid.innerHTML = '';
    
    // 遍历账户数据并创建卡片
    accounts.forEach((account, index) => {
        const accountCard = document.createElement('div');
        accountCard.className = 'account-card';
        
        // 解码状态 - 处理Unicode编码的中文
        let decodedStatus = "正常";
        try {
            // 直接使用JSON.parse解析Unicode编码
            decodedStatus = JSON.parse('"' + account.status + '"');
        } catch (error) {
            console.error('状态解码失败:', error);
        }
        
        // 格式化更新时间
        const updateTime = formatDate(account.update_time);
        
        // 设置状态样式
        let statusClass = 'active';
        if (decodedStatus !== '正常') {
            statusClass = 'warning';
        }
        
        // 处理账户显示，只显示前4位和@后面的部分
        const maskedAccount = maskAccount(account.account);
        
        accountCard.innerHTML = `
            <div class="credentials">
                <div class="credential-row">
                    <span class="label">账户:</span>
                    <span id="account-${index + 1}" class="value">${maskedAccount}</span>
                </div>
            </div>
            <div class="account-status">
                <span class="status-badge ${statusClass}">${decodedStatus}</span>
                <span class="update-time">${updateTime}更新</span>
            </div>
            <div class="copy-actions">
                <button class="copy-btn" data-copy="account-${index + 1}" data-real="${account.account}">复制账户 <i class="fas fa-copy"></i></button>
                <button class="copy-btn password-btn" data-real="${account.password}">复制密码 <i class="fas fa-key"></i></button>
            </div>
        `;
        
        accountsGrid.appendChild(accountCard);
    });
    
    // 更新复制按钮事件监听器
    setupCopyButtons();
}

// 账户部分隐藏处理
function maskAccount(account) {
    if (!account) return '';
    
    const atIndex = account.indexOf('@');
    if (atIndex <= 0) return account;
    
    // 显示前4位和@后面的部分
    const prefix = account.substring(0, Math.min(4, atIndex));
    const suffix = account.substring(atIndex);
    
    // 中间部分用*替代
    const maskedPart = '*'.repeat(Math.max(0, atIndex - 4));
    
    return prefix + maskedPart + suffix;
}

// 格式化日期为"几分钟前"格式
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        const now = new Date();
        
        if (isNaN(date.getTime())) {
            return dateString.split(' ')[0]; // 如果解析失败，至少返回日期部分
        }
        
        const diffMs = now - date;
        const diffMins = Math.round(diffMs / (1000 * 60));
        const diffHours = Math.round(diffMs / (1000 * 60 * 60));
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        
        // 根据时间差显示不同的格式
        if (diffMins < 1) {
            return '刚刚';
        } else if (diffMins < 60) {
            return `${diffMins}分钟前`;
        } else if (diffHours < 24) {
            return `${diffHours}小时前`;
        } else {
            return `${diffDays}天前`;
        }
    } catch (error) {
        console.error('日期格式化失败:', error);
        return dateString;
    }
}

// 设置复制按钮事件监听器
function setupCopyButtons() {
    const copyButtons = document.querySelectorAll('.copy-btn');

    if (copyButtons) {
        copyButtons.forEach(button => {
            // 移除之前可能存在的事件监听器
            button.removeEventListener('click', handleCopyClick);
            // 添加新的事件监听器
            button.addEventListener('click', handleCopyClick);
        });
    }
}

// 复制按钮点击事件处理函数
function handleCopyClick() {
    // 获取要复制的元素ID和真实值
    const targetId = this.getAttribute('data-copy');
    const realValue = this.getAttribute('data-real');
    
    if (realValue) {
        // 使用现代 Clipboard API 进行复制，如果不支持则降级到传统方法
        copyTextToClipboard(realValue, this);
    }
}

// 复制文本到剪贴板的现代方法
async function copyTextToClipboard(text, button) {
    try {
        // 尝试使用现代 Clipboard API
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            showCopyModal(button.innerHTML.includes('账户') ? '账户' : '密码');
        } else {
            // 降级方法，适用于不支持 Clipboard API 的浏览器或非安全上下文
            fallbackCopyTextToClipboard(text, button);
        }
    } catch (err) {
        console.error('复制失败:', err);
        // 降级到传统方法
        fallbackCopyTextToClipboard(text, button);
    }
}

// 降级的复制方法，适用于不支持 Clipboard API 的浏览器
function fallbackCopyTextToClipboard(text, button) {
    // 创建临时文本区域，定位在屏幕之外
    const textarea = document.createElement('textarea');
    textarea.value = text;
    
    // 移动设备优化：设置为可见但位于视图之外
    textarea.style.position = 'fixed';
    textarea.style.left = '999999px';
    textarea.style.top = '0';
    textarea.style.opacity = '0';
    textarea.style.zIndex = '-1';
    
    document.body.appendChild(textarea);
    
    // 触摸设备处理
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
        // 移动设备特殊处理
        const range = document.createRange();
        range.selectNodeContents(textarea);
        
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        
        textarea.setSelectionRange(0, text.length);
    } else {
        // 桌面设备处理
        textarea.select();
    }
    
    // 尝试执行复制命令
    let successful = false;
    try {
        successful = document.execCommand('copy');
    } catch (err) {
        console.error('复制失败:', err);
    }
    
    // 移除临时元素
    document.body.removeChild(textarea);
    
    if (successful) {
        showCopyModal(button.innerHTML.includes('账户') ? '账户' : '密码');
    } else {
        alert('复制失败，请手动长按选择复制');
    }
}

// 显示复制成功弹窗
function showCopyModal(type) {
    // 检查是否已存在modal，如果存在则移除
    const existingModal = document.querySelector('.copy-modal');
    if (existingModal) {
        document.body.removeChild(existingModal);
    }
    
    // 创建modal元素
    const modal = document.createElement('div');
    modal.className = 'copy-modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-check-circle"></i> ${type}复制成功</h3>
            </div>
            <div class="modal-body">
                <p>已成功复制到剪贴板</p>
                <p class="warning-text"><i class="fas fa-exclamation-triangle"></i> 请不要将共享账号登陆到手机设置或iCloud里！否则会被锁机变砖！</p>
            </div>
            <div class="modal-footer">
                <button class="close-modal-btn">确定</button>
            </div>
        </div>
    `;
    
    // 添加到body
    document.body.appendChild(modal);
    
    // 淡入效果已通过CSS实现
    
    // 关闭弹窗的通用函数
    const closeModal = () => {
        const modalContent = modal.querySelector('.modal-content');
        modalContent.classList.add('modal-fade-out');
        
        // 等待动画完成后移除模态框
        setTimeout(() => {
            if (document.body.contains(modal)) {
                document.body.removeChild(modal);
            }
        }, 300); // 动画持续时间为0.3秒
    };
    
    // 给确定按钮添加事件
    const closeBtn = modal.querySelector('.close-modal-btn');
    closeBtn.addEventListener('click', closeModal);
    
    // 点击模态框外部关闭
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });
    
    // 自动关闭功能已移除
} 