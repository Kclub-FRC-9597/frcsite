// tools-sidebar.js — 赛事页布局（FRC / MakeX / 赛项管理）
(function () {

// 赛项与工具入口（布局层数据：赛项 → 工具菜单）
var PROGRAMS = [
    { code: 'frc', label: 'FRC', icon: '🔧',
      desc: 'FRC（FIRST Robotics Competition）—— 机器人赛前侦查、现场记录与数据分析。',
      tools: [
        { href: '#tools/prescouting', label: 'PreScouting', icon: '📋' },
        { href: '#tools/scouting',     label: 'Scouting',    icon: '📊' },
        { href: '#tools/analysis',     label: 'Analysis',    icon: '📈' },
        { href: '#tools/team-assignments', label: '队伍分配', icon: '🎯' },
        { href: '#tools/events/frc',   label: '赛事管理',     icon: '🏆' },
        { href: '#tools/trainings/frc',label: '集训管理',     icon: '🏋️' },
        { action: 'task', label: '任务管理', icon: '📝' },
      ] },
    { code: 'makex-inspire', label: 'MakeX Inspire', icon: '🤖',
      desc: 'MakeX Inspire —— 机器人启蒙赛项数据与活动管理。',
      tools: [
        { href: '#tools/events/makex-in',   label: '赛事管理', icon: '🏆' },
        { href: '#tools/trainings/makex-in',label: '集训管理', icon: '🏋️' },
        { action: 'task', label: '任务管理', icon: '📝' },
      ] },
    { code: 'makex-explore', label: 'MakeX Explore', icon: '🚀',
      desc: 'MakeX Explore —— 探索类赛项数据与活动管理。',
      tools: [
        { href: '#tools/events/makex-ex',   label: '赛事管理', icon: '🏆' },
        { href: '#tools/trainings/makex-ex',label: '集训管理', icon: '🏋️' },
        { action: 'task', label: '任务管理', icon: '📝' },
      ] },
    { code: 'makex-challenger', label: 'MakeX Challenger', icon: '⚙️',
      desc: 'MakeX Challenger —— 挑战类赛项数据与活动管理。',
      tools: [
        { href: '#tools/events/makex-ch',   label: '赛事管理', icon: '🏆' },
        { href: '#tools/trainings/makex-ch',label: '集训管理', icon: '🏋️' },
        { action: 'task', label: '任务管理', icon: '📝' },
      ] },
];

var PROG_BY_CODE = {};
PROGRAMS.forEach(function (p) { PROG_BY_CODE[p.code] = p; });

function parseToolPath(tp) {
    if (!tp || tp === '/' || tp === '/preview') return { program: null, tool: null };
    var m = tp.match(/^\/(events|trainings)\/(.+)$/);
    if (m) {
        var p = PROG_BY_CODE[m[2]];
        return p ? { program: p, tool: m[1] } : { program: null, tool: null };
    }
    var pp = PROG_BY_CODE[tp.slice(1)];
    if (pp) return { program: pp, tool: null };
    if (tp === '/prescouting' || tp === '/scouting' || tp === '/analysis' || tp === '/team-assignments') {
        return { program: PROG_BY_CODE.frc, tool: tp.slice(1) };
    }
    return { program: null, tool: null };
}

function sidebarHtml(toolPath) {
    var st = parseToolPath(toolPath);
    var sel = st.program ? st.program.code : 'preview';
    var opts = [{ v: 'preview', l: '🏁 赛事预览' }].concat(PROGRAMS.map(function (p) {
        return { v: p.code, l: p.icon + ' ' + p.label };
    }));
    var html = '<div class="sidebar" id="toolsSidebar">';
    html += '<h3>赛事</h3>';
    // 选择赛项 下拉
    html += '<div class="tools-program-select"><label>选择赛项</label>';
    html += '<select id="toolsProgramSelect" onchange="window.navigate(\'#tools/\'+this.value)">';
    opts.forEach(function (o) {
        html += '<option value="' + o.v + '"' + (o.v === sel ? ' selected' : '') + '>' + o.l + '</option>';
    });
    html += '</select></div>';
    // 工具菜单（选择赛项 与 返回主页 之间）
    if (st.program) {
        html += '<div class="tools-menu"><h4>工具菜单</h4><ul>';
        st.program.tools.forEach(function (t) {
            if (t.action === 'task') {
                html += '<li><a href="#" class="tool-link tm-task-card" data-program="' + st.program.code + '" data-pname="' + st.program.label + '">' + t.icon + ' ' + t.label + '</a></li>';
            } else {
                html += '<li><a href="' + t.href + '" class="tool-link' + (t.href === '#tools' + toolPath ? ' active' : '') + '">' + t.icon + ' ' + t.label + '</a></li>';
            }
        });
        html += '</ul></div>';
    } else {
        html += '<div class="tools-menu tools-menu-empty"><h4>工具菜单</h4><p>请先选择赛项</p></div>';
    }
    html += '<ul class="tools-footer-links">';
    html += '<li class="sidebar-home-link"><a href="#home">返回主页</a></li>';
    html += '<li><a href="#" onclick="logout()">登出</a></li></ul>';
    html += '</div>';
    return html;
}

window.renderToolsLayout = async function (hash) {
    var toolPath = hash.replace('#tools', '') || '/preview';
    if (toolPath === '') toolPath = '/preview';
    var app = document.getElementById('app');
    var header = await window.loadHeader();
    var footer = await window.loadFooter();
    var st = parseToolPath(toolPath);
    var content = '';
    var after = null;

    if (!st.program) {
        // ——— 赛事预览：各赛事快速入口 ———
        content = '<h1 style="margin-bottom:28px;">🏁 赛事预览</h1>' +
            '<p class="tools-preview-hint">选择下方赛事进入对应工具；也可使用侧栏「选择赛项」。</p>' +
            '<div class="home-tools-grid">' +
            PROGRAMS.map(function (p) {
                return card(p.icon, p.label, p.desc, '#tools/' + p.code);
            }).join('') +
            '</div>';
    } else if (st.tool === 'events' || st.tool === 'trainings') {
        // ——— 赛事/集训管理（event-manager 填充 .content） ———
        content = '<h1 style="margin-bottom:28px;">' + (st.tool === 'events' ? '📅 赛事管理' : '🏋️ 集训管理') + '</h1><p>加载中...</p>';
        after = function () { if (typeof window.setupEventList === 'function') window.setupEventList(); };
    } else if (st.tool) {
        // ——— FRC 子工具内容（激活 renderToolsContent 分发） ———
        content = window.renderToolsContent('/' + st.tool) || '<p>功能开发中...</p>';
        if (st.tool === 'prescouting') {
            after = function () {
                if (typeof window.initializePrescouttingForm === 'function') window.initializePrescouttingForm();
                if (typeof window.renderEntries === 'function') window.renderEntries();
            };
        }
    } else {
        // ——— 赛项预览落地页 ———
        content = '<h1 style="margin-bottom:28px;">' + st.program.icon + ' ' + st.program.label + '</h1>' +
            '<p style="margin-bottom:22px;">' + st.program.desc + '</p>' +
            '<p class="tools-preview-hint">工具入口见侧栏「工具菜单」。</p>';
    }

    app.innerHTML = header +
        '<div class="container">' + sidebarHtml(toolPath) +
        '<div class="content">' + content + '</div></div>' + footer;

    if (after) setTimeout(after, 50);
};

// ——— 事件委托：任务管理卡片点击（全局绑定，不依赖 DOM 创建时机） ———
document.addEventListener('click', function (e) {
    var card = e.target.closest('.tm-task-card');
    if (!card) return;
    e.preventDefault();
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

