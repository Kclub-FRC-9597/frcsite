-- 0001: 初始化用户表（提取自现有 ensureUsersTable）
CREATE TABLE IF NOT EXISTS users (
    username   TEXT PRIMARY KEY,
    password   TEXT NOT NULL,
    role       TEXT NOT NULL,
    created_at INTEGER,
    updated_at INTEGER
);

INSERT OR IGNORE INTO users (username, password, role, created_at, updated_at)
VALUES ('admin', 'admin123', 'admin', unixepoch(), unixepoch());

INSERT OR IGNORE INTO users (username, password, role, created_at, updated_at)
VALUES ('user', 'user123', 'user', unixepoch(), unixepoch());
