// Re-export a minimal Durable Object class because existing Durable Object
// instances are still registered for this Worker. Removing the exported class
// causes Wrangler to reject the deploy. This minimal implementation is a no-op
// placeholder and can be removed only after deleting the Durable Object via
// a migration if you truly want to remove it.
import { DurableObject } from "cloudflare:workers";

const ADMIN_TOKEN = "admin-token-2026";

interface Env {
	D1_PRESCOUT: any;
	ASSETS: any;
}

export class MyDurableObject extends DurableObject {
	constructor(state: DurableObjectState, env: Env) {
		super(state, env);
	}

	async fetch(request: Request): Promise<Response> {
		return new Response("Not Found", { status: 404 });
	}
}

// Simplified Worker: no Durable Object APIs. Serve static assets (public/) via fetch.
export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		// For non-GET requests to /api/, require authentication
		// For GET requests to /api/sponsors, allow without authentication
		// For other APIs, require authentication
		if (url.pathname.startsWith('/api/')) {
			const isPublicGetRequest = request.method === 'GET' && url.pathname === '/api/sponsors';
			const isPublicLoginRequest = request.method === 'POST' && url.pathname === '/api/auth/login';
			if (!isPublicGetRequest && !isPublicLoginRequest) {
				const authError = requireAuth(request);
				if (authError) return authError;
			}
		}

		// API: auth/login for database-backed users (tester is handled in frontend local mode)
		if (url.pathname === '/api/auth/login' && request.method === 'POST') {
			if (!env.D1_PRESCOUT) {
				return new Response(JSON.stringify({ error: 'D1_PRESCOUT binding not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
			}

			try {
				await ensureUsersTable(env);
				const body = await request.json() as any;
				const username = String(body?.username || '').trim();
				const password = String(body?.password || '');

				if (!username || !password) {
					return new Response(JSON.stringify({ error: 'Missing username or password' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
				}

				const user = await env.D1_PRESCOUT
					.prepare('SELECT username, role, password FROM users WHERE username = ? LIMIT 1')
					.bind(username)
					.first() as any;

				if (!user || user.password !== password) {
					return new Response(JSON.stringify({ error: '用户名或密码错误' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
				}

				const role = String(user.role || 'admin');
				const token = role === 'admin' ? ADMIN_TOKEN : '';

				return new Response(JSON.stringify({ ok: true, username: user.username, role, token }), { headers: { 'Content-Type': 'application/json' } });
			} catch (err) {
				return new Response(JSON.stringify({ error: 'Auth Error: ' + (err as any).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
			}
		}

		// API: users management in D1
		if (url.pathname === '/api/users') {
			if (!env.D1_PRESCOUT) {
				return new Response(JSON.stringify({ error: 'D1_PRESCOUT binding not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
			}

			try {
				await ensureUsersTable(env);
			} catch (err) {
				return new Response(JSON.stringify({ error: 'DB Init Error: ' + (err as any).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
			}

			if (request.method === 'GET') {
				try {
					const r = await env.D1_PRESCOUT.prepare('SELECT username, role, created_at, updated_at FROM users ORDER BY created_at ASC').all();
					const rows = (r && r.results) ? r.results : [];
					return new Response(JSON.stringify(rows), { headers: { 'Content-Type': 'application/json' } });
				} catch (err) {
					return new Response(JSON.stringify({ error: 'DB Read Error: ' + (err as any).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
				}
			}

			if (request.method === 'POST') {
				try {
					const body = await request.json() as any;
					const username = String(body?.username || '').trim();
					const password = String(body?.password || '');
					const role = String(body?.role || 'admin');

					if (!username || !password) {
						return new Response(JSON.stringify({ error: 'Missing username or password' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
					}

					if (username === 'tester') {
						return new Response(JSON.stringify({ error: 'tester 账户保留为本地测试账户，不能写入数据库' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
					}

					const now = Date.now();
					await env.D1_PRESCOUT.prepare('INSERT INTO users (username, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
						.bind(username, password, role, now, now)
						.run();

					return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
				} catch (err) {
					return new Response(JSON.stringify({ error: 'DB Write Error: ' + (err as any).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
				}
			}

			if (request.method === 'PUT') {
				try {
					const body = await request.json() as any;
					const username = String(body?.username || '').trim();
					const password = String(body?.password || '');
					const role = String(body?.role || 'admin');

					if (!username) {
						return new Response(JSON.stringify({ error: 'Missing username' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
					}

					if (username === 'tester') {
						return new Response(JSON.stringify({ error: 'tester 账户保留为本地测试账户，不能写入数据库' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
					}

					const now = Date.now();
					if (password) {
						await env.D1_PRESCOUT.prepare('UPDATE users SET password = ?, role = ?, updated_at = ? WHERE username = ?')
							.bind(password, role, now, username)
							.run();
					} else {
						await env.D1_PRESCOUT.prepare('UPDATE users SET role = ?, updated_at = ? WHERE username = ?')
							.bind(role, now, username)
							.run();
					}

					return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
				} catch (err) {
					return new Response(JSON.stringify({ error: 'DB Update Error: ' + (err as any).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
				}
			}

			if (request.method === 'DELETE') {
				try {
					const username = (new URL(request.url)).searchParams.get('username');
					if (!username) {
						return new Response(JSON.stringify({ error: 'Missing username parameter' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
					}

					if (username === 'tester') {
						return new Response(JSON.stringify({ error: 'tester 账户保留为本地测试账户，不能删除' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
					}

					await env.D1_PRESCOUT.prepare('DELETE FROM users WHERE username = ?').bind(username).run();
					return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
				} catch (err) {
					return new Response(JSON.stringify({ error: 'DB Delete Error: ' + (err as any).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
				}
			}

			return new Response('Method Not Allowed', { status: 405 });
		}

		if (url.pathname === '/api/users/password' && request.method === 'POST') {
			if (!env.D1_PRESCOUT) {
				return new Response(JSON.stringify({ error: 'D1_PRESCOUT binding not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
			}

			try {
				await ensureUsersTable(env);
				const body = await request.json() as any;
				const username = String(body?.username || '').trim();
				const currentPassword = String(body?.currentPassword || '');
				const newPassword = String(body?.newPassword || '');

				if (!username || !currentPassword || !newPassword) {
					return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
				}

				const user = await env.D1_PRESCOUT
					.prepare('SELECT username, password FROM users WHERE username = ? LIMIT 1')
					.bind(username)
					.first() as any;

				if (!user) {
					return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
				}

				if (String(user.password || '') !== currentPassword) {
					return new Response(JSON.stringify({ error: '当前密码错误' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
				}

				await env.D1_PRESCOUT.prepare('UPDATE users SET password = ?, updated_at = ? WHERE username = ?')
					.bind(newPassword, Date.now(), username)
					.run();

				return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
			} catch (err) {
				return new Response(JSON.stringify({ error: 'DB Update Error: ' + (err as any).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
			}
		}
		// API: prescout entries using D1 (SQL)
		if (url.pathname === '/api/prescout') {
			// Check if D1 binding exists
			if (!env.D1_PRESCOUT) {
				return new Response(JSON.stringify({ error: 'D1_PRESCOUT binding not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
			}

			// ensure table exists with correct schema (do NOT drop every time!)
			try {
				// Create table if it doesn't exist - this preserves existing data
				await env.D1_PRESCOUT.prepare(`
					CREATE TABLE IF NOT EXISTS prescout (
						id TEXT PRIMARY KEY,
						collector TEXT,
						teamNumber TEXT,
						teamName TEXT,
						practice TEXT,
						compCount INTEGER,
						chassis TEXT,
						event TEXT,
						ts INTEGER
					)
				`).run();
			} catch (err) {
				return new Response(JSON.stringify({ error: 'DB Init Error: ' + (err as any).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
			}

			if (request.method === 'GET') {
				try {
					const url_obj = new URL(request.url);
					const event = url_obj.searchParams.get('event');
					// If no event specified, return ALL data
					let r;
					if (event) {
						r = await env.D1_PRESCOUT.prepare('SELECT id, collector, teamNumber, teamName, practice, compCount, chassis, event, ts FROM prescout WHERE event = ? ORDER BY ts DESC LIMIT 100').bind(event).all();
					} else {
						r = await env.D1_PRESCOUT.prepare('SELECT id, collector, teamNumber, teamName, practice, compCount, chassis, event, ts FROM prescout ORDER BY ts DESC LIMIT 100').all();
					}
					const rows = (r && r.results) ? r.results : [];
					return new Response(JSON.stringify(rows), { headers: { 'Content-Type': 'application/json' } });
				} catch (err) {
					return new Response(JSON.stringify({ error: 'DB Read Error: ' + (err as any).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
				}
			} else if (request.method === 'POST') {
				try {
					const body = await request.json() as any;
					const id = crypto.randomUUID();
					const stmt = env.D1_PRESCOUT.prepare('INSERT INTO prescout (id, collector, teamNumber, teamName, practice, compCount, chassis, event, ts) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
					await stmt.bind(id, body.collector || null, String(body.teamNumber || ''), body.teamName || null, body.practice || null, Number(body.compCount || 0), body.chassis || null, body.event || '2025-einstein', Number(body.ts || Date.now())).run();
					return new Response(JSON.stringify({ ok: true, id }), { headers: { 'Content-Type': 'application/json' } });
				} catch (err) {
					return new Response(JSON.stringify({ error: 'DB Write Error: ' + (err as any).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
				}
			} else {
				return new Response('Method Not Allowed', { status: 405 });
			}
		}

		// API: scouting entries using D1 (SQL)
		if (url.pathname === '/api/scouting') {
			if (!env.D1_PRESCOUT) {
				return new Response(JSON.stringify({ error: 'D1_PRESCOUT binding not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
			}

			try {
				await env.D1_PRESCOUT.prepare(`
					CREATE TABLE IF NOT EXISTS scouting (
						id TEXT PRIMARY KEY,
						data TEXT,
						team TEXT,
						event TEXT,
						ts INTEGER
					)
				`).run();
			} catch (err) {
				return new Response(JSON.stringify({ error: 'DB Init Error: ' + (err as any).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
			}

			if (request.method === 'GET') {
				try {
					const url_obj = new URL(request.url);
					const event = url_obj.searchParams.get('event');
					let r;
					if (event) {
						r = await env.D1_PRESCOUT.prepare('SELECT id, data, team, event, ts FROM scouting WHERE event = ? ORDER BY ts DESC LIMIT 200').bind(event).all();
					} else {
						r = await env.D1_PRESCOUT.prepare('SELECT id, data, team, event, ts FROM scouting ORDER BY ts DESC LIMIT 200').all();
					}
					const rows = (r && r.results) ? r.results : [];
					const parsed = rows.map((row: any) => {
						let payload: any = {};
						try {
							payload = row.data ? JSON.parse(row.data) : {};
						} catch {
							payload = {};
						}
						return { id: row.id, ts: row.ts, team: row.team, event: row.event, ...payload };
					});
					return new Response(JSON.stringify(parsed), { headers: { 'Content-Type': 'application/json' } });
				} catch (err) {
					return new Response(JSON.stringify({ error: 'DB Read Error: ' + (err as any).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
				}
			} else if (request.method === 'POST') {
				try {
					const body = await request.json() as any;
					const id = crypto.randomUUID();
					const payload = JSON.stringify(body || {});
					const team = body && body.team ? String(body.team) : '';
					const event = body && body.event ? String(body.event) : '';
					const ts = Number(body && body.ts ? body.ts : Date.now());
					const stmt = env.D1_PRESCOUT.prepare('INSERT INTO scouting (id, data, team, event, ts) VALUES (?, ?, ?, ?, ?)');
					await stmt.bind(id, payload, team, event, ts).run();
					return new Response(JSON.stringify({ ok: true, id }), { headers: { 'Content-Type': 'application/json' } });
				} catch (err) {
					return new Response(JSON.stringify({ error: 'DB Write Error: ' + (err as any).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
				}
			} else {
				return new Response('Method Not Allowed', { status: 405 });
			}
		}

		// API: sponsors management using D1 (SQL)
		if (url.pathname === '/api/sponsors') {
			if (!env.D1_PRESCOUT) {
				return new Response(JSON.stringify({ error: 'D1_PRESCOUT binding not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
			}

			try {
				// Create table if it doesn't exist
				await env.D1_PRESCOUT.prepare(`
					CREATE TABLE IF NOT EXISTS sponsors (
						id TEXT PRIMARY KEY,
						year INTEGER,
						name TEXT,
						logo_url TEXT,
						website TEXT,
						created_at INTEGER,
						updated_at INTEGER
					)
				`).run();

				// Normalize legacy sponsor naming
				await env.D1_PRESCOUT.prepare("UPDATE sponsors SET name = 'Bambu' WHERE lower(name) = 'bambo'").run();

				// Initialize default sponsors if table is empty
				const checkResult = await env.D1_PRESCOUT.prepare('SELECT COUNT(*) as count FROM sponsors').first() as any;
				if (checkResult && checkResult.count === 0) {
					const defaultSponsors = [
						{ year: 2026, name: 'SolidWorks', logo_url: null, website: 'https://www.solidworks.com' },
						{ year: 2026, name: 'OnShape', logo_url: null, website: 'https://www.onshape.com' },
						{ year: 2026, name: 'FRC', logo_url: null, website: 'https://www.firstinspires.org' },
						{ year: 2025, name: 'Bambu', logo_url: null, website: null },
						{ year: 2025, name: 'MakeX', logo_url: null, website: null },
						{ year: 2025, name: 'XTool', logo_url: null, website: null },
						{ year: 2025, name: 'Makeblock', logo_url: null, website: null },
						{ year: 2025, name: 'SolidWorks', logo_url: null, website: 'https://www.solidworks.com' },
						{ year: 2025, name: 'FRC', logo_url: null, website: 'https://www.firstinspires.org' },
						{ year: 2024, name: 'SolidWorks', logo_url: null, website: 'https://www.solidworks.com' },
						{ year: 2024, name: 'OnShape', logo_url: null, website: 'https://www.onshape.com' },
						{ year: 2024, name: 'FRC', logo_url: null, website: 'https://www.firstinspires.org' },
						{ year: 2024, name: '智慧土豆', logo_url: null, website: null },
						{ year: 2024, name: '敏源传感', logo_url: null, website: null },
					];

					const now = Date.now();
					for (const sponsor of defaultSponsors) {
						const id = crypto.randomUUID();
						await env.D1_PRESCOUT.prepare(
							'INSERT INTO sponsors (id, year, name, logo_url, website, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
						).bind(id, sponsor.year, sponsor.name, sponsor.logo_url, sponsor.website, now, now).run();
					}
				}
			} catch (err) {
				return new Response(JSON.stringify({ error: 'DB Init Error: ' + (err as any).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
			}

			if (request.method === 'GET') {
				try {
					const url_obj = new URL(request.url);
					const year = url_obj.searchParams.get('year');
					let r;
					if (year) {
						r = await env.D1_PRESCOUT.prepare('SELECT id, year, name, logo_url, website, created_at, updated_at FROM sponsors WHERE year = ? ORDER BY created_at ASC').bind(Number(year)).all();
					} else {
						r = await env.D1_PRESCOUT.prepare('SELECT id, year, name, logo_url, website, created_at, updated_at FROM sponsors ORDER BY year DESC, created_at ASC').all();
					}
					const rows = (r && r.results) ? r.results : [];
					return new Response(JSON.stringify(rows), { headers: { 'Content-Type': 'application/json' } });
				} catch (err) {
					return new Response(JSON.stringify({ error: 'DB Read Error: ' + (err as any).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
				}
			} else if (request.method === 'POST') {
				const authError = requireAuth(request);
				if (authError) return authError;

				try {
					const body = await request.json() as any;
					const id = crypto.randomUUID();
					const now = Date.now();
					const stmt = env.D1_PRESCOUT.prepare('INSERT INTO sponsors (id, year, name, logo_url, website, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
					await stmt.bind(id, Number(body.year), String(body.name || ''), body.logo_url || null, body.website || null, now, now).run();
					return new Response(JSON.stringify({ ok: true, id }), { headers: { 'Content-Type': 'application/json' } });
				} catch (err) {
					return new Response(JSON.stringify({ error: 'DB Write Error: ' + (err as any).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
				}
			} else if (request.method === 'PUT') {
				const authError = requireAuth(request);
				if (authError) return authError;

				try {
					const body = await request.json() as any;
					const url_obj = new URL(request.url);
					const id = url_obj.searchParams.get('id');
					if (!id) {
						return new Response(JSON.stringify({ error: 'Missing id parameter' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
					}
					const now = Date.now();
					const stmt = env.D1_PRESCOUT.prepare('UPDATE sponsors SET name = ?, logo_url = ?, website = ?, year = ?, updated_at = ? WHERE id = ?');
					await stmt.bind(String(body.name || ''), body.logo_url || null, body.website || null, Number(body.year), now, id).run();
					return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
				} catch (err) {
					return new Response(JSON.stringify({ error: 'DB Update Error: ' + (err as any).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
				}
			} else if (request.method === 'DELETE') {
				const authError = requireAuth(request);
				if (authError) return authError;

				try {
					const url_obj = new URL(request.url);
					const id = url_obj.searchParams.get('id');
					if (!id) {
						return new Response(JSON.stringify({ error: 'Missing id parameter' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
					}
					const stmt = env.D1_PRESCOUT.prepare('DELETE FROM sponsors WHERE id = ?');
					await stmt.bind(id).run();
					return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
				} catch (err) {
					return new Response(JSON.stringify({ error: 'DB Delete Error: ' + (err as any).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
				}
			} else {
				return new Response('Method Not Allowed', { status: 405 });
			}
		}

		// API: teams management using D1 (SQL)
		if (url.pathname === '/api/teams') {
			if (!env.D1_PRESCOUT) {
				return new Response(JSON.stringify({ error: 'D1_PRESCOUT binding not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
			}

			try {
				await env.D1_PRESCOUT.prepare(`
					CREATE TABLE IF NOT EXISTS teams (
						id TEXT PRIMARY KEY,
						team_number TEXT NOT NULL,
						team_name TEXT,
						city TEXT,
						province TEXT,
						country TEXT,
						event TEXT,
						year INTEGER,
						created_at INTEGER
					)
				`).run();

				// Initialize Shanghai Regional 2026 teams if table is empty
				const checkResult = await env.D1_PRESCOUT.prepare('SELECT COUNT(*) as count FROM teams WHERE event = ? AND year = ?').bind('Shanghai Regional', 2026).first() as any;
				if (!checkResult || checkResult.count === 0) {
					const teams2026Shanghai = [
						{ number: '5449', name: 'Prototype', city: 'Beijing', province: 'Beijing', country: 'China' },
						{ number: '5515', name: 'Blue Power Robotics', city: 'Shanghai', province: 'Shanghai', country: 'China' },
						{ number: '5516', name: 'Iron Maple', city: 'Shenzhen', province: 'Guangdong', country: 'China' },
						{ number: '5522', name: 'Stargazer', city: 'Shenzhen', province: 'Guangdong', country: 'China' },
						{ number: '5823', name: 'ACE', city: 'Shenzhen', province: 'Guangdong', country: 'China' },
						{ number: '5849', name: 'Joker', city: 'Qingdao', province: 'Shandong', country: 'China' },
						{ number: '6304', name: 'EAGLE', city: 'Zhenjiang', province: 'Jiangsu', country: 'China' },
						{ number: '6353', name: 'EFZ Robotics', city: 'Shanghai', province: 'Shanghai', country: 'China' },
						{ number: '6394', name: 'MITO', city: 'Suzhou', province: 'Jiangsu', country: 'China' },
						{ number: '6399', name: 'Tinspiratio', city: 'Jinan', province: 'Shandong', country: 'China' },
						{ number: '6414', name: 'Voyager', city: 'Shenzhen', province: 'Guangdong', country: 'China' },
						{ number: '6433', name: 'HZ4Z', city: 'Hangzhou', province: 'Zhejiang', country: 'China' },
						{ number: '6487', name: 'Clockwork Knights', city: 'Shanghai', province: 'Shanghai', country: 'China' },
						{ number: '6494', name: 'Wings of Liberty', city: 'Shanghai', province: 'Shanghai', country: 'China' },
						{ number: '6706', name: 'Golem', city: 'Shenzhen', province: 'Guangdong', country: 'China' },
						{ number: '6766', name: 'AtomStorm', city: 'Shenzhen', province: 'Guangdong', country: 'China' },
						{ number: '6907', name: 'The G.O.A.T', city: 'Shanghai', province: 'Shanghai', country: 'China' },
						{ number: '6940', name: 'Violet Z', city: 'Shanghai', province: 'Shanghai', country: 'China' },
						{ number: '6941', name: 'IronPulse Robotics', city: 'Shanghai', province: 'Shanghai', country: 'China' },
						{ number: '6986', name: 'PPT Bots', city: 'Nanjing', province: 'Jiangsu', country: 'China' },
						{ number: '7002', name: '风云蹦豆', city: 'Taiyuan', province: 'Shanxi', country: 'China' },
						{ number: '7594', name: 'Nautilus', city: 'Shenzhen', province: 'Guangdong', country: 'China' },
						{ number: '7601', name: 'Shenzhen Unity Stallion', city: 'Shenzhen', province: 'Guangdong', country: 'China' },
						{ number: '7738', name: 'Helion', city: 'Beijing', province: 'Beijing', country: 'China' },
						{ number: '8011', name: 'Kirin', city: 'Guangzhou', province: 'Guangdong', country: 'China' },
						{ number: '8015', name: 'The Cheetahs', city: 'Shanghai', province: 'Shanghai', country: 'China' },
						{ number: '8214', name: 'Cyber Unicorn', city: 'Guangzhou', province: 'Guangdong', country: 'China' },
						{ number: '8806', name: 'Our Lady of Providence Dream League', city: 'New Taipei City', province: 'New Taipei', country: 'Chinese Taipei' },
						{ number: '8810', name: 'The Alphabots', city: 'Suzhou', province: 'Jiangsu', country: 'China' },
						{ number: '9421', name: 'Nexus', city: 'Hong Kong', province: 'Hong Kong', country: 'China' },
						{ number: '9597', name: 'Luban Robotics', city: 'Beijing', province: 'Beijing', country: 'China' },
						{ number: '9635', name: 'Cyber Rabbit', city: 'Guangzhou', province: 'Guangdong', country: 'China' },
						{ number: '10000', name: 'Neutron Star', city: 'Beijing', province: 'Beijing', country: 'China' },
						{ number: '10016', name: 'Absolute Zero', city: 'Shanghai', province: 'Shanghai', country: 'China' },
						{ number: '10120', name: 'Wulfa the Wolf', city: 'Shanghai', province: 'Shanghai', country: 'China' },
						{ number: '10131', name: 'Royal Turtles', city: 'Hong Kong', province: 'Hong Kong', country: 'China' },
						{ number: '10214', name: 'Team Doritos', city: 'Beijing', province: 'Beijing', country: 'China' },
						{ number: '10479', name: 'Powerhouse', city: 'Shanghai', province: 'Shanghai', country: 'China' },
						{ number: '10526', name: 'Orcas', city: 'Shanghai', province: 'Shanghai', country: 'China' },
						{ number: '10541', name: 'CarbonPulse Robotics', city: 'Shanghai', province: 'Shanghai', country: 'China' },
						{ number: '10558', name: 'Forté', city: 'Beijing', province: 'Beijing', country: 'China' },
						{ number: '10711', name: 'FORMSHOP', city: 'Shanghai', province: 'Shanghai', country: 'China' },
						{ number: '11019', name: 'X.PLORE', city: 'Shanghai', province: 'Shanghai', country: 'China' },
						{ number: '11118', name: 'The Baybies', city: 'Suzhou', province: 'Jiangsu', country: 'China' },
						{ number: '11256', name: 'Sattellites', city: 'Qingdao', province: 'Shandong', country: 'China' },
						{ number: '11288', name: 'Trident Force', city: 'Hangzhou', province: 'Zhejiang', country: 'China' },
						{ number: '11319', name: 'Polaris', city: 'Ningbo', province: 'Zhejiang', country: 'China' },
						{ number: '11328', name: 'SIA', city: 'Shenzhen', province: 'Guangdong', country: 'China' },
						{ number: '11352', name: 'Flying Tiger', city: 'Chongqing', province: 'Chongqing', country: 'China' },
						{ number: '11485', name: 'Bestarian NextGEN', city: 'Kuala Lumpur', province: 'Kuala Lumpur', country: 'Malaysia' }
					];

					const now = Date.now();
					for (const team of teams2026Shanghai) {
						const id = crypto.randomUUID();
						await env.D1_PRESCOUT.prepare(
							'INSERT INTO teams (id, team_number, team_name, city, province, country, event, year, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
						).bind(id, team.number, team.name, team.city, team.province, team.country, 'Shanghai Regional', 2026, now).run();
					}
				}
			} catch (err) {
				return new Response(JSON.stringify({ error: 'DB Init Error: ' + (err as any).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
			}

			if (request.method === 'GET') {
				try {
					const url_obj = new URL(request.url);
					const event = url_obj.searchParams.get('event');
					const year = url_obj.searchParams.get('year');
					let r;
					if (event && year) {
						r = await env.D1_PRESCOUT.prepare('SELECT id, team_number, team_name, city, province, country, event, year FROM teams WHERE event = ? AND year = ? ORDER BY team_number ASC').bind(event, Number(year)).all();
					} else if (event) {
						r = await env.D1_PRESCOUT.prepare('SELECT id, team_number, team_name, city, province, country, event, year FROM teams WHERE event = ? ORDER BY team_number ASC').bind(event).all();
					} else {
						r = await env.D1_PRESCOUT.prepare('SELECT id, team_number, team_name, city, province, country, event, year FROM teams ORDER BY year DESC, event ASC, team_number ASC LIMIT 500').all();
					}
					const rows = (r && r.results) ? r.results : [];
					return new Response(JSON.stringify(rows), { headers: { 'Content-Type': 'application/json' } });
				} catch (err) {
					return new Response(JSON.stringify({ error: 'DB Read Error: ' + (err as any).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
				}
			} else if (request.method === 'POST') {
				const authError = requireAuth(request);
				if (authError) return authError;

				try {
					const body = await request.json() as any;
					const id = crypto.randomUUID();
					const now = Date.now();
					const stmt = env.D1_PRESCOUT.prepare('INSERT INTO teams (id, team_number, team_name, city, province, country, event, year, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
					await stmt.bind(id, String(body.team_number || ''), body.team_name || null, body.city || null, body.province || null, body.country || null, body.event || '', Number(body.year) || 2026, now).run();
					return new Response(JSON.stringify({ ok: true, id }), { headers: { 'Content-Type': 'application/json' } });
				} catch (err) {
					return new Response(JSON.stringify({ error: 'DB Write Error: ' + (err as any).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
				}
			} else if (request.method === 'DELETE') {
				const authError = requireAuth(request);
				if (authError) return authError;

				try {
					const url_obj = new URL(request.url);
					const id = url_obj.searchParams.get('id');
					if (!id) {
						return new Response(JSON.stringify({ error: 'Missing id parameter' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
					}
					const stmt = env.D1_PRESCOUT.prepare('DELETE FROM teams WHERE id = ?');
					await stmt.bind(id).run();
					return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
				} catch (err) {
					return new Response(JSON.stringify({ error: 'DB Delete Error: ' + (err as any).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
				}
			} else {
				return new Response('Method Not Allowed', { status: 405 });
			}
		}

		// Otherwise fall back to serving static assets via Assets Binding
		return env.ASSETS.fetch(request);
	},
} satisfies ExportedHandler<Env>;

function requireAuth(request: Request): Response | null {
	const auth = request.headers.get('Authorization') || '';
	if (auth !== `Bearer ${ADMIN_TOKEN}`) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
	}
	return null;
}

async function ensureUsersTable(env: Env): Promise<void> {
	await env.D1_PRESCOUT.prepare(`
		CREATE TABLE IF NOT EXISTS users (
			username TEXT PRIMARY KEY,
			password TEXT NOT NULL,
			role TEXT NOT NULL,
			created_at INTEGER,
			updated_at INTEGER
		)
	`).run();

	const adminUser = await env.D1_PRESCOUT
		.prepare('SELECT username FROM users WHERE username = ? LIMIT 1')
		.bind('admin')
		.first();

	if (!adminUser) {
		const now = Date.now();
		await env.D1_PRESCOUT.prepare('INSERT INTO users (username, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
			.bind('admin', 'admin123', 'admin', now, now)
			.run();
	}
}
