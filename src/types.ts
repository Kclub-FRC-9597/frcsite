// 共享类型定义
export interface Env {
	D1_PRESCOUT: D1Database;
	ASSETS: any;
}

export interface User {
	username: string;
	password: string;
	role: string;
	created_at: number;
	updated_at: number;
}

export interface Student {
	username: string;
	real_name: string;
	class: string;
	team_ids: string;
	created_at: number;
	updated_at: number;
}
