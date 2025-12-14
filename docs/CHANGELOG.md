# CHANGELOG – AI Docs Changelog

> 用來記錄 ai-docs 目錄內規格檔的重大異動，方便人類與 AI 追蹤版本。

## 2025-12-13

### 重大變更 - Auth 架構轉向（Auth.js → Better Auth on Workers）

- Admin 改為 **純 SPA**（靜態部署），登入 / session 由 `apps/api`（Hono on Workers）整合 **Better Auth** 負責。
- `[Admin Only]` API 端點改以 **HttpOnly cookie session** 驗證（跨網域需 CORS `credentials: true` + client `credentials: "include"`）。
- `VERCEL_SECRET` 僅保留給 Workers ↔ Vercel AI backend 的 server-to-server 驗證（例如 `/api/analyze`）。

### 修改檔案

- `01-PRD.md`
- `02-USER-FLOW.md`
- `03-IA.md`
- `05-PAGE-LIST.md`
- `06-ENGINEERING.md`
- `07-FOLDER-STRUCTURE.md`
- `09-COMPONENT-LIST.md`
- `10-STATE-MANAGEMENT.md`
- `13-DEPLOYMENT.md`
- `14-ENVIRONMENT.md`
- `17-API-ROUTES.md`
- `18-AUTH.md`
- `22-IMAGE-MANAGEMENT.md`
- `assets/flow.mermaid`

## 2025-12-07

### 重大變更 - 架構重構（Astro → Next.js Storefront）

- **Storefront 框架變更**：從 Astro 改為 Next.js，部署在 Cloudflare Pages
- **目錄結構變更**：`apps/web` 改名為 `apps/storefront`
- **Admin 框架增強（歷史）**：加入 Refine 框架，並曾規劃直接搭配 Vercel AI SDK
- **新增 packages/ui**：共用 UI components
- **更新所有相關文件**：移除 Astro 相關描述，改為 Next.js

### 修改檔案

- `01-PRD.md`：更新專案名稱與平台架構描述
- `02-USER-FLOW.md`：更新 Storefront 技術描述
- `03-IA.md`：更新前台技術與資料來源描述
- `05-PAGE-LIST.md`：更新 Storefront 與 Admin 路由結構
- `06-ENGINEERING.md`：更新 Monorepo 結構與技術堆疊
- `07-FOLDER-STRUCTURE.md`：全面更新目錄結構
- `09-COMPONENT-LIST.md`：更新組件清單模板
- `11-PAYMENT-FLOW.md`：更新結帳流程描述
- `13-DEPLOYMENT.md`：更新部署流程
- `14-ENVIRONMENT.md`：更新環境變數描述
- `16-DB-SCHEMA.md`：更新服務存取說明
- `17-API-ROUTES.md`：更新架構說明
- `18-AUTH.md`：更新 Storefront 路徑
- `21-D1-NEON-STRATEGY.md`：更新架構圖
- `TODO.md`：更新待辦事項

---

## 2025-12-06

### 重大變更 - 全 D1 架構（API 代理模式）

- **apps/admin** 和 **apps/storefront** 不再直接連接資料庫
- 所有資料操作統一透過 `apps/api` 的 API endpoints
- 移除 `DATABASE_URL` 環境變數，改用 `API_URL`

### 新增 API Endpoints

- `GET /api/products/all`：取得所有商品（含排序）
- `GET /api/products/search`：搜尋商品
- `GET /api/products/low-stock`：低庫存商品
- `PUT /api/products/:id`：更新商品（by ID）
- `PUT /api/products/by-sku/:sku`：更新商品（by SKU）
- `POST /api/products/validate-cart`：驗證購物車
- `GET /api/orders`：取得所有訂單
- `GET /api/orders/dashboard`：Dashboard 統計
- `GET /api/orders/stats`：銷售統計
- `GET /api/analysis`、`POST /api/analysis`：分析紀錄

### 修改檔案

- `apps/admin/src/app/page.tsx`：改用 API 取得 dashboard 統計
- `apps/admin/src/app/products/page.tsx`：改用 API 取得商品列表
- `apps/admin/src/app/products/actions.ts`：改用 API 更新商品
- `apps/admin/src/app/orders/page.tsx`：改用 API 取得訂單列表
- `apps/admin/src/app/api/ai/chat/route.ts`：AI Copilot 改用 API
- `apps/storefront/app/page.tsx`：改用 API 取得精選商品
- `apps/storefront/app/products/page.tsx`：改用 API 取得商品列表
- `apps/storefront/app/products/[slug]/page.tsx`：改用 API 取得商品詳情
- `apps/storefront/app/api/checkout/route.ts`：改用 API 驗證購物車（舊實作路徑；現行建議直接由 `apps/storefront` client 呼叫 `apps/api`）

---

## 2025-12-05

### 新增 - D1 支援（選項 B 實作）

- `packages/db/src/schema-d1.ts`：D1 SQLite schema（對應 Postgres schema）
- `packages/db/src/d1.ts`：D1 專用匯出
- `apps/api/src/lib/db.ts`：DB adapter 切換機制（D1 / Neon 自動切換）
- `apps/api/migrations/0001_init.sql`：D1 初始化 SQL
- 更新 `apps/api/wrangler.toml`：加入 D1 binding 配置與多客戶環境範例
- 更新 `packages/db/package.json`：加入 `./schema-d1` 和 `./d1` exports
- 更新所有 API routes 使用新的 DB adapter

### 修正

- 更新 `assets/flow.mermaid`：DB 標籤改為 `DB (Phase 1: D1 / Phase 2: Neon)` 以反映雙階段策略
- 更新根目錄 `.env.example`：加入 Phase 1/2 說明與（當時規劃的）Auth 相關變數
- 移除 CHANGELOG 中的錯誤未來日期
- 更新 `21-D1-NEON-STRATEGY.md`：加入實作狀態與詳細架構說明

### 初始建立

- 初始建立 `ai-docs/`：
  - 新增 01–15 規格檔（PRD, User Flow, IA, Engineering, State Management 等）
  - 新增 DB / API / Auth / AI Prompt 摘要檔（16–20，待後續細化）
  - 新增 `21-D1-NEON-STRATEGY.md`：D1 → Neon 遷移策略
