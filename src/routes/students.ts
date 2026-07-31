// /api/students — 学生资料 CRUD（admin 专用）
import { Env } from '../types';

export async function handleStudents(request: Request, env: Env): Promise<Response> {
	if (!env.D1_PRESCOUT) {
		return new Response(JSON.stringify({ error: 'D1_PRESCOUT binding not configured' }), {
			status: 500, headers: { 'Content-Type': 'application/json' }
		});
	}

	const method = request.method;

	// GET /api/students — 查询所有学生
	if (method === 'GET') {
		try {
			const r = await env.D1_PRESCOUT.prepare(`
				SELECT s.*, u.role, u.created_at AS user_created_at
				FROM students s
				JOIN users u ON s.username = u.username
				ORDER BY s.created_at DESC
			`).all();
			return new Response(JSON.stringify((r && r.results) ? r.results : []), {
				headers: { 'Content-Type': 'application/json' }
			});
		} catch (err) {
			return new Response(JSON.stringify({ error: 'DB Read Error: ' + (err as any).message }), {
				status: 500, headers: { 'Content-Type': 'application/json' }
			});
		}
	}

	// POST /api/students — 创建学生（同时写 users + students 两张表）
	if (method === 'POST') {
		try {
			const body = await request.json() as any;
			const username = String(body?.username || '').trim();
			const password = String(body?.password || '');
			const real_name = String(body?.real_name || '');
			const clazz = String(body?.class || '');
			const team_ids = body?.team_ids ? JSON.stringify(body.team_ids) : '[]';

			if (!username || !password) {
				return new Response(JSON.stringify({ error: '缺少用户名或密码' }), {
					status: 400, headers: { 'Content-Type': 'application/json' }
				});
			}

			const now = Date.now();

			// 写 users 表
			await env.D1_PRESCOUT
				.prepare('INSERT INTO users (username, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
				.bind(username, password, 'student', now, now)
				.run();

			// 写 students 表
			await env.D1_PRESCOUT
				.prepare('INSERT INTO students (username, real_name, class, team_ids, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
				.bind(username, real_name, clazz, team_ids, now, now)
				.run();

			return new Response(JSON.stringify({ ok: true }), {
				headers: { 'Content-Type': 'application/json' }
			});
		} catch (err) {
			const msg = (err as any).message || '';
			// D1 UNIQUE constraint violation → 用户名已存在
			if (msg.includes('UNIQUE constraint failed')) {
				return new Response(JSON.stringify({ error: '用户名已存在' }), {
					status: 409, headers: { 'Content-Type': 'application/json' }
				});
			}
			return new Response(JSON.stringify({ error: 'DB Write Error: ' + msg }), {
				status: 500, headers: { 'Content-Type': 'application/json' }
			});
		}
	}

	// PUT /api/students — 更新学生资料
	if (method === 'PUT') {
		try {
			const body = await request.json() as any;
			const username = String(body?.username || '').trim();
			const real_name = String(body?.real_name || '');
			const clazz = String(body?.class || '');
			const team_ids = body?.team_ids ? JSON.stringify(body.team_ids) : '[]';
			const password = String(body?.password || '');

			if (!username) {
				return new Response(JSON.stringify({ error: '缺少用户名' }), {
					status: 400, headers: { 'Content-Type': 'application/json' }
				});
			}

			const now = Date.now();

			// 更新 students 表
			await env.D1_PRESCOUT
				.prepare('UPDATE students SET real_name = ?, class = ?, team_ids = ?, updated_at = ? WHERE username = ?')
				.bind(real_name, clazz, team_ids, now, username)
				.run();

			// 如果提供了密码，同步更新 users 表
			if (password) {
				await env.D1_PRESCOUT
					.prepare('UPDATE users SET password = ?, updated_at = ? WHERE username = ?')
					.bind(password, now, username)
					.run();
			}

			return new Response(JSON.stringify({ ok: true }), {
				headers: { 'Content-Type': 'application/json' }
			});
		} catch (err) {
			return new Response(JSON.stringify({ error: 'DB Update Error: ' + (err as any).message }), {
				status: 500, headers: { 'Content-Type': 'application/json' }
			});
		}
	}

	// DELETE /api/students?username=xxx — 删除学生（同时删 users + students）
	if (method === 'DELETE') {
		try {
			const username = (new URL(request.url)).searchParams.get('username');
			if (!username) {
				return new Response(JSON.stringify({ error: '缺少 username 参数' }), {
					status: 400, headers: { 'Content-Type': 'application/json' }
				});
			}

			// 先删 students，再删 users（外键约束）
			await env.D1_PRESCOUT
				.prepare('DELETE FROM students WHERE username = ?')
				.bind(username).run();
			await env.D1_PRESCOUT
				.prepare('DELETE FROM users WHERE username = ? AND role = ?')
				.bind(username, 'student').run();

			return new Response(JSON.stringify({ ok: true }), {
				headers: { 'Content-Type': 'application/json' }
			});
		} catch (err) {
			return new Response(JSON.stringify({ error: 'DB Delete Error: ' + (err as any).message }), {
				status: 500, headers: { 'Content-Type': 'application/json' }
			});
		}
	}

	return new Response('Method Not Allowed', { status: 405 });
}
