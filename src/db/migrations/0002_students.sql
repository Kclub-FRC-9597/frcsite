-- 0002: 学生资料表（通过 username 关联 users 表）
CREATE TABLE IF NOT EXISTS students (
    username   TEXT PRIMARY KEY,
    real_name  TEXT NOT NULL DEFAULT '',
    class      TEXT NOT NULL DEFAULT '',
    team_ids   TEXT NOT NULL DEFAULT '[]',
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
    FOREIGN KEY (username) REFERENCES users(username)
);
