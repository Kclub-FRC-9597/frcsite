// Worker 入口 · 仅做路由分发
import { DurableObject } from ""cloudflare:workers"";
import { Env } from './types';
import { requireAuth } from './auth';
import { handleAuthLogin } from './routes/auth';
import { handleUsers, handleChangePassword } from './routes/users';
import { handlePrescout } from './routes/prescout';
import { handleScouting } from './routes/scouting';
import { handleSponsors } from './routes/sponsors';
import { handleTeams, handleTeamAssignments } from './routes/teams';

export class MyDurableObject extends DurableObject {
    constructor(state: DurableObjectState, env: Env) { super(state, env); }
    async fetch(request: Request): Promise<Response> {
        return new Response(""Not Found"", { status: 404 });
    }
}

export default {
    async fetch(request, env: Env, ctx): Promise<Response> {
        const url = new URL(request.url);
        const method = request.method;

        const publicRoutes: Record<string, string[]> = {
            'GET':  ['/api/sponsors', '/api/teams', '/api/team-assignments'],
            'POST': ['/api/auth/login', '/api/users/password'],
        };
        const isPublic = (publicRoutes[method] || []).includes(url.pathname);
        if (!isPublic) { const e = requireAuth(request); if (e) return e; }

        if (url.pathname === '/api/auth/login' && method === 'POST') return handleAuthLogin(request, env);
        if (url.pathname === '/api/users') return handleUsers(request, env);
        if (url.pathname === '/api/users/password' && method === 'POST') return handleChangePassword(request, env);
        if (url.pathname === '/api/prescout') return handlePrescout(request, env);
        if (url.pathname === '/api/scouting') return handleScouting(request, env);
        if (url.pathname === '/api/sponsors') return handleSponsors(request, env);
        if (url.pathname === '/api/teams') return handleTeams(request);
        if (url.pathname === '/api/team-assignments') return handleTeamAssignments(request, env);

        return env.ASSETS.fetch(request);
    },
};
