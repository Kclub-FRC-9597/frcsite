// /api/scouting — 现场 Scouting 数据 CRUD
import { Env } from '../types';

export async function handleScouting(request: Request, env: Env): Promise<Response> {
	if (!env.D1_PRESCOUT) {
		return new Response(JSON.stringify({ error: 'D1_PRESCOUT binding not configured' }), {
			status: 500, headers: { 'Content-Type': 'application/json' }
		});
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
					.prepare('SELECT id, data, team, event, ts FROM scouting WHERE event = ? ORDER BY ts DESC LIMIT 200')
					.bind(event).all();
			} else {
				r = await env.D1_PRESCOUT
					.prepare('SELECT id, data, team, event, ts FROM scouting ORDER BY ts DESC LIMIT 200')
					.all();
			}
			const rows = (r && r.results) ? r.results : [];
			const parsed = rows.map((row: any) => {
				let payload: any = {};
				try { payload = row.data ? JSON.parse(row.data) : {}; } catch { payload = {}; }
				return { id: row.id, ts: row.ts, team: row.team, event: row.event, ...payload };
			});
			return new Response(JSON.stringify(parsed), { headers: { 'Content-Type': 'application/json' } });
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
			const payload = JSON.stringify(body || {});
			const team = body && body.team ? String(body.team) : '';
			const event = body && body.event ? String(body.event) : '';
			const ts = Number(body && body.ts ? body.ts : Date.now());
			await env.D1_PRESCOUT
				.prepare('INSERT INTO scouting (id, data, team, event, ts) VALUES (?, ?, ?, ?, ?)')
				.bind(id, payload, team, event, ts).run();
			return new Response(JSON.stringify({ ok: true, id }), { headers: { 'Content-Type': 'application/json' } });
		} catch (err) {
			return new Response(JSON.stringify({ error: 'DB Write Error: ' + (err as any).message }), {
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
			await env.D1_PRESCOUT.prepare('DELETE FROM scouting WHERE id = ?').bind(id).run();
			return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
		} catch (err) {
			return new Response(JSON.stringify({ error: 'DB Delete Error: ' + (err as any).message }), {
				status: 500, headers: { 'Content-Type': 'application/json' }
			});
		}
	}

	return new Response('Method Not Allowed', { status: 405 });
}
