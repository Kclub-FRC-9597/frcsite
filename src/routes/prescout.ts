// /api/prescout — PreScouting 数据 CRUD
import { Env } from '../types';

export async function handlePrescout(request: Request, env: Env): Promise<Response> {
	if (!env.D1_PRESCOUT) {
		return new Response(JSON.stringify({ error: 'D1_PRESCOUT binding not configured' }), {
			status: 500, headers: { 'Content-Type': 'application/json' }
		});
	}

	try {
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
		return new Response(JSON.stringify({ error: 'DB Init Error: ' + (err as any).message }), {
			status: 500, headers: { 'Content-Type': 'application/json' }
		});
	}

	if (request.method === 'GET') {
		try {
			const url_obj = new URL(request.url);
			const event = url_obj.searchParams.get('event');
			let r;
			if (event) {
				r = await env.D1_PRESCOUT
					.prepare('SELECT id, collector, teamNumber, teamName, practice, compCount, chassis, event, ts FROM prescout WHERE event = ? ORDER BY ts DESC LIMIT 100')
					.bind(event).all();
			} else {
				r = await env.D1_PRESCOUT
					.prepare('SELECT id, collector, teamNumber, teamName, practice, compCount, chassis, event, ts FROM prescout ORDER BY ts DESC LIMIT 100')
					.all();
			}
			const rows = (r && r.results) ? r.results : [];
			return new Response(JSON.stringify(rows), { headers: { 'Content-Type': 'application/json' } });
		} catch (err) {
			return new Response(JSON.stringify({ error: 'DB Read Error: ' + (err as any).message }), {
				status: 500, headers: { 'Content-Type': 'application/json' }
			});
		}
	}

	if (request.method === 'POST') {
		try {
			const body = await request.json() as any;
			const id = crypto.randomUUID();
			await env.D1_PRESCOUT
				.prepare('INSERT INTO prescout (id, collector, teamNumber, teamName, practice, compCount, chassis, event, ts) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
				.bind(id, body.collector || null, String(body.teamNumber || ''), body.teamName || null,
					body.practice || null, Number(body.compCount || 0), body.chassis || null,
					body.event || 'Shanghai Regional', Number(body.ts || Date.now()))
				.run();
			return new Response(JSON.stringify({ ok: true, id }), { headers: { 'Content-Type': 'application/json' } });
		} catch (err) {
			return new Response(JSON.stringify({ error: 'DB Write Error: ' + (err as any).message }), {
				status: 500, headers: { 'Content-Type': 'application/json' }
			});
		}
	}

	if (request.method === 'DELETE') {
		try {
			const url_obj = new URL(request.url);
			const id = url_obj.searchParams.get('id');
			if (!id) {
				return new Response(JSON.stringify({ error: 'Missing id parameter' }), {
					status: 400, headers: { 'Content-Type': 'application/json' }
				});
			}
			await env.D1_PRESCOUT.prepare('DELETE FROM prescout WHERE id = ?').bind(id).run();
			return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
		} catch (err) {
			return new Response(JSON.stringify({ error: 'DB Delete Error: ' + (err as any).message }), {
				status: 500, headers: { 'Content-Type': 'application/json' }
			});
		}
	}

	return new Response('Method Not Allowed', { status: 405 });
}
