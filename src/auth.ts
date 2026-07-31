// 认证模块
export const ADMIN_TOKEN = "admin-token-2026";

export function requireAuth(request: Request): Response | null {
	const auth = request.headers.get('Authorization') || '';
	if (auth !== `Bearer ${ADMIN_TOKEN}`) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		});
	}
	return null;
}
