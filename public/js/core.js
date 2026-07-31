// core.js — 全局状态、认证、工具函数
// 所有模块依赖的基础文件，必须最先加载
(function () {

// ─── 认证状态 ───
window.currentUser = localStorage.getItem('frc_user');
window.currentRole = localStorage.getItem('frc_role');
window.currentToken = localStorage.getItem('frc_token');

window.ADMIN_USER = 'admin';
window.ADMIN_PASS = 'admin123';
window.ADMIN_TOKEN = 'admin-token-2026';
window.TESTER_USER = 'tester';
window.TESTER_PASS = 'password123';
window.USER_USER = 'user';
window.USER_PASS = 'user123';

window.DEFAULT_EVENTS = ['Shanghai Regional'];
window.currentEventTeams = [];

if (window.currentUser && !window.currentRole) {
    window.currentRole = 'tester';
    localStorage.setItem('frc_role', 'tester');
}

// ─── 认证函数 ───
window.isAdmin = function () {
    return window.currentRole === 'admin' && window.currentToken === window.ADMIN_TOKEN;
};

window.isTesterUser = function (username) {
    if (username === undefined) username = window.currentUser;
    return username === window.TESTER_USER;
};

window.isSystemUser = function (username) {
    if (username === undefined) username = window.currentUser;
    return username === window.TESTER_USER || username === window.USER_USER;
};

// ─── API 请求 ───
window.apiFetch = function (url, options) {
    options = options || {};
    if (!window.isAdmin()) {
        return fetch(url, options);
    }
    var headers = new Headers(options.headers || {});
    headers.set('Authorization', 'Bearer ' + window.ADMIN_TOKEN);
    return fetch(url, Object.assign({}, options, { headers: headers }));
};

// ─── PreScouting 本地数据 ───
window.getLocalPrescoutData = function () {
    return JSON.parse(localStorage.getItem('prescout_data') || '[]');
};

window.saveLocalPrescoutData = function (entries) {
    localStorage.setItem('prescout_data', JSON.stringify(entries));
};

// ─── Scouting 本地数据 ───
window.getLocalScoutingData = function () {
    return JSON.parse(localStorage.getItem('scouting_data') || '[]');
};

window.saveLocalScoutingData = function (entries) {
    localStorage.setItem('scouting_data', JSON.stringify(entries));
};

// ─── Event 选项 ───
window.getEventOptions = function () {
    var saved = localStorage.getItem('event_options');
    if (saved) return JSON.parse(saved);
    localStorage.setItem('event_options', JSON.stringify(window.DEFAULT_EVENTS));
    return window.DEFAULT_EVENTS.slice();
};

window.addEventOption = function (name) {
    if (!name) return;
    var options = window.getEventOptions();
    if (options.indexOf(name) >= 0) return;
    options.push(name);
    localStorage.setItem('event_options', JSON.stringify(options));
};

// ─── Header / Footer 缓存 ───
var _headerHTML = '';
var _footerHTML = '';

window.loadHeader = async function () {
    if (!_headerHTML) {
        var res = await fetch('/partials/header.html');
        _headerHTML = await res.text();
    }
    var header = _headerHTML;
    if (window.currentUser) {
        header = _headerHTML.replace(
            '</nav>',
            '<a href="#account/profile" class="header-account-link">👤 账户</a></nav>'
        );
    }
    return header;
};

window.loadFooter = async function () {
    if (!_footerHTML) {
        var res = await fetch('/partials/footer.html');
        _footerHTML = await res.text();
    }
    return _footerHTML;
};

// ─── 主站 header 右侧“其他赛事”下拉（委托绑定，header 由各页注入） ───
document.addEventListener('click', function (e) {
    var toggle = document.getElementById('inspireDdToggle');
    var menu = document.getElementById('inspireDdMenu');
    if (!toggle || !menu) return;
    if (toggle.contains(e.target)) {
        e.preventDefault();
        e.stopPropagation();
        var open = menu.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    } else if (!menu.contains(e.target)) {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
    }
});

// ─── 本地数据提交到服务器 ───
window.submitLocalPrescout = async function (id) {
    var entries = window.getLocalPrescoutData();
    var entry = entries.find(function (e) { return e.id === id; });
    if (!entry) return;
    var res = await window.apiFetch('/api/prescout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
    });
    if (!res.ok) { alert('提交失败'); return; }
    var filtered = entries.filter(function (e) { return e.id !== id; });
    window.saveLocalPrescoutData(filtered);
    if (typeof renderEntries === 'function') renderEntries();
};

window.submitLocalScouting = async function (id) {
    var entries = window.getLocalScoutingData();
    var entry = entries.find(function (e) { return e.id === id; });
    if (!entry) return;
    var res = await window.apiFetch('/api/scouting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
    });
    if (!res.ok) { alert('提交失败'); return; }
    var filtered = entries.filter(function (e) { return e.id !== id; });
    window.saveLocalScoutingData(filtered);
    if (typeof showScoutingData === 'function') showScoutingData();
};

// ─── 数据查询 ───
window.getPrescoutEntries = async function (eventFilter) {
    if (window.isAdmin()) {
        var url = eventFilter ? '/api/prescout?event=' + encodeURIComponent(eventFilter) : '/api/prescout';
        var res = await window.apiFetch(url);
        return await res.json();
    }
    var entries = window.getLocalPrescoutData();
    if (eventFilter) {
        entries = entries.filter(function (e) { return e.event === eventFilter; });
    }
    return entries;
};

window.getScoutingEntries = async function (eventFilter) {
    if (window.isAdmin()) {
        var url = eventFilter ? '/api/scouting?event=' + encodeURIComponent(eventFilter) : '/api/scouting';
        var res = await window.apiFetch(url);
        return await res.json();
    }
    var entries = window.getLocalScoutingData();
    if (eventFilter) {
        entries = entries.filter(function (e) { return e.event === eventFilter; });
    }
    return entries;
};

})();
