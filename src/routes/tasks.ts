// /api/tasks — 任务表 CRUD + 初始化
import { Env } from '../types';

async function ensureTasksTable(env: Env): Promise<void> {
    await env.D1_PRESCOUT.prepare(`
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
        )
    `).run();
}

export async function handleTasks(request: Request, env: Env): Promise<Response> {
    if (!env.D1_PRESCOUT) {
        return new Response(JSON.stringify({ error: 'D1_PRESCOUT binding not configured' }), {
            status: 500, headers: { 'Content-Type': 'application/json' }
        });
    }

    await ensureTasksTable(env);

    const method = request.method;
    const url = new URL(request.url);

    // GET /api/tasks?program_id=xxx&year=2026
    if (method === 'GET') {
        try {
            const program_id = url.searchParams.get('program_id');
            const year = url.searchParams.get('year');
            const id = url.searchParams.get('id');
            let r;
            if (id) {
                r = await env.D1_PRESCOUT.prepare('SELECT * FROM tasks WHERE id = ?').bind(id).all();
            } else if (program_id && year) {
                r = await env.D1_PRESCOUT
                    .prepare('SELECT * FROM tasks WHERE program_id = ? AND year = ? ORDER BY created_at ASC')
                    .bind(program_id, Number(year)).all();
            } else if (program_id) {
                r = await env.D1_PRESCOUT
                    .prepare('SELECT * FROM tasks WHERE program_id = ? ORDER BY year DESC, created_at ASC')
                    .bind(program_id).all();
            } else if (year) {
                r = await env.D1_PRESCOUT
                    .prepare('SELECT * FROM tasks WHERE year = ? ORDER BY program_id, created_at ASC')
                    .bind(Number(year)).all();
            } else {
                r = await env.D1_PRESCOUT.prepare('SELECT * FROM tasks ORDER BY year DESC, created_at ASC').all();
            }
            return new Response(JSON.stringify((r && r.results) ? r.results : []), {
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (err) {
            return new Response(JSON.stringify({ error: 'DB Error: ' + (err as any).message }), {
                status: 500, headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    // POST /api/tasks
    if (method === 'POST') {
        try {
            const body = await request.json() as any;
            const id = body?.id || crypto.randomUUID();
            const program_id = String(body?.program_id || '').trim();
            const name = String(body?.name || '').trim();
            const description = String(body?.description || '');
            const year = Number(body?.year);
            const scoring_type = body?.scoring_type === 'time' ? 'time' : 'score';
            const max_score = scoring_type === 'score' ? (Number(body?.max_score) || null) : null;

            if (!program_id || !name || !year) {
                return new Response(JSON.stringify({ error: '缺少必填字段' }), {
                    status: 400, headers: { 'Content-Type': 'application/json' }
                });
            }

            const now = Date.now();
            await env.D1_PRESCOUT.prepare(
                'INSERT INTO tasks (id, program_id, name, description, year, scoring_type, max_score, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
            ).bind(id, program_id, name, description, year, scoring_type, max_score, now, now).run();

            return new Response(JSON.stringify({ ok: true, id }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (err) {
            return new Response(JSON.stringify({ error: 'DB Error: ' + (err as any).message }), {
                status: 500, headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    // PUT /api/tasks?id=xxx
    if (method === 'PUT') {
        try {
            const id = url.searchParams.get('id');
            if (!id) {
                return new Response(JSON.stringify({ error: '缺少 id 参数' }), {
                    status: 400, headers: { 'Content-Type': 'application/json' }
                });
            }
            const body = await request.json() as any;
            const name = String(body?.name || '').trim();
            const description = String(body?.description || '');
            const scoring_type = body?.scoring_type === 'time' ? 'time' : 'score';
            const max_score = scoring_type === 'score' ? (Number(body?.max_score) || null) : null;

            await env.D1_PRESCOUT.prepare(
                'UPDATE tasks SET name = ?, description = ?, scoring_type = ?, max_score = ?, updated_at = ? WHERE id = ?'
            ).bind(name, description, scoring_type, max_score, Date.now(), id).run();
            return new Response(JSON.stringify({ ok: true }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (err) {
            return new Response(JSON.stringify({ error: 'DB Error: ' + (err as any).message }), {
                status: 500, headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    // DELETE /api/tasks?id=xxx
    if (method === 'DELETE') {
        try {
            const id = url.searchParams.get('id');
            if (!id) {
                return new Response(JSON.stringify({ error: '缺少 id 参数' }), {
                    status: 400, headers: { 'Content-Type': 'application/json' }
                });
            }
            // 先解除赛事关联
            await env.D1_PRESCOUT.prepare('DELETE FROM event_tasks WHERE task_id = ?').bind(id).run();
            await env.D1_PRESCOUT.prepare('DELETE FROM tasks WHERE id = ?').bind(id).run();
            return new Response(JSON.stringify({ ok: true }), {
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (err) {
            return new Response(JSON.stringify({ error: 'DB Error: ' + (err as any).message }), {
                status: 500, headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    return new Response('Method Not Allowed', { status: 405 });
}
