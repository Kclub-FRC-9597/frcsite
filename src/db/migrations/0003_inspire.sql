-- 0003: 赛项体系 — 任务、赛事

-- 1. 任务表
CREATE TABLE IF NOT EXISTS tasks (
    id            TEXT PRIMARY KEY,
    program_id    TEXT NOT NULL,
    name          TEXT NOT NULL,
    description   TEXT DEFAULT '',
    year          INTEGER NOT NULL,
    scoring_type  TEXT NOT NULL DEFAULT 'score',
    max_score     INTEGER,
    created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 2. 赛事表
CREATE TABLE IF NOT EXISTS events (
    id                TEXT PRIMARY KEY,
    program_id        TEXT NOT NULL,
    year              INTEGER NOT NULL,
    name              TEXT NOT NULL,
    location          TEXT DEFAULT '',
    start_date        TEXT DEFAULT '',
    end_date          TEXT DEFAULT '',
    status            TEXT DEFAULT 'upcoming',
    primary_coach     TEXT DEFAULT '',
    assistant_coaches TEXT DEFAULT '[]',
    created_at        INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at        INTEGER NOT NULL DEFAULT (unixepoch())
);

-- 3. 赛事→任务
CREATE TABLE IF NOT EXISTS event_tasks (
    event_id TEXT NOT NULL,
    task_id  TEXT NOT NULL,
    sort     INTEGER DEFAULT 0,
    PRIMARY KEY (event_id, task_id),
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

-- 4. 赛事→参赛队员
CREATE TABLE IF NOT EXISTS event_participants (
    event_id         TEXT NOT NULL,
    student_username TEXT NOT NULL,
    PRIMARY KEY (event_id, student_username),
    FOREIGN KEY (event_id) REFERENCES events(id),
    FOREIGN KEY (student_username) REFERENCES students(username)
);

-- 预置 Inspire 任务 (2026)
INSERT OR IGNORE INTO tasks (id, program_id, name, description, year, scoring_type, max_score) VALUES
    ('t-in-001', 'makex-in', '迷宫挑战',     '编程控制机器人完成迷宫导航',          2026, 'time',  NULL),
    ('t-in-002', 'makex-in', '物体识别',     '视觉识别特定颜色和形状的物体',        2026, 'score',  100),
    ('t-in-003', 'makex-in', '机械臂操控',   '使用机械臂完成抓取和放置任务',        2026, 'score',  100),
    ('t-in-004', 'makex-in', '底盘组装',     '完成机器人底盘的结构搭建',            2026, 'time',  NULL),
    ('t-in-005', 'makex-in', '电路布线',     '传感器和主控板的电路连接',            2026, 'score',   50),
    ('t-in-006', 'makex-in', '传感器校准',   '调试各传感器参数使其准确',            2026, 'time',  NULL),
    ('t-in-007', 'makex-in', '自动程序调试', '完善自动阶段运行逻辑',                2026, 'time',  NULL),
    ('t-in-008', 'makex-in', '团队路演',     '准备技术答辩和项目展示',              2026, 'score',  100);
