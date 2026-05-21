# 3D 多人在线中国象棋 — 架构说明

> 本文档对应 `prompt.md` 交付要求 1–6，并作为后续迭代的蓝图。

## 1. 模块拆解

| 模块 | 职责 | 目录 |
|------|------|------|
| **3D 渲染** | Three.js 棋盘网格、PBR 木纹、棋子风格、摄像机预设、走子高亮 | `client/src/scenes/` |
| **规则引擎** | FEN 解析、合法着法、将军/终局判定（xiangqi.js 封装） | `client/src/lib/fen.ts`, `client/src/engine/xiangqiLocal.ts`, `server/src/game/xiangqiEngine.ts` |
| **网络层** | REST 鉴权、Socket.IO 房间/匹配/走子同步、观战广播 | `server/src/socket/`, `client/src/hooks/useSocket.ts`, `shared/src/socket-events.ts` |
| **AI** | Pikafish.wasm + Web Worker UCI 桥接，1–20 档 depth | `client/src/engine/pikafish.worker.ts`, `client/public/engine/` |
| **持久化** | SQLite + Prisma：用户、对局历史、聊天、好友 | `server/prisma/`, `server/src/db/` |

数据流：

```
点击棋子 → 本地合法着法高亮 → Socket game:move → 服务端 xiangqiEngine 校验
    → 广播 game:move_applied → 客户端更新 FEN → 3D 棋子位置/动画
```

## 2. Socket.IO 事件协议表

| 事件名 | 方向 | 负载 | 说明 |
|--------|------|------|------|
| `matchmaking:join` | C→S | `{ timeControl, eloRange? }` | 进入 Elo 匹配队列 |
| `matchmaking:leave` | C→S | — | 离开队列 |
| `matchmaking:queued` | S→C | `{ position, estimatedMs }` | 排队位置 |
| `matchmaking:matched` | S→C | `{ game, side }` | 匹配成功 |
| `room:create` | C→S | `{ timeControl }` | 创建房间，ack `RoomInfo` |
| `room:join` | C→S | `{ code }` | 加入房间 |
| `room:leave` | C→S | — | 离开房间 |
| `room:updated` | S→C | `RoomInfo` | 房间状态变更 |
| `game:move` | C→S | `{ gameId, move }` | 提交 ICCS 着法，ack `{ ok, snapshot?, error? }` |
| `game:resign` | C→S | `{ gameId }` | 认输 |
| `game:offer_draw` | C→S | `{ gameId }` | 提和 |
| `game:respond_draw` | C→S | `{ gameId, accept }` | 回应和棋 |
| `game:sync` | C→S | `{ gameId }` | 拉取完整局面 |
| `game:state` | S→C | `GameSnapshot` | 局面推送 |
| `game:move_applied` | S→C | `{ gameId, move, snapshot }` | 走子广播 |
| `game:ended` | S→C | `{ gameId, result, reason }` | 终局 |
| `spectate:list` | C→S | ack `GameSnapshot[]` | 可观战列表 |
| `spectate:join` | C→S | `{ gameId }` | 进入观战 |
| `spectate:leave` | C→S | `{ gameId }` | 退出观战 |
| `spectate:update` | S→C | `GameSnapshot` | 观战同步 |
| `chat:send` | C→S | `{ roomId, text }` | 聊天 |
| `chat:message` | S→C | `{ roomId, user, text, at }` | 聊天广播 |
| `ai:start` | C→S | `{ depth, timeControl, side }` | 启动 AI 局 |
| `ai:move` | C→S | `{ gameId }` | 请求 AI 应手（待接 Worker） |
| `replay:load` | C→S | `{ id }` | 加载复盘 |
| `replay:import` | C→S | `{ pgn }` | 导入棋谱 |
| `leaderboard:update` | S→C | `PublicUser[]` | 排行榜 |
| `error` | S→C | `{ code, message }` | 错误 |

类型定义见 `shared/src/socket-events.ts`。

## 3. 目录结构

```
21-3d-china-chess/
├── client/                     # Vite + React + R3F
│   ├── public/engine/            # Pikafish.wasm 放置目录
│   └── src/
│       ├── scenes/               # 3D 棋盘与场景
│       ├── engine/               # 本地规则 + Pikafish Worker
│       ├── hooks/                # Socket 封装
│       ├── store/                # Zustand 状态
│       └── components/           # UI（shadcn 风格）
├── server/
│   ├── prisma/schema.prisma
│   └── src/
│       ├── auth/                 # JWT
│       ├── game/                 # 对局内存态 + xiangqi 引擎
│       ├── matchmaking/          # Elo 队列
│       └── socket/               # Socket.IO 处理器
├── shared/                       # 共享类型、Elo、棋盘坐标
├── ARCHITECTURE.md
└── README.md
```

## 4. Elo 算法选型

采用 **标准 Elo 评分系统**（国际象棋通用，适用于中国象棋在线积分）：

- 预期得分：`E = 1 / (1 + 10^((Rb-Ra)/400))`
- 赛后更新：`R' = R + K * (S - E)`，其中 `S ∈ {1, 0.5, 0}`
- **K 因子**：Elo < 2100 用 **K=32**，否则 **K=16**
- **匹配窗口**：初始 ±200，每等待 5 秒扩大 50 分

实现见 `shared/src/elo.ts`。

## 5. Pikafish.wasm 启动与通信方案

### 5.1 文件布局

```
client/public/engine/
├── pikafish.wasm      # 官方构建产物（需自行放置）
└── pikafish.js        # 可选 Emscripten 胶水
```

### 5.2 Web Worker 消息协议

**主线程 → Worker**

| type | 字段 | 说明 |
|------|------|------|
| `init` | — | 加载 wasm，发送 `uci` / `isready` |
| `position` | `fen`, `moves?` | 对应 UCI `position fen ... moves ...` |
| `go` | `depth` | 搜索深度 1–20 |
| `stop` | — | 中止搜索 |
| `quit` | — | 释放引擎 |

**Worker → 主线程**

| type | 字段 | 说明 |
|------|------|------|
| `ready` | — | 引擎就绪 |
| `bestmove` | `move`, `depth`, `fallback?` | 最佳 ICCS 着法 |
| `error` | `message` | 错误信息 |

客户端封装：`client/src/engine/pikafishClient.ts`  
Worker 实现：`client/src/engine/pikafish.worker.ts`（当前为 **mock 回退**，无 wasm 时可联调 UI）

### 5.3 真实集成步骤

1. 将 Pikafish wasm 构建放入 `public/engine/`
2. Worker 内 `fetch('/engine/pikafish.wasm')` + `WebAssembly.instantiate`
3. 实现 UCI 文本协议循环（`uci` → `isready` → `position` → `go depth N` → 解析 `bestmove`）
4. 若需多线程 wasm，部署 COOP/COEP 响应头

## 6. 风险点与对策

| 风险 | 说明 | 对策 |
|------|------|------|
| **3D 性能** | 多观战 + 阴影 + 高 DPR 掉帧 | 视锥裁剪、InstancedMesh 批量棋子、可关闭阴影、移动端降 DPR |
| **网络延迟** | 拖拽走子与服务端校验不一致 | 乐观 UI + 服务端权威 FEN；非法着法回滚 |
| **作弊** | 客户端改 FEN / 引擎辅助 | 所有着法服务端 xiangqi.js 校验；可记录着法耗时异常；高分段强制服务端计时 |
| **长将/长捉** | 规则复杂，库未必全覆盖 | 服务端局面历史 + 着法类型标注；竞赛规则模块增量实现 |
| **wasm 体积** | Pikafish.wasm 较大 | 懒加载 Worker；CDN 缓存；首局再下载 |
| **SQLite 并发** | 多进程写入锁 | 生产换 PostgreSQL；Prisma 迁移即可 |
| **JWT 泄露** | localStorage 存 token | 短期 token + HTTPS；敏感操作二次校验 |

## 7. 后续实现清单

- [ ] 完整拖拽（pointer capture + GSAP 弧线动画）
- [ ] 服务端棋钟与超时判负
- [ ] 长将/长捉检测
- [ ] 复盘 ICCS/中文记谱导入导出 + 引擎评注
- [ ] 好友系统与私聊
- [ ] 真实 Pikafish.wasm 接入
- [ ] 反作弊：着法时间统计、客户端 hash 校验
