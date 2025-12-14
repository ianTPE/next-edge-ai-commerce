# 17-API-ROUTES – Hono API Routes

> **Service**: `apps/api` (Hono on Cloudflare Workers)  
> **Base Path**: `/api`  
> **SSOT**: `apps/api/src/routes/**`  
> **Principle**: API 是所有寫入操作的唯一入口（Web/AI/Telegram/Slack 都必須走這裡）

---

## 0. Conventions

### Access Levels

- **[Public]**：不需驗證
    
- **[Admin]**：需 Better Auth session cookie（前端需 `credentials: "include"`）
    
- **[Webhook]**：需驗證簽名（Stripe）
    

### Response Envelope（建議統一）

```ts
type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; error: { code: string; message: string; details?: unknown } };
```

### Common Error Codes（建議）

- `UNAUTHORIZED` / `FORBIDDEN`
    
- `VALIDATION_ERROR`
    
- `NOT_FOUND`
    
- `CONFLICT`
    
- `RATE_LIMITED`
    
- `INTERNAL_ERROR`
    

### Data Format Rules

- **Money**：用 `integer`（cents）或 `string decimal` 二選一，建議全專案一致
    
    - ✅ 推薦：`priceCents: number`（避免 decimal/float 問題，跨 D1/Neon 最穩）
        
- **Time**：`integer` epoch ms（與 D1 對齊），或統一 ISO 8601（擇一）
    

> 如果你既有系統已經用 `"123.45"`，模板也 OK；重點是 **全 API 一致**。

---

## 1. Env Bindings (Cloudflare Worker)

```ts
interface Env {
  DB: D1Database;
  R2: R2Bucket;

  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;

  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL?: string;

  // Optional: protect internal calls (AI gateway → API)
  INTERNAL_API_SECRET?: string;
}
```

---

## 2. Auth (Better Auth)

|Method|Path|Access|Description|
|---|---|---|---|
|*|`/api/auth/*`|Public|Better Auth handlers (login/session/logout)|

> Notes
> 
> - Admin routes must verify session via middleware.
>     
> - (Optional) Add `/api/me` to simplify session checking.
>     

---

## 3. Products

### 3.1 Read (Public)

|Method|Path|Access|Description|
|---|---|---|---|
|GET|`/api/products`|Public|List active products (paged)|
|GET|`/api/products/:slug`|Public|Get single product by slug|
|GET|`/api/products/search?q=`|Public|Search products|

**Query Params (example)**

- `/api/products?page=1&pageSize=20&sort=createdAt_desc`
    

**Response (example)**

```json
{ "ok": true, "data": { "items": [], "page": 1, "pageSize": 20, "total": 0 } }
```

### 3.2 Cart Validation (Public)

|Method|Path|Access|Description|
|---|---|---|---|
|POST|`/api/products/validate-cart`|Public|Validate cart items/price/stock|

**Request (example)**

```json
{ "items": [{ "sku": "SKU-001", "quantity": 2 }] }
```

**Response (example)**

```json
{
  "ok": true,
  "data": {
    "isValid": true,
    "items": [{ "sku": "SKU-001", "available": 10, "unitPriceCents": 19900 }]
  }
}
```

### 3.3 Admin CRUD

|Method|Path|Access|Description|
|---|---|---|---|
|GET|`/api/products/all`|Admin|List all products (incl inactive)|
|GET|`/api/products/low-stock?threshold=`|Admin|Low stock alert|
|POST|`/api/products`|Admin|Create product|
|PUT|`/api/products/:id`|Admin|Update product|
|DELETE|`/api/products/:id`|Admin|Soft delete product|

**Write Rules**

- `PUT` must update `updatedAt`
    
- Soft delete recommended: `isActive=false` (or `deletedAt`)
    

---

## 4. Media (R2 Signed Upload)

|Method|Path|Access|Description|
|---|---|---|---|
|POST|`/api/media/signed-upload`|Admin|Create signed upload URL|
|POST|`/api/media/commit`|Admin|Commit uploaded file metadata|

> 如果你暫時仍用 `/api/upload-image`，也可以保留，但建議逐步改為 media 命名，便於擴充。

---

## 5. Sync (Bulk Upsert)

|Method|Path|Access|Description|
|---|---|---|---|
|POST|`/api/sync/products`|Admin|Bulk upsert products from JSON|

**Notes**

- Validate payload (Zod)
    
- Return per-item result (success/failure) for admin UX
    

---

## 6. Orders

### 6.1 Stripe Webhook

|Method|Path|Access|Description|
|---|---|---|---|
|POST|`/api/webhook/stripe`|Webhook|Handle Stripe events (checkout.session.completed, etc.)|

**Security**

- Verify Stripe signature using `STRIPE_WEBHOOK_SECRET`
    

### 6.2 Admin Read / Stats

|Method|Path|Access|Description|
|---|---|---|---|
|GET|`/api/orders`|Admin|List orders|
|GET|`/api/orders/:id`|Admin|Order detail|
|GET|`/api/orders/dashboard`|Admin|Dashboard counts|
|GET|`/api/orders/stats`|Admin|Revenue stats|

---

## 7. AI-related API (Server-side operations logging)

> **Important**：AI Gateway 在 Vercel；Hono API 只負責 **資料與操作**。  
> AI 的 tool calling 最終仍會呼叫這些 API（或直接呼叫對應的 products/orders routes），並在 DB 中留下可追溯紀錄。

### 7.1 Action / Audit Log（推薦取代 analysis_log）

|Method|Path|Access|Description|
|---|---|---|---|
|GET|`/api/actions`|Admin|List action logs|
|GET|`/api/actions/:id`|Admin|Action detail + changes|
|POST|`/api/actions`|Admin|Create action log (optional; usually server-created)|

### 7.2 AI-triggered Operations（可選：如果你想把 AI tools 也在 API 端「具名」）

|Method|Path|Access|Description|
|---|---|---|---|
|POST|`/api/tools/update-price`|Admin|Update price (validated)|
|POST|`/api/tools/restock`|Admin|Restock inventory|
|POST|`/api/tools/generate-report`|Admin|Generate report snapshot|

> 這種 `/api/tools/*` 的好處：
> 
> - 讓 AI tool calling 對應到固定 endpoint（可控、好審核）
>     
> - 避免 AI 直接操作一堆 CRUD endpoint（風險較高）
>     

---

## 8. Phase Alignment

### Phase 1 (MVP)

- Web Admin + Web Chat（AI gateway）會呼叫：
    
    - Products CRUD / validate-cart
        
    - Orders read/stats
        
    - Media signed upload
        
    - Actions log (if enabled)
        

### Phase 2

- Telegram/Slack webhooks（在 Vercel AI gateway）
    
- API 無需變動，只新增必要的工具 endpoint 或權限策略
    

---

## 9. Checklist (keep routes consistent)

-  每個 route group 有對應 `routes/*.ts`
    
-  所有 Admin routes 都有 auth middleware
    
-  金額/時間格式全站一致
    
-  Stripe webhook 驗簽
    
-  AI 操作可追溯（actions + changes）

---

## 10. Client ↔ Route Matrix（Refactor 用）

> 這一節用來明確「誰可以呼叫哪一條 API」。重構時若新增 endpoint，請同步更新此矩陣。

### 10.1 呼叫者角色

- **Shopper**：透過 Storefront（Next.js）前台。
- **Admin UI**：Vite SPA（Refine）。
- **AI Gateway**：Vercel AI routes。
- **Stripe**：第三方金流 Webhook。

### 10.2 Matrix（簡化版）

|Route Group|Example Path|Shopper|Admin UI|AI Gateway|Stripe|
|---|---|---|---|---|---|
|Auth|`/api/auth/*`|✗|✓|✓ (service-context)|✗|
|Products – public|`/api/products`, `/api/products/:slug`, `/api/products/validate-cart`|✓|✓|✓|✗|
|Products – admin|`/api/products/all`, `/api/products/low-stock`, `/api/products/:id` (POST/PUT/DELETE)|✗|✓|✓|✗|
|Media|`/api/media/*`|✗|✓|✓|✗|
|Sync|`/api/sync/products`|✗|✓|✓|✗|
|Orders – admin|`/api/orders*`|✗|✓|✓|✗|
|Stripe webhook|`/api/webhook/stripe`|✗|✗|✗|✓|
|Actions log|`/api/actions*`|✗|✓|✓|✗|
|Tools (optional)|`/api/tools/*`|✗|✓|✓|✗|

> 備註：
> - AI Gateway 呼叫 `[Admin]` routes 時，必須符合 Auth 規則（Option A: session forwarding；Option B: internal secret）。
> - Shopper 一律不得觸及 admin / tools / actions 相關 routes。

### 10.3 重構時檢查

-  新增任一 route 時，有沒有明確標註 Access Level？
-  是否有 route 被前台誤用（例如前台呼叫 admin-only endpoint）？
-  是否有 AI 專用 route 實際上應該降階成一般 Admin 工具（反之亦然）？
    
