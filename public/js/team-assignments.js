// 队伍分配功能（工具 → FRC 分类下使用）
(function () {

function renderTeamAssignContent() {
	return `
		<h1>🎯 队伍分配</h1>
		<div class="users-card">
			<h2 class="users-section-title">为队员分配队伍</h2>
			<p style="color: var(--text-muted); margin-bottom: 20px;">选择队员，然后勾选要分配的队伍，支持批量分配。队员登录后将看到分配给他们的队伍。</p>
			<div style="margin-bottom: 20px;">
				<label>选择队员</label>
				<select id="tAssignUsername">
					<option value="">选择队员...</option>
				</select>
			</div>
			<div style="margin-bottom: 20px;">
				<label>选择要分配的队伍（可多选）</label>
				<div id="tTeamCheckboxes" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; max-height: 300px; overflow-y: auto; border: 1px solid var(--line); padding: 10px; border-radius: 4px; background: var(--surface-contrast);">
				</div>
			</div>
			<button id="tAssignBtn" style="width: 100%; padding: 10px; font-size: 16px;">批量分配</button>
			<h2 class="users-section-title" style="margin-top: 30px;">当前分配</h2>
			<div id="tAssignmentsList"></div>
		</div>
	`;
}

async function tSetupListeners() {
	// Load teams
	var teamsRes = await fetch('/api/teams');
	var teams = await teamsRes.json();

	// Load users (from getAllUsers which fetches /api/users)
	var users = [];
	if (typeof getAllUsers === 'function') {
		users = await getAllUsers();
	}

	// Load current assignments
	var assignRes = await apiFetch('/api/team-assignments');
	var assignments = await assignRes.json();

	// Group by username
	var assignMap = {};
	assignments.forEach(function(a) {
		if (!assignMap[a.username]) assignMap[a.username] = [];
		assignMap[a.username].push(a.team_number);
	});

	// Populate username dropdown (exclude admin)
	var sel = document.getElementById('tAssignUsername');
	if (sel) {
		sel.innerHTML = '<option value="">选择队员...</option>';
		users.filter(function(u) { return u.username !== 'admin'; }).forEach(function(user) {
			var opt = document.createElement('option');
			opt.value = user.username;
			opt.textContent = user.username + ' (' + (user.role === 'admin' ? '管理员' : user.role === 'user' ? '用户' : '测试员') + ')';
			sel.appendChild(opt);
		});
	}

	// Populate team checkboxes
	var checkDiv = document.getElementById('tTeamCheckboxes');
	if (checkDiv) {
		checkDiv.innerHTML = '';
		teams.forEach(function(team) {
			var label = document.createElement('label');
			label.style.cssText = 'cursor:pointer;display:flex;align-items:center;gap:8px;';
			var cb = document.createElement('input');
			cb.type = 'checkbox';
			cb.value = team.team_number;
			cb.className = 't-team-cb';
			label.appendChild(cb);
			label.appendChild(document.createTextNode(team.team_number + ' - ' + team.team_name));
			checkDiv.appendChild(label);
		});
	}

	// Assign button
	var btn = document.getElementById('tAssignBtn');
	if (btn) {
		btn.removeEventListener('click', tAssign);
		btn.addEventListener('click', tAssign);
	}

	// Display current assignments
	var list = document.getElementById('tAssignmentsList');
	if (list) {
		var html = '<table class="users-table"><thead><tr class="users-table-head"><th>队员</th><th>队伍</th><th>队名</th><th>操作</th></tr></thead><tbody>';
		var keys = Object.keys(assignMap);
		for (var i = 0; i < keys.length; i++) {
			var username = keys[i];
			var tns = assignMap[username];
			for (var j = 0; j < tns.length; j++) {
				var tn = tns[j];
				var team = teams.find(function(t) { return t.team_number === tn; });
				html += '<tr class="users-table-row">' +
					'<td class="users-table-cell">' + username + '</td>' +
					'<td class="users-table-cell">' + tn + '</td>' +
					'<td class="users-table-cell">' + (team ? team.team_name : '未知') + '</td>' +
					'<td class="users-table-actions">' +
						'<button class="tRemoveBtn user-action-btn user-action-delete" data-u="' + username + '" data-t="' + tn + '">删除</button>' +
					'</td></tr>';
			}
		}
		html += '</tbody></table>';
		list.innerHTML = html;

		list.querySelectorAll('.tRemoveBtn').forEach(function(btn) {
			btn.addEventListener('click', function() {
				tRemove(this.dataset.u, this.dataset.t);
			});
		});
	}
}

async function tAssign() {
	var sel = document.getElementById('tAssignUsername');
	var username = sel ? sel.value : '';
	if (!username) { alert('请选择队员'); return; }

	var checked = Array.from(document.querySelectorAll('.t-team-cb:checked')).map(function(cb) { return cb.value; });
	if (checked.length === 0) { alert('请选择至少一个队伍'); return; }

	var ok = 0, fail = 0, failedTeams = [];
	for (var i = 0; i < checked.length; i++) {
		var tn = checked[i];
		var res = await apiFetch('/api/team-assignments', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username: username, team_number: tn })
		});
		var result = await res.json();
		if (res.ok && result.ok) ok++; else { fail++; failedTeams.push(tn + ': ' + (result.error || '?')); }
	}

	document.querySelectorAll('.t-team-cb').forEach(function(cb) { cb.checked = false; });

	if (fail === 0) {
		alert('成功为 ' + username + ' 分配了 ' + ok + ' 个队伍');
	} else {
		var msg = '成功: ' + ok + ' / 失败: ' + fail;
		if (failedTeams.length > 0) msg += '\n' + failedTeams.slice(0, 5).join('\n');
		alert(msg);
	}
	await tSetupListeners();
}

async function tRemove(username, teamNumber) {
	if (!confirm('确定要删除 ' + username + ' 对队伍 ' + teamNumber + ' 的分配吗？')) return;
	var res = await apiFetch('/api/team-assignments?username=' + encodeURIComponent(username) + '&team_number=' + encodeURIComponent(teamNumber), { method: 'DELETE' });
	var result = await res.json();
	if (!res.ok || !result.ok) { alert(result.error || '删除失败'); return; }
	alert('已删除');
	await tSetupListeners();
}

window.renderTeamAssignContent = renderTeamAssignContent;
window.tSetupListeners = tSetupListeners;

})();
