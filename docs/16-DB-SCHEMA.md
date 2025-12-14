# 16-DB-SCHEMA – Database Schema

> **DB (MVP)**: Cloudflare D1 (SQLite)  
> **Phase 2**: Neon (Postgres)  
> **SSOT**: `packages/db/src/schema.ts` (Drizzle)  
> **Goal**: 支援 Storefront / Admin / AI tools 的核心資料、訂單流程、以及 AI 操作的可追溯性（audit）。

---

## 0. Design Principles

- **Single Source of Truth**：所有 schema 以 Drizzle 定義為準（文件僅是可讀摘要）。
    
- **D1-first Compatibility**：避免 Postgres-only 特性；時間以 `integer (epoch ms)` 優先。
    
- **Immutable Order Facts**：`order_items.unitPrice` 必須保存購買當下單價。
    
- **Auditable Writes**：所有「會改狀態」的操作（價格/庫存/上架）都要可追溯（人/AI/來源/差異）。
    
- **Schema Evolution**：MVP 以 additive change 為主（新增欄位/表，避免破壞性變更）。
    

---

## 1. Type Mapping (D1 ↔ Neon)

|Concept|D1 (SQLite)|Neon (Postgres)|Note|
|---|---|---|---|
|Primary Key|`text` (uuid) or `integer`|`uuid` or `bigserial`|建議：所有 domain 表用 `text uuid` 最省遷移痛苦|
|Money|`integer` (minor units)|`integer`|推薦存 cents，避免 decimal 差異|
|Timestamp|`integer` (epoch ms)|`timestamptz`|MVP 用 epoch ms；Phase2 可用 view/adapter|
|JSON|`text` (JSON string)|`jsonb`|Drizzle 可封裝序列化|

> 建議：**金額用 minor units (cents)**，比 `decimal/text` 更穩、跨 DB 一致。

---

## 2. Auth Tables (Better Auth)

> 本段以 Better Auth 的實際需求為準；若你使用其 adapter 產生的欄位較多，文件可只列核心欄位，並連到 schema 定義。

### 2.1 `auth_user`

|Column|Type|Constraints|Note|
|---|---|---|---|
|id|text|PK|UUID|
|email|text|UNIQUE, NOT NULL||
|passwordHash|text|NOT NULL|加密後密碼（若使用 password login）|
|role|text|NOT NULL|`admin` / `user`|
|createdAt|integer|NOT NULL|epoch ms|

### 2.2 `auth_session`

|Column|Type|Constraints|Note|
|---|---|---|---|
|id|text|PK||
|userId|text|FK → auth_user.id||
|token|text|UNIQUE||
|expiresAt|integer|NOT NULL|epoch ms|
|createdAt|integer|NOT NULL|epoch ms|

> Optional tables（若你要支援 OAuth / email verification）：`auth_account`, `auth_verification`（略）

---

## 3. Core Commerce Tables

### 3.1 `products`

|Column|Type|Constraints|Note|
|---|---|---|---|
|id|text|PK|UUID（建議）|
|name|text|NOT NULL||
|slug|text|UNIQUE, NOT NULL|SEO|
|sku|text|UNIQUE, NOT NULL||
|description|text|||
|priceCents|integer|NOT NULL|售價（minor units）|
|compareAtPriceCents|integer||參考價|
|stockQuantity|integer|NOT NULL||
|isActive|integer|NOT NULL|0/1|
|createdAt|integer|NOT NULL|epoch ms|
|updatedAt|integer|NOT NULL|epoch ms|

#### `product_images`

|Column|Type|Constraints|Note|
|---|---|---|---|
|id|text|PK||
|productId|text|FK → products.id||
|url|text|NOT NULL|R2 public url|
|sortOrder|integer|NOT NULL||
|createdAt|integer|NOT NULL||



---

### 3.2 `customers`（MVP 可選）

|Column|Type|Constraints|Note|
|---|---|---|---|
|id|text|PK|UUID|
|email|text|UNIQUE, NOT NULL||
|name|text|||
|phone|text|||
|createdAt|integer|NOT NULL||

> 若 Shopper 不登入，`orders` 也可以只存 email/name/address，不一定要 customers 表；看你是否要做回購分析。

---

### 3.3 `orders`

|Column|Type|Constraints|Note|
|---|---|---|---|
|id|text|PK|UUID|
|stripeSessionId|text|UNIQUE||
|customerEmail|text|NOT NULL||
|currency|text|NOT NULL|e.g. `TWD`|
|totalAmountCents|integer|NOT NULL||
|status|text|NOT NULL|`pending` / `paid` / `cancelled`|
|createdAt|integer|NOT NULL||
|updatedAt|integer|NOT NULL||

> 可選：`shippingAddressJson`（text），或拆 `order_addresses`

---

### 3.4 `order_items`

|Column|Type|Constraints|Note|
|---|---|---|---|
|id|text|PK|UUID|
|orderId|text|FK → orders.id||
|productId|text|FK → products.id||
|sku|text|NOT NULL|購買當下快照|
|quantity|integer|NOT NULL||
|unitPriceCents|integer|NOT NULL|購買當下單價（immutable）|

---

## 4. Inventory & Pricing Operations (AI / Admin Auditing)

> 因為你是 **AI as Interface**，這一段是「必備」而不是加分：要能追溯誰在什麼渠道下了什麼指令、改了哪些資料。

### 4.1 `action_log`（建議命名比 analysis_log 更準）

|Column|Type|Constraints|Note|
|---|---|---|---|
|id|text|PK|UUID|
|actorType|text|NOT NULL|`human` / `ai`|
|actorId|text||human = userId；ai = model/agent id|
|channel|text|NOT NULL|`web` / `telegram` / `slack`|
|intent|text|NOT NULL|e.g. `update_price`, `restock`, `generate_report`|
|prompt|text||原始輸入（可做 PII policy）|
|toolCallsJson|text||tool calling trace|
|status|text|NOT NULL|`proposed` / `confirmed` / `executed` / `failed`|
|createdAt|integer|NOT NULL||
|executedAt|integer|||

### 4.2 `action_changes`（差異紀錄）

|Column|Type|Constraints|Note|
|---|---|---|---|
|id|text|PK||
|actionId|text|FK → action_log.id||
|entityType|text|NOT NULL|`product` / `order` / ...|
|entityId|text|NOT NULL||
|beforeJson|text|||
|afterJson|text|||
|createdAt|integer|NOT NULL||

> MVP 如果想簡化：可以先把 change 直接塞 `action_log.changesJson`，Phase 2 再拆表。

---

## 5. Indexes & Constraints (Minimum)

- `products.slug` UNIQUE
    
- `products.sku` UNIQUE
    
- `orders.stripeSessionId` UNIQUE
    
- `order_items.orderId` index
    
- `action_log.createdAt` index
    
- `action_changes.actionId` index
    

---

## 6. Code Reference (DB Helper)

```ts
import { getDatabase } from "apps/api/src/lib/db";

const { db, type } = getDatabase(c.env);
// type: "d1" | "neon"
```

---

## 7. Schema Checklist (MVP)

-  Products list/detail 可用（含圖片）
    
-  Cart validation（庫存/價格快照策略明確）
    
-  Stripe webhook 寫入訂單
    
-  Admin CRUD（Refine data-provider 可對接）
    
-  AI 操作可審核/可追溯（action_log + changes）

---

## 8. Ownership & Change Rules（Refactor 用）

### 8.1 表與服務的責任對應

- `auth_*` 系列表
  - 主要被：`apps/api` 的 auth routes / middleware 使用。
  - 不暴露給 Storefront / Admin 直接查詢（必須透過 API）。

- `products`, `product_images`
  - 讀取：
    - Storefront：Public products API。
    - Admin / AI：Admin products API / tools。
  - 寫入：
    - 僅限 Admin / AI（經由 API）。

- `orders`, `order_items`
  - 寫入：
    - Stripe webhook（`/api/webhook/stripe`）為主要入口。
    - Admin 可以更新非金流關鍵欄位（例如註記、標籤），但不可直接改 `totalAmountCents`、`status=paid` 等金流來源欄位，除非有明確 policy。

- `action_log`, `action_changes`
  - 寫入：
    - 由 API（或 AI gateway → API）在執行 Admin / AI 行為時自動產生。
  - 查詢：
    - 由 Admin UI 用於「歷程檢視」與「回溯」。

### 8.2 變更策略（Schema Evolution）

- 新需求優先：
  - 加欄位（nullable 或有預設值）。
  - 加表（例如新的報表快照表）。
- 盡量避免：
  - 移除欄位。
  - 改欄位語意（例如 `status` 的值域改名）而不同步更新 API 文件與程式碼。
- 若必須破壞性變更：
  - 先在 API 層提供 backward-compatible adapter（例如同時支援 `status` 舊新值），再逐步移除。

### 8.3 DB 寫入邊界（務必遵守）

- **只能** 由 `apps/api` 存取 DB（不論是 D1 或 Neon）。
- AI / Admin / Storefront 皆不可：
  - 直接持有 DB connection string。
  - 執行 SQL（包含「看起來只是查詢」但實際可能改寫狀態的語句）。

### 8.4 重構時檢查清單

-  是否每一個寫入路徑都能對應到一筆 `action_log`？（至少對重要操作）
-  是否有任何 app 直接觸碰 DB？→ 應改為呼叫 API。
-  是否有欄位語意被重用（例如把 `description` 當成暫存欄位）？→ 應新增獨立欄位，而不是 overload 現有欄位。
    
