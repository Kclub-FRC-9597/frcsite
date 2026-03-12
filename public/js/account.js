(function () {
    async function renderAccountDashboard() {
        const app = document.getElementById('app');
        const accountSection = window.location.hash.replace('#account', '') || '/profile';
        const header = await loadHeader();
        const footer = await loadFooter();
        const contentHtml = renderAccountContentTemplate(accountSection);

        app.innerHTML = renderAccountDashboardTemplate({
            header,
            footer,
            accountSection,
            contentHtml,
            adminEnabled: isAdmin()
        });

        setTimeout(function() {
            if (accountSection === '/profile') {
                setupProfileEventListeners();
            } else if (accountSection === '/password') {
                const changePasswordBtn = document.getElementById('changePasswordBtn');
                if (changePasswordBtn) {
                    changePasswordBtn.addEventListener('click', changePassword);
                }
            } else if (accountSection === '/content') {
                setupContentEditorListeners();
            } else if (accountSection === '/users') {
                setupUserManagementListeners();
            } else if (accountSection === '/teams') {
                setupTeamAssignmentListeners();
            }
        }, 100);
    }

    function setupProfileEventListeners() {
        const editNicknameBtn = document.getElementById('editNicknameBtn');
        if (editNicknameBtn) {
            editNicknameBtn.addEventListener('click', showNicknameEditor);
        }
    }

    function showNicknameEditor() {
        const nickname = localStorage.getItem(`nickname_${currentUser}`) || '';
        const nicknameSection = document.getElementById('nicknameSection');

        nicknameSection.innerHTML = `
                <input type="text" id="nicknameInput" placeholder="输入昵称（1-20个字符）" value="${nickname}" class="nickname-input">
                <button id="saveNicknameBtn" class="btn-nickname btn-nickname-save">保存</button>
                <button id="cancelNicknameBtn" class="btn-nickname btn-nickname-cancel">取消</button>
            `;

        document.getElementById('nicknameInput').focus();
        document.getElementById('saveNicknameBtn').addEventListener('click', saveNickname);
        document.getElementById('cancelNicknameBtn').addEventListener('click', cancelNicknameEdit);
    }

    function saveNickname() {
        const nicknameInput = document.getElementById('nicknameInput');
        const nickname = nicknameInput.value.trim();

        if (!nickname) {
            alert('昵称不能为空');
            return;
        }

        if (nickname.length > 20) {
            alert('昵称长度不能超过20个字符');
            return;
        }

        localStorage.setItem(`nickname_${currentUser}`, nickname);
        alert('昵称已成功修改');

        const nicknameSection = document.getElementById('nicknameSection');
        nicknameSection.innerHTML = `
                <p class="nickname-display" id="nicknameDisplay">${nickname}</p>
                <button id="editNicknameBtn" class="btn-nickname btn-nickname-edit">编辑昵称</button>
            `;
        setupProfileEventListeners();
    }

    function cancelNicknameEdit() {
        const nickname = localStorage.getItem(`nickname_${currentUser}`) || '';
        const nicknameSection = document.getElementById('nicknameSection');
        nicknameSection.innerHTML = `
                <p class="nickname-display" id="nicknameDisplay">${nickname || '未设置'}</p>
                <button id="editNicknameBtn" class="btn-nickname btn-nickname-edit">编辑昵称</button>
            `;
        setupProfileEventListeners();
    }

    async function getAllUsers() {
        try {
            const response = await apiFetch('/api/users');
            const dbUsers = response.ok ? await response.json() : [];
            const normalized = Array.isArray(dbUsers) ? dbUsers.map(user => ({
                username: user.username,
                role: user.role || 'admin',
                isSystemUser: user.username === ADMIN_USER
            })) : [];

            const hasTester = normalized.some(user => user.username === TESTER_USER);
            if (!hasTester) {
                normalized.push({ username: TESTER_USER, role: 'tester', isSystemUser: true });
            }

            const hasUser = normalized.some(user => user.username === USER_USER);
            if (!hasUser) {
                normalized.push({ username: USER_USER, role: 'user', isSystemUser: true });
            }

            return normalized;
        } catch (err) {
            console.error('Error loading users:', err);
            return [
                { username: TESTER_USER, role: 'tester', isSystemUser: true },
                { username: USER_USER, role: 'user', isSystemUser: true }
            ];
        }
    }

    async function setupUserManagementListeners() {
        const usersList = document.getElementById('usersList');
        const users = await getAllUsers();

        let html = '<table class="users-table">';
        html += '<thead><tr class="users-table-head"><th>用户名</th><th>昵称</th><th>角色</th><th>操作</th></tr></thead>';
        html += '<tbody>';

        for (const user of users) {
            const nickname = localStorage.getItem(`nickname_${user.username}`) || '未设置';
            let roleDisplay = '👤 未知';
            if (user.role === 'admin') {
                roleDisplay = '👑 管理员';
            } else if (user.role === 'user') {
                roleDisplay = '👤 用户';
            } else if (user.role === 'tester') {
                roleDisplay = '🧪 测试员';
            }

            html += `<tr class="users-table-row">
                    <td class="users-table-cell">${user.username}</td>
                    <td class="users-table-cell">${nickname}</td>
                    <td class="users-table-cell">${roleDisplay}</td>
                    <td class="users-table-actions">
                        <button class="editUserBtn user-action-btn user-action-edit" data-username="${user.username}">编辑</button>
                        <button class="resetPasswordBtn user-action-btn user-action-reset" data-username="${user.username}">重置密码</button>
                        ${!user.isSystemUser && !isSystemUser(user.username) ? `<button class="deleteUserBtn user-action-btn user-action-delete" data-username="${user.username}">删除</button>` : ''}
                    </td>
                </tr>`;
        }

        html += '</tbody></table>';
        usersList.innerHTML = html;

        document.querySelectorAll('.editUserBtn').forEach(btn => {
            btn.addEventListener('click', function() {
                editUserNickname(this.dataset.username);
            });
        });

        document.querySelectorAll('.resetPasswordBtn').forEach(btn => {
            btn.addEventListener('click', function() {
                resetUserPassword(this.dataset.username);
            });
        });

        document.querySelectorAll('.deleteUserBtn').forEach(btn => {
            btn.addEventListener('click', function() {
                deleteUser(this.dataset.username);
            });
        });

        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', addUser);
        }
    }

    async function addUser() {
        const usernameInput = document.getElementById('newUsername');
        const passwordInput = document.getElementById('newPassword');
        const roleInput = document.getElementById('newRole');

        const username = (usernameInput?.value || '').trim();
        const password = passwordInput?.value || '';
        const role = roleInput?.value || 'admin';

        if (!username || !password) {
            alert('请填写用户名和密码');
            return;
        }

        if (isSystemUser(username)) {
            alert(`${username} 为本地测试账户，不能添加到数据库`);
            return;
        }

        const response = await apiFetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, role })
        });

        const result = await response.json();
        if (!response.ok || !result?.ok) {
            alert(result?.error || '添加账户失败');
            return;
        }

        usernameInput.value = '';
        passwordInput.value = '';
        roleInput.value = 'admin';
        alert('账户添加成功');
        await setupUserManagementListeners();
    }

    function editUserNickname(username) {
        const nickname = localStorage.getItem(`nickname_${username}`) || '';
        const newNickname = prompt(`编辑 ${username} 的昵称：`, nickname);

        if (newNickname === null) return;

        const trimmedNickname = newNickname.trim();

        if (trimmedNickname === '') {
            localStorage.removeItem(`nickname_${username}`);
            alert('昵称已清除');
        } else if (trimmedNickname.length > 20) {
            alert('昵称长度不能超过20个字符');
            return;
        } else {
            localStorage.setItem(`nickname_${username}`, trimmedNickname);
            alert('昵称已修改');
        }

        setupUserManagementListeners();
    }

    async function resetUserPassword(username) {
        if (!confirm(`确定要重置 ${username} 的密码吗？`)) {
            return;
        }

        if (isSystemUser(username)) {
            localStorage.removeItem(`password_${username}`);
            alert(`${username} 的密码已重置为默认密码`);
            return;
        }

        const users = await getAllUsers();
        const target = users.find(u => u.username === username);
        if (!target) {
            alert('用户不存在');
            return;
        }

        let defaultPassword = ADMIN_PASS;
        if (username === ADMIN_USER) {
            defaultPassword = ADMIN_PASS;
        } else if (username === USER_USER) {
            defaultPassword = USER_PASS;
        } else if (username === TESTER_USER) {
            defaultPassword = TESTER_PASS;
        } else if (target.role === 'user') {
            defaultPassword = USER_PASS;
        } else if (target.role === 'tester') {
            defaultPassword = TESTER_PASS;
        }

        const response = await apiFetch('/api/users', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, role: target.role || 'admin', password: defaultPassword })
        });

        const result = await response.json();
        if (!response.ok || !result?.ok) {
            alert(result?.error || '重置密码失败');
            return;
        }

        alert(`${username} 的密码已重置为默认密码`);
    }

    async function deleteUser(username) {
        if (!confirm(`确定要删除用户 ${username} 吗？此操作无法撤销！`)) {
            return;
        }

        if (!confirm(`再次确认：删除 ${username} 将清除其所有数据！`)) {
            return;
        }

        if (isTesterUser(username)) {
            alert('tester 为系统本地测试账户，不能删除');
            return;
        }

        const response = await apiFetch(`/api/users?username=${encodeURIComponent(username)}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        if (!response.ok || !result?.ok) {
            alert(result?.error || '删除失败');
            return;
        }

        localStorage.removeItem(`password_${username}`);
        localStorage.removeItem(`nickname_${username}`);
        alert(`用户 ${username} 已删除`);

        await setupUserManagementListeners();
    }

    function setupContentEditorListeners() {
        const content = getHomePageContent();
        const featuresEditor = document.getElementById('featuresEditor');
        const toolsEditor = document.getElementById('toolsEditor');

        let featuresHtml = '';
        for (let i = 0; i < content.features.length; i++) {
            const feature = content.features[i];
            featuresHtml += `
                    <div class="content-edit-item-card">
                        <div class="form-group">
                            <label class="content-edit-item-label">特性 ${i + 1}: 标题</label>
                            <input type="text" data-feature-index="${i}" data-field="title" class="featureInput content-edit-input" value="${feature.title}">
                        </div>
                        <div class="form-group">
                            <label class="content-edit-item-label">特性 ${i + 1}: 描述</label>
                            <textarea data-feature-index="${i}" data-field="description" class="featureInput content-edit-textarea">${feature.description}</textarea>
                        </div>
                    </div>
                `;
        }
        if (featuresEditor) featuresEditor.innerHTML = featuresHtml;

        let toolsHtml = '';
        for (let i = 0; i < content.tools.items.length; i++) {
            const item = content.tools.items[i];
            toolsHtml += `
                    <div class="content-edit-item-card">
                        <div class="form-group">
                            <label class="content-edit-item-label">工具 ${i + 1}: 名称</label>
                            <input type="text" data-tool-index="${i}" data-field="name" class="toolInput content-edit-input" value="${item.name}">
                        </div>
                        <div class="form-group">
                            <label class="content-edit-item-label">工具 ${i + 1}: 描述</label>
                            <textarea data-tool-index="${i}" data-field="description" class="toolInput content-edit-textarea">${item.description}</textarea>
                        </div>
                    </div>
                `;
        }
        if (toolsEditor) toolsEditor.innerHTML = toolsHtml;

        const saveBtn = document.getElementById('saveContentBtn');
        const resetBtn = document.getElementById('resetContentBtn');

        if (saveBtn) {
            saveBtn.addEventListener('click', saveHomepageContent);
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', resetHomepageContent);
        }
    }

    function saveHomepageContent() {
        const content = getHomePageContent();

        const aboutP1 = document.getElementById('aboutP1');
        const aboutP2 = document.getElementById('aboutP2');
        const aboutP3 = document.getElementById('aboutP3');

        if (aboutP1 && aboutP1.value.trim()) {
            content.aboutUs.p1 = aboutP1.value;
        } else if (aboutP1) {
            alert('关于我们的第一段不能为空');
            return;
        }

        if (aboutP2 && aboutP2.value.trim()) {
            content.aboutUs.p2 = aboutP2.value;
        } else if (aboutP2) {
            alert('关于我们的第二段不能为空');
            return;
        }

        if (aboutP3 && aboutP3.value.trim()) {
            content.aboutUs.p3 = aboutP3.value;
        } else if (aboutP3) {
            alert('关于我们的第三段不能为空');
            return;
        }

        document.querySelectorAll('.featureInput').forEach(input => {
            const index = parseInt(input.dataset.featureIndex);
            const field = input.dataset.field;
            const value = input.value.trim();

            if (value && content.features[index]) {
                content.features[index][field] = value;
            }
        });

        const toolsDescription = document.getElementById('toolsDescription');
        if (toolsDescription && toolsDescription.value.trim()) {
            content.tools.description = toolsDescription.value;
        }

        document.querySelectorAll('.toolInput').forEach(input => {
            const index = parseInt(input.dataset.toolIndex);
            const field = input.dataset.field;
            const value = input.value.trim();

            if (value && content.tools.items[index]) {
                content.tools.items[index][field] = value;
            }
        });

        saveHomePageContent(content);
        alert('✅ 主页内容已保存！');

        setTimeout(() => {
            window.location.hash = '#home';
        }, 500);
    }

    function resetHomepageContent() {
        if (!confirm('确定要重置所有主页内容为默认值吗？此操作无法撤销！')) {
            return;
        }

        localStorage.setItem('homepage_content', JSON.stringify(DEFAULT_HOMEPAGE_CONTENT));
        alert('✅ 主页内容已重置为默认值！');

        setTimeout(() => {
            window.location.hash = '#home';
        }, 500);
    }

    async function changePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!currentPassword || !newPassword || !confirmPassword) {
            alert('请填写所有密码字段');
            return;
        }

        if (newPassword !== confirmPassword) {
            alert('新密码与确认密码不一致');
            return;
        }

        if (newPassword.length < 6) {
            alert('新密码至少需要6个字符');
            return;
        }

        if (isTesterUser(currentUser)) {
            const savedPassword = localStorage.getItem(`password_${currentUser}`);
            const defaultPassword = TESTER_PASS;
            const isPasswordValid = currentPassword === defaultPassword || currentPassword === savedPassword;

            if (!isPasswordValid) {
                alert('当前密码错误');
                return;
            }

            localStorage.setItem(`password_${currentUser}`, newPassword);
            alert('密码已成功修改');
        } else {
            const response = await apiFetch('/api/users/password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: currentUser, currentPassword, newPassword })
            });
            const result = await response.json();
            if (!response.ok || !result?.ok) {
                alert(result?.error || '修改密码失败');
                return;
            }
            alert('密码已成功修改');
        }

        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
    }

    async function setupTeamAssignmentListeners() {
        // Load teams
        const teamsResponse = await fetch('/api/teams');
        const teams = await teamsResponse.json();

        // Load users
        const users = await getAllUsers();

        // Load current assignments
        const assignmentsResponse = await apiFetch('/api/team-assignments');
        const assignments = await assignmentsResponse.json();
        
        // Group assignments by username: username -> [team_number1, team_number2, ...]
        const assignmentsMap = new Map();
        assignments.forEach(a => {
            if (!assignmentsMap.has(a.username)) {
                assignmentsMap.set(a.username, []);
            }
            assignmentsMap.get(a.username).push(a.team_number);
        });

        // Populate username dropdown (exclude admin)
        const usernameSelect = document.getElementById('assignUsername');
        users.filter(u => u.username !== 'admin').forEach(user => {
            const option = document.createElement('option');
            option.value = user.username;
            option.textContent = `${user.username} (${user.role === 'admin' ? '管理员' : user.role === 'user' ? '用户' : '测试员'})`;
            usernameSelect.appendChild(option);
        });

        // Populate team dropdown
        const teamSelect = document.getElementById('assignTeamNumber');
        teams.forEach(team => {
            const option = document.createElement('option');
            option.value = team.team_number;
            option.textContent = `${team.team_number} - ${team.team_name}`;
            teamSelect.appendChild(option);
        });

        // Setup assign button
        const assignBtn = document.getElementById('assignTeamBtn');
        if (assignBtn) {
            assignBtn.addEventListener('click', assignTeam);
        }

        // Display current assignments
        const assignmentsList = document.getElementById('assignmentsList');
        if (assignmentsList) {
            let html = '<table class="users-table">';
            html += '<thead><tr class="users-table-head"><th>队员</th><th>分配队伍</th><th>队名</th><th>操作</th></tr></thead>';
            html += '<tbody>';

            for (const [username, teamNumbers] of assignmentsMap) {
                for (const teamNumber of teamNumbers) {
                    const team = teams.find(t => t.team_number === teamNumber);
                    html += `<tr class="users-table-row">
                        <td class="users-table-cell">${username}</td>
                        <td class="users-table-cell">${teamNumber}</td>
                        <td class="users-table-cell">${team ? team.team_name : '未知'}</td>
                        <td class="users-table-actions">
                            <button class="removeAssignmentBtn user-action-btn user-action-delete" data-username="${username}" data-team-number="${teamNumber}">删除分配</button>
                        </td>
                    </tr>`;
                }
            }

            html += '</tbody></table>';
            assignmentsList.innerHTML = html;

            document.querySelectorAll('.removeAssignmentBtn').forEach(btn => {
                btn.addEventListener('click', function() {
                    removeTeamAssignment(this.dataset.username, this.dataset.teamNumber);
                });
            });
        }
    }

    async function assignTeam() {
        const usernameSelect = document.getElementById('assignUsername');
        const teamSelect = document.getElementById('assignTeamNumber');

        const username = usernameSelect?.value;
        const teamNumber = teamSelect?.value;

        if (!username || !teamNumber) {
            alert('请选择队员和队伍');
            return;
        }

        const response = await apiFetch('/api/team-assignments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, team_number: teamNumber })
        });

        const result = await response.json();
        if (!response.ok || !result?.ok) {
            alert(result?.error || '分配队伍失败');
            return;
        }

        alert(`已为 ${username} 分配队伍 ${teamNumber}`);
        await setupTeamAssignmentListeners();
    }

    async function removeTeamAssignment(username, teamNumber) {
        if (!confirm(`确定要删除 ${username} 对队伍 ${teamNumber} 的分配吗？`)) {
            return;
        }

        const response = await apiFetch(`/api/team-assignments?username=${username}&team_number=${teamNumber}`, {
            method: 'DELETE'
        });

        const result = await response.json();
        if (!response.ok || !result?.ok) {
            alert(result?.error || '删除分配失败');
            return;
        }

        alert('队伍分配已删除');
        await setupTeamAssignmentListeners();
    }

    Object.assign(window, {
        renderAccountDashboard,
        setupProfileEventListeners,
        showNicknameEditor,
        saveNickname,
        cancelNicknameEdit,
        getAllUsers,
        setupUserManagementListeners,
        addUser,
        editUserNickname,
        resetUserPassword,
        deleteUser,
        setupTeamAssignmentListeners,
        assignTeam,
        removeTeamAssignment,
        setupContentEditorListeners,
        saveHomepageContent,
        resetHomepageContent,
        changePassword
    });
})();
