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
                <span>加载账户中...</span>
            </div>
        `;
    }
    
    try {
        const response = await fetch('https://a.c98.eu/api/appids.json');
        
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
                <button class="copy-btn" data-copy="account-${index + 1}" data-real="${account.account}">复制账户</button>
                <button class="copy-btn password-btn" data-real="${account.password}">复制密码</button>
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

// 格式化日期
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return dateString.split(' ')[0]; // 如果解析失败，至少返回日期部分
        }
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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
        // 创建临时文本区域
        const textarea = document.createElement('textarea');
        textarea.value = realValue;
        document.body.appendChild(textarea);
        
        // 选择文本并复制
        textarea.select();
        document.execCommand('copy');
        
        // 移除临时元素
        document.body.removeChild(textarea);
        
        // 显示复制成功反馈
        const originalText = this.innerHTML;
        this.innerHTML = '复制成功';
        this.classList.add('copied');
        
        // 2秒后恢复原始文本
        setTimeout(() => {
            this.innerHTML = originalText;
            this.classList.remove('copied');
        }, 2000);
    }
} 