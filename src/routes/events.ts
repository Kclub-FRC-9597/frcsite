// /api/events — 赛事表 CRUD + 初始化（含 task/participant 关联）
import { Env } from '../types';

async function ensureEventsTables(env: Env): Promise<void> {
    await env.D1_PRESCOUT.prepare(`
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
        )
    `).run();

    await env.D1_PRESCOUT.prepare(`
        CREATE TABLE IF NOT EXISTS event_tasks (
            event_id TEXT NOT NULL,
            task_id  TEXT NOT NULL,
            sort     INTEGER DEFAULT 0,
            PRIMARY KEY (event_id, task_id),
            FOREIGN KEY (event_id) REFERENCES events(id),
            FOREIGN KEY (task_id) REFERENCES tasks(id)
        )
    `).run();

    await env.D1_PRESCOUT.prepare(`
        CREATE TABLE IF NOT EXISTS event_participants (
            event_id         TEXT NOT NULL,
            student_username TEXT NOT NULL,
            PRIMARY KEY (event_id, student_username),
            FOREIGN KEY (event_id) REFERENCES events(id),
            FOREIGN KEY (student_username) REFERENCES students(username)
        )
    `).run();
}

export async function handleEvents(request: Request, env: Env): Promise<Response> {
    if (!env.D1_PRESCOUT) {
        return new Response(JSON.stringify({ error: 'D1_PRESCOUT binding not configured' }), {
            status: 500, headers: { 'Content-Type': 'application/json' }
        });
    }

    await ensureEventsTables(env);

    const method = request.method;
    const url = new URL(request.url);

    // GET /api/events?program_id=xxx&year=2026  or  /api/events?id=xxx (详细)
    if (method === 'GET') {
        try {
            const id = url.searchParams.get('id');
            if (id) {
                const event = await env.D1_PRESCOUT.prepare('SELECT * FROM events WHERE id = ?').bind(id).first() as any;
                if (!event) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                const tasks = await env.D1_PRESCOUT.prepare(
                    'SELECT t.* FROM tasks t JOIN event_tasks et ON t.id = et.task_id WHERE et.event_id = ?'
                ).bind(id).all();
                const participants = await env.D1_PRESCOUT.prepare(
                    'SELECT s.* FROM students s JOIN event_participants ep ON s.username = ep.student_username WHERE ep.event_id = ?'
                ).bind(id).all();
                return new Response(JSON.stringify({
                    ...event,
                    tasks: (tasks && tasks.results) ? tasks.results : [],
                    participants: (participants && participants.results) ? participants.results : [],
                }), { headers: { 'Content-Type': 'application/json' } });
            }

            const program_id = url.searchParams.get('program_id');
            const year = url.searchParams.get('year');
            let r;
            if (program_id && year) {
                r = await env.D1_PRESCOUT.prepare(
                    'SELECT * FROM events WHERE program_id = ? AND year = ? ORDER BY created_at DESC'
                ).bind(program_id, Number(year)).all();
            } else if (program_id) {
                r = await env.D1_PRESCOUT.prepare(
                    'SELECT * FROM events WHERE program_id = ? ORDER BY year DESC, created_at DESC'
                ).bind(program_id).all();
            } else {
                r = await env.D1_PRESCOUT.prepare('SELECT * FROM events ORDER BY year DESC, created_at DESC').all();
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

    // POST /api/events
    if (method === 'POST') {
        try {
            const body = await request.json() as any;
            const id = body?.id || crypto.randomUUID();
            const program_id = String(body?.program_id || '').trim();
            const year = Number(body?.year);
            const name = String(body?.name || '').trim();

            if (!program_id || !name || !year) {
                return new Response(JSON.stringify({ error: '缺少必填字段' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
            }

            const now = Date.now();
            await env.D1_PRESCOUT.prepare(
                'INSERT INTO events (id, program_id, year, name, location, start_date, end_date, primary_coach, assistant_coaches, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            ).bind(id, program_id, year, name,
                body?.location || '', body?.start_date || '', body?.end_date || '',
                body?.primary_coach || '', JSON.stringify(body?.assistant_coaches || []),
                now, now
            ).run();

            // 关联任务
            if (body?.task_ids && Array.isArray(body.task_ids)) {
                for (let i = 0; i < body.task_ids.length; i++) {
                    await env.D1_PRESCOUT.prepare(
                        'INSERT OR IGNORE INTO event_tasks (event_id, task_id, sort) VALUES (?, ?, ?)'
                    ).bind(id, body.task_ids[i], i).run();
                }
            }

            // 关联学员
            if (body?.participants && Array.isArray(body.participants)) {
                for (const p of body.participants) {
                    await env.D1_PRESCOUT.prepare(
                        'INSERT OR IGNORE INTO event_participants (event_id, student_username) VALUES (?, ?)'
                    ).bind(id, String(p)).run();
                }
            }

            return new Response(JSON.stringify({ ok: true, id }), { headers: { 'Content-Type': 'application/json' } });
        } catch (err) {
            return new Response(JSON.stringify({ error: 'DB Error: ' + (err as any).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
    }

    // PUT /api/events?id=xxx
    if (method === 'PUT') {
        try {
            const id = url.searchParams.get('id');
            if (!id) return new Response(JSON.stringify({ error: '缺少 id' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
            const body = await request.json() as any;

            await env.D1_PRESCOUT.prepare(
                'UPDATE events SET name = ?, location = ?, start_date = ?, end_date = ?, primary_coach = ?, assistant_coaches = ?, updated_at = ? WHERE id = ?'
            ).bind(
                body?.name || '', body?.location || '', body?.start_date || '', body?.end_date || '',
                body?.primary_coach || '', JSON.stringify(body?.assistant_coaches || []), Date.now(), id
            ).run();

            // 重新关联任务
            if (body?.task_ids !== undefined) {
                await env.D1_PRESCOUT.prepare('DELETE FROM event_tasks WHERE event_id = ?').bind(id).run();
                if (Array.isArray(body.task_ids)) {
                    for (let i = 0; i < body.task_ids.length; i++) {
                        await env.D1_PRESCOUT.prepare('INSERT OR IGNORE INTO event_tasks (event_id, task_id, sort) VALUES (?, ?, ?)').bind(id, body.task_ids[i], i).run();
                    }
                }
            }

            // 重新关联学员
            if (body?.participants !== undefined) {
                await env.D1_PRESCOUT.prepare('DELETE FROM event_participants WHERE event_id = ?').bind(id).run();
                if (Array.isArray(body.participants)) {
                    for (const p of body.participants) {
                        await env.D1_PRESCOUT.prepare('INSERT OR IGNORE INTO event_participants (event_id, student_username) VALUES (?, ?)').bind(id, String(p)).run();
                    }
                }
            }

            return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
        } catch (err) {
            return new Response(JSON.stringify({ error: 'DB Error: ' + (err as any).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
    }

    // DELETE /api/events?id=xxx
    if (method === 'DELETE') {
        try {
            const id = url.searchParams.get('id');
            if (!id) return new Response(JSON.stringify({ error: '缺少 id' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
            await env.D1_PRESCOUT.prepare('DELETE FROM event_tasks WHERE event_id = ?').bind(id).run();
            await env.D1_PRESCOUT.prepare('DELETE FROM event_participants WHERE event_id = ?').bind(id).run();
            await env.D1_PRESCOUT.prepare('DELETE FROM events WHERE id = ?').bind(id).run();
            return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
        } catch (err) {
            return new Response(JSON.stringify({ error: 'DB Error: ' + (err as any).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
    }

    return new Response('Method Not Allowed', { status: 405 });
}
