// router.js — 路由引擎、登录/登出
(function () {

window.navigate = function (hash) {
    window.location.hash = hash;
};

window.renderApp = async function () {
    var app = document.getElementById('app');
    var hash = window.location.hash || '#home';
    var mobileToggle = document.getElementById('mobileToggle');

    if (hash === '#tools') { hash = '#tools/frc'; window.history.replaceState(null, '', hash); }
    if (hash === '#account') { hash = '#account/profile'; window.history.replaceState(null, '', hash); }
    if (hash === '#seasons') { hash = '#seasons/2026'; window.history.replaceState(null, '', hash); }

    if (!window.currentUser && hash.startsWith('#tools')) {
        if (mobileToggle) mobileToggle.style.display = 'flex';
        window.renderLogin();
        return;
    }

    if (hash === '#login') {
        if (mobileToggle) mobileToggle.style.display = 'none';
        window.renderLogin();
    } else if (hash.startsWith('#account')) {
        if (mobileToggle) mobileToggle.style.display = 'flex';
        if (window.currentUser) {
            await window.renderAccountDashboard();
        } else {
            window.location.hash = '#login';
        }
    } else if (hash.startsWith('#tools')) {
        if (mobileToggle) mobileToggle.style.display = 'flex';
        await window.renderToolsLayout(hash);
    } else if (hash.startsWith('#seasons')) {
        if (mobileToggle) mobileToggle.style.display = 'flex';
        await window.renderSeasonsLayout(hash);
    } else if (hash === '#luban-lock') {
        if (mobileToggle) mobileToggle.style.display = 'none';
        await window.renderLubanLock();
    } else {
        if (mobileToggle) mobileToggle.style.display = 'none';
        await window.renderHome();
    }
};

window.renderLogin = function () {
    var app = document.getElementById('app');
    var returnTo = window.location.hash || '#home';
    app.innerHTML =
        '<div class="login-container">' +
        '<h1>FRC Team 9597</h1>' +
        '<h2>登录</h2>' +
        '<div class="form-group"><label>用户名</label><input type="text" id="username" placeholder="输入用户名"></div>' +
        '<div class="form-group"><label>密码</label><input type="password" id="password" placeholder="输入密码" onkeypress="if(event.key===\'Enter\')login(\'' + returnTo + '\')"></div>' +
        '<button onclick="login(\'' + returnTo + '\')">登录</button>' +
        '<div class="login-links"><a href="#home">返回主页</a><span class="divider">|</span><a href="#" onclick="loginAsTester(\'' + returnTo + '\');return false;">使用测试账户（tester）</a></div>' +
        '</div>';
};

window.login = async function (returnTo) {
    returnTo = returnTo || '#home';
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;

    if (!username || !password) { alert('请输入用户名和密码'); return; }

    if (window.isTesterUser(username)) {
        var savedPassword = localStorage.getItem('password_' + username);
        if (password !== window.TESTER_PASS && password !== savedPassword) { alert('用户名或密码错误'); return; }
        window.currentUser = username;
        window.currentRole = 'tester';
        window.currentToken = '';
        localStorage.setItem('frc_user', username);
        localStorage.setItem('frc_role', 'tester');
        localStorage.removeItem('frc_token');
    } else {
        var res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username, password: password })
        });
        var result = await res.json();
        if (!res.ok || !result.ok) { alert(result.error || '用户名或密码错误'); return; }

        window.currentUser = result.username;
        window.currentRole = result.role || 'admin';
        window.currentToken = result.token || '';
        localStorage.setItem('frc_user', window.currentUser);
        localStorage.setItem('frc_role', window.currentRole);
        if (window.currentToken) { localStorage.setItem('frc_token', window.currentToken); }
        else { localStorage.removeItem('frc_token'); }
    }

    if (returnTo === '#login' || returnTo === '#tools') { window.location.hash = '#tools/prescouting'; }
    else { window.location.hash = returnTo; }
    await window.renderApp();
};

window.loginAsTester = async function (returnTo) {
    returnTo = returnTo || '#home';
    window.currentUser = window.TESTER_USER;
    window.currentRole = 'tester';
    window.currentToken = '';
    localStorage.setItem('frc_user', window.TESTER_USER);
    localStorage.setItem('frc_role', 'tester');
    localStorage.removeItem('frc_token');
    if (returnTo === '#login' || returnTo === '#tools') { window.location.hash = '#tools/prescouting'; }
    else { window.location.hash = returnTo; }
    await window.renderApp();
};

window.logout = function () {
    window.currentUser = null;
    window.currentRole = null;
    window.currentToken = null;
    localStorage.removeItem('frc_user');
    localStorage.removeItem('frc_role');
    localStorage.removeItem('frc_token');
    window.navigate('#home');
};

})();
