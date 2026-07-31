// /api/users — 用户 CRUD + /api/users/password — 修改密码
import { Env } from '../types';

export async function handleUsers(request: Request, env: Env): Promise<Response> {
	if (!env.D1_PRESCOUT) {
		return new Response(JSON.stringify({ error: 'D1_PRESCOUT binding not configured' }), {
			status: 500, headers: { 'Content-Type': 'application/json' }
		});
	}

	const method = request.method;

	// GET /api/users
	if (method === 'GET') {
		try {
			const r = await env.D1_PRESCOUT
				.prepare('SELECT username, role, created_at, updated_at FROM users ORDER BY created_at ASC')
				.all();
			const rows = (r && r.results) ? r.results : [];
			return new Response(JSON.stringify(rows), {
				headers: { 'Content-Type': 'application/json' }
			});
		} catch (err) {
			return new Response(JSON.stringify({ error: 'DB Read Error: ' + (err as any).message }), {
				status: 500, headers: { 'Content-Type': 'application/json' }
			});
		}
	}

	// POST /api/users
	if (method === 'POST') {
		try {
			const body = await request.json() as any;
			const username = String(body?.username || '').trim();
			const password = String(body?.password || '');
			const role = String(body?.role || 'admin');

			if (!username || !password) {
				return new Response(JSON.stringify({ error: 'Missing username or password' }), {
					status: 400, headers: { 'Content-Type': 'application/json' }
				});
			}

			if (username === 'tester' || username === 'user') {
				return new Response(JSON.stringify({ error: `${username} 账户保留为本地测试账户，不能写入数据库` }), {
					status: 400, headers: { 'Content-Type': 'application/json' }
				});
			}

			const now = Date.now();
			await env.D1_PRESCOUT
				.prepare('INSERT INTO users (username, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
				.bind(username, password, role, now, now)
				.run();

			return new Response(JSON.stringify({ ok: true }), {
				headers: { 'Content-Type': 'application/json' }
			});
		} catch (err) {
			return new Response(JSON.stringify({ error: 'DB Write Error: ' + (err as any).message }), {
				status: 500, headers: { 'Content-Type': 'application/json' }
			});
		}
	}

	// PUT /api/users
	if (method === 'PUT') {
		try {
			const body = await request.json() as any;
			const username = String(body?.username || '').trim();
			const password = String(body?.password || '');
			const role = String(body?.role || 'admin');

			if (!username) {
				return new Response(JSON.stringify({ error: 'Missing username' }), {
					status: 400, headers: { 'Content-Type': 'application/json' }
				});
			}

			if (username === 'tester' || username === 'user') {
				return new Response(JSON.stringify({ error: `${username} 账户保留为本地测试账户，不能写入数据库` }), {
					status: 400, headers: { 'Content-Type': 'application/json' }
				});
			}

			const now = Date.now();
			if (password) {
				await env.D1_PRESCOUT
					.prepare('UPDATE users SET password = ?, role = ?, updated_at = ? WHERE username = ?')
					.bind(password, role, now, username)
					.run();
			} else {
				await env.D1_PRESCOUT
					.prepare('UPDATE users SET role = ?, updated_at = ? WHERE username = ?')
					.bind(role, now, username)
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

	// DELETE /api/users
	if (method === 'DELETE') {
		try {
			const username = (new URL(request.url)).searchParams.get('username');
			if (!username) {
				return new Response(JSON.stringify({ error: 'Missing username parameter' }), {
					status: 400, headers: { 'Content-Type': 'application/json' }
				});
			}

			if (username === 'tester' || username === 'user') {
				return new Response(JSON.stringify({ error: `${username} 账户保留为本地测试账户，不能删除` }), {
					status: 400, headers: { 'Content-Type': 'application/json' }
				});
			}

			await env.D1_PRESCOUT.prepare('DELETE FROM users WHERE username = ?').bind(username).run();
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

// POST /api/users/password — 修改密码（含旧密码验证）
export async function handleChangePassword(request: Request, env: Env): Promise<Response> {
	if (!env.D1_PRESCOUT) {
		return new Response(JSON.stringify({ error: 'D1_PRESCOUT binding not configured' }), {
			status: 500, headers: { 'Content-Type': 'application/json' }
		});
	}

	try {
		const body = await request.json() as any;
		const username = String(body?.username || '').trim();
		const currentPassword = String(body?.currentPassword || '');
		const newPassword = String(body?.newPassword || '');

		if (!username || !currentPassword || !newPassword) {
			return new Response(JSON.stringify({ error: 'Missing required fields' }), {
				status: 400, headers: { 'Content-Type': 'application/json' }
			});
		}

		const user = await env.D1_PRESCOUT
			.prepare('SELECT username, password FROM users WHERE username = ? LIMIT 1')
			.bind(username)
			.first() as any;

		if (!user) {
			return new Response(JSON.stringify({ error: 'User not found' }), {
				status: 404, headers: { 'Content-Type': 'application/json' }
			});
		}

		if (String(user.password || '') !== currentPassword) {
			return new Response(JSON.stringify({ error: '当前密码错误' }), {
				status: 400, headers: { 'Content-Type': 'application/json' }
			});
		}

		await env.D1_PRESCOUT
			.prepare('UPDATE users SET password = ?, updated_at = ? WHERE username = ?')
			.bind(newPassword, Date.now(), username)
			.run();

		return new Response(JSON.stringify({ ok: true }), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (err) {
		return new Response(JSON.stringify({ error: 'DB Update Error: ' + (err as any).message }), {
			status: 500, headers: { 'Content-Type': 'application/json' }
		});
	}
}
