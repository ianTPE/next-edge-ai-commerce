# Implementation Plan – Next.js Edge AI Commerce MVP

> **生成日期**：2024-12-14  
> **依據文件**：`docs/01-PRD.md` ~ `docs/21-D1-NEON-STRATEGY.md`  
> **目標**：提供建議的檔案結構、每個模組對應的 Spec ID，以及開發順序

---

## 1. Spec 文件總覽

| Spec ID | 文件名稱         | 主要內容                                    |
| ------- | ---------------- | ------------------------------------------- |
| 01      | PRD              | 產品需求、使用者角色、架構原則、AI 介面設計 |
| 02      | USER-FLOW        | Shopper / Admin 操作流程                    |
| 03      | IA               | 資訊架構（頁面/區塊/導覽）                  |
| 05      | PAGE-LIST        | 頁面與路由清單                              |
| 06      | ENGINEERING      | 工程架構、技術棧、開發流程                  |
| 07      | FOLDER-STRUCTURE | 目錄結構與檔案定位                          |
| 10      | STATE-MANAGEMENT | 狀態管理策略                                |
| 11      | PAYMENT-FLOW     | 付款與結帳流程（Stripe）                    |
| 13      | DEPLOYMENT       | 部署目標與環境                              |
| 14      | ENVIRONMENT      | 環境變數設定                                |
| 16      | DB-SCHEMA        | 資料庫 Schema（Drizzle）                    |
| 17      | API-ROUTES       | Hono API 路由定義                           |
| 18      | AUTH             | Admin 認證（Better Auth）                   |
| 21      | D1-NEON-STRATEGY | D1 → Neon 遷移策略                          |

---

## 2. 建議的檔案結構

```plaintext
root/
├── apps/
│   ├── storefront/                    # Next.js Storefront (Cloudflare Pages)
│   │   ├── app/
│   │   │   ├── layout.tsx             # Root layout
│   │   │   ├── page.tsx               # Home (/)
│   │   │   ├── products/
│   │   │   │   ├── page.tsx           # Products list (/products)
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx       # Product detail (/products/[slug])
│   │   │   ├── cart/
│   │   │   │   └── page.tsx           # Cart (/cart)
│   │   │   └── checkout/
│   │   │       └── page.tsx           # Checkout (/checkout)
│   │   ├── components/                # UI components
│   │   ├── lib/
│   │   │   ├── api-client.ts          # API client wrapper
│   │   │   ├── cart-store.ts          # Client-side cart state
│   │   │   └── validators.ts          # Zod validators
│   │   └── public/                    # Static assets
│   │
│   ├── api/                           # Hono API (Cloudflare Workers)
│   │   ├── src/
│   │   │   ├── index.ts               # Hono app entry
│   │   │   ├── routes/
│   │   │   │   ├── products.ts        # /api/products/*
│   │   │   │   ├── orders.ts          # /api/orders/*
│   │   │   │   ├── auth.ts            # /api/auth/* (Better Auth)
│   │   │   │   ├── media.ts           # /api/media/* (R2 signed upload)
│   │   │   │   ├── webhooks.ts        # /api/webhook/stripe
│   │   │   │   ├── actions.ts         # /api/actions/* (audit log)
│   │   │   │   └── tools.ts           # /api/tools/* (AI operations)
│   │   │   ├── middlewares/
│   │   │   │   ├── auth.ts            # Session validation
│   │   │   │   └── cors.ts            # CORS handling
│   │   │   └── lib/
│   │   │       ├── db.ts              # D1/Neon adapter
│   │   │       ├── validators.ts      # Zod schemas
│   │   │       └── errors.ts          # Error mapping
│   │   ├── wrangler.toml              # D1/R2 bindings
│   │   └── migrations/                # SQL migrations
│   │
│   └── admin/                         # Vercel: Admin UI + AI Gateway
│       ├── index.html
│       ├── vite.config.ts
│       ├── src/
│       │   ├── main.tsx               # SPA entry
│       │   ├── App.tsx                # Refine root
│       │   ├── pages/
│       │   │   ├── dashboard/         # Dashboard page
│       │   │   ├── products/          # Products CRUD pages
│       │   │   ├── orders/            # Orders pages
│       │   │   ├── reports/           # Reports page
│       │   │   ├── ai/                # AI Copilot page
│       │   │   └── login/             # Login page
│       │   ├── resources/             # Refine resources
│       │   ├── providers/
│       │   │   ├── data-provider.ts   # Points to Hono API
│       │   │   └── auth-provider.ts   # Better Auth client
│       │   ├── components/            # Admin UI components
│       │   └── lib/                   # Admin utilities
│       │
│       └── api/                       # Vercel server routes (AI Gateway)
│           ├── ai/
│           │   ├── chat.ts            # POST /api/ai/chat
│           │   ├── tools.ts           # Tool calling wrapper
│           │   └── confirm.ts         # Confirm pending actions
│           └── health.ts              # Health check
│
├── packages/
│   ├── db/                            # Drizzle schema + migrations (SSOT)
│   │   ├── src/
│   │   │   ├── schema.ts              # Canonical schema
│   │   │   ├── schema.d1.ts           # D1-specific (optional)
│   │   │   └── schema.pg.ts           # Postgres-specific (optional)
│   │   ├── drizzle/                   # Generated migrations
│   │   └── drizzle.config.ts
│   │
│   ├── ui/                            # (Optional) Shared UI components
│   │
│   └── config/                        # Shared tsconfig/eslint/prettier
│
├── docs/                              # Documentation
├── .env.example
├── package.json
├── bun.lockb
└── turbo.json
```

---

## 3. 模組與 Spec 對應表

### 3.1 基礎設施層 (Infrastructure)

| 模組          | 檔案位置                        | 對應 Spec |
| ------------- | ------------------------------- | --------- |
| Monorepo 設定 | `turbo.json`, `package.json`    | 06, 07    |
| 環境變數      | `.env.example`, `wrangler.toml` | 14        |
| 部署設定      | 各 app 的 deploy scripts        | 13        |

### 3.2 資料層 (Data Layer)

| 模組             | 檔案位置                                                    | 對應 Spec |
| ---------------- | ----------------------------------------------------------- | --------- |
| DB Schema (SSOT) | `packages/db/src/schema.ts`                                 | 16, 21    |
| Auth Tables      | `packages/db/src/schema.ts` (auth_user, auth_session)       | 16, 18    |
| Commerce Tables  | `packages/db/src/schema.ts` (products, orders, order_items) | 16        |
| Audit Tables     | `packages/db/src/schema.ts` (action_log, action_changes)    | 16        |
| DB Adapter       | `apps/api/src/lib/db.ts`                                    | 21        |
| Migrations       | `packages/db/drizzle/`                                      | 16, 21    |

### 3.3 API 層 (Hono Workers)

| 模組                 | 檔案位置                           | 對應 Spec |
| -------------------- | ---------------------------------- | --------- |
| Auth Routes          | `apps/api/src/routes/auth.ts`      | 17, 18    |
| Products Routes      | `apps/api/src/routes/products.ts`  | 17        |
| Orders Routes        | `apps/api/src/routes/orders.ts`    | 17        |
| Media Routes         | `apps/api/src/routes/media.ts`     | 17        |
| Stripe Webhook       | `apps/api/src/routes/webhooks.ts`  | 11, 17    |
| Actions/Audit Routes | `apps/api/src/routes/actions.ts`   | 17        |
| AI Tools Routes      | `apps/api/src/routes/tools.ts`     | 17        |
| Auth Middleware      | `apps/api/src/middlewares/auth.ts` | 18        |
| CORS Middleware      | `apps/api/src/middlewares/cors.ts` | 18        |

### 3.4 Storefront (Next.js)

| 模組           | 檔案位置                                       | 對應 Spec  |
| -------------- | ---------------------------------------------- | ---------- |
| Home Page      | `apps/storefront/app/page.tsx`                 | 02, 03, 05 |
| Products List  | `apps/storefront/app/products/page.tsx`        | 02, 03, 05 |
| Product Detail | `apps/storefront/app/products/[slug]/page.tsx` | 02, 03, 05 |
| Cart Page      | `apps/storefront/app/cart/page.tsx`            | 02, 03, 05 |
| Checkout Page  | `apps/storefront/app/checkout/page.tsx`        | 02, 05, 11 |
| API Client     | `apps/storefront/lib/api-client.ts`            | 02, 10     |
| Cart Store     | `apps/storefront/lib/cart-store.ts`            | 10         |

### 3.5 Admin (Vite SPA + Refine)

| 模組               | 檔案位置                                    | 對應 Spec      |
| ------------------ | ------------------------------------------- | -------------- |
| Dashboard          | `apps/admin/src/pages/dashboard/`           | 03, 05         |
| Products CRUD      | `apps/admin/src/pages/products/`            | 02, 03, 05     |
| Orders List/Detail | `apps/admin/src/pages/orders/`              | 03, 05         |
| Reports            | `apps/admin/src/pages/reports/`             | 03, 05         |
| AI Copilot         | `apps/admin/src/pages/ai/`                  | 01, 02, 03, 05 |
| Login              | `apps/admin/src/pages/login/`               | 05, 18         |
| Data Provider      | `apps/admin/src/providers/data-provider.ts` | 10             |
| Auth Provider      | `apps/admin/src/providers/auth-provider.ts` | 18             |

### 3.6 AI Gateway (Vercel)

| 模組           | 檔案位置                       | 對應 Spec  |
| -------------- | ------------------------------ | ---------- |
| Chat Endpoint  | `apps/admin/api/ai/chat.ts`    | 01, 02, 06 |
| Tool Calling   | `apps/admin/api/ai/tools.ts`   | 01, 06     |
| Action Confirm | `apps/admin/api/ai/confirm.ts` | 01, 02     |

---

## 4. 開發順序（建議）

### Phase 0: 專案初始化

**預估時間**: 1-2 天

| 順序 | 任務                                         | 對應 Spec | 依賴 |
| ---- | -------------------------------------------- | --------- | ---- |
| 0.1  | 建立 Monorepo 結構 (Turborepo + Bun)         | 06, 07    | -    |
| 0.2  | 設定共用 config (tsconfig, eslint, prettier) | 06, 07    | 0.1  |
| 0.3  | 建立 `.env.example` 與環境變數文件           | 14        | 0.1  |
| 0.4  | 設定 Cloudflare D1 + R2 bindings             | 14, 21    | 0.1  |

---

### Phase 1: 資料層

**預估時間**: 2-3 天

| 順序 | 任務                                            | 對應 Spec | 依賴    |
| ---- | ----------------------------------------------- | --------- | ------- |
| 1.1  | 建立 `packages/db` 與 Drizzle 設定              | 16, 21    | Phase 0 |
| 1.2  | 定義 Auth Tables (auth_user, auth_session)      | 16, 18    | 1.1     |
| 1.3  | 定義 Commerce Tables (products, product_images) | 16        | 1.1     |
| 1.4  | 定義 Orders Tables (orders, order_items)        | 16        | 1.1     |
| 1.5  | 定義 Audit Tables (action_log, action_changes)  | 16        | 1.1     |
| 1.6  | 建立 DB Adapter (D1/Neon 切換)                  | 21        | 1.1     |
| 1.7  | 執行初始 Migration                              | 16, 21    | 1.2-1.5 |

---

### Phase 2: API 核心

**預估時間**: 4-5 天

| 順序 | 任務                                      | 對應 Spec | 依賴     |
| ---- | ----------------------------------------- | --------- | -------- |
| 2.1  | 建立 Hono app 骨架 (`apps/api`)           | 06, 07    | Phase 1  |
| 2.2  | 實作 CORS Middleware                      | 18        | 2.1      |
| 2.3  | 實作 Better Auth 整合 (`/api/auth/*`)     | 17, 18    | 2.1      |
| 2.4  | 實作 Auth Middleware (session validation) | 18        | 2.3      |
| 2.5  | 實作 Products Public Routes (GET)         | 17        | 2.1      |
| 2.6  | 實作 Products Admin Routes (CRUD)         | 17        | 2.4      |
| 2.7  | 實作 Cart Validation Route                | 17        | 2.5      |
| 2.8  | 實作 Media Routes (R2 signed upload)      | 17        | 2.4      |
| 2.9  | 實作 Orders Routes                        | 17        | 2.4      |
| 2.10 | 實作 Stripe Webhook                       | 11, 17    | 2.9      |
| 2.11 | 實作 Actions/Audit Routes                 | 17        | 2.4      |
| 2.12 | 實作 AI Tools Routes (optional)           | 17        | 2.4, 2.6 |

---

### Phase 3: Storefront

**預估時間**: 3-4 天

| 順序 | 任務                                      | 對應 Spec  | 依賴     |
| ---- | ----------------------------------------- | ---------- | -------- |
| 3.1  | 建立 Next.js app 骨架 (`apps/storefront`) | 06, 07     | Phase 2  |
| 3.2  | 實作 API Client                           | 02, 10     | 3.1      |
| 3.3  | 實作 Cart Store (client-side)             | 10         | 3.1      |
| 3.4  | 實作 Home Page                            | 02, 03, 05 | 3.2      |
| 3.5  | 實作 Products List Page                   | 02, 03, 05 | 3.2      |
| 3.6  | 實作 Product Detail Page                  | 02, 03, 05 | 3.2, 3.3 |
| 3.7  | 實作 Cart Page                            | 02, 03, 05 | 3.3      |
| 3.8  | 實作 Checkout Page (Stripe integration)   | 02, 05, 11 | 3.3, 3.2 |

---

### Phase 4: Admin UI

**預估時間**: 4-5 天

| 順序 | 任務                                       | 對應 Spec  | 依賴    |
| ---- | ------------------------------------------ | ---------- | ------- |
| 4.1  | 建立 Vite + Refine app 骨架 (`apps/admin`) | 06, 07     | Phase 2 |
| 4.2  | 實作 Auth Provider (Better Auth client)    | 18         | 4.1     |
| 4.3  | 實作 Data Provider (指向 Hono API)         | 10         | 4.1     |
| 4.4  | 實作 Login Page                            | 05, 18     | 4.2     |
| 4.5  | 實作 Dashboard Page                        | 03, 05     | 4.3     |
| 4.6  | 實作 Products List/Edit Pages              | 02, 03, 05 | 4.3     |
| 4.7  | 實作 Image Upload (R2)                     | 02         | 4.6     |
| 4.8  | 實作 Orders List/Detail Pages              | 03, 05     | 4.3     |
| 4.9  | 實作 Reports Page                          | 03, 05     | 4.3     |

---

### Phase 5: AI Gateway

**預估時間**: 3-4 天

| 順序 | 任務                                                | 對應 Spec  | 依賴    |
| ---- | --------------------------------------------------- | ---------- | ------- |
| 5.1  | 設定 Vercel AI SDK                                  | 06         | Phase 4 |
| 5.2  | 實作 Chat Endpoint (`/api/ai/chat`)                 | 01, 02, 06 | 5.1     |
| 5.3  | 定義 AI Tools (query inventory, update price, etc.) | 01         | 5.2     |
| 5.4  | 實作 Tool Calling → Hono API 整合                   | 01, 06     | 5.3     |
| 5.5  | 實作 Confirm Endpoint (擬議變更確認)                | 01, 02     | 5.4     |
| 5.6  | 實作 AI Copilot UI (Chat interface)                 | 01, 03, 05 | 5.2     |
| 5.7  | 整合 Audit Log (action_log 寫入)                    | 16         | 5.4     |

---

### Phase 6: 部署與整合測試

**預估時間**: 2-3 天

| 順序 | 任務                                | 對應 Spec | 依賴       |
| ---- | ----------------------------------- | --------- | ---------- |
| 6.1  | 部署 API 到 Cloudflare Workers      | 13        | Phase 2    |
| 6.2  | 部署 Storefront 到 Cloudflare Pages | 13        | Phase 3    |
| 6.3  | 部署 Admin + AI Gateway 到 Vercel   | 13        | Phase 4, 5 |
| 6.4  | 設定 Production 環境變數            | 14        | 6.1-6.3    |
| 6.5  | 設定 Stripe Webhook (Production)    | 11        | 6.1        |
| 6.6  | End-to-end 測試                     | 02        | 6.1-6.5    |

---

## 5. 關鍵依賴關係圖

```
┌─────────────────────────────────────────────────────────────────┐
│                        Phase 0: 專案初始化                        │
│  (Monorepo, Config, Env)                                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Phase 1: 資料層                           │
│  (packages/db, Schema, Migrations)                              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Phase 2: API 核心                         │
│  (apps/api, Auth, Products, Orders, Stripe Webhook)             │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
│  Phase 3:         │ │  Phase 4:         │ │  Phase 5:         │
│  Storefront       │ │  Admin UI         │ │  AI Gateway       │
│  (Next.js)        │ │  (Vite + Refine)  │ │  (Vercel AI SDK)  │
└───────────────────┘ └───────────────────┘ └───────────────────┘
                │               │               │
                └───────────────┼───────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Phase 6: 部署與整合測試                       │
│  (Cloudflare Pages/Workers, Vercel, Stripe Production)          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. 技術棧總覽

| 類別              | 技術選擇                      | 對應 Spec |
| ----------------- | ----------------------------- | --------- |
| **Runtime**       | Bun >= 1.x                    | 06        |
| **Monorepo**      | Turborepo                     | 06        |
| **Storefront**    | Next.js (SSG + ISR)           | 06        |
| **Admin UI**      | Vite SPA + Refine             | 06        |
| **API**           | Hono on Cloudflare Workers    | 06        |
| **DB (MVP)**      | Cloudflare D1 (SQLite)        | 16, 21    |
| **DB (Phase 2)**  | Neon (Postgres)               | 16, 21    |
| **ORM**           | Drizzle                       | 06, 16    |
| **Auth**          | Better Auth (HttpOnly Cookie) | 18        |
| **Media Storage** | Cloudflare R2                 | 06        |
| **Payment**       | Stripe Checkout               | 11        |
| **AI**            | Vercel AI SDK                 | 06        |

---

## 7. MVP 邊界提醒

### 包含 (MVP)

- Shopper 完整購物流程（瀏覽 → 購物車 → 結帳）
- Admin Web UI (Refine CRUD)
- Admin AI Chat (Web-based)
- D1 作為唯一 DB
- 單一 Admin 角色

### 不包含 (Phase 2)

- Shopper 會員系統 / 登入
- Telegram / Slack Bot
- Neon (Postgres) 遷移
- 多租戶 / 複雜 RBAC
- 進階自動化工作流 (Agents)

---

## 8. 重構檢查清單

- [ ] 所有寫入操作是否都經由 `apps/api`？
- [ ] Storefront / Admin 是否只透過 API 取得資料？
- [ ] AI Gateway 是否只呼叫 API，不直接操作 DB？
- [ ] 所有 Admin routes 是否都有 auth middleware 保護？
- [ ] 金額是否統一使用 cents (integer)？
- [ ] 時間是否統一使用 epoch ms？
- [ ] 是否所有重要操作都有 audit log？
