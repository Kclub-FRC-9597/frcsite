// tools-sidebar.js — 赛事页布局（FRC / MakeX / 赛项管理）
(function () {

function sidebarHtml(toolPath) {
    var isAdmin = window.isAdmin ? window.isAdmin() : false;
    var links = [
        { href: '#tools/frc',          label: 'FRC',               active: toolPath === '/frc' || toolPath === '/prescouting' || toolPath === '/scouting' || toolPath === '/analysis' || toolPath === '/team-assignments' },
        { href: '#tools/makex-inspire',label: 'MakeX Inspire',     active: toolPath === '/makex-inspire' },
        { href: '#tools/makex-explore',label: 'MakeX Explore',     active: toolPath === '/makex-explore' },
        { href: '#tools/makex-challenger',label:'MakeX Challenger', active: toolPath === '/makex-challenger' },
    ];
    var html = '<div class="sidebar" id="toolsSidebar"><h3>赛事</h3><ul>';
    for (var i = 0; i < links.length; i++) {
        html += '<li><a href="' + links[i].href + '" class="' + (links[i].active ? 'active' : '') + '">' + links[i].label + '</a></li>';
    }
    html += '<li class="sidebar-home-link"><a href="#home">返回主页</a></li>';
    html += '<li><a href="#" onclick="logout()">登出</a></li></ul></div>';
    return html;
}

window.renderToolsLayout = async function (hash) {
    var toolPath = hash.replace('#tools', '') || '/frc';
    var app = document.getElementById('app');
    var header = await window.loadHeader();
    var footer = await window.loadFooter();

    // ——— FRC 子页面 ———
    if (toolPath === '/frc' || toolPath === '/prescouting' || toolPath === '/scouting' || toolPath === '/analysis' || toolPath === '/team-assignments') {
        app.innerHTML = header +
            '<div class="container">' + sidebarHtml(toolPath) +
            '<div class="content home-content">' +
            '<h1 style="margin-bottom:28px;">🔧 FRC</h1>' +
            '<div class="home-tools-grid">' +
            card('📋', 'PreScouting', '赛前数据收集与团队评估', '#tools/prescouting') +
            card('📊', 'Scouting', '现场实时数据记录与分析', '#tools/scouting') +
            card('📈', 'Analysis', '数据可视化与战略决策', '#tools/analysis') +
            card('🎯', '队伍分配', '分配队员到赛队', '#tools/team-assignments') +
            card('🏆', '赛事管理', '管理 FRC 比赛安排', '#tools/events/frc') +
            card('🏋️', '集训管理', '管理 FRC 集训', '#tools/trainings/frc') +
            '<div class="home-tool-card tm-task-card" data-program="frc" data-pname="FRC" style="cursor:pointer;">' +
            '<span class="tool-icon">📝</span><h4>任务管理</h4><p>管理 FRC 评分任务</p>' +
            '<span class="tool-link" style="color:var(--accent-blue);">进入</span></div>' +
            '</div></div></div>' + footer;
        return;
    }

    // ——— MakeX 子页面 ———
    if (toolPath === '/makex-inspire' || toolPath === '/makex-explore' || toolPath === '/makex-challenger') {
        var name = toolPath === '/makex-inspire' ? 'Inspire' : toolPath === '/makex-explore' ? 'Explore' : 'Challenger';
        var code = toolPath === '/makex-inspire' ? 'makex-in' : toolPath === '/makex-explore' ? 'makex-ex' : 'makex-ch';
        app.innerHTML = header +
            '<div class="container">' + sidebarHtml(toolPath) +
            '<div class="content home-content">' +
            '<h1 style="margin-bottom:28px;">MakeX ' + name + '</h1>' +
            '<div class="home-tools-grid">' +
            card('🏆', '赛事管理', '管理 MakeX ' + name + ' 比赛', '#tools/events/' + code) +
            card('🏋️', '集训管理', '管理 ' + name + ' 集训', '#tools/trainings/' + code) +
            '<div class="home-tool-card tm-task-card" data-program="' + code + '" data-pname="MakeX ' + name + '" style="cursor:pointer;">' +
            '<span class="tool-icon">📝</span><h4>任务管理</h4><p>管理 ' + name + ' 评分任务</p>' +
            '<span class="tool-link" style="color:var(--accent-blue);">进入</span></div>' +
            '</div></div></div>' + footer;
        return;
    }

    // ——— 赛事/集训管理（通用） ———
    if (toolPath.indexOf('/events/') === 0 || toolPath.indexOf('/trainings/') === 0) {
        var html = header + '<div class="container">' + sidebarHtml(toolPath) +
            '<div class="content">' +
            '<h1>📋 ' + (toolPath.indexOf('/events/') === 0 ? '赛事管理' : '集训管理') + '</h1><p>加载中...</p>' +
            '</div></div>' + footer;
        app.innerHTML = html;
        return;
    }

    // ——— 兜底 ———
    app.innerHTML = header + '<div class="container">' + sidebarHtml(toolPath) +
        '<div class="content"><p>功能开发中...</p></div></div>' + footer;
};

// ——— 事件委托：任务管理卡片点击（全局绑定，不依赖 DOM 创建时机） ———
document.addEventListener('click', function (e) {
    var card = e.target.closest('.tm-task-card');
    if (!card) return;
    var code = card.dataset.program;
    var name = card.dataset.pname;
    if (code && typeof window.showTaskManager === 'function') {
        window.showTaskManager(code, name);
    }
});

// ——— 旧版 renderToolsContent 兼容（PreScouting/Scouting/Analysis 仍走旧路由） ———
window.renderToolsContent = function (path) {
    if (path === '/scouting') return window.renderScouting();
    if (path === '/prescouting') return window.renderPreScouting();
    if (path === '/analysis') return window.renderAnalysis();
    if (path === '/team-assignments') {
        if (typeof window.renderTeamAssignContent === 'function') {
            var h = window.renderTeamAssignContent();
            setTimeout(function () { if (typeof window.tSetupListeners === 'function') window.tSetupListeners(); }, 100);
            return h;
        }
        return '<h1>🎯 队伍分配</h1><p>加载中...</p>';
    }
    return '';
};

// ——— 旧版兼容 ———
window.renderMakeX = function (n, d) { return '<h1>MakeX ' + n + '</h1><p>' + d + '</p><p>🚧 建设中...</p>'; };
window.TOOLS_CATS = { frc: false, makex: false };
window.toggleToolsCategory = function () {};

function card(icon, title, desc, href) {
    return '<div class="home-tool-card">' +
        '<span class="tool-icon">' + icon + '</span>' +
        '<h4>' + title + '</h4>' +
        '<p>' + desc + '</p>' +
        '<a href="' + href + '" class="tool-link">进入</a></div>';
}

})();

