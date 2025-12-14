# 11-PAYMENT-FLOW – Payment & Checkout Flow (Stripe)

> **Purpose**：明確描述從購物車到付款完成的流程，包含 Storefront / API / Stripe / DB 之間的關係，避免重構時引入金流風險。  
> **Provider**：Stripe Checkout（MVP）。

---

## 0. Roles & Components

- **Shopper**：在 Storefront 上購物。
- **Storefront**：Next.js app，主持 UI 與 `validate-cart` 呼叫。
- **API（Hono）**：建立 Stripe Session、處理 webhook、寫入 DB。
- **Stripe**：收款與事件來源。
- **DB**：`orders` / `order_items` 等表。

---

## 1. High-level Flow

```text
Shopper (Storefront)
  → validate cart (API)
  → create Stripe Checkout Session (API or proxy)
  → redirect to Stripe

Stripe
  → POST /api/webhook/stripe

API (Hono)
  → verify event
  → write orders + order_items
```

---

## 2. Detailed Steps

### 2.1 Cart Validation

1. Shopper 在 `/checkout` 點選「前往結帳」。
2. Storefront 讀取 client cart state，組成 payload：
   ```json
   { "items": [{ "sku": "SKU-001", "quantity": 2 }] }
   ```
3. 呼叫 `POST /api/products/validate-cart`。
4. API：
   - 查 DB 確認 `sku` 存在且 `stockQuantity` 足夠。
   - 回傳最終 `unitPriceCents` 與可用數量。
5. Storefront 以 API 回傳結果為準，顯示確認頁面（summary）。

### 2.2 建立 Stripe Checkout Session

> 實作上可選擇：Session 建立發生在 `apps/api` 或 Storefront 自己的 server route（再呼叫 API），但 **訂單仍以 webhook 為單一入口**。

1. Storefront 呼叫：
   - 推薦：`POST /api/checkout`（於 `apps/api` 實作），或
   - 過渡：`apps/storefront` server route 代理呼叫 `apps/api`。
2. API：
   - 根據 validate 後的 cart 資料建立 Stripe Checkout Session。
   - 將 `order draft` 資訊（如有）存於 Stripe metadata 或自家 DB 暫存。
3. API 回傳 `sessionId` 或 redirect URL。
4. Storefront 導向 Stripe。

### 2.3 Stripe Webhook → DB 訂單

1. Stripe 在付款完成後呼叫：
   - `POST /api/webhook/stripe`。
2. API：
   - 使用 `STRIPE_WEBHOOK_SECRET` 驗證簽名。
   - 解析事件（例如 `checkout.session.completed`）。
   - 依 session metadata 或 Stripe line items：
     - 建立 `orders` 記錄。
     - 建立 `order_items` 記錄，填入 `unitPriceCents`（購買當下快照）。
   - 更新 `orders.status` 為 `paid`。
3. 視需求：扣減 `products.stockQuantity`。

### 2.4 Admin / AI 查詢

- Admin / AI 可透過：
  - `GET /api/orders`、`GET /api/orders/:id`、`GET /api/orders/stats` 查詢訂單與報表。
- AI 進一步分析時：
  - 可在 AI Gateway 解析後，呼叫上述 API 取得資料。

---

## 3. Error Handling & Edge Cases

- Cart 在驗證後到 Stripe 付款之間發生價格 / 庫存變動：
  - 可選策略：
    - 嚴格模式：若與 validate 時不同，阻止建立 Session，請 Shopper 重新確認。
    - 寬鬆模式：允許以 validate 當下價格成交，但之後調整庫存與售價。
- Webhook 重送：
  - `orders.stripeSessionId` 需 UNIQUE，避免同一事件寫入多次。
- 付款失敗 / 取消：
  - 不建立 `paid` 訂單，可選擇建立 `pending` 並標記失敗。

---

## 4. Boundaries（誰不能做什麼）

- Storefront：
  - 不直接寫 `orders` / `order_items` 表。
  - 不以 client 的「付款成功頁」判斷是否完成付款。
- Admin / AI：
  - 不直接創建 `paid` 訂單（除非有特別流程，需嚴格控管）。
  - 可修改非金流關鍵欄位（備註等），但付款金額與狀態應以 Stripe 事件為準。
- API：
  - `POST /api/webhook/stripe` 是唯一「付款 → 訂單」寫入入口。

---

## 5. Payment Flow Checklist（Refactor 用）

-  validate-cart 是否一定在建立 Stripe Session 前執行？
-  建立 Session 的程式碼是否集中於 API（或至少經由 API 代理）？
-  是否所有「成交」都由 webhook 寫入 DB，而非前端 redirect 結果？
-  `orders.stripeSessionId` 是否加上 UNIQUE 約束，以避免重複寫入？
-  若修改 Payment 流程，是否同步更新：
   - 對應 API routes（`17-API-ROUTES.md`）
   - DB schema（`16-DB-SCHEMA.md`）？

