# 06-ENGINEERING – Engineering Architecture

> **Purpose**：本文件描述 repo 結構、開發流程、部署方式與關鍵工程決策（工程落地用）。  
> **Out of scope**：產品需求與商業邏輯請見 `01-PRD.md`。

## 0. TL;DR

- **Monorepo**：Turborepo（Bun）
    
- **Apps**：Storefront（Next.js）/ Admin（Vite SPA + AI Gateway）/ API（Hono Workers）
    
- **DB**：Drizzle（SSOT schema）+ D1（MVP）→ Neon（Phase 2）
    
- **Media**：R2（Signed upload）
    
- **AI**：Vercel AI SDK（Tool calling → API）
    

---

## 1. Stack & Ownership

### 1.1 Tech Stack

- **Runtime / PM**：Bun `>= 1.x`
    
- **Monorepo**：Turborepo
    
- **Storefront**：Next.js (SSG + ISR)

- **Admin + AI Platform**: Vercel (same repo)
    - **Admin UI**: Vite SPA (`apps/admin`) — static build
    - **AI Gateway**: Vercel AI SDK (`apps/admin/api/*`) — server routes
    - **Role**:
        - Web Admin screens (fallback / visualization)
        - Web Chat interface (primary admin entry in Phase 1)
        - Tool calling orchestration (calls Hono API for read/write)

- **Admin UI Framework**: Refine
    - Used for rapid CRUD scaffolding and data-driven admin screens
    
- **API**：Hono on Cloudflare Workers
    
- **DB**：Drizzle ORM + Cloudflare D1 (SQLite) → Neon (Postgres)
    
- **Media**：Cloudflare R2

    

### 1.2 Source of Truth

- **DB Schema SSOT**：`packages/db/src/schema.ts`
    
- **API Contract SSOT**：`apps/api/src/routes/**`（或 OpenAPI：`apps/api/openapi.*` if used）
    
- **Env Keys SSOT**：`/docs/env.md`（建議你加這份）
    

### 1.3 Admin UI Implementation Notes

- **Admin Web UI** is implemented as a Vite SPA.
- **Refine** is used to:
    - Scaffold CRUD pages (products, orders)
    - Integrate with REST API resources
    - Reduce custom admin UI boilerplate
- **Refine** is not required for:
    - AI Chat interface
    - Business logic or data validation

---

## 2. Repository Layout (Monorepo)

```plaintext
root/
├── apps/
│   ├── storefront/          # Next.js Storefront
│   ├── api/                 # Hono API (Cloudflare Workers)
│   └── admin/               # Vite SPA Admin + AI Gateway (Vercel)
├── packages/
│   ├── db/                  # Drizzle schema + migrations (SSOT)
│   ├── ui/                  # (Optional) shared UI components
│   └── config/              # tsconfig/eslint/prettier shared
├── turbo.json
├── package.json
└── bun.lockb
```

> **Convention**
> 
> - `apps/*`：可部署單元
>     
> - `packages/*`：可重用模組（不可直接部署）
>     

---

## 3. Local Development

### 3.1 Prerequisites

- Bun installed
    
- Cloudflare account + `wrangler` authenticated（for D1/Workers）
    
- (Optional) Vercel CLI authenticated（for AI routes local parity）
    

### 3.2 Install

```bash
bun install
```

### 3.3 Environment Variables

- Create `.env` at repo root (or per-app `.env.local`)
    
- Minimum required:
    

```bash
# Database
DATABASE_URL=...
D1_DATABASE_ID=...            # if needed by wrangler
D1_DATABASE_NAME=...

# R2
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=...
R2_PUBLIC_BASE_URL=...

# Auth (Admin)
AUTH_SECRET=...
AUTH_COOKIE_NAME=...

# Stripe
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...

# AI (Vercel)
OPENAI_API_KEY=...            # or provider key
AI_PROXY_SECRET=...           # optional: protect AI route
```

> 建議：把完整 env 清單整理到 `/docs/env.md`，並標註「必填 / 選填 / 僅 prod」。

### 3.4 Run (All / Filtered)

```bash
# Run all (turbo pipeline)
bun run dev

# Run only one app
bun run dev --filter=storefront
bun run dev --filter=admin
bun run dev --filter=api
```

### 3.5 Ports (Example)

- Storefront: `http://localhost:3000`
    
- Admin: `http://localhost:5173`
    
- API: `http://localhost:8787`
    
- AI Gateway: `http://localhost:3001` (if separated)
    

---

## 4. Data Layer (Drizzle + D1/Neon)

### 4.1 Schema & Migrations

- Schema: `packages/db/src/schema.ts`
    
- Migrations: `packages/db/drizzle/**` (or your drizzle config path)
    

### 4.2 Commands

```bash
# Generate migrations
bun run --filter db generate

# Apply migrations (D1/Neon)
bun run --filter db push

# (Optional) Drizzle Studio
bun run --filter db studio
```

### 4.3 Environments

- **MVP**：D1 (SQLite)
    
- **Phase 2**：Neon (Postgres)
    
- Migration policy:
    
    - Keep schema compatible (avoid SQLite-only quirks)
        
    - Prefer additive changes in MVP
        

---

## 5. API Architecture (Hono)

### 5.1 Responsibilities

- Single write entrypoint for:
    
    - Storefront
        
    - Web Admin
        
    - AI Tools
        
    - (Phase 2) Telegram / Slack
        

### 5.2 Route Groups (Example)

```plaintext
/apps/api/src/routes
├── products.ts        # /api/products/*
├── orders.ts          # /api/orders/*
├── auth.ts            # /api/auth/*
├── media.ts           # /api/media/* (signed upload)
└── ai-tools.ts        # /api/ai/tools/* (optional)
```

### 5.3 Auth Model (Admin)

- Better Auth (HttpOnly cookie)
    
- All privileged routes under `/api/admin/*` or auth middleware guarded.
    

---

## 6. AI Architecture (Vercel)

> **Concept**：AI 是「操作介面與協調層」，不是單一 analyze endpoint。

### 6.1 AI Gateway Responsibilities

- Chat request handling (Web chat UI / future messaging channels)
    
- Tool calling / action execution
    
- Enforce safety + confirmation rules for write operations
    
- Write audit logs (optional)
    

> **Important**: AI Gateway performs no direct DB writes. All state-changing operations go through Hono API (single source of truth).

### 6.2 Suggested Endpoints (Phase-aligned)

**Phase 1 (MVP)**

- `POST /api/ai/chat` – Web chat interface entry
    
- `POST /api/ai/tools/:name` – tool execution wrapper (optional)
    
- `POST /api/ai/confirm` – confirm a pending write action (optional)
    
- `POST /api/ai/events` – store tool traces / logs (optional)
    

**Phase 2**

- Telegram webhook → same AI gateway
    
- Slack events → same AI gateway
    

### 6.3 Tool Calling Pattern (Recommended)

- Tools do **not** write DB directly.
    
- Tools call **Hono API** (single source of truth).
    
- Every write requires:
    
    - `action_summary`
        
    - `diff` (before/after) when possible
        
    - `requires_confirmation: true|false`
        

---

## 7. Media Upload (R2)

### 7.1 Flow

1. Admin requests signed URL from API (Worker)
    
2. Client uploads directly to R2
    
3. API stores image metadata / public URL in DB
    

### 7.2 Endpoints (Example)

- `POST /api/media/signed-upload`
    
- `POST /api/media/commit`
    

---

## 8. Deployment

### 8.1 Targets

|Component|Deploy Target|Notes|
|---|---|---|
|Storefront|Cloudflare Pages|SSG + ISR|
|Admin UI + AI Gateway|**Vercel**|One project, static SPA + server routes|
|API|Cloudflare Workers|Hono|
|DB|Cloudflare D1|MVP|
|Images|Cloudflare R2|Signed upload|

### 8.2 Commands (Reference)

```bash
# Storefront (Cloudflare Pages)
npx @cloudflare/next-on-pages@1

# API (Workers)
wrangler deploy

# Admin (Vercel)
vite build

# AI Gateway (Vercel)
vercel deploy
```

> 建議：每個 app 都在 `package.json` 提供 `deploy` script，讓 CI 一致。

---

## 9. Key Engineering Decisions (with rationale)

- **Bun + Turborepo**：快、依賴/腳本統一、適合 monorepo。
    
- **Admin = Vite SPA**：靜態部署成本低、與 Storefront 解耦、開發迭代快。
    
- **API = Hono on Workers**：Edge latency、成本可控、與 D1/R2 整合順。
    
- **AI on Vercel**：AI SDK 生態完整、tool calling/streaming 方便、迭代快。
    
- **DB MVP = D1 → Phase2 = Neon**：MVP 先快；成長後用 Postgres 解鎖更多能力。
    

---

## 10. Phase Notes

### Phase 1 (MVP)

- Web Admin + Web Chat Interface
    
- Tool calling 覆蓋核心操作（price/inventory/report）
    
- D1 + R2 + Stripe webhook
    

### Phase 2

- Telegram bot / Slack app 接入 AI Gateway
    
- LangChain/Agent workflow
    
- Neon migration

---

## 11. Component Boundaries Checklist（Refactor 用）

> 本節聚焦「工程層級邊界」：誰可以依賴誰、哪些地方不能互相耦合。重構時優先維護這些邊界，再談微調實作。

### 11.1 Monorepo 依賴方向

- `packages/*`：
  - 可以被任何 `apps/*` 引用。
  - **不得** 反向引用 `apps/*`。
  - 適合放：DB schema、shared UI、config、共用 types/utilities。

- `apps/*`：
  - 只可引用 `packages/*` 與當前 app 內部程式碼。
  - **不得** 互相直接 import 其他 app 內部檔案（例如 `apps/storefront` 不可 import `apps/admin/src/**`）。

### 11.2 App 職責邊界

- `apps/storefront`（Next.js）
  - **只做**：前台頁面、購物流程相關 UI、呼叫 Public API。
  - **禁止**：
    - 實作 Admin 行為（例如改價、補貨）。
    - 直接連線 DB 或 Stripe（除非為了 client SDK 需求，且依然透過 API 完成關鍵邏輯）。

- `apps/admin`（Vite SPA + AI Gateway）
  - **只做**：
    - Admin UI（Refine 資源、頁面、表單）。
    - AI Chat UI + Vercel AI routes。
  - **禁止**：
    - 自行實作資料層（所有資料讀寫必須走 `apps/api`）。
    - 在 AI route 內直接操作 DB（只能呼叫 API）。

- `apps/api`（Hono Workers）
  - **只做**：
    - 驗證（Auth middleware）、權限控制。
    - 商業邏輯 / 寫入規則 / audit log。
    - 封裝所有 DB 存取邏輯。
  - **禁止**：
    - 顯示 UI（僅回 JSON）。
    - 存取 Vercel 專屬 env（保持與部署平台無關）。

### 11.3 DB 與 Adapter 邊界

- **唯一 DB 入口**：`apps/api/src/lib/db.ts`（或等價封裝）。
- Route handlers 不應各自 new DB client；應透過共用 helper 取得 `db`。
- D1 / Neon 差異應封裝在：
  - schema 層（`schema.d1.ts` / `schema.pg.ts`，如有需要）。
  - adapter 層（時間 / money / JSON 映射）。
- 任何地方如果開始在 route 內寫 provider-specific SQL（例如只支援 Postgres 的語法），要先檢查是否破壞 D1 相容性。

### 11.4 AI Gateway 邊界

- AI routes：
  - 只處理：prompt、tool calling、結果整合。
  - 不處理：最終寫入邏輯（交給 Hono API 決定）。
- 每一個「寫入型 Tool」都應該對應到：
  - 一個清楚的 API endpoint（例如 `/api/tools/update-price` 或 `/api/products/:id`）。
  - 一筆或多筆 audit log（`action_log` / `action_changes`）。

### 11.5 重構時檢查項目

-  是否有 app 直接依賴另一個 app？→ 應改為透過 API 或 `packages/*`。
-  是否有「邊寫邊查」的 SQL 散落在 route 以外地方？→ 應集中到 DB adapter / repository 層。
-  是否有 AI route 直接操作 DB？→ 一律改成呼叫 Hono API。
-  是否有共用 types 定義在 app 內部而非 `packages/*`？→ 考慮抽出。
    
