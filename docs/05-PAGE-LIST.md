# 05-PAGE-LIST – Page & Route List

> **Purpose**：列出 Storefront / Admin / AI 的頁面與路由，對齊 Next.js / Vite route 結構與 API 需求，便於重構與導覽調整。  
> **Related**：整體 IA 請見 `03-IA.md`，User Flow 請見 `02-USER-FLOW.md`。

---

## 0. Legend

- **App**：
  - `storefront` = Next.js Storefront（Cloudflare Pages）
  - `admin` = Admin SPA（Vite on Vercel）
- **Access**：
  - `[Public]` 不需登入。
  - `[Admin]` 需 Better Auth session。

---

## 1. Storefront Pages

|Path|App|Access|Description|Notes|
|---|---|---|---|---|
|`/`|storefront|[Public]|首頁，顯示精選商品|呼叫 `GET /api/products`（有限度）|
|`/products`|storefront|[Public]|商品列表|支援分頁與排序|
|`/products/[slug]`|storefront|[Public]|商品詳情|顯示圖片、描述、價格、庫存|
|`/cart`|storefront|[Public]|購物車頁面|使用 client-side cart state|
|`/checkout`|storefront|[Public]|結帳頁|呼叫 `validate-cart` + 建立 Stripe Session|

**備註**
- MVP 不含會員註冊 / 登入 / 訂單歷史頁面。

---

## 2. Admin Pages（SPA routes）

|Path|App|Access|Description|API Dependencies|
|---|---|---|---|---|
|`/`|admin|[Admin]|Dashboard|`GET /api/orders/dashboard`, `GET /api/products/low-stock`|
|`/products`|admin|[Admin]|產品列表|`GET /api/products/all`|
|`/products/:id`|admin|[Admin]|產品詳情 / 編輯|`GET /api/products/:id`, `PUT /api/products/:id`|
|`/orders`|admin|[Admin]|訂單列表|`GET /api/orders`|
|`/orders/:id`|admin|[Admin]|訂單詳情|`GET /api/orders/:id`|
|`/reports`|admin|[Admin]|簡易報表|`GET /api/orders/stats` or 專用 endpoint|
|`/ai`|admin|[Admin]|AI Copilot（Chat UI）|`POST /api/ai/chat`, `GET /api/actions`（可選）|

**備註**
- 實際 Vite route 結構可依 Router 使用方式調整，但建議概念路徑維持上述語意。

---

## 3. Auth-related Views

> Admin Auth UI 屬於 Admin SPA 一部分，但實際 handlers 在 `apps/api`。

|Path|App|Access|Description|
|---|---|---|---|
|`/login` (or modal)|admin|[Public]|Admin 登入表單|

**Notes**
- 登入表單提交到 `/api/auth/*`；成功後導回 `/`（Dashboard）。

---

## 4. AI-related Endpoints (非頁面，for completeness)

> 這裡列的是「API endpoints」，非前端畫面，方便對照 `17-API-ROUTES.md`。

|Path|Location|Access|Description|
|---|---|---|---|
|`/api/ai/chat`|admin (Vercel)|[Admin] 或內部|AI Chat 入口|
|`/api/ai/tools` (optional)|admin (Vercel)|內部|工具封裝 endpoint|
|`/api/ai/confirm` (optional)|admin (Vercel)|[Admin]|確認擬議 action|

---

## 5. Page Boundary Checklist（Refactor 用）

-  Storefront 是否只有 `[Public]` 頁面？（沒有 Admin-only 資訊）
-  Admin 頁面是否全部受保護（進入前必須有 session）？
-  AI Copilot 是否只存在於 Admin app，而非額外建立一個「AI 專用前台」？
-  每個頁面是否都有對應 API routes（若需要資料）？若新增頁面，是否同步更新此表與 `17-API-ROUTES.md`？

