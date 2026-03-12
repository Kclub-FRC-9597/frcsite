(function () {
    function renderAccountDashboardTemplate({ header, footer, accountSection, contentHtml, adminEnabled }) {
        return `
                ${header}
                <div class="container">
                    <div class="sidebar" id="accountSidebar">
                        <h3>账户</h3>
                        <ul>
                            <li><a href="#account/profile" class="${accountSection === '/profile' ? 'active' : ''}">👤 个人信息</a></li>
                            <li><a href="#account/password" class="${accountSection === '/password' ? 'active' : ''}">🔐 修改密码</a></li>
                            ${adminEnabled ? `<li><a href="#account/users" class="${accountSection === '/users' ? 'active' : ''}">👥 用户管理</a></li>` : ''}
                            ${adminEnabled ? `<li><a href="#account/content" class="${accountSection === '/content' ? 'active' : ''}">📝 编辑主页</a></li>` : ''}
                            <li class="sidebar-home-link"><a href="#home">返回主页</a></li>
                            <li><a href="#" onclick="logout()">登出</a></li>
                        </ul>
                    </div>
                    <div class="content" id="accountContent">
                        ${contentHtml}
                    </div>
                </div>
                ${footer}
            `;
    }

    function renderAccountPasswordTemplate() {
        return `
                    <h1>🔐 修改密码</h1>
                    <div class="account-password-card">
                        <div class="form-group">
                            <label class="account-label-strong">当前密码</label>
                            <input type="password" id="currentPassword" placeholder="输入当前密码" class="account-input">
                        </div>
                        <div class="form-group">
                            <label class="account-label-strong">新密码</label>
                            <input type="password" id="newPassword" placeholder="输入新密码（至少6个字符）" class="account-input">
                        </div>
                        <div class="form-group">
                            <label class="account-label-strong">确认新密码</label>
                            <input type="password" id="confirmPassword" placeholder="确认新密码" class="account-input">
                        </div>
                        <button id="changePasswordBtn" class="account-btn-primary">确认修改密码</button>
                    </div>
                `;
    }

    function renderAccountContentEditorTemplate(content) {
        return `
                    <h1>📝 编辑主页内容</h1>
                    <div class="content-editor-card">
                        <div class="form-group">
                            <label class="content-editor-label">第一段</label>
                            <textarea id="aboutP1" class="content-editor-textarea">${content.aboutUs.p1}</textarea>
                        </div>
                        <div class="form-group">
                            <label class="content-editor-label">第二段</label>
                            <textarea id="aboutP2" class="content-editor-textarea">${content.aboutUs.p2}</textarea>
                        </div>
                        <div class="form-group">
                            <label class="content-editor-label">第三段</label>
                            <textarea id="aboutP3" class="content-editor-textarea">${content.aboutUs.p3}</textarea>
                        </div>
                        
                        <h2 class="content-editor-subtitle content-editor-subtitle-feature">特性卡片</h2>
                        <div id="featuresEditor"></div>
                        
                        <h2 class="content-editor-subtitle content-editor-subtitle-tools">💡 我们的工具</h2>
                        <div class="form-group">
                            <label class="content-editor-label">工具描述</label>
                            <textarea id="toolsDescription" class="content-editor-textarea content-editor-textarea-tools">${content.tools.description}</textarea>
                        </div>
                        <div id="toolsEditor"></div>
                        
                        <div class="content-editor-actions">
                            <button id="saveContentBtn" class="content-editor-btn content-editor-btn-save">保存更改</button>
                            <button id="resetContentBtn" class="content-editor-btn content-editor-btn-reset">重置为默认</button>
                        </div>
                    </div>
                `;
    }

    function renderAccountUsersTemplate() {
        return `
                    <h1>👥 用户管理</h1>
                    <div class="users-card">
                        <h2 class="users-section-title">添加账户（数据库）</h2>
                        <div class="users-add-grid">
                            <input type="text" id="newUsername" placeholder="用户名（不能是 tester 或 user）" />
                            <input type="password" id="newPassword" placeholder="初始密码" />
                            <select id="newRole">
                                <option value="admin">admin</option>
                                <option value="user">user</option>
                                <option value="tester">tester</option>
                            </select>
                            <button id="addUserBtn">添加账户</button>
                        </div>
                        <h2 class="users-section-title">所有账户</h2>
                        <div id="usersList"></div>
                    </div>
                `;
    }

    function renderAccountProfileTemplate({ currentUser, currentRole, nickname }) {
        return `
                    <h1>👤 个人信息</h1>
                    <div class="profile-card">
                        <div class="profile-section">
                            <p class="profile-label">
                                <strong>用户名</strong>
                            </p>
                            <p class="profile-value">${currentUser}</p>
                        </div>
                        <div class="profile-section">
                            <p class="profile-label">
                                <strong>昵称</strong>
                            </p>
                            <div class="nickname-row" id="nicknameSection">
                                <p class="nickname-display" id="nicknameDisplay">${nickname || '未设置'}</p>
                                <button id="editNicknameBtn" class="btn-nickname btn-nickname-edit">编辑昵称</button>
                            </div>
                        </div>
                        <div class="profile-section">
                            <p class="profile-label">
                                <strong>账户角色</strong>
                            </p>
                            <p class="profile-value">${
                                currentRole === 'admin' ? '👑 管理员' :
                                currentRole === 'user' ? '👤 用户' :
                                currentRole === 'tester' ? '🧪 测试员' :
                                '👤 未知'
                            }</p>
                        </div>
                        <div class="profile-section">
                            <p class="profile-label">
                                <strong>账户状态</strong>
                            </p>
                            <p class="profile-value-success">✅ 活跃</p>
                        </div>
                    </div>
                    <div class="profile-tips-card">
                        <h2 class="profile-tips-title">💡 建议</h2>
                        <ul class="profile-tips-list">
                            <li>定期修改密码以保护账户安全</li>
                            <li>设置一个昵称来个性化您的账户</li>
                            <li>请勿与他人共享账户信息</li>
                        </ul>
                    </div>
                `;
    }

    function renderAccountContentTemplate(section) {
        if (section === '/password') {
            return renderAccountPasswordTemplate();
        }
        if (section === '/content') {
            return renderAccountContentEditorTemplate(getHomePageContent());
        }
        if (section === '/users') {
            return renderAccountUsersTemplate();
        }

        const nickname = localStorage.getItem(`nickname_${currentUser}`) || '';
        return renderAccountProfileTemplate({ currentUser, currentRole, nickname });
    }

    Object.assign(window, {
        renderAccountDashboardTemplate,
        renderAccountContentTemplate
    });
})();
