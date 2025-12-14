# 14-ENVIRONMENT – Environment Variables & Config

> **Purpose**：統一列出各 app / 環境需要的環境變數與設定，標明「必填 / 選填 / 僅 prod」，避免重構後出現隱性依賴。  
> **Related**：部署流程見 `13-DEPLOYMENT.md`，工程架構見 `06-ENGINEERING.md`。

---

## 0. Legend

- **Req**：是否必須。
  - `R` = Required（缺少即無法正常運作）
  - `O` = Optional（缺少只影響部分功能）
  - `P` = Prod-only（開發可不設）
- **Scope**：
  - `storefront` / `admin` / `api` / `shared`

---

## 1. Shared Variables

|Name|Req|Scope|Description|
|---|---|---|---|
|`API_URL`|R|storefront, admin|指向 API base URL（Workers）|
|`NODE_ENV`|R|all|環境模式（development / production）|

---

## 2. Database & Storage

|Name|Req|Scope|Description|
|---|---|---|---|
|`D1_DATABASE_ID`|R (MVP)|api|Cloudflare D1 DB ID|
|`D1_DATABASE_NAME`|R (MVP)|api|Cloudflare D1 DB 名稱|
|`DATABASE_URL`|R (Phase 2)|api|Neon Postgres 連線字串|
|`DB_PROVIDER`|O|api|`d1` / `neon`（若不設則可用偵測策略）|
|`R2_ACCOUNT_ID`|R|api|Cloudflare R2 帳號 ID|
|`R2_ACCESS_KEY_ID`|R|api|R2 Access Key|
|`R2_SECRET_ACCESS_KEY`|R|api|R2 Secret Key|
|`R2_BUCKET`|R|api|R2 bucket 名稱|
|`R2_PUBLIC_BASE_URL`|R|api|R2 公開檔案 base URL|

---

## 3. Auth & Security

|Name|Req|Scope|Description|
|---|---|---|---|
|`BETTER_AUTH_SECRET`|R|api|Better Auth 使用的 secret|
|`BETTER_AUTH_URL`|R|api|Auth host base URL（API 公開 URL）|
|`AUTH_COOKIE_NAME`|R|api|Admin session cookie 名稱|
|`ADMIN_ORIGIN`|R|api|Admin SPA URL，用於 CORS 設定|
|`INTERNAL_API_SECRET`|O|api, admin|AI Gateway → API 內部呼叫時的 shared secret（Option B）|

---

## 4. Stripe & Payments

|Name|Req|Scope|Description|
|---|---|---|---|
|`STRIPE_SECRET_KEY`|R|api|Stripe API Key（secret）|
|`STRIPE_WEBHOOK_SECRET`|R|api|Webhook 簽名 secret|

---

## 5. AI / LLM Providers

|Name|Req|Scope|Description|
|---|---|---|---|
|`OPENAI_API_KEY` (or other provider key)|R|admin|AI Gateway 使用的 LLM Key|
|`AI_PROXY_SECRET`|O|admin|若使用 AI Proxy，保護 AI route 的 secret|

---

## 6. Example `.env` Snippet（Reference）

```bash
# Shared
API_URL="https://your-worker.workers.dev"

# Auth
BETTER_AUTH_SECRET="..."
BETTER_AUTH_URL="https://your-worker.workers.dev"
AUTH_COOKIE_NAME="admin_session"
ADMIN_ORIGIN="https://admin.example.com"

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# DB / Storage
D1_DATABASE_ID="..."
D1_DATABASE_NAME="..."
DATABASE_URL="postgres://..."   # Phase 2
DB_PROVIDER="d1"                # or neon
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET="..."
R2_PUBLIC_BASE_URL="https://r2.example.com"

# AI
OPENAI_API_KEY="sk-..."
AI_PROXY_SECRET="..."
```

---

## 7. Environment Boundary Checklist（Refactor 用）

-  是否有密鑰被硬編碼在 repo 內？（應全部改為 env）
-  Storefront / Admin 是否僅透過 `API_URL` 指向 API，而不是寫死 URL？
-  API 是否只透過 `DB_PROVIDER` / `DATABASE_URL` 切換 DB，而不需要修改程式碼？
-  若新增服務或 provider（例如新的 AI vendor），是否：
   - 把必要設定整理到此文件
   - 明確標註其適用範圍與是否必填？

