// /api/sponsors — 赞助商管理
import { Env } from '../types';
import { requireAuth } from '../auth';

export async function handleSponsors(request: Request, env: Env): Promise<Response> {
	if (!env.D1_PRESCOUT) {
		return new Response(JSON.stringify({ error: 'D1_PRESCOUT binding not configured' }), {
			status: 500, headers: { 'Content-Type': 'application/json' }
		});
	}

	try {
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

		await env.D1_PRESCOUT.prepare("UPDATE sponsors SET name = 'Bambu' WHERE lower(name) = 'bambo'").run();

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
		return new Response(JSON.stringify({ error: 'DB Init Error: ' + (err as any).message }), {
			status: 500, headers: { 'Content-Type': 'application/json' }
		});
	}

	if (request.method === 'GET') {
		try {
			const url_obj = new URL(request.url);
			const year = url_obj.searchParams.get('year');
			let r;
			if (year) {
				r = await env.D1_PRESCOUT
					.prepare('SELECT id, year, name, logo_url, website, created_at, updated_at FROM sponsors WHERE year = ? ORDER BY created_at ASC')
					.bind(Number(year)).all();
			} else {
				r = await env.D1_PRESCOUT
					.prepare('SELECT id, year, name, logo_url, website, created_at, updated_at FROM sponsors ORDER BY year DESC, created_at ASC')
					.all();
			}
			return new Response(JSON.stringify((r && r.results) ? r.results : []), {
				headers: { 'Content-Type': 'application/json' }
			});
		} catch (err) {
			return new Response(JSON.stringify({ error: 'DB Read Error: ' + (err as any).message }), {
				status: 500, headers: { 'Content-Type': 'application/json' }
			});
		}
	}

	if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
		const authError = requireAuth(request);
		if (authError) return authError;
	}

	if (request.method === 'POST') {
		try {
			const body = await request.json() as any;
			const id = crypto.randomUUID();
			const now = Date.now();
			await env.D1_PRESCOUT
				.prepare('INSERT INTO sponsors (id, year, name, logo_url, website, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
				.bind(id, Number(body.year), String(body.name || ''), body.logo_url || null, body.website || null, now, now)
				.run();
			return new Response(JSON.stringify({ ok: true, id }), { headers: { 'Content-Type': 'application/json' } });
		} catch (err) {
			return new Response(JSON.stringify({ error: 'DB Write Error: ' + (err as any).message }), {
				status: 500, headers: { 'Content-Type': 'application/json' }
			});
		}
	}

	if (request.method === 'PUT') {
		try {
			const body = await request.json() as any;
			const id = (new URL(request.url)).searchParams.get('id');
			if (!id) {
				return new Response(JSON.stringify({ error: 'Missing id parameter' }), {
					status: 400, headers: { 'Content-Type': 'application/json' }
				});
			}
			const now = Date.now();
			await env.D1_PRESCOUT
				.prepare('UPDATE sponsors SET name = ?, logo_url = ?, website = ?, year = ?, updated_at = ? WHERE id = ?')
				.bind(String(body.name || ''), body.logo_url || null, body.website || null, Number(body.year), now, id)
				.run();
			return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
		} catch (err) {
			return new Response(JSON.stringify({ error: 'DB Update Error: ' + (err as any).message }), {
				status: 500, headers: { 'Content-Type': 'application/json' }
			});
		}
	}

	if (request.method === 'DELETE') {
		try {
			const id = (new URL(request.url)).searchParams.get('id');
			if (!id) {
				return new Response(JSON.stringify({ error: 'Missing id parameter' }), {
					status: 400, headers: { 'Content-Type': 'application/json' }
				});
			}
			await env.D1_PRESCOUT.prepare('DELETE FROM sponsors WHERE id = ?').bind(id).run();
			return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
		} catch (err) {
			return new Response(JSON.stringify({ error: 'DB Delete Error: ' + (err as any).message }), {
				status: 500, headers: { 'Content-Type': 'application/json' }
			});
		}
	}

	return new Response('Method Not Allowed', { status: 405 });
}
