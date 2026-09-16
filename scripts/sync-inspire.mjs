// 子模块同步：选择子模块 → 拉取合并 → 部署 → 提交推送
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import readline from 'node:readline/promises';

// 命令执行：失败就打印一行结果并中止（不抛 stack trace），保证每步都有「开始 + 结果」
const sh = (cmd) => {
	try {
		execSync(cmd, { stdio: 'inherit' });
	} catch {
		console.log(`  [X] 本步失败，已中止：${cmd}`);
		process.exit(1);
	}
};

const out = (cmd) => {
	try {
		return execSync(cmd, { encoding: 'utf8' }).trim();
	} catch {
		console.log(`  [X] 本步失败，已中止：${cmd}`);
		process.exit(1);
	}
};

const name = (p) => p.split('/').pop();

// 输出：每步「开始」先打印将要执行的命令，「结果」打印 [OK] / [--]
const step = (msg) => console.log(`\n=== ${msg} ===`);
const run = (cmd) => console.log(`>>> ${cmd}`);
const ok = (msg) => console.log(`  [OK] ${msg}`);
const miss = (msg) => console.log(`  [--] ${msg}`);

// 1. 列出 .gitmodules 里的所有子模块
const paths = readFileSync('.gitmodules', 'utf8')
	.split('\n')
	.map((line) => line.trim())
	.filter((line) => line.startsWith('path ='))
	.map((line) => line.slice('path ='.length).trim())
	.filter(Boolean);

if (paths.length === 0) {
	console.log('.gitmodules 里没有子模块');
	process.exit(1);
}

// 2. 决定更新哪些：命令行指定 > 只有一个子模块 > 交互选择
step('1/4 选择子模块');
let picked = process.argv.slice(2);

if (picked.length === 0 && paths.length === 1) {
	picked = paths;
	ok(`只有一个子模块，直接选中：${paths[0]}`);
}

if (picked.length === 0) {
	console.log('可更新的子模块：');
	paths.forEach((p, i) => console.log(`  ${i + 1}. ${p}`));
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
	const ans = (await rl.question('\n要更新哪些？（如 1,3；直接回车＝全部）: ')).trim();
	rl.close();
	picked =
		ans === ''
			? paths
			: ans
					.split(/[,\s]+/)
					.map((n) => paths[Number(n) - 1])
					.filter(Boolean);
}

if (picked.length === 0) {
	console.log('没有选中任何子模块');
	process.exit(1);
}
ok(`本次更新：${picked.join('、')}`);

// 3. 拉取并移动指针
step('2/4 拉取合并子模块');
const synced = [];
for (const p of picked) {
	const before = out(`git -C ${p} rev-parse --short HEAD`);
	run(`git submodule update --remote ${p}`);
	sh(`git submodule update --remote ${p}`);
	const after = out(`git -C ${p} rev-parse --short HEAD`);

	if (before === after) {
		miss(`${p} 已是最新（${after}），无需变动`);
	} else {
		ok(`${p} 已更新：${before} -> ${after}`);
		out(`git -C ${p} log --oneline ${before}..${after}`)
			.split('\n')
			.forEach((line) => console.log(`       ${line}`));
	}
	synced.push([p, after]);
}

// 4. 部署 → 提交（提交信息带子模块 sha）→ 推送
const detail = synced.map(([p, sha]) => `${name(p)} ${sha}`).join(', ');
const msg =
	synced.length === 1
		? `chore: sync ${name(synced[0][0])} 子模块最新改动 (${synced[0][1]})`
		: `chore: sync 子模块最新改动 (${detail})`;

step('3/4 部署');
run('npm run deploy');
sh('npm run deploy');
ok('部署完成');

step('4/4 提交并推送');
run(`git add ${picked.join(' ')}`);
sh(`git add ${picked.join(' ')}`);
ok(`已暂存：${picked.join('、')}`);

// 只有本次子模块指针真的变了才提交；无变化时跳过提交，但仍推送，避免本地积压的提交推不上去
if (out(`git diff --cached --name-only -- ${picked.join(' ')}`)) {
	run(`git commit -m "${msg}" -- ${picked.join(' ')}`);
	sh(`git commit -m "${msg}" -- ${picked.join(' ')}`);
	ok(`已提交：${msg}`);
} else {
	miss('子模块指针没有变化，跳过提交');
}

run('git push');
sh('git push');
ok('已推送到 origin');

console.log(`\n全部完成：${msg}`);
