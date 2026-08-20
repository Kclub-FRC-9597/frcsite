# TESTPLAN · prd-5-1 数据 IndexedDB 化

## GATE 1（R1 数据 IndexedDB 化）

### 自动化检查 [agent 执行]
| 编号 | 验证内容 | 命令 | 预期结果 |
|------|---------|------|---------|
| A-1 | shared_indexdb.js 语法 | `node --check public/inspire/shared_indexdb.js` | 无输出 |
| A-2 | shared.js 语法 | `node --check public/inspire/shared.js` | 无输出 |
| A-3 | devtools.js 语法 | `node --check public/inspire/devtools.js` | 无输出 |
| A-4 | merge() 并发合并 | 注入测试 | 收敛一致、无丢更新 |
| A-5 | merge() 删除复活 | 注入测试 | 墓碑传播，删除不被复活 |
| A-6 | merge() 平局（lamport=deviceId 同） | 注入测试 | deviceId 字典序决胜 |

### 手工验证 [human 执行]
| 编号 | 操作步骤 | 预期结果 |
|------|---------|---------|
| M-1 | 打开页面 | 数据完整迁入四库，功能正常 |
| M-2 | 刷新 / 同机多标签页 | 数据联动一致 |
| M-3 | 检查旧 STS_DB | 已清理；localStorage 只剩小配置 |

### GATE 1 通过条件
- [ ] [agent] A-1~A-6 全部通过
- [ ] [human] M-1~M-3 全部通过，结果已反馈
