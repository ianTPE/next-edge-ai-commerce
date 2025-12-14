# 07-FOLDER-STRUCTURE – Folder Structure

> **Purpose**：提供整體目錄結構與「檔案定位指南」，讓開發者與 AI 能快速找到：UI、API、DB schema、AI routes、部署設定。  
> **Convention**：`apps/*` 為可部署單元，`packages/*` 為可重用模組（不可直接部署）。

---

## 1. Monorepo Tree (High-level)

```plaintext
root/
├── apps/
│   ├── storefront/           # Next.js Storefront (Cloudflare Pages)
│   ├── api/                  # Hono API (Cloudflare Workers)
│   └── admin/                # Vercel project: Admin UI + AI routes
│
├── packages/
│   ├── db/                   # Drizzle schema + migrations (SSOT)
│   ├── ui/                   # (Optional) shared UI components
│   └── config/               # (Optional) shared tsconfig/eslint/prettier
│
├── docs/                     # Human docs (PRD/Engineering/Runbooks)
├── ai-docs/                  # AI context/specs/prompts (if used)
├── .env.example
├── package.json
├── bun.lockb
└── turbo.json
```

### Key Notes

- **Admin + AI colocated** under `apps/admin/` because they are deployed together on **Vercel** (static SPA + server routes).
    
- All **state-changing actions** (price/stock/product/order) should go through `apps/api/` (single source of truth).
    

---

## 2. Folder Index (Where to find things)

|Want to…|Go to…|
|---|---|
|Build Storefront pages|`apps/storefront/app/**`|
|Admin UI screens (Refine resources)|`apps/admin/src/**`|
|AI chat endpoint / tool routes|`apps/admin/api/**` (or `apps/admin/src/server/**` depending on framework)|
|API routes & middleware|`apps/api/src/routes/**`, `apps/api/src/middlewares/**`|
|DB schema (SSOT)|`packages/db/src/schema.ts`|
|DB migrations|`packages/db/drizzle/**` (or `apps/api/migrations/**` if you keep SQL there)|
|Cloudflare bindings|`apps/api/wrangler.toml`|
|Shared types/utilities|`packages/*`|


---

## 3. `apps/storefront` (Next.js)

```plaintext
apps/storefront/
├── app/
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Home
│   ├── products/
│   │   ├── page.tsx               # Products list
│   │   └── [slug]/
│   │       └── page.tsx           # Product detail
│   ├── cart/
│   │   └── page.tsx               # Cart
│   └── checkout/
│       └── page.tsx               # Checkout
├── components/                    # UI components
├── lib/
│   ├── api-client.ts              # API client wrapper
│   └── validators.ts              # (Optional) shared zod validators
└── public/                        # static assets
```

**Notes**

- Data fetch reads from Hono API (`apps/api`) via `lib/api-client.ts`
    
- Cart state is client-side (e.g. LocalStorage) in MVP
    

---

## 4. `apps/admin` (Vercel: Admin UI + AI Routes)

> **Deploy**：Vercel single project
> 
> - **UI**：Vite SPA + Refine
>     
> - **Server routes**：AI gateway endpoints (Vercel Functions/Edge)
>     

```plaintext
apps/admin/
├── index.html
├── vite.config.ts
├── src/
│   ├── main.tsx                   # SPA entry
│   ├── App.tsx                    # Refine root
│   ├── pages/                     # (Optional) route-level screens
│   ├── resources/                 # Refine resources (Products/Orders/...)
│   ├── providers/
│   │   ├── data-provider.ts       # Points to Hono API (credentials include)
│   │   └── auth-provider.ts       # Better Auth client wrapper
│   ├── components/                # Admin-only UI components
│   └── lib/                       # Admin utilities
│
├── api/                           # Vercel server routes (AI gateway)
│   ├── ai/
│   │   ├── chat.ts                # POST /api/ai/chat  (Phase 1)
│   │   ├── tools.ts               # POST /api/ai/tools (tool calling)
│   │   └── confirm.ts             # POST /api/ai/confirm (optional)
│   └── health.ts                  # GET /api/health
│
└── README.md                      # Admin-specific run notes
```

**Notes (important)**

- AI routes **do not** write DB directly.
    
- AI routes call Hono API endpoints to execute actions.
    
- Phase 2 Telegram/Slack can be added as additional webhooks under `apps/admin/api/integrations/*`.
    

---

## 5. `apps/api` (Hono on Cloudflare Workers)

```plaintext
apps/api/
├── src/
│   ├── index.ts                   # Hono app entry
│   ├── routes/
│   │   ├── products.ts            # /api/products/*
│   │   ├── orders.ts              # /api/orders/*
│   │   ├── auth.ts                # /api/auth/*
│   │   ├── media.ts               # /api/media/* (signed upload)
│   │   └── webhooks.ts            # /api/webhook/stripe
│   ├── middlewares/
│   │   └── auth.ts                # session validation
│   └── lib/
│       ├── db.ts                  # D1/Neon adapter
│       ├── validators.ts          # Zod schemas
│       └── errors.ts              # error mapping
├── wrangler.toml                  # D1/R2 bindings
└── migrations/                    # (If keeping SQL close to workers)
```

---

## 6. `packages/db` (Drizzle SSOT)

```plaintext
packages/db/
├── src/
│   ├── schema.ts                  # canonical schema (SSOT)
│   ├── schema.d1.ts               # (Optional) D1-specific tweaks
│   └── schema.pg.ts               # (Optional) Neon/Postgres tweaks
├── drizzle/                       # generated migrations
└── drizzle.config.ts
```

**Notes**

- Prefer keeping **business tables** in `schema.ts` and only environment-specific overrides in `schema.*.ts`.
    

---

## 7. Related Docs

- Engineering overview: `06-ENGINEERING.md`
    
- (Optional) API reference: `docs/api.md` or `apps/api/openapi.*`
    
- (Optional) Runbooks: `docs/runbooks/**`

---

## 8. Import & Dependency Rules（Refactor 用）

> 此節說明「檔案可以怎麼互相 import」，以避免重構時形成循環依賴或跨層耦合。

### 8.1 Allowed imports（建議）

- `apps/storefront/**`
  - 可以 import：
    - 自身 `apps/storefront` 下面的程式碼。
    - `packages/*`（例如 `packages/ui`, `packages/config`）。
  - 不可以 import：
    - `apps/admin/**`
    - `apps/api/**`

- `apps/admin/**`
  - 可以 import：
    - 自身 `apps/admin` 下面的程式碼。
    - `packages/*`。
  - 不可以 import：
    - `apps/storefront/**`
    - `apps/api/**`

- `apps/api/**`
  - 可以 import：
    - 自身 `apps/api` 下的程式碼。
    - `packages/db`（schema、型別、DAO）。
    - 其他純工具 package（例如 `packages/config`）。
  - 不可以 import：
    - `apps/storefront/**`
    - `apps/admin/**`

- `packages/*`
  - 可以 import：
    - 同一個 `packages` 內較低層的 util（視你如何分層）。
  - 不可以 import：
    - 任何 `apps/*`。

### 8.2 Cross-cutting concerns 放哪裡？

- 共用型別（例如 `Product`, `OrderSummary`）：
  - 建議放在 `packages/db` 或 `packages/shared-types`。
- 共用 UI component：
  - 建議放在 `packages/ui`。
- 共用設定（eslint/tsconfig/prettier）：
  - 建議放在 `packages/config`。

### 8.3 重構時檢查清單

-  是否有從 `apps/*` import 另一個 `apps/*` 的情況？→ 應改為經由 API 或抽到 `packages/*`。
-  是否有在 `packages/*` 內 import 任一 `apps/*`？→ 應拆出新的 util / shared package。
-  是否有邏輯無法判斷「應該屬於哪一層」？→ 先決定它主要服務對象是誰，再決定應放在 app 還是 package。
    
