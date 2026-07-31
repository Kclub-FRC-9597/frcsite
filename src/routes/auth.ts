// POST /api/auth/login
import { Env } from '../types';
import { ADMIN_TOKEN } from '../auth';

export async function handleAuthLogin(request: Request, env: Env): Promise<Response> {
	if (!env.D1_PRESCOUT) {
		return new Response(JSON.stringify({ error: 'D1_PRESCOUT binding not configured' }), {
			status: 500, headers: { 'Content-Type': 'application/json' }
		});
	}

	try {
		const body = await request.json() as any;
		const username = String(body?.username || '').trim();
		const password = String(body?.password || '');

		if (!username || !password) {
			return new Response(JSON.stringify({ error: 'Missing username or password' }), {
				status: 400, headers: { 'Content-Type': 'application/json' }
			});
		}

		const user = await env.D1_PRESCOUT
			.prepare('SELECT username, role, password FROM users WHERE username = ? LIMIT 1')
			.bind(username)
			.first() as any;

		if (!user || user.password !== password) {
			return new Response(JSON.stringify({ error: '用户名或密码错误' }), {
				status: 401, headers: { 'Content-Type': 'application/json' }
			});
		}

		const role = String(user.role || 'admin');
		const token = role === 'admin' ? ADMIN_TOKEN : '';
		const result: any = { ok: true, username: user.username, role, token };

		// 如果是学生，联表查学生信息
		if (role === 'student') {
			const student = await env.D1_PRESCOUT
				.prepare('SELECT real_name, class, team_ids FROM students WHERE username = ?')
				.bind(username)
				.first() as any;
			if (student) {
				result.student = student;
			}
		}

		return new Response(JSON.stringify(result), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (err) {
		return new Response(JSON.stringify({ error: 'Auth Error: ' + (err as any).message }), {
			status: 500, headers: { 'Content-Type': 'application/json' }
		});
	}
}
