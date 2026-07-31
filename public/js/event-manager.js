// event-manager.js — 集训/赛事管理
(function () {

// ========== 事件列表 ==========
window.setupEventList = async function (params) {
    var content = document.querySelector('.content');
    if (!content) return;

    var eventsRes = await window.apiFetch('/api/events');
    var events = await eventsRes.json();

    var progMap = { 'frc': 'FRC', 'makex-in': 'MakeX Inspire', 'makex-ex': 'MakeX Explore', 'makex-ch': 'MakeX Challenger' };
    var programs = [
        { code: 'frc',       value: 'FRC' },
        { code: 'makex-in',  value: 'MakeX Inspire' },
        { code: 'makex-ex',  value: 'MakeX Explore' },
        { code: 'makex-ch',  value: 'MakeX Challenger' },
    ];

    if (events.length === 0) {
        content.innerHTML = '<h1>📅 集训管理</h1><p style="color:var(--text-muted);">暂无集训活动，点击下方按钮创建。</p>' +
            '<button id="newEventBtn">➕ 新建集训</button>';
    } else {
        var html = '<h1>📅 集训管理</h1>';
        html += '<div style="display:flex;gap:12px;margin-bottom:20px;align-items:center;">';
        html += '<button id="newEventBtn">➕ 新建集训</button>';
        html += '<select id="programFilter" style="padding:8px 12px;border:1px solid var(--line);border-radius:8px;"><option value="">全部赛项</option>';
        programs.forEach(function (p) {
            html += '<option value="' + p.code + '">' + p.value + '</option>';
        });
        html += '</select>';
        html += '</div>';
        html += '<div class="event-grid" id="eventGrid">';
        events.forEach(function (e) {
            html += renderEventCard(e, progMap);
        });
        html += '</div>';
        content.innerHTML = html;

        document.getElementById('programFilter').addEventListener('change', function () {
            var filter = this.value;
            var grid = document.getElementById('eventGrid');
            grid.innerHTML = '';
            events.forEach(function (e) {
                if (!filter || e.program_id === filter) {
                    grid.innerHTML += renderEventCard(e, progMap);
                }
            });
        });
    }

    document.getElementById('newEventBtn').addEventListener('click', function () {
        showEventModal(null);
    });

    // 编辑 / 删除按钮
    content.querySelectorAll('.editEventBtn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var e = events.find(function (x) { return x.id == btn.dataset.id; });
            if (e) showEventModal(e);
        });
    });
    content.querySelectorAll('.delEventBtn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            if (!confirm('删除这个集训活动？')) return;
            window.apiFetch('/api/events?id=' + btn.dataset.id, { method: 'DELETE' })
                .then(function () { window.setupEventList(); });
        });
    });
};

function renderEventCard(e, progMap) {
    var statusLabel = e.status === 'active' ? '🟢 进行中' : e.status === 'done' ? '✅ 已完成' : '📋 草稿';
    var html = '<div class="program-card">';
    html += '<div class="program-card-header"><strong>' + e.name + '</strong>';
    html += '<button class="delEventBtn user-action-btn user-action-delete" data-id="' + e.id + '" style="float:right;">✕</button>';
    html += '<button class="editEventBtn user-action-btn user-action-edit" data-id="' + e.id + '" style="float:right;margin-right:4px;">✎</button>';
    html += '</div>';
    html += '<div style="font-size:0.85em;color:var(--text-muted);">' + (progMap[e.program_id] || e.program_id) + ' · ' + e.year + '</div>';
    html += '<div style="margin-top:4px;">' + statusLabel + '</div>';
    html += '<div style="font-size:0.8em;color:var(--text-muted);margin-top:4px;">' + (e.start_date || '未定日期') + (e.end_date ? ' ~ ' + e.end_date : '') + '</div>';
    html += '</div>';
    return html;
}

// ========== 事件 Modal ==========
async function showEventModal(eventData) {
    var isEdit = !!eventData;

    var programs = [
        { code: 'frc',       value: 'FRC' },
        { code: 'makex-in',  value: 'MakeX Inspire' },
        { code: 'makex-ex',  value: 'MakeX Explore' },
        { code: 'makex-ch',  value: 'MakeX Challenger' },
    ];

    var tasksRes = await window.apiFetch('/api/tasks');
    var allTasks = await tasksRes.json();

    var studentsRes = await window.apiFetch('/api/students');
    var allStudents = await studentsRes.json();

    var modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = '<div class="modal-content" style="max-width:600px;max-height:90vh;overflow-y:auto;">' +
        '<div class="modal-header"><h3>' + (isEdit ? '编辑集训' : '新建集训') + '</h3></div>' +
        '<div class="modal-body">' +
        '<label>名称</label><input id="evName" value="' + (eventData ? eventData.name : '') + '">' +
        '<label>赛项</label><select id="evProgram">' + programs.map(function (p) {
            return '<option value="' + p.code + '"' + (eventData && eventData.program_id === p.code ? ' selected' : '') + '>' + p.value + '</option>';
        }).join('') + '</select>' +
        '<label>赛年</label><input id="evYear" type="number" value="' + (eventData ? eventData.year : new Date().getFullYear()) + '">' +
        '<label>开始日期</label><input id="evStart" type="date" value="' + (eventData ? eventData.start_date || '' : '') + '">' +
        '<label>结束日期</label><input id="evEnd" type="date" value="' + (eventData ? eventData.end_date || '' : '') + '">' +
        '<label>状态</label><select id="evStatus">' +
        '<option value="draft"' + (eventData && eventData.status === 'draft' ? ' selected' : '') + '>草稿</option>' +
        '<option value="active"' + (eventData && eventData.status === 'active' ? ' selected' : '') + '>进行中</option>' +
        '<option value="done"' + (eventData && eventData.status === 'done' ? ' selected' : '') + '>已完成</option>' +
        '</select>' +
        '<label>关联任务（可多选）</label><div id="evTaskList" style="max-height:200px;overflow-y:auto;"></div>' +
        '<label>参与学生（可多选）</label><div id="evStudentList" style="max-height:200px;overflow-y:auto;"></div>' +
        '</div>' +
        '<div class="modal-footer">' +
        '<button class="user-action-btn user-action-delete" id="cancelModal">取消</button>' +
        '<button class="user-action-btn user-action-edit" id="saveEvent">保存</button>' +
        '</div>' +
        '</div>';

    document.body.appendChild(modal);

    // 填任务 checkboxes
    var taskContainer = modal.querySelector('#evTaskList');
    allTasks.forEach(function (t) {
        var checked = eventData && eventData.task_ids && eventData.task_ids.indexOf(t.id) !== -1;
        taskContainer.innerHTML += '<label style="display:block;font-size:0.9em;"><input type="checkbox" value="' + t.id + '"' + (checked ? ' checked' : '') + '> ' + t.name + ' (' + t.program_id + ' ' + t.year + ')</label>';
    });

    // 填学生 checkboxes
    var studentContainer = modal.querySelector('#evStudentList');
    allStudents.forEach(function (s) {
        var checked = eventData && eventData.participants && eventData.participants.indexOf(s.id) !== -1;
        studentContainer.innerHTML += '<label style="display:block;font-size:0.9em;"><input type="checkbox" value="' + s.id + '"' + (checked ? ' checked' : '') + '> ' + s.name + ' (' + (s.program || '无') + ')</label>';
    });

    modal.addEventListener('click', function (e) {
        if (e.target === modal) modal.remove();
    });
    modal.querySelector('#cancelModal').addEventListener('click', function () { modal.remove(); });

    modal.querySelector('#saveEvent').addEventListener('click', async function () {
        var tasks = [];
        modal.querySelectorAll('#evTaskList input:checked').forEach(function (cb) { tasks.push(parseInt(cb.value)); });
        var students = [];
        modal.querySelectorAll('#evStudentList input:checked').forEach(function (cb) { students.push(parseInt(cb.value)); });

        var body = {
            name: modal.querySelector('#evName').value.trim(),
            program_id: modal.querySelector('#evProgram').value,
            year: parseInt(modal.querySelector('#evYear').value),
            start_date: modal.querySelector('#evStart').value || null,
            end_date: modal.querySelector('#evEnd').value || null,
            status: modal.querySelector('#evStatus').value,
            task_ids: tasks,
            participants: students
        };

        var url = '/api/events';
        var method = 'POST';
        if (isEdit) {
            url += '?id=' + eventData.id;
            method = 'PUT';
        }

        var r = await window.apiFetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (r.ok) {
            modal.remove();
            window.setupEventList();
        } else {
            var err = await r.json();
            alert('保存失败：' + (err.error || '未知错误'));
        }
    });

    // 赛项切换时过滤任务
    modal.querySelector('#evProgram').addEventListener('change', function () {
        var selProgram = this.value;
        var checkboxes = modal.querySelectorAll('#evTaskList label');
        checkboxes.forEach(function (label) {
            var text = label.textContent || '';
            if (text.indexOf(selProgram) !== -1) {
                label.style.display = 'block';
            } else {
                label.style.display = 'none';
            }
        });
    });
    // 初始触发
    modal.querySelector('#evProgram').dispatchEvent(new Event('change'));
}

})();
