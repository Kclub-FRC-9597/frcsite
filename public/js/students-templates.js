// 学生管理模板
(function () {
	window.renderStudentsContent = function () {
		return `
			<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
				<h1 style="margin:0;">🎓 学生管理</h1>
				<button id="showAddStudentBtn" class="account-btn-primary" style="width:auto;padding:10px 24px;">➕ 添加学生</button>
			</div>
			<div class="users-card">
				<div id="studentsList"></div>
			</div>
			<div id="addStudentModal" class="modal-overlay" style="display:none;">
				<div class="modal-content">
					<div class="modal-header">
						<h2>添加学生</h2>
						<button id="closeAddStudentModal" class="modal-close">&times;</button>
					</div>
					<div class="modal-body">
						<div class="form-group">
							<label class="account-label-strong">用户名</label>
							<input type="text" id="newStudentUsername" placeholder="登录用户名" class="account-input">
						</div>
						<div class="form-group">
							<label class="account-label-strong">密码</label>
							<input type="password" id="newStudentPassword" placeholder="初始密码" class="account-input">
						</div>
						<div class="form-group">
							<label class="account-label-strong">真实姓名</label>
							<input type="text" id="newStudentName" placeholder="张三" class="account-input">
						</div>
					</div>
					<div class="modal-footer">
						<button id="cancelAddStudentBtn" class="hero-btn-secondary" style="padding:10px 24px;border-radius:8px;background:var(--panel);border:1px solid var(--line);color:var(--text-main);cursor:pointer;">取消</button>
						<button id="addStudentBtn" class="account-btn-primary" style="width:auto;padding:10px 24px;">确认添加</button>
					</div>
				</div>
			</div>
		`;
	};
})();
