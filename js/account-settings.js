document.addEventListener('DOMContentLoaded', function() {
    // 初始化左侧预约状态卡片点击事件（无论是否登录都要初始化）
    initializeBookingStatCards();
    
    // 检查用户是否已登录
    if (!checkAuth()) return;
    
    // 检查是否为新注册用户
    const isNewUser = localStorage.getItem('isNewUser') === 'true';
    const urlParams = new URLSearchParams(window.location.search);
    const setupMode = urlParams.get('setup');
    
    // 账号设置页面初始化
    const userProfile = localStorage.getItem('userProfile');
    if (!userProfile) {
        // 新用户，所有内容都为空（只保留用户名和邮箱）
        initializeNewUserMode();
    } else {
        // 老用户，自动恢复资料
        updateUserInfo();
        loadProfile();
    }
    
    // 选项卡切换
    const tabButtons = document.querySelectorAll('.tab-btn');
    const settingsPanels = document.querySelectorAll('.settings-panel');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            settingsPanels.forEach(panel => panel.classList.remove('active'));
            document.getElementById(button.dataset.tab).classList.add('active');
            localStorage.setItem('activeTab', button.dataset.tab);
        });
    });

    // 设置默认选项卡
    let showDefaultTab = true;
    const activeTab = localStorage.getItem('activeTab');
    
    
    // 显示默认的个人资料选项卡
    if (showDefaultTab) {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        settingsPanels.forEach(panel => panel.classList.remove('active'));
        const profileButton = Array.from(tabButtons).find(btn => btn.dataset.tab === 'profile');
        if (profileButton) {
        profileButton.classList.add('active');
        document.getElementById('profile').classList.add('active');
            localStorage.setItem('activeTab', 'profile');
        }
    }

    // 头像上传
    const avatarInput = document.getElementById('avatar-input');
    const avatarPreview = document.getElementById('avatar-preview');
    const avatarOverlay = document.querySelector('.avatar-overlay');
    avatarOverlay?.addEventListener('click', () => avatarInput.click());
    avatarInput?.addEventListener('change', () => {
        const file = avatarInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                avatarPreview.src = e.target.result;
                // 保存头像数据到用户信息中
                updateUserAvatar(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

    // 密码强度检测
    const passwordInputs = document.querySelectorAll('.password-input input[type="password"]');
    const strengthBar = document.querySelector('.strength-bar .bar-fill');
    const strengthText = document.querySelector('.strength-text');

    passwordInputs.forEach(input => {
        input.addEventListener('input', () => {
            if (input.closest('#security')) {
                const password = input.value;
                const strength = checkPasswordStrength(password);
                
                // 更新密码强度指示器
                if (strengthBar && strengthText) {
                    strengthBar.style.width = `${strength.percent}%`;
                    strengthBar.style.backgroundColor = strength.color;
                    strengthText.textContent = `密码强度：${strength.text}`;
                }
            }
        });
    });

    // 密码可见性切换
    const toggleButtons = document.querySelectorAll('.toggle-password');
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const input = button.previousElementSibling;
            const icon = button.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
    
    // 保存按钮事件
    const saveButtons = document.querySelectorAll('.btn-save');
    saveButtons.forEach(button => {
        button.addEventListener('click', () => {
            const panel = button.closest('.settings-panel');
            if (panel) {
                const panelId = panel.id;
                saveSettings(panelId);
            }
        });
    });
    
    // 联系方式修改按钮事件
    document.querySelectorAll('.btn-modify').forEach(button => {
        button.addEventListener('click', function(e) {
            const inputField = this.previousElementSibling;
            if (inputField) {
                const inputId = inputField.id;
                enableInput(inputId, e);
            }
        });
    });

    // 添加地址按钮事件
    const addAddressBtn = document.querySelector('.btn-add-address');
    if (addAddressBtn) {
        addAddressBtn.addEventListener('click', showAddAddressModal);
    }
    
    // 修改密码按钮事件
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await updatePassword();
        });
    }

    // 加载用户数据
    loadUserData();
});

/**
 * 检查密码强度
 * @param {string} password - 密码
 * @returns {Object} - 密码强度对象
 */
function checkPasswordStrength(password) {
    if (!password) {
        return { percent: 0, text: '弱', color: '#ff4d4f' };
    }

    let strength = 0;
    
    // 长度检查
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    
    // 复杂度检查
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
    
    // 强度级别
    if (strength <= 2) {
        return { percent: 25, text: '弱', color: '#ff4d4f' };
    } else if (strength <= 4) {
        return { percent: 50, text: '中', color: '#faad14' };
    } else if (strength <= 5) {
        return { percent: 75, text: '强', color: '#52c41a' };
    } else {
        return { percent: 100, text: '非常强', color: '#1890ff' };
    }
}

/**
 * 显示提示消息
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型
 * @param {number} duration - 显示持续时间（毫秒），默认3000
 */
function showToast(message, type = 'success', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, duration);
}

/**
 * 加载用户数据
 */
async function loadUserData() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'index.html';
            return;
        }

        // 获取用户数据
        const response = await fetch('/api/user', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`获取用户数据失败: ${response.status}`);
        }

        const userData = await response.json();
        
        // 填充用户资料
        fillUserProfile(userData);
        
        // 填充联系信息
        fillContactInfo(userData);
        
        // 填充通知设置
        fillNotificationSettings(userData);
        
        
    } catch (error) {
        console.error('获取用户数据失败:', error);
        showToast('获取用户数据失败，请重试', 'error');
    }
}

/**
 * 填充用户资料
 * @param {Object} userData - 用户数据
 */
function fillUserProfile(userData) {
    // 头像
    const avatarPreview = document.getElementById('avatar-preview');
    if (avatarPreview && userData.avatar) {
        avatarPreview.src = userData.avatar;
    }
    
    // 用户名
    const usernameInput = document.querySelector('#profile .form-group:nth-child(1) input');
    if (usernameInput) {
        usernameInput.value = userData.username || '';
    }
    
    // 昵称
    const nicknameInput = document.querySelector('#profile .form-group:nth-child(2) input');
    if (nicknameInput) {
        nicknameInput.value = userData.nickname || '';
    }
    
    // 性别
    const genderRadios = document.querySelectorAll('#profile input[name="gender"]');
    if (genderRadios.length > 0 && userData.gender) {
        genderRadios.forEach(radio => {
            if (radio.value === userData.gender) {
                radio.checked = true;
            }
        });
    }
    
    // 生日
    const birthdayInput = document.querySelector('#profile input[type="date"]');
    if (birthdayInput && userData.birthday) {
        birthdayInput.value = userData.birthday;
    }
    
    // 简介
    const bioTextarea = document.querySelector('#profile textarea');
    if (bioTextarea) {
        bioTextarea.value = userData.bio || '';
    }
}

/**
 * 填充联系信息
 * @param {Object} userData - 用户数据
 */
function fillContactInfo(userData) {
    // 电话
    const phoneInput = document.querySelector('#profile .form-group:nth-child(1) input[type="tel"]');
    if (phoneInput) {
        phoneInput.value = userData.phone || '';
    }
    
    // 邮箱
    const emailInput = document.querySelector('#profile .form-group:nth-child(2) input[type="email"]');
    if (emailInput) {
        emailInput.value = userData.email || '';
    }

    // 加载用户地址
    loadUserAddresses();
}

/**
 * 填充通知设置
 * @param {Object} userData - 用户数据
 */
function fillNotificationSettings(userData) {
    const notificationSettings = userData.notification_settings || {};
    
    // 预订通知
    const bookingNotifications = document.querySelectorAll('#notification .notification-item:nth-child(1) input[type="checkbox"]');
    if (bookingNotifications.length > 0 && notificationSettings.types && notificationSettings.types.booking) {
        const bookingSettings = notificationSettings.types.booking;
        
        // 启用预订通知
        bookingNotifications[0].checked = bookingSettings.enabled;
        
        // 启用预订确认通知
        if (bookingNotifications.length > 1) {
            bookingNotifications[1].checked = bookingSettings.confirmation;
        }
        
        // 启用预订提醒通知
        if (bookingNotifications.length > 2) {
            bookingNotifications[2].checked = bookingSettings.reminder;
        }
        
        // 启用预订取消通知
        if (bookingNotifications.length > 3) {
            bookingNotifications[3].checked = bookingSettings.cancellation;
        }
    }
    
    // 系统通知
    const systemNotifications = document.querySelectorAll('#notification .notification-item:nth-child(3) input[type="checkbox"]');
    if (systemNotifications.length > 0 && notificationSettings.types && notificationSettings.types.system) {
        const systemSettings = notificationSettings.types.system;
        
        // 启用系统通知
        systemNotifications[0].checked = systemSettings.enabled;
        
        // 启用维护通知
        if (systemNotifications.length > 1) {
            systemNotifications[1].checked = systemSettings.maintenance;
        }
        
        // 启用安全通知
        if (systemNotifications.length > 2) {
            systemNotifications[2].checked = systemSettings.security;
        }
        
        // 启用促销通知
        if (systemNotifications.length > 3) {
            systemNotifications[3].checked = systemSettings.promotion;
        }
    }
}

/**
 * 显示添加地址模态框
 */
function showAddAddressModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>添加地址</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>地址标签</label>
                    <input type="text" id="address-label" placeholder="请输入地址标签">
                </div>
                <div class="form-group">
                    <label>地址详情</label>
                    <textarea id="address-detail" placeholder="请输入地址详情"></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary modal-close">取消</button>
                <button class="btn-primary btn-confirm">确认</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 显示模态框
    setTimeout(() => {
        modal.classList.add('modal-active');
    }, 10);
    
    // 添加关闭按钮事件
    const closeButtons = modal.querySelectorAll('.modal-close');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modal.classList.remove('modal-active');
            setTimeout(() => modal.remove(), 300);
        });
    });
    
    // 确认按钮事件
    const confirmButton = modal.querySelector('.btn-confirm');
    confirmButton.addEventListener('click', async () => {
        const labelInput = modal.querySelector('#address-label');
        const detailInput = modal.querySelector('#address-detail');
        
        if (!labelInput.value.trim()) {
            showToast('请输入地址标签', 'error');
            return;
        }
        
        if (!detailInput.value.trim()) {
            showToast('请输入地址详情', 'error');
            return;
        }
        
        try {
            await addAddress(labelInput.value.trim(), detailInput.value.trim());
            modal.classList.remove('modal-active');
            setTimeout(() => modal.remove(), 300);
        } catch (error) {
            console.error('添加地址失败:', error);
        }
    });
}

/**
 * 显示编辑地址模态框
 * @param {Object} address - 地址对象
 */
function showEditAddressModal(address) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>编辑地址</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>地址标签</label>
                    <input type="text" id="address-label" value="${address.label}" placeholder="请输入地址标签">
                </div>
                <div class="form-group">
                    <label>地址详情</label>
                    <textarea id="address-detail" placeholder="请输入地址详情">${address.address}</textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary modal-close">取消</button>
                <button class="btn-primary btn-confirm">确认</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 显示模态框
    setTimeout(() => {
        modal.classList.add('modal-active');
    }, 10);
    
    // 添加关闭按钮事件
    const closeButtons = modal.querySelectorAll('.modal-close');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modal.classList.remove('modal-active');
            setTimeout(() => modal.remove(), 300);
        });
    });
    
    // 确认按钮事件
    const confirmButton = modal.querySelector('.btn-confirm');
    confirmButton.addEventListener('click', async () => {
        const labelInput = modal.querySelector('#address-label');
        const detailInput = modal.querySelector('#address-detail');
        
        if (!labelInput.value.trim()) {
            showToast('请输入地址标签', 'error');
            return;
        }
        
        if (!detailInput.value.trim()) {
            showToast('请输入地址详情', 'error');
            return;
        }
        
        try {
            await updateAddress(address.id, labelInput.value.trim(), detailInput.value.trim());
            modal.classList.remove('modal-active');
            setTimeout(() => modal.remove(), 300);
        } catch (error) {
            console.error('更新地址失败:', error);
        }
    });
}

/**
 * 显示删除地址确认模态框
 * @param {string} addressId - 地址ID
 * @param {string} addressLabel - 地址标签
 */
function showDeleteAddressConfirmation(addressId, addressLabel) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>删除地址</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <p>确认删除地址"${addressLabel}"吗？</p>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary modal-close">取消</button>
                <button class="btn-danger btn-confirm">删除</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 显示模态框
    setTimeout(() => {
        modal.classList.add('modal-active');
    }, 10);
    
    // 添加关闭按钮事件
    const closeButtons = modal.querySelectorAll('.modal-close');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modal.classList.remove('modal-active');
            setTimeout(() => modal.remove(), 300);
        });
    });
    
    // 删除按钮事件
    const confirmButton = modal.querySelector('.btn-confirm');
    confirmButton.addEventListener('click', async () => {
        try {
            await deleteAddress(addressId);
            modal.classList.remove('modal-active');
            setTimeout(() => modal.remove(), 300);
        } catch (error) {
            console.error('删除地址失败:', error);
        }
    });
}

/**
 * 添加地址
 * @param {string} label - 地址标签
 * @param {string} address - 地址详情
 */
async function addAddress(label, address) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'index.html';
            return;
        }
        
        // 发送添加请求
        const response = await fetch('/api/user/addresses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                label: label,
                address: address
            })
        });

        if (!response.ok) {
            throw new Error(`添加地址失败: ${response.status}`);
        }

        const result = await response.json();
        
        // 显示成功消息
        showToast('地址添加成功');
        
        // 重新加载用户地址
        await loadUserAddresses();
        
        return true;
    } catch (error) {
        console.error('添加地址失败:', error);
        showToast('添加地址失败，请重试', 'error');
        return false;
    }
}

/**
 * 更新地址
 * @param {string} addressId - 地址ID
 * @param {string} label - 地址标签
 * @param {string} address - 地址详情
 */
async function updateAddress(addressId, label, address) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'index.html';
            return;
        }

        // 发送更新请求
        const response = await fetch(`/api/user/addresses/${addressId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                label: label,
                address: address
            })
        });
        
        if (!response.ok) {
            throw new Error(`更新地址失败: ${response.status}`);
        }

        const result = await response.json();
        
        // 显示成功消息
        showToast('地址更新成功');
        
        // 重新加载用户地址
        await loadUserAddresses();
        
        return true;
    } catch (error) {
        console.error('更新地址失败:', error);
        showToast('更新地址失败，请重试', 'error');
        return false;
    }
}

/**
 * 删除地址
 * @param {string} addressId - 地址ID
 */
async function deleteAddress(addressId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'index.html';
            return;
        }

        // 发送删除请求
        const response = await fetch(`/api/user/addresses/${addressId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`删除地址失败: ${response.status}`);
        }
        
        // 显示成功消息
        showToast('地址删除成功');
        
        // 重新加载用户地址
        await loadUserAddresses();
        
        return true;
    } catch (error) {
        console.error('删除地址失败:', error);
        showToast('删除地址失败，请重试', 'error');
        return false;
    }
}

/**
 * 获取设置面板名称
 * @param {string} panelId - 设置面板ID
 * @returns {string} - 设置面板名称
 */
function getPanelName(panelId) {
    switch (panelId) {
        case 'profile':
            return '个人资料';
        case 'security':
            return '安全设置';
        case 'notification':
            return '通知设置';
        case 'privacy':
            return '隐私设置';
        default:
            return '设置';
    }
}

/**
 * 保存设置
 * @param {string} panelId - 设置面板ID
 */
async function saveSettings(panelId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'index.html';
            return;
        }

        let data = {};
        let endpoint = '/api/user';
        let method = 'PUT';
        
        // 根据面板ID加载表单数据
        switch (panelId) {
            case 'profile':
                data = collectProfileData();
                break;
            case 'security':
                // 更新密码需要单独处理
                return await updatePassword();
            case 'notification':
                data = collectNotificationData();
                endpoint = '/api/user/notification-settings';
                break;
            case 'privacy':
                data = collectPrivacyData();
                endpoint = '/api/user/privacy-settings';
                break;
            default:
                console.error('未知设置面板:', panelId);
                return;
        }

        // 显示加载中提示
        const saveButton = document.querySelector(`#${panelId} .btn-save`);
        if (saveButton) {
            saveButton.disabled = true;
            saveButton.textContent = '保存中...';
        }

        // 发送更新请求
        const response = await fetch(endpoint, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`更新用户数据失败: ${response.status}`);
        }

        // 显示成功消息
        showToast(`${getPanelName(panelId)}保存成功`);
        
        // 重新加载用户数据
        await loadUserData();
        
    } catch (error) {
        console.error('保存设置失败:', error);
        showToast('保存设置失败，请重试', 'error');
    } finally {
        // 恢复按钮可用
        const saveButton = document.querySelector(`#${panelId} .btn-save`);
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = '保存';
        }
    }
}

/**
 * 收集用户资料表单数据
 * @returns {Object} - 用户资料表单数据
 */
function collectProfileData() {
    const data = {};
    
    // 用户名
    const usernameInput = document.querySelector('#profile .form-group:nth-child(1) input');
    if (usernameInput) {
        data.username = usernameInput.value.trim();
    }
    
    // 昵称
    const nicknameInput = document.querySelector('#profile .form-group:nth-child(2) input');
    if (nicknameInput) {
        data.nickname = nicknameInput.value.trim();
    }
    
    // 性别
    const genderRadio = document.querySelector('#profile input[name="gender"]:checked');
    if (genderRadio) {
        data.gender = genderRadio.value;
    }
    
    // 生日
    const birthdayInput = document.querySelector('#profile input[type="date"]');
    if (birthdayInput) {
        data.birthday = birthdayInput.value;
    }
    
    // 简介
    const bioTextarea = document.querySelector('#profile textarea');
    if (bioTextarea) {
        data.bio = bioTextarea.value.trim();
    }
    
    // 电话
    const phoneInput = document.querySelector('#profile input[type="tel"]:not([disabled])');
    if (phoneInput) {
        data.phone = phoneInput.value.trim();
    }
    
    // 邮箱
    const emailInput = document.querySelector('#profile input[type="email"]:not([disabled])');
    if (emailInput) {
        data.email = emailInput.value.trim();
    }
    
    return data;
}

/**
 * 收集通知设置表单数据
 * @returns {Object} - 通知设置表单数据
 */
function collectNotificationData() {
    const notificationSettings = {
        notification_settings: {
            types: {
                booking: {
                    enabled: false,
                    confirmation: false,
                    reminder: false,
                    cancellation: false
                },
                review: {
                    enabled: false,
                    new: false,
                    reply: false
                },
                system: {
                    enabled: false,
                    maintenance: false,
                    security: false,
                    promotion: false
                }
            }
        }
    };
    
    // 预订通知
    const bookingNotifications = document.querySelectorAll('#notification .notification-item:nth-child(1) input[type="checkbox"]');
    if (bookingNotifications.length > 0) {
        // 启用预订通知
        notificationSettings.notification_settings.types.booking.enabled = bookingNotifications[0].checked;
        
        // 启用预订确认通知
        if (bookingNotifications.length > 1) {
            notificationSettings.notification_settings.types.booking.confirmation = bookingNotifications[1].checked;
        }
        
        // 启用预订提醒通知
        if (bookingNotifications.length > 2) {
            notificationSettings.notification_settings.types.booking.reminder = bookingNotifications[2].checked;
        }
        
        // 启用预订取消通知
        if (bookingNotifications.length > 3) {
            notificationSettings.notification_settings.types.booking.cancellation = bookingNotifications[3].checked;
        }
    }
    
    // 系统通知
    const systemNotifications = document.querySelectorAll('#notification .notification-item:nth-child(3) input[type="checkbox"]');
    if (systemNotifications.length > 0) {
        // 启用系统通知
        notificationSettings.notification_settings.types.system.enabled = systemNotifications[0].checked;
        
        // 启用维护通知
        if (systemNotifications.length > 1) {
            notificationSettings.notification_settings.types.system.maintenance = systemNotifications[1].checked;
        }
        
        // 启用安全通知
        if (systemNotifications.length > 2) {
            notificationSettings.notification_settings.types.system.security = systemNotifications[2].checked;
        }
        
        // 启用促销通知
        if (systemNotifications.length > 3) {
            notificationSettings.notification_settings.types.system.promotion = systemNotifications[3].checked;
        }
    }
    
    return notificationSettings;
}

/**
 * 收集隐私设置表单数据
 * @returns {Object} - 隐私设置表单数据
 */
function collectPrivacyData() {
    const privacySettings = {
        privacy_settings: {
            visibility: {
                profile: 'public',
                bookings: 'private',
                reviews: 'public'
            }
        }
    };
    
    // 用户资料可见性
    const profileVisibility = document.querySelector('#privacy .privacy-item:nth-child(1) select');
    if (profileVisibility) {
        privacySettings.privacy_settings.visibility.profile = profileVisibility.value;
    }
    
    // 启用预订通知可见性
    const bookingsVisibility = document.querySelector('#privacy .privacy-item:nth-child(2) select');
    if (bookingsVisibility) {
        privacySettings.privacy_settings.visibility.bookings = bookingsVisibility.value;
    }
    
    // 启用评论可见性
    const reviewsVisibility = document.querySelector('#privacy .privacy-item:nth-child(3) select');
    if (reviewsVisibility) {
        privacySettings.privacy_settings.visibility.reviews = reviewsVisibility.value;
    }
    
    return privacySettings;
}

/**
 * 更新密码
 * @returns {Promise<boolean>} - 是否成功更新密码
 */
async function updatePassword() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'index.html';
            return false;
        }

        // 获取当前密码输入框
        const currentPasswordInput = document.getElementById('currentPassword');
        const newPasswordInput = document.getElementById('newPassword');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        
        if (!currentPasswordInput || !newPasswordInput || !confirmPasswordInput) {
            showToast('请填写所有密码输入框', 'error');
            return false;
        }
        
        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        // 验证当前密码
        if (!currentPassword) {
            showToast('请输入当前密码', 'error');
            return false;
        }
        
        if (!newPassword) {
            showToast('请输入新密码', 'error');
            return false;
        }
        
        if (newPassword !== confirmPassword) {
            showToast('两次输入的新密码不一致', 'error');
            return false;
        }
        
        // 显示加载中提示
        const changePasswordBtn = document.getElementById('changePasswordBtn');
        if (changePasswordBtn) {
            changePasswordBtn.disabled = true;
            changePasswordBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 更新中...';
        }
        
        // 发送更新请求
        const response = await fetch('/api/user/password', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '更新密码失败');
        }
        
        // 清空密码输入框
        currentPasswordInput.value = '';
        newPasswordInput.value = '';
        confirmPasswordInput.value = '';
        
        // 更新密码强度指示器
        const strengthBar = document.querySelector('.strength-bar .bar-fill');
        const strengthText = document.querySelector('.strength-text');
        
        if (strengthBar && strengthText) {
            strengthBar.style.width = '0%';
            strengthText.textContent = '密码强度：弱';
        }
        
        showToast('密码更新成功');
        return true;
        
    } catch (error) {
        console.error('更新密码失败:', error);
        showToast(error.message || '更新密码失败，请重试', 'error');
        return false;
    } finally {
        // 恢复按钮可用
        const changePasswordBtn = document.getElementById('changePasswordBtn');
        if (changePasswordBtn) {
            changePasswordBtn.disabled = false;
            changePasswordBtn.innerHTML = '<i class="fas fa-key"></i> 修改密码';
        }
    }
}

/**
 * 启用或禁用输入框
 * @param {string} inputId - 输入框ID
 * @param {Event} event - 事件对象
 */
function enableInput(inputId, event) {
    if (event) {
        event.preventDefault();
    }
    
    const inputField = document.getElementById(inputId);
    if (!inputField) return;
    
    // 切换输入框的禁用状态
    inputField.disabled = !inputField.disabled;
    
    // 获取修改按钮
    const modifyButton = event.target;
    if (modifyButton && modifyButton.classList.contains('btn-modify')) {
        // 切换按钮文本
        modifyButton.textContent = inputField.disabled ? '修改' : '确认';
        
        // 如果启用了输入框，则聚焦
        if (!inputField.disabled) {
            inputField.focus();
        } else {
            // 如果禁用了输入框，则保存更改
            saveContactInfo(inputId, inputField.value);
        }
    }
}

/**
 * 保存联系方式信息
 * @param {string} fieldType - 字段类型（phone或email）
 * @param {string} value - 字段值
 */
async function saveContactInfo(fieldType, value) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'index.html';
            return;
        }

        // 验证输入值
        if (!value || value.trim() === '') {
            showToast(`${fieldType === 'phone' ? '手机号码' : '邮箱地址'}不能为空`, 'error');
            await loadUserData(); // 重新加载用户数据
            return;
        }
        
        // 验证邮箱格式
        if (fieldType === 'email' && !validateEmail(value)) {
            showToast('请输入有效的邮箱地址', 'error');
            await loadUserData(); // 重新加载用户数据
            return;
        }
        
        // 验证手机号格式
        if (fieldType === 'phone' && !validatePhone(value)) {
            showToast('请输入有效的手机号码', 'error');
            await loadUserData(); // 重新加载用户数据
            return;
        }

        // 创建要更新的数据对象
        const data = {};
        data[fieldType] = value;
        
        // 发送更新请求
        const response = await fetch('/api/user', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`更新${fieldType === 'phone' ? '手机号码' : '邮箱地址'}失败: ${response.status}`);
        }
        
        // 显示成功消息
        showToast(`${fieldType === 'phone' ? '手机号码' : '邮箱地址'}更新成功`);
        
        // 如果是邮箱地址更新，更新本地存储
        if (fieldType === 'email') {
            localStorage.setItem('userEmail', value);
        }
        
    } catch (error) {
        console.error(`保存${fieldType}失败:`, error);
        showToast(`保存${fieldType === 'phone' ? '手机号码' : '邮箱地址'}失败，请重试`, 'error');
        
        // 如果保存失败，重新加载用户数据
        await loadUserData();
    }
}

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean} 是否有效
 */
function validateEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
}

/**
 * 验证手机号格式
 * @param {string} phone - 手机号码
 * @returns {boolean} 是否有效
 */
function validatePhone(phone) {
    // 简单验证中国手机号（11位数字，以1开头）
    const re = /^1\d{10}$/;
    return re.test(phone);
}

/**
 * 保存个人资料
 * @param {Event} event - 事件对象
 */
async function saveProfile(event) {
    if (event) {
        event.preventDefault();
    }
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'index.html';
            return;
        }

        // 收集表单数据
        const profileData = {
            username: document.getElementById('username').value,
            nickname: document.getElementById('nickname').value,
            gender: document.querySelector('input[name="gender"]:checked')?.value || 'other',
            birthday: document.getElementById('birthday').value || null,
            bio: document.getElementById('bio').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value
        };
        
        // 发送更新请求
        const response = await fetch('/api/user', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(profileData)
        });
        
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || `更新失败: ${response.status}`);
        }
        
        // 如果邮箱已更改，提示用户下次使用新邮箱登录
        const currentEmail = localStorage.getItem('userEmail');
        if (profileData.email && currentEmail && profileData.email !== currentEmail) {
            localStorage.setItem('userEmail', profileData.email);
            showToast(`个人资料更新成功，下次请使用新邮箱 ${profileData.email} 登录`, 'success', 5000);
        } else {
            showToast('个人资料更新成功');
        }
        
        // 重新加载用户数据
        await loadUserData();
        
    } catch (error) {
        console.error('保存个人资料失败:', error);
        showToast(`保存失败: ${error.message}`, 'error');
    }
}

/**
 * 初始化预约状态卡片点击事件
 */
function initializeBookingStatCards() {
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        card.addEventListener('click', () => {
            const status = card.classList[1]; // 获取状态类名（waiting, upcoming, completed, cancelled）
            if (status) {
                // 如果用户已登录，跳转到预约历史页面并传递状态参数
                if (checkAuth()) {
                    window.location.href = `booking-history.html?status=${status}`;
                } else {
                    // 未登录则提示用户登录
                    showToast('请先登录后查看预约信息', 'info');
                }
            }
        });
    });
}

/**
 * 初始化新用户模式
 */
function initializeNewUserMode() {
    // 从localStorage获取基本用户信息
    const userEmail = localStorage.getItem('userEmail');
    const username = localStorage.getItem('username');
    
    // 填充基本信息
    const usernameInput = document.querySelector('#profile .form-group:nth-child(1) input');
    const emailInput = document.querySelector('#profile input[type="email"]');
    
    if (usernameInput && username) {
        usernameInput.value = username;
    }
    
    if (emailInput && userEmail) {
        emailInput.value = userEmail;
    }
    
    // 显示新用户欢迎提示
    showToast('欢迎！请完善您的个人资料', 'info', 5000);
}

/**
 * 检查用户是否已登录
 * @returns {boolean} 是否已登录
 */
function checkAuth() {
        const token = localStorage.getItem('token');
        if (!token) {
        // 如果未登录，重定向到登录页面
            window.location.href = 'index.html';
        return false;
    }
        return true;
}

/**
 * 更新用户信息
 */
function updateUserInfo() {
    const userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
        try {
            const profileData = JSON.parse(userProfile);
            
            // 更新顶部导航栏用户信息
            const userMenuName = document.querySelector('.user-menu .user-name');
            const userMenuAvatar = document.querySelector('.user-menu .avatar img');
            
            if (userMenuName && profileData.username) {
                userMenuName.textContent = profileData.username;
            }
            
            if (userMenuAvatar && profileData.avatar) {
                userMenuAvatar.src = profileData.avatar;
            }
            
            // 更新侧边栏用户信息
            const sidebarName = document.querySelector('.profile-name');
            const sidebarAvatar = document.querySelector('.user-profile .avatar img');
            
            if (sidebarName && profileData.username) {
                sidebarName.textContent = profileData.username;
            }
            
            if (sidebarAvatar && profileData.avatar) {
                sidebarAvatar.src = profileData.avatar;
            }
    } catch (error) {
            console.error('解析用户资料失败:', error);
        }
    }
}

/**
 * 加载用户个人资料
 */
function loadProfile() {
    // 此函数在用户登录后调用，用于加载个人资料页面
    // 实际实现已包含在loadUserData()函数中
} 
        
/**
 * 处理联系方式修改
 * @param {string} fieldId - 字段ID
 * @param {Event} event - 事件对象
 */
function handleContactModify(fieldId, event) {
    if (event) {
        event.preventDefault();
    }
    
    const inputField = document.getElementById(fieldId);
    if (!inputField) return;
    
    // 获取修改按钮
    const modifyButton = event.currentTarget;
    
    // 切换输入框的禁用状态
    inputField.disabled = !inputField.disabled;
    
    // 切换按钮文本
    modifyButton.textContent = inputField.disabled ? '修改' : '确认';
    
    // 如果启用了输入框，则聚焦
    if (!inputField.disabled) {
        inputField.focus();
    } else {
        // 如果禁用了输入框，则保存更改
        saveContactInfo(fieldId, inputField.value);
    }
} 
        
