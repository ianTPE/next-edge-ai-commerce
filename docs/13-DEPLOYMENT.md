# 13-DEPLOYMENT – Deployment & Environments

> **Purpose**：定義 Storefront / Admin / API / AI 的部署目標、流程與環境分層，讓重構後仍能一鍵部署。  
> **Related**：環境變數詳見 `14-ENVIRONMENT.md`，工程架構見 `06-ENGINEERING.md`。

---

## 0. Targets Overview

|Component|Deploy Target|Notes|
|---|---|---|
|Storefront (`apps/storefront`)|Cloudflare Pages|Next.js SSG + ISR|
|Admin UI + AI Gateway (`apps/admin`)|Vercel|Vite SPA + Vercel Functions / Edge|
|API (`apps/api`)|Cloudflare Workers|Hono router + D1 / Neon|
|DB|Cloudflare D1 → Neon|Phase 1 / Phase 2|
|Images|Cloudflare R2|Signed upload from Admin|

---

## 1. Environments

- **Local**：開發機，使用本地 D1 / SQLite，Stripe sandbox。
- **Staging**（可選）：對應未來多環境部署。
- **Production**：面向真實使用者 / 客戶。

---

## 2. Local Development

### 2.1 啟動方式

```bash
bun install

# 全部一起跑（建議）
bun run dev

# 個別 app
bun run dev --filter=storefront
bun run dev --filter=admin
bun run dev --filter=api
```

### 2.2 Local URL（示例）

- Storefront：`http://localhost:3000`
- Admin：`http://localhost:5173`
- API：`http://localhost:8787`

---

## 3. Production Deployment Flows

### 3.1 Storefront（Cloudflare Pages）

- Build:
  - 由 Turbo pipeline / CI 執行 Next.js build。
- Deploy:
  - 使用 `next-on-pages`（或 Cloudflare 官方整合）部署。
- Environment:
  - 指向 API 的 `API_URL`（Workers URL）。

### 3.2 Admin + AI Gateway（Vercel）

- Build:
  - Vercel 使用 `pnpm/bun` + `vite build`。
- Deploy:
  - SPA 靜態資源 + `/api/*` Vercel functions（AI Gateway）。
- Environment:
  - `VITE_API_BASE_URL` 指向 Workers base URL。
  - AI provider Key / Proxy config。

### 3.3 API（Cloudflare Workers）

- Deploy:
  - `wrangler deploy`。
- Bindings:
  - D1：在 `wrangler.toml` 定義 `[[d1_databases]]`。
  - R2：`[[r2_buckets]]`。
- Env:
  - Stripe / Auth / internal secret 等。

---

## 4. DB Migration & Promotion

- MVP：
  - 使用 D1 + Drizzle migrations。
- Phase 2：
  - 以 Drizzle schema 產生 Neon migrations。
  - 按 `21-D1-NEON-STRATEGY.md` 進行切換。

---

## 5. CI/CD Hooks（建議）

- Monorepo 使用 Turborepo pipeline：
  - 依 app 分別建置 / 部署。
- 每個 app 在 `package.json` 提供：
  - `dev`：開發用。
  - `build`：產出 build artifacts。
  - `deploy`：CI / 手動部署指令封裝。

---

## 6. Deployment Boundary Checklist（Refactor 用）

-  是否有任何 app 依賴同環境中其他 app 的「內部檔案」，而不是公開 URL / API？
-  Storefront / Admin 是否皆透過環境變數指向 API base URL，而不是寫死？
-  DB provider（D1 / Neon）切換是否只影響 API 層，而不需要改 Storefront / Admin？
-  新增 app 或服務時，是否有：
   - 明確的部署目標
   - 對應環境變數設定
   - 在 CI pipeline 中清楚的 build/deploy 步驟？

