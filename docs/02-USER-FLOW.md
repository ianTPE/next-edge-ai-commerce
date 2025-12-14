# 02-USER-FLOW – User Flows (Shopper / Admin)

> **Purpose**：用「實際操作流程」描述 Shopper / Admin 如何使用系統，對應到前端頁面與 API routes，作為重構時的行為基準。  
> **Related**：需求請看 `01-PRD.md`，技術與架構請看 `06-ENGINEERING.md`、`17-API-ROUTES.md`。

---

## 0. Scope

- **包含**
  - Shopper 在 Storefront 上的購物流程（瀏覽 → 加購物車 → 結帳）。
  - Admin 在 Admin UI / AI Chat 上的核心營運流程（看報表、改價、補貨）。
  - 每個流程使用到的 **App**（storefront/admin/api）與 **API routes**。
- **不包含**
  - 未來 Phase 2 的 Telegram / Slack 細節（僅留掛鉤）。
  - 行銷活動、折扣券等進階功能。

---

## 1. Shopper Flow（MVP）

### 1.1 入口與瀏覽

**情境**
- Shopper 透過 SEO / 社群連結進入 Storefront。

**流程**
1. 瀏覽首頁：`/`（Next.js）
   - Storefront 呼叫 `GET /api/products` 取得精選商品。
2. 瀏覽商品列表：`/products`
   - 呼叫 `GET /api/products?page=&pageSize=&sort=...`。
3. 瀏覽商品詳情：`/products/[slug]`
   - 呼叫 `GET /api/products/:slug`。

**邊界**
- 所有資料皆由 Storefront 經由 Public API 取得，**不得** 直接讀 DB。
- 不涉及登入，不建立 Shopper 帳號。

### 1.2 加入購物車（Client-side）

**情境**
- Shopper 把商品加入購物車，尚未結帳。

**流程**
1. 在商品詳情或列表點選「加入購物車」。
2. Storefront 將商品 `sku` 與 `quantity` 存在瀏覽器（localStorage / client state）。
3. `/cart` 頁面讀取 client cart state 顯示內容。

**邊界**
- MVP 不需 server-side cart；所有 cart state 存在 client。
- 僅在結帳前透過 API 做 **validate-cart**。

### 1.3 結帳（Stripe Checkout）

**情境**
- Shopper 準備付款，導到 Stripe Checkout 完成付款。

**流程**
1. Shopper 在 `/checkout` 按「前往結帳」。
2. Storefront 呼叫：
   - `POST /api/products/validate-cart` 驗證 `sku` / `quantity` / `price`。
3. 若驗證通過，Storefront 呼叫：
   - `POST /api/checkout`（實際實作可為 `apps/api` route 或 Storefront 自身 route 代理呼叫 API），建立 Stripe Checkout Session。
4. Shopper 被導向 Stripe Checkout 完成付款。
5. Stripe 付款完成後：
   - 呼叫 `POST /api/webhook/stripe`。
   - API 根據事件建立 `orders` + `order_items`，寫入 DB。
6. API 可選擇發送簡易 email（非 MVP 必要）。

**邊界**
- 付款成功與否的判斷以 **Stripe webhook** 為準，不以前端 redirect 為準。
- 建立訂單的唯一入口是 `POST /api/webhook/stripe`，**不可** 由前端直接寫 DB。

---

## 2. Admin Flow（Web Admin）

### 2.1 登入 / 登出

**情境**
- Admin 透過 Web Admin 登入系統。

**流程**
1. Admin 瀏覽 Admin SPA：`apps/admin`（例如 `/`）。
2. SPA 檢查 `/api/me`（如有）或直接顯示登入表單。
3. 登入：
   - `POST /api/auth/login`（實際路徑依 Better Auth handlers 而定）。
   - Workers 設置 `Set-Cookie: session=...; HttpOnly; Secure; SameSite=None`。
4. Admin SPA 使用 `credentials: "include"` 呼叫其他 Admin API。
5. 登出：
   - `POST /api/auth/logout` 清除 session cookie。

**邊界**
- Admin SPA 不直接操作 cookie；一律透過 `/api/auth/*`。
- 所有 Admin API 呼叫都必須帶上 `credentials: "include"`。

### 2.2 商品管理（非 AI）

**情境**
- Admin 在 Admin UI 上管理商品列表與詳細資訊。

**流程**
1. 開啟「商品列表」頁。
   - SPA 呼叫 `GET /api/products/all`。
2. 點擊某商品進入編輯畫面。
   - SPA 呼叫 `GET /api/products/:id` 或從列表快取資料。
3. Admin 修改名稱 / 價格 / 上架狀態。
4. 點擊「儲存」：
   - SPA 呼叫 `PUT /api/products/:id`。
   - API 寫入 `products` 表，更新 `updatedAt`。
   - API 可同步寫入 `action_log`（actorType=human）。

**邊界**
- Admin SPA 只送乾淨 payload（validated by UI + Zod），最終驗證仍由 API 進行。
- 寫入必須走 API；不得在 Admin 內有 direct DB helper。

### 2.3 圖片上傳

**情境**
- Admin 上傳商品圖片至 R2。

**流程**
1. Admin 在商品編輯頁選擇圖片。
2. SPA 呼叫 `POST /api/media/signed-upload` 取得 Signed URL。
3. SPA 透過 Signed URL 直接上傳檔案至 R2。
4. 上傳成功後，SPA 呼叫 `POST /api/media/commit`：
   - 提供 `productId`、`url`、`sortOrder`。
   - API 寫入 `product_images` 表。

**邊界**
- SPA 不儲存 R2 credentials，只使用 Signed URL。
- 只有 API 能寫 `product_images`；R2 只存檔案，不當 DB 使用。

---

## 3. Admin Flow（AI Chat）

### 3.1 查詢庫存 / 銷量

**情境**
- Admin 在 AI Chat 問：「列出下週可能缺貨的商品」。

**流程**
1. Admin 在 Web Chat UI 輸入自然語言。
2. Chat UI 呼叫 `POST /api/ai/chat`（Vercel AI Gateway）。
3. AI Gateway 解析意圖，決定呼叫對應工具（例如 `getLowStockProducts`）。
4. AI Gateway 呼叫 Hono API：
   - `GET /api/products/low-stock?threshold=...`。
5. API 查 DB，回傳結果。
6. AI 整理成自然語言回覆 Admin。
7. AI 同步寫入 `action_log`（actorType=ai, intent=low_stock_report）。

**邊界**
- AI Gateway 不直接查 DB；所有資料查詢都走 API。
- 查詢類操作仍建議寫入 `action_log`（至少對重要查詢）。

### 3.2 調整價格（需確認）

**情境**
- Admin 在 AI Chat 說：「把所有庫存少於 10 的商品調降 10%。」

**流程（建議模式）**
1. Chat 收到指令 → `POST /api/ai/chat`。
2. AI 做解析，產生一組「擬議變更」列表（舊價 / 新價）。
3. AI Gateway 呼叫 API 產生「暫存 action」：
   - `POST /api/actions` 或 `POST /api/tools/update-price`（`requires_confirmation=true`）。
   - API 寫入 `action_log`（status=proposed）與 `action_changes`（before/after）。
4. AI 以摘要形式顯示給 Admin，並提供「確認 / 取消」按鈕。
5. Admin 點「確認」，Chat UI 呼叫：
   - `POST /api/ai/confirm` 或直接呼叫對應工具 endpoint。
6. AI Gateway 再次呼叫 API：
   - 更新 `action_log.status=executed`。
   - 實際呼叫 `POST /api/tools/update-price` 完成 DB 寫入。

**邊界**
- 所有「Write」必須經過明確的摘要 + 確認機制。
- 真正更新價格的動作由 API 完成；AI 只是 orchestrator。

---

## 4. Phase 2 Flow Hooks（Telegram / Slack）

> 詳細實作留待 Phase 2，這裡只定義「入口」。

- Telegram / Slack bot：
  - 收到訊息後，將內容與 Admin 身份資訊一起轉發到 AI Gateway（同一組 `/api/ai/chat` 邏輯）。
  - AI Gateway 照原有工具流程呼叫 API。
- 邊界：
  - Bot 層不實作商業邏輯，只做「身份映射 + 訊息轉送」。

---

## 5. Flow Boundary Checklist（Refactor 用）

-  Shopper 的所有操作是否都只透過 Storefront + Public API 完成？
-  Admin 所有營運操作是否有對應的 API route（而非直接 DB）？
-  AI Chat 是否有清楚的「查詢 vs 寫入」分界，且寫入都有確認機制？
-  Stripe webhook 是否是唯一「付款成功 → 訂單寫入」入口？
-  若新增流程，是否對應到：
   - 具名頁面（Storefront / Admin 路由）
   - 具名 API endpoint
   - 需要時對應的 audit log 記錄？

