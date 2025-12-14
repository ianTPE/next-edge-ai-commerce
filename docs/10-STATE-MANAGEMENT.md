# 10-STATE-MANAGEMENT – State Management

> **Purpose**：定義 Storefront / Admin / AI 的狀態管理策略（哪裡存、誰是 source of truth），避免重構時出現多處狀態不一致。  
> **Related**：DB schema 見 `16-DB-SCHEMA.md`，API routes 見 `17-API-ROUTES.md`。

---

## 0. State 類型分類

- **Server state**：來自 API / DB 的資料（products、orders、reports）。
- **Client UI state**：UI 控制相關（modal 開關、目前 tab）。
- **Client session state**：與 Auth / 使用者上下文相關（admin 是否登入）。
- **Derived state**：從 server state 計算出的結果（報表、圖表）。

---

## 1. Storefront State

### 1.1 商品與內容（Server state）

- 來源：
  - `GET /api/products`、`GET /api/products/:slug`。
- 建議策略：
  - Next.js 使用 SSG + ISR（視需求而定）。
  - 客戶端可再做輕量 cache（例如 SWR / React Query）。

### 1.2 購物車（Client state）

- MVP 策略：
  - 使用 client-side state（例如 React context）+ localStorage 持久化。
- 進入 `/checkout` 前：
  - 透過 `POST /api/products/validate-cart` 做 server-side 驗證。

**邊界**
- DB 不存 Shopper cart。
- validate-cart 的結果才是最終可信價格與庫存。

### 1.3 Checkout / Payment

- Stripe Checkout session 狀態：
  - 不由前端保存為信任 source of truth。
  - 由 API 的 webhook handler 負責更新 DB 中的 `orders` 狀態。

---

## 2. Admin State

### 2.1 Auth / Session

- Source of truth：
  - 存在 Better Auth 管理的 `auth_session` 表 + HttpOnly Cookie。
- Admin SPA：
  - 只透過 API 檢查登入狀態（例如 `GET /api/me`），不自行 decode token。

### 2.2 CRUD 資料（Products / Orders）

- 來源：
  - Products：`/api/products/all`、`/api/products/:id`。
  - Orders：`/api/orders`、`/api/orders/:id`。
- 建議：
  - 使用 Refine 的 data provider 連到 API（而非 DB）。
  - 以 API 回傳資料為唯一主版本，表單內的變動屬 client draft。

### 2.3 Dashboard / Reports

- Derived state：
  - 由 API 回傳聚合結果（dashboard / stats）。
- 紀錄粒度：
  - 若不需要歷史報表，可每次即時計算。
  - 若需要歷史快照，可加 `report_snapshots` 表（非 MVP 必要）。

---

## 3. AI State

### 3.1 對話歷程

- AI Chat 對話內容：
  - 可短期存於前端（chat UI）與 AI provider session。
  - 若需要長期保存，建議：
    - 將「指令摘要 + action log」存 DB（`action_log`）。
    - 原始完整對話可選擇記錄（視隱私 / 成本）。

### 3.2 擬議變更（Proposed Changes）

- 當 AI 提出「擬議變更」（例如一批價格調整）時：
  - 短期狀態可放在 AI Gateway 的 ephemeral storage 或前端 state。
  - 一旦需要「可追溯」與「可延後確認」：
    - 應建立 `action_log`（status=proposed）與 `action_changes` 記錄完整 diff。

### 3.3 執行結果（Executed Actions）

- 真正寫入 DB 的時刻：
  - 由 Hono API 完成。
- 實際結果狀態：
  - 同樣應記錄在 `action_log`（status=executed / failed）。

---

## 4. Who Owns What?（Source of Truth）

|State|Source of truth|Readable by|
|---|---|---|
|Products / inventory|DB（D1 / Neon）|Storefront / Admin / AI（via API）|
|Orders / payments|DB + Stripe|Admin / AI（via API）|
|Admin session|Better Auth + Cookie|Admin / AI（via API）|
|Cart contents|Client（Storefront）+ API validation result|Shopper|
|AI actions|`action_log` + `action_changes`|Admin / AI|

---

## 5. State Boundary Checklist（Refactor 用）

-  是否有任何「重要狀態」只存在於 client 而沒有 server-side 驗證？（例如價格、庫存）
-  Admin 是否只以 API 為資料來源，而不是直接讀 DB？
-  AI 的擬議變更與執行結果是否都有在 DB 中留下足夠 trace？
-  若新增 state（例如行銷活動、折扣），是否先決定：
   - 誰是 source of truth（DB / API / client）？
   - 讀寫流程（哪個 app / route 負責）？

