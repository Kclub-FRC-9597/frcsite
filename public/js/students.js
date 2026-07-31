// 学生管理逻辑（admin 专用）
(function () {
	async function setupStudentListeners() {
		await renderStudentList();

		const showBtn = document.getElementById('showAddStudentBtn');
		const modal = document.getElementById('addStudentModal');
		const closeBtn = document.getElementById('closeAddStudentModal');
		const cancelBtn = document.getElementById('cancelAddStudentBtn');
		const addBtn = document.getElementById('addStudentBtn');

		if (showBtn && modal) {
			showBtn.addEventListener('click', () => { modal.style.display = 'flex'; });
		}
		if (closeBtn && modal) {
			closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
		}
		if (cancelBtn && modal) {
			cancelBtn.addEventListener('click', () => { modal.style.display = 'none'; });
		}
		if (modal) {
			modal.addEventListener('click', (e) => {
				if (e.target === modal) modal.style.display = 'none';
			});
		}
		if (addBtn) {
			addBtn.addEventListener('click', addStudent);
		}
	}

	async function renderStudentList() {
		const list = document.getElementById('studentsList');
		if (!list) return;

		try {
			const response = await apiFetch('/api/students');
			const students = await response.json();

			if (!students.length) {
				list.innerHTML = '<p style="color: var(--text-muted); padding: 20px; text-align: center;">暂无学生数据</p>';
				return;
			}

			let html = '<table class="users-table">';
			html += '<thead><tr class="users-table-head"><th>用户名</th><th>姓名</th><th>创建时间</th><th>操作</th></tr></thead><tbody>';

			for (const s of students) {
				html += `<tr class="users-table-row">
					<td class="users-table-cell">${s.username}</td>
					<td class="users-table-cell">${s.real_name || '—'}</td>
					<td class="users-table-cell">${formatDate(s.created_at)}</td>
					<td class="users-table-actions">
						<button class="editStudentBtn user-action-btn user-action-edit" data-username="${s.username}">编辑</button>
						<button class="resetStudentPwdBtn user-action-btn user-action-reset" data-username="${s.username}">改密</button>
						<button class="deleteStudentBtn user-action-btn user-action-delete" data-username="${s.username}">删除</button>
					</td>
				</tr>`;
			}

			html += '</tbody></table>';
			list.innerHTML = html;

			// 绑定按钮事件
			list.querySelectorAll('.editStudentBtn').forEach(btn => {
				btn.addEventListener('click', () => editStudent(btn.dataset.username));
			});
			list.querySelectorAll('.resetStudentPwdBtn').forEach(btn => {
				btn.addEventListener('click', () => resetStudentPassword(btn.dataset.username));
			});
			list.querySelectorAll('.deleteStudentBtn').forEach(btn => {
				btn.addEventListener('click', () => deleteStudent(btn.dataset.username));
			});
		} catch (err) {
			list.innerHTML = `<p style="color: red;">加载失败：${err.message}</p>`;
		}
	}

	async function addStudent() {
		const username = (document.getElementById('newStudentUsername')?.value || '').trim();
		const password = (document.getElementById('newStudentPassword')?.value || '');
		const real_name = (document.getElementById('newStudentName')?.value || '').trim();

		if (!username || !password) {
			alert('用户名和密码不能为空');
			return;
		}

		const response = await apiFetch('/api/students', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, password, real_name })
		});

		const result = await response.json();
		if (!response.ok || !result.ok) {
			alert(result.error || '添加失败');
			return;
		}

		// 清空表单并关闭弹窗
		['newStudentUsername', 'newStudentPassword', 'newStudentName'].forEach(function (id) {
			var el = document.getElementById(id);
			if (el && el.tagName === 'INPUT') el.value = '';
		});
		const modal = document.getElementById('addStudentModal');
		if (modal) modal.style.display = 'none';

		alert('学生添加成功');
		await renderStudentList();
	}

	async function editStudent(username) {
		try {
			const response = await apiFetch('/api/students');
			const students = await response.json();
			const student = students.find(function(s) { return s.username === username; });
			if (!student) return;

			const newName = prompt('真实姓名：', student.real_name || '');
			if (newName === null) return;

			const updateResponse = await apiFetch('/api/students', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, real_name: newName.trim() })
			});

			const result = await updateResponse.json();
			if (!updateResponse.ok || !result.ok) {
				alert(result.error || '更新失败');
				return;
			}

			alert('更新成功');
			await renderStudentList();
		} catch (err) {
			alert('操作失败：' + (err && err.message ? err.message : String(err)));
		}
	}

	async function resetStudentPassword(username) {
		const newPassword = prompt(`为 ${username} 设置新密码（至少6个字符）：`);
		if (!newPassword || newPassword.trim().length < 6) {
			alert('密码至少需要6个字符');
			return;
		}

		const response = await apiFetch('/api/students', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ username, password: newPassword.trim() })
		});

		const result = await response.json();
		if (!response.ok || !result.ok) {
			alert(result.error || '密码修改失败');
			return;
		}

		alert('密码已更新');
	}

	async function deleteStudent(username) {
		if (!confirm(`确定要删除学生 ${username} 吗？此操作将同时删除其账户和数据。`)) return;

		const response = await apiFetch(`/api/students?username=${encodeURIComponent(username)}`, {
			method: 'DELETE'
		});

		const result = await response.json();
		if (!response.ok || !result.ok) {
			alert(result.error || '删除失败');
			return;
		}

		alert('已删除');
		await renderStudentList();
	}

	function formatDate(ts) {
		if (!ts) return '—';
		return new Date(ts).toLocaleDateString('zh-CN');
	}

	window.setupStudentListeners = setupStudentListeners;
})();
