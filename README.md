# 3D 多人在线中国象棋

Web 端 3D 中国象棋平台：好友/匹配对战、AI（Pikafish.wasm 1–20 档）、观战、复盘。技术栈：Vite + React 18 + Three.js + Socket.IO + SQLite/Prisma。

## 快速开始

```bash
# 安装依赖
pnpm install

# 生成 Prisma Client 并初始化 SQLite
pnpm db:generate
pnpm db:push

# 同时启动前端 (5173) 与后端 (3001)
pnpm dev
```

浏览器打开 http://localhost:5173 ，注册两个账号或用两个隐身窗口测试匹配/建房。

## 脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 并行启动 client + server |
| `pnpm build` | 构建 shared、client、server |
| `pnpm test` | 运行各包单元测试 |
| `pnpm db:push` | 同步 Prisma schema 到 SQLite |

## 目录

| 路径 | 说明 |
|------|------|
| `client/src/scenes/` | 3D 棋盘（R3F）、摄像机预设 |
| `client/src/engine/` | xiangqi 本地规则、Pikafish Worker |
| `client/public/engine/` | 放置 `pikafish.wasm` |
| `server/src/game/` | 服务端权威规则引擎 |
| `server/src/socket/` | Socket.IO 事件处理 |
| `shared/` | 类型、Elo、Socket 协议、棋盘坐标 |
| `ARCHITECTURE.md` | 模块拆解、协议表、风险与引擎集成 |

## 环境变量

复制 `server/.env.example` 为 `server/.env`（可选）。

| 变量 | 默认 | 说明 |
|------|------|------|
| `PORT` | `3001` | API + Socket.IO |
| `JWT_SECRET` | 开发密钥 | 生产必须更换 |
| `CORS_ORIGIN` | `http://localhost:5173` | 前端来源 |
| `DATABASE_URL` | `file:./dev.db` | SQLite 路径 |

## 规则与引擎

- **规则校验**：服务端与客户端均使用 [xiangqi.js](https://github.com/lengyanyu258/xiangqi.js)（蹩马腿、象眼、炮架、过河兵、飞将等）。
- **AI**：Worker 协议已就绪；将官方 Pikafish wasm 放入 `client/public/engine/` 后替换 mock（见 `ARCHITECTURE.md` §5）。
- **计时**：闪电 3+0 / 快棋 5+5 / 慢棋 15+10（`shared/src/types.ts`）。
- **和棋**：双方同意、60 回合无吃子（120 half-move）、三次重复局面（服务端 `gameManager` 跟踪）。

## REST API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| GET | `/api/leaderboard` | 排行榜 |
| GET | `/api/games/history` | 对局历史（需 Bearer token） |
| GET | `/health` | 健康检查 |

## 部署

1. `pnpm build`
2. 静态资源：`client/dist`
3. Node 服务：`server/dist`，配置反向代理 `/api` 与 `/socket.io`
4. 生产数据库建议 PostgreSQL，修改 `schema.prisma` datasource

## 架构详情

完整 Socket 协议、Elo 选型、Pikafish 通信格式与风险对策见 [ARCHITECTURE.md](./ARCHITECTURE.md)。
