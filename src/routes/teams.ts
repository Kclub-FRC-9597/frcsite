// /api/teams + /api/team-assignments
import { Env } from '../types';
import { requireAuth } from '../auth';

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

export function handleTeams(request: Request): Response {
	if (request.method === 'GET') {
		const url_obj = new URL(request.url);
		const event = url_obj.searchParams.get('event');
		const year = url_obj.searchParams.get('year');

		let filtered = teams2026Shanghai;
		if (event && event === 'Shanghai Regional' && year && year === '2026') {
			filtered = teams2026Shanghai;
		} else if (event && event === 'Shanghai Regional') {
			filtered = teams2026Shanghai;
		} else if (!event) {
			filtered = teams2026Shanghai;
		} else {
			filtered = [];
		}

		return new Response(JSON.stringify(filtered), { headers: { 'Content-Type': 'application/json' } });
	}

	return new Response('Method Not Allowed', { status: 405 });
}

export async function handleTeamAssignments(request: Request, env: Env): Promise<Response> {
	if (!env.D1_PRESCOUT) {
		return new Response(JSON.stringify({ error: 'D1_PRESCOUT binding not configured' }), {
			status: 500, headers: { 'Content-Type': 'application/json' }
		});
	}

	try {
		await env.D1_PRESCOUT.prepare(`
			CREATE TABLE IF NOT EXISTS team_assignments (
				id TEXT PRIMARY KEY,
				username TEXT NOT NULL,
				team_number TEXT NOT NULL,
				UNIQUE(username, team_number)
			)
		`).run();
	} catch (err) {
		return new Response(JSON.stringify({ error: 'DB Init Error: ' + (err as any).message }), {
			status: 500, headers: { 'Content-Type': 'application/json' }
		});
	}

	if (request.method === 'GET') {
		try {
			const r = await env.D1_PRESCOUT.prepare(
				'SELECT username, team_number FROM team_assignments ORDER BY username ASC, team_number ASC'
			).all();
			return new Response(JSON.stringify((r && r.results) ? r.results : []), {
				headers: { 'Content-Type': 'application/json' }
			});
		} catch (err) {
			return new Response(JSON.stringify({ error: 'DB Read Error: ' + (err as any).message }), {
				status: 500, headers: { 'Content-Type': 'application/json' }
			});
		}
	}

	// POST/PUT/DELETE require auth
	const authError = requireAuth(request);
	if (authError) return authError;

	if (request.method === 'POST') {
		try {
			const body = await request.json() as any;
			const username = String(body?.username || '').trim();
			const team_number = String(body?.team_number || '').trim();

			if (!username || !team_number) {
				return new Response(JSON.stringify({ error: 'Missing username or team_number' }), {
					status: 400, headers: { 'Content-Type': 'application/json' }
				});
			}

			const existing = await env.D1_PRESCOUT
				.prepare('SELECT id FROM team_assignments WHERE username = ? AND team_number = ? LIMIT 1')
				.bind(username, team_number)
				.first() as any;

			if (existing) {
				return new Response(JSON.stringify({ error: `${username} 已被分配给队伍 ${team_number}` }), {
					status: 400, headers: { 'Content-Type': 'application/json' }
				});
			}

			const id = crypto.randomUUID();
			await env.D1_PRESCOUT
				.prepare('INSERT INTO team_assignments (id, username, team_number) VALUES (?, ?, ?)')
				.bind(id, username, team_number)
				.run();
			return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
		} catch (err) {
			return new Response(JSON.stringify({ error: 'DB Write Error: ' + (err as any).message }), {
				status: 500, headers: { 'Content-Type': 'application/json' }
			});
		}
	}

	if (request.method === 'DELETE') {
		try {
			const url_obj = new URL(request.url);
			const username = url_obj.searchParams.get('username');
			const team_number = url_obj.searchParams.get('team_number');
			if (!username || !team_number) {
				return new Response(JSON.stringify({ error: 'Missing username or team_number parameter' }), {
					status: 400, headers: { 'Content-Type': 'application/json' }
				});
			}
			await env.D1_PRESCOUT
				.prepare('DELETE FROM team_assignments WHERE username = ? AND team_number = ?')
				.bind(username, team_number).run();
			return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
		} catch (err) {
			return new Response(JSON.stringify({ error: 'DB Delete Error: ' + (err as any).message }), {
				status: 500, headers: { 'Content-Type': 'application/json' }
			});
		}
	}

	return new Response('Method Not Allowed', { status: 405 });
}
