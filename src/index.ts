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
		if (url.pathname.startsWith('/api/')) {
			const authError = requireAuth(request);
			if (authError) return authError;
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
