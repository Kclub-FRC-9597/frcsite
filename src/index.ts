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
		// For GET requests to /api/sponsors and /api/teams, allow without authentication
		// For other APIs, require authentication
		if (url.pathname.startsWith('/api/')) {
			const isPublicGetRequest = (request.method === 'GET' && url.pathname === '/api/sponsors') || 
				(request.method === 'GET' && url.pathname === '/api/teams');
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

					if (username === 'tester' || username === 'user') {
						return new Response(JSON.stringify({ error: `${username} 账户保留为本地测试账户，不能写入数据库` }), { status: 400, headers: { 'Content-Type': 'application/json' } });
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

					if (username === 'tester' || username === 'user') {
						return new Response(JSON.stringify({ error: `${username} 账户保留为本地测试账户，不能写入数据库` }), { status: 400, headers: { 'Content-Type': 'application/json' } });
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

					if (username === 'tester' || username === 'user') {
						return new Response(JSON.stringify({ error: `${username} 账户保留为本地测试账户，不能删除` }), { status: 400, headers: { 'Content-Type': 'application/json' } });
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
					await stmt.bind(id, body.collector || null, String(body.teamNumber || ''), body.teamName || null, body.practice || null, Number(body.compCount || 0), body.chassis || null, body.event || 'Shanghai Regional', Number(body.ts || Date.now())).run();
					return new Response(JSON.stringify({ ok: true, id }), { headers: { 'Content-Type': 'application/json' } });
				} catch (err) {
					return new Response(JSON.stringify({ error: 'DB Write Error: ' + (err as any).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
				}
			} else if (request.method === 'DELETE') {
				try {
					const url_obj = new URL(request.url);
					const id = url_obj.searchParams.get('id');
					if (!id) {
						return new Response(JSON.stringify({ error: 'Missing id parameter' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
					}
					await env.D1_PRESCOUT.prepare('DELETE FROM prescout WHERE id = ?').bind(id).run();
					return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
				} catch (err) {
					return new Response(JSON.stringify({ error: 'DB Delete Error: ' + (err as any).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
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
			} else if (request.method === 'DELETE') {
				try {
					const url_obj = new URL(request.url);
					const id = url_obj.searchParams.get('id');
					if (!id) {
						return new Response(JSON.stringify({ error: 'Missing id parameter' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
					}
					await env.D1_PRESCOUT.prepare('DELETE FROM scouting WHERE id = ?').bind(id).run();
					return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
				} catch (err) {
					return new Response(JSON.stringify({ error: 'DB Delete Error: ' + (err as any).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
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
			// Teams data for Shanghai Regional 2026
			const teams2026Shanghai = [
				{ team_number: '5449', team_name: 'Prototype', city: 'Beijing', province: 'Beijing', country: 'China' },
				{ team_number: '5515', team_name: 'Blue Power Robotics', city: 'Shanghai', province: 'Shanghai', country: 'China' },
				{ team_number: '5516', team_name: 'Iron Maple', city: 'Shenzhen', province: 'Guangdong', country: 'China' },
				{ team_number: '5522', team_name: 'Stargazer', city: 'Shenzhen', province: 'Guangdong', country: 'China' },
				{ team_number: '5823', team_name: 'ACE', city: 'Shenzhen', province: 'Guangdong', country: 'China' },
				{ team_number: '5849', team_name: 'Joker', city: 'Qingdao', province: 'Shandong', country: 'China' },
				{ team_number: '6304', team_name: 'EAGLE', city: 'Zhenjiang', province: 'Jiangsu', country: 'China' },
				{ team_number: '6353', team_name: 'EFZ Robotics', city: 'Shanghai', province: 'Shanghai', country: 'China' },
				{ team_number: '6394', team_name: 'MITO', city: 'Suzhou', province: 'Jiangsu', country: 'China' },
				{ team_number: '6399', team_name: 'Tinspiratio', city: 'Jinan', province: 'Shandong', country: 'China' },
				{ team_number: '6414', team_name: 'Voyager', city: 'Shenzhen', province: 'Guangdong', country: 'China' },
				{ team_number: '6433', team_name: 'HZ4Z', city: 'Hangzhou', province: 'Zhejiang', country: 'China' },
				{ team_number: '6487', team_name: 'Clockwork Knights', city: 'Shanghai', province: 'Shanghai', country: 'China' },
				{ team_number: '6494', team_name: 'Wings of Liberty', city: 'Shanghai', province: 'Shanghai', country: 'China' },
				{ team_number: '6706', team_name: 'Golem', city: 'Shenzhen', province: 'Guangdong', country: 'China' },
				{ team_number: '6766', team_name: 'AtomStorm', city: 'Shenzhen', province: 'Guangdong', country: 'China' },
				{ team_number: '6907', team_name: 'The G.O.A.T', city: 'Shanghai', province: 'Shanghai', country: 'China' },
				{ team_number: '6940', team_name: 'Violet Z', city: 'Shanghai', province: 'Shanghai', country: 'China' },
				{ team_number: '6941', team_name: 'IronPulse Robotics', city: 'Shanghai', province: 'Shanghai', country: 'China' },
				{ team_number: '6986', team_name: 'PPT Bots', city: 'Nanjing', province: 'Jiangsu', country: 'China' },
				{ team_number: '7002', team_name: '风云蹦豆', city: 'Taiyuan', province: 'Shanxi', country: 'China' },
				{ team_number: '7594', team_name: 'Nautilus', city: 'Shenzhen', province: 'Guangdong', country: 'China' },
				{ team_number: '7601', team_name: 'Shenzhen Unity Stallion', city: 'Shenzhen', province: 'Guangdong', country: 'China' },
				{ team_number: '7738', team_name: 'Helion', city: 'Beijing', province: 'Beijing', country: 'China' },
				{ team_number: '8011', team_name: 'Kirin', city: 'Guangzhou', province: 'Guangdong', country: 'China' },
				{ team_number: '8015', team_name: 'The Cheetahs', city: 'Shanghai', province: 'Shanghai', country: 'China' },
				{ team_number: '8214', team_name: 'Cyber Unicorn', city: 'Guangzhou', province: 'Guangdong', country: 'China' },
				{ team_number: '8806', team_name: 'Our Lady of Providence Dream League', city: 'New Taipei City', province: 'New Taipei', country: 'Chinese Taipei' },
				{ team_number: '8810', team_name: 'The Alphabots', city: 'Suzhou', province: 'Jiangsu', country: 'China' },
				{ team_number: '9421', team_name: 'Nexus', city: 'Hong Kong', province: 'Hong Kong', country: 'China' },
				{ team_number: '9597', team_name: 'Luban Robotics', city: 'Beijing', province: 'Beijing', country: 'China' },
				{ team_number: '9635', team_name: 'Cyber Rabbit', city: 'Guangzhou', province: 'Guangdong', country: 'China' },
				{ team_number: '10000', team_name: 'Neutron Star', city: 'Beijing', province: 'Beijing', country: 'China' },
				{ team_number: '10016', team_name: 'Absolute Zero', city: 'Shanghai', province: 'Shanghai', country: 'China' },
				{ team_number: '10120', team_name: 'Wulfa the Wolf', city: 'Shanghai', province: 'Shanghai', country: 'China' },
				{ team_number: '10131', team_name: 'Royal Turtles', city: 'Hong Kong', province: 'Hong Kong', country: 'China' },
				{ team_number: '10214', team_name: 'Team Doritos', city: 'Beijing', province: 'Beijing', country: 'China' },
				{ team_number: '10479', team_name: 'Powerhouse', city: 'Shanghai', province: 'Shanghai', country: 'China' },
				{ team_number: '10526', team_name: 'Orcas', city: 'Shanghai', province: 'Shanghai', country: 'China' },
				{ team_number: '10541', team_name: 'CarbonPulse Robotics', city: 'Shanghai', province: 'Shanghai', country: 'China' },
				{ team_number: '10558', team_name: 'Forté', city: 'Beijing', province: 'Beijing', country: 'China' },
				{ team_number: '10711', team_name: 'FORMSHOP', city: 'Shanghai', province: 'Shanghai', country: 'China' },
				{ team_number: '11019', team_name: 'X.PLORE', city: 'Shanghai', province: 'Shanghai', country: 'China' },
				{ team_number: '11118', team_name: 'The Baybies', city: 'Suzhou', province: 'Jiangsu', country: 'China' },
				{ team_number: '11256', team_name: 'Sattellites', city: 'Qingdao', province: 'Shandong', country: 'China' },
				{ team_number: '11288', team_name: 'Trident Force', city: 'Hangzhou', province: 'Zhejiang', country: 'China' },
				{ team_number: '11319', team_name: 'Polaris', city: 'Ningbo', province: 'Zhejiang', country: 'China' },
				{ team_number: '11328', team_name: 'SIA', city: 'Shenzhen', province: 'Guangdong', country: 'China' },
				{ team_number: '11352', team_name: 'Flying Tiger', city: 'Chongqing', province: 'Chongqing', country: 'China' },
				{ team_number: '11485', team_name: 'Bestarian NextGEN', city: 'Kuala Lumpur', province: 'Kuala Lumpur', country: 'Malaysia' }
			];

			if (request.method === 'GET') {
				try {
					const url_obj = new URL(request.url);
					const event = url_obj.searchParams.get('event');
					const year = url_obj.searchParams.get('year');
					
					// Filter teams by event and year
					let filtered = teams2026Shanghai;
					if (event && event === 'Shanghai Regional' && year && year === '2026') {
						filtered = teams2026Shanghai;
					} else if (event && event === 'Shanghai Regional') {
						filtered = teams2026Shanghai;
					} else if (!event) {
						// Return all teams if no event specified
						filtered = teams2026Shanghai;
					} else {
						filtered = [];
					}
					
					return new Response(JSON.stringify(filtered), { headers: { 'Content-Type': 'application/json' } });
				} catch (err) {
					return new Response(JSON.stringify({ error: 'Error: ' + (err as any).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
				}
			} else {
				return new Response('Method Not Allowed', { status: 405 });
			}
		}

		// API: team assignments
		if (url.pathname === '/api/team-assignments') {
			if (!env.D1_PRESCOUT) {
				return new Response(JSON.stringify({ error: 'D1_PRESCOUT binding not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
			}

			try {
				await ensureTeamAssignmentsTable(env);
			} catch (err) {
				return new Response(JSON.stringify({ error: 'DB Init Error: ' + (err as any).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
			}

			if (request.method === 'GET') {
				try {
					const r = await env.D1_PRESCOUT.prepare('SELECT username, team_number FROM team_assignments ORDER BY username ASC').all();
					const rows = (r && r.results) ? r.results : [];
					return new Response(JSON.stringify(rows), { headers: { 'Content-Type': 'application/json' } });
				} catch (err) {
					return new Response(JSON.stringify({ error: 'DB Read Error: ' + (err as any).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
				}
			} else if (request.method === 'POST') {
				try {
					const body = await request.json() as any;
					const username = String(body?.username || '').trim();
					const team_number = String(body?.team_number || '').trim();

					if (!username || !team_number) {
						return new Response(JSON.stringify({ error: 'Missing username or team_number' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
					}

					// Delete existing assignment for this user
					await env.D1_PRESCOUT.prepare('DELETE FROM team_assignments WHERE username = ?').bind(username).run();
					
					// Insert new assignment
					await env.D1_PRESCOUT.prepare('INSERT INTO team_assignments (username, team_number) VALUES (?, ?)')
						.bind(username, team_number)
						.run();
					
					return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
				} catch (err) {
					return new Response(JSON.stringify({ error: 'DB Write Error: ' + (err as any).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
				}
			} else if (request.method === 'DELETE') {
				try {
					const url_obj = new URL(request.url);
					const username = url_obj.searchParams.get('username');
					if (!username) {
						return new Response(JSON.stringify({ error: 'Missing username parameter' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
					}
					await env.D1_PRESCOUT.prepare('DELETE FROM team_assignments WHERE username = ?').bind(username).run();
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

	const userUser = await env.D1_PRESCOUT
		.prepare('SELECT username FROM users WHERE username = ? LIMIT 1')
		.bind('user')
		.first();

	if (!userUser) {
		const now = Date.now();
		await env.D1_PRESCOUT.prepare('INSERT INTO users (username, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?)')
			.bind('user', 'user123', 'user', now, now)
			.run();
	}
}

async function ensureTeamAssignmentsTable(env: Env): Promise<void> {
	await env.D1_PRESCOUT.prepare(`
		CREATE TABLE IF NOT EXISTS team_assignments (
			username TEXT PRIMARY KEY,
			team_number TEXT NOT NULL
		)
	`).run();
}
