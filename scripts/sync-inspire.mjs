// 子模块同步：选择子模块 → 拉取合并 → 部署 → 提交推送
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import readline from 'node:readline/promises';

const sh = (cmd) => execSync(cmd, { stdio: 'inherit' });
const out = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim();
const name = (p) => p.split('/').pop();

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
let picked = process.argv.slice(2);

if (picked.length === 0 && paths.length === 1) {
	picked = paths;
	console.log(`只有一个子模块，直接更新：${paths[0]}`);
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

// 3. 拉取并移动指针
const synced = [];
for (const p of picked) {
	console.log(`\n>>> ${p}`);
	sh(`git submodule update --remote ${p}`);
	synced.push([p, out(`git -C ${p} rev-parse --short HEAD`)]);
}

// 4. 部署 → 提交（信息带 sha）→ 推送
const detail = synced.map(([p, sha]) => `${name(p)} ${sha}`).join(', ');
const msg =
	synced.length === 1
		? `chore: sync ${name(synced[0][0])} 子模块最新改动 (${synced[0][1]})`
		: `chore: sync 子模块最新改动 (${detail})`;

sh('npm run deploy');
sh(`git add ${picked.join(' ')}`);
// 无变化时不提交（子模块本来就没更新），但继续推送，避免本地积压的提交推不上去
if (out('git diff --cached --name-only')) {
	sh(`git commit -m "${msg}"`);
}
sh('git push');

console.log(`\n完成：${msg}`);
