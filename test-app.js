// 简化测试版本 - 只包含核心登录功能
const API_BASE = '';
let authToken = null;
let currentUser = null;

// 页面加载时的初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Application starting...');
    
    // 绑定登录表单
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // 检查是否已经登录
    checkAuthStatus();
});

// 登录处理
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value.toLowerCase();
    const password = document.getElementById('loginPassword').value;
    
    console.log('🔑 Login attempt:', username);
    
    // 验证用户名和密码
    if ((username === 'candidate' || username === 'hr') && password === '123456') {
        // 模拟登录成功
        authToken = 'demo-token-' + username + '-' + Date.now();
        currentUser = {
            username: username,
            role: username,
            email: username + '@demo.com'
        };
        
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        console.log('✅ Login successful');
        updateAuthUI();
        
        if (username === 'candidate') {
            showCandidateDashboard();
        } else {
            showHRDashboard();
        }
    } else {
        console.error('❌ Login failed');
        showError('Invalid username or password');
    }
}

// 检查认证状态
function checkAuthStatus() {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedToken && savedUser) {
        authToken = savedToken;
        currentUser = JSON.parse(savedUser);
        updateAuthUI();
        
        if (currentUser.role === 'candidate') {
            showCandidateDashboard();
        } else {
            showHRDashboard();
        }
    }
}

// 更新认证界面
function updateAuthUI() {
    const loginSection = document.getElementById('loginSection');
    const candidateSection = document.getElementById('candidateSection');
    const hrSection = document.getElementById('hrSection');
    
    if (authToken) {
        loginSection.style.display = 'none';
        if (currentUser.role === 'candidate') {
            candidateSection.style.display = 'block';
            hrSection.style.display = 'none';
        } else {
            candidateSection.style.display = 'none';
            hrSection.style.display = 'block';
        }
    } else {
        loginSection.style.display = 'block';
        candidateSection.style.display = 'none';
        hrSection.style.display = 'none';
    }
}

// 显示候选人界面
function showCandidateDashboard() {
    console.log('📋 Showing candidate dashboard');
    updateAuthUI();
}

// 显示HR界面
function showHRDashboard() {
    console.log('👔 Showing HR dashboard');
    updateAuthUI();
}

// 登出
function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    updateAuthUI();
    console.log('👋 Logged out');
}

// 显示错误消息
function showError(message) {
    console.error('❌', message);
    alert(message); // 临时使用alert
}
