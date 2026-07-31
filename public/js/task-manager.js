// task-manager.js — 赛项内嵌任务管理弹窗（通用组件）
(function () {

window.showTaskManager = async function (programCode, programName) {
    // 单例：若已有任务弹窗则先彻底关闭（含 hashchange 监听清理）
    var prev = document.getElementById('tmOverlay');
    if (prev) {
        if (prev._closeOverlay) prev._closeOverlay();
        else prev.remove();
    }
    // 加载该赛项全部任务
    var allTasks = [];
    try {
        var tasksRes = await window.apiFetch('/api/tasks?program_id=' + programCode);
        if (!tasksRes.ok) throw new Error('HTTP ' + tasksRes.status);
        allTasks = await tasksRes.json();
    } catch (e) {
        alert('加载任务失败：' + e.message);
        return;
    }

    var tasksByYear = {};
    allTasks.forEach(function (t) {
        if (!tasksByYear[t.year]) tasksByYear[t.year] = [];
        tasksByYear[t.year].push(t);
    });

    var currentYear = new Date().getFullYear();
    var years = Object.keys(tasksByYear).sort(function (a, b) { return Number(b) - Number(a); });
    if (years.length === 0) years = [String(currentYear)];

    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay'; // 修复：固定全屏居中遮罩，而非普通 inline 元素
    overlay.id = 'tmOverlay';
    overlay.innerHTML =
        '<div class="modal-content" style="max-width:550px;">' +
        '<div class="modal-header"><h3>📝 任务管理 — ' + programName + '</h3></div>' +
        '<div class="modal-body">' +
        '<label>赛季</label>' +
        '<select id="tmYear">' + years.map(function (y) {
            return '<option value="' + y + '"' + (Number(y) === currentYear ? ' selected' : '') + '>' + y + '</option>';
        }).join('') + '</select>' +
        '<div id="tmTaskList" style="margin-top:12px;max-height:250px;overflow-y:auto;"></div>' +
        '<hr style="border-color:var(--line);margin:16px 0;">' +
        '<label>新增任务</label>' +
        '<input id="tmNewName" placeholder="任务名称（必填）">' +
        '<input id="tmNewDesc" placeholder="任务描述（可选）" style="margin-top:8px;">' +
        '<div style="display:flex;gap:10px;align-items:center;margin-top:8px;">' +
        '<select id="tmScoring"><option value="score">记分制</option><option value="time">记时制</option></select>' +
        '<input id="tmMaxScore" type="number" placeholder="满分" style="width:80px;" value="100">' +
        '</div></div>' +
        '<div class="modal-footer">' +
        '<button class="user-action-btn user-action-delete" id="tmClose">关闭</button>' +
        '<button class="user-action-btn user-action-edit" id="tmAdd">➕ 添加</button>' +
        '</div></div>';

    var taskList = overlay.querySelector('#tmTaskList');
    var yearSel = overlay.querySelector('#tmYear');
    var scoringSel = overlay.querySelector('#tmScoring');
    var maxScoreInp = overlay.querySelector('#tmMaxScore');

    function renderList(year) {
        var tasks = tasksByYear[Number(year)] || [];
        if (tasks.length === 0) {
            taskList.innerHTML = '<p style="color:var(--text-muted);padding:8px 0;">暂无任务，在下方添加。</p>';
            return;
        }
        taskList.innerHTML = tasks.map(function (t) {
            var label = t.scoring_type === 'time' ? '⏱ 记时' : '📊 记分 / ' + (t.max_score !== null && t.max_score !== undefined ? t.max_score : '?');
            return '<div style="display:flex;align-items:center;padding:6px 0;border-bottom:1px solid var(--line);">' +
                '<span style="flex:1;">' + t.name +
                (t.description ? ' <span style="color:var(--text-muted);font-size:0.85em;">— ' + t.description + '</span>' : '') +
                '</span>' +
                '<span style="font-size:0.8em;color:var(--text-muted);margin-right:8px;white-space:nowrap;">' + label + '</span>' +
                '<button class="tmDelBtn user-action-btn user-action-delete" data-id="' + t.id + '">✕</button>' +
                '</div>';
        }).join('');

        taskList.querySelectorAll('.tmDelBtn').forEach(function (btn) {
            btn.addEventListener('click', async function () {
                if (!confirm('删除这个任务？')) return;
                try {
                    await window.apiFetch('/api/tasks?id=' + this.dataset.id, { method: 'DELETE' });
                } catch (e) { /* ignore */ }
                allTasks = allTasks.filter(function (t) { return t.id !== btn.dataset.id; });
                tasksByYear = {};
                allTasks.forEach(function (t) {
                    if (!tasksByYear[t.year]) tasksByYear[t.year] = [];
                    tasksByYear[t.year].push(t);
                });
                renderList(yearSel.value);
            });
        });
    }

    renderList(String(currentYear));

    yearSel.addEventListener('change', function () { renderList(this.value); });
    scoringSel.addEventListener('change', function () {
        maxScoreInp.style.display = this.value === 'score' ? '' : 'none';
    });

    // 路由切换(hashchange)时自动关闭，避免弹窗残留在其它页面（#app 重渲染不会清 body 级节点）
    var closed = false;
    function closeOverlay() {
        if (closed) return;
        closed = true;
        overlay.remove();
        window.removeEventListener('hashchange', onHash);
    }
    var onHash = function () { closeOverlay(); };
    window.addEventListener('hashchange', onHash);
    // 挂到元素上，供单例校验时彻底关闭旧弹窗（连同监听一起清理）
    overlay._closeOverlay = closeOverlay;

    // 单例（插入 DOM 前再校验一次，同步执行，杜绝并发/连点叠加两个弹窗）
    prev = document.getElementById('tmOverlay');
    if (prev) {
        if (prev._closeOverlay) prev._closeOverlay();
        else prev.remove();
    }
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeOverlay(); });
    overlay.querySelector('#tmClose').addEventListener('click', function () { closeOverlay(); });

    overlay.querySelector('#tmAdd').addEventListener('click', async function () {
        var name = overlay.querySelector('#tmNewName').value.trim();
        if (!name) { alert('请输入任务名称'); return; }
        var desc = overlay.querySelector('#tmNewDesc').value.trim();
        var scoring = scoringSel.value;
        var maxScore = scoring === 'score' ? parseInt(maxScoreInp.value) || 100 : null;
        var year = parseInt(yearSel.value);

        try {
            var r = await window.apiFetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    program_id: programCode,
                    name: name,
                    description: desc,
                    year: year,
                    scoring_type: scoring,
                    max_score: maxScore
                })
            });
            if (r.ok) {
                var refreshed = await window.apiFetch('/api/tasks?program_id=' + programCode);
                allTasks = await refreshed.json();
                tasksByYear = {};
                allTasks.forEach(function (t) {
                    if (!tasksByYear[t.year]) tasksByYear[t.year] = [];
                    tasksByYear[t.year].push(t);
                });
                renderList(String(year));
                overlay.querySelector('#tmNewName').value = '';
                overlay.querySelector('#tmNewDesc').value = '';
            } else {
                var err = await r.json();
                alert('添加失败：' + (err.error || '未知错误'));
            }
        } catch (e) {
            alert('添加失败：' + e.message);
        }
    });
};

})();
