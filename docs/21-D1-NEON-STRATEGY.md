# 21-D1-NEON-STRATEGY – D1 → Neon Strategy

> **Intent**：MVP 用 Cloudflare D1（SQLite）快速 Demo、低成本；成長後可平滑切換到 Neon（Postgres）。  
> **Rule**：所有讀寫必經 `apps/api`（Hono）。Storefront/Admin/AI/ChatOps 都不直接碰 DB。

---

## 0. Decision Summary

### Phase 1 (MVP): D1 via API Proxy

- **DB**: Cloudflare D1 (SQLite)
    
- **Access pattern**: Storefront/Admin/AI → `apps/api` → D1
    
- **Why**: 成本低、部署簡單、資料一致（Single Source of Truth）
    

### Phase 2: Neon (Postgres) behind same API

- **DB**: Neon serverless Postgres
    
- **Migration goal**: 不改 API contract、不改上層 client，只替換 DB adapter 與 migration
    

---

## 1. Architecture

```text
(Storefront / Admin / AI Gateway / Phase2 Bots)
                ↓
        apps/api (Hono)
                ↓
        DB Adapter (D1 | Neon)
                ↓
      D1 (MVP) / Neon (Phase 2)
```

### Why “API Proxy模式” is non-negotiable

- 避免多處直連 DB 造成權限/一致性問題
    
- 便於統一 auth、rate limit、audit log
    
- AI tool calling 也能遵守同一套寫入規則
    

---

## 2. Repository Layout (DB-related)

```plaintext
packages/db/src/
├── schema.ts            # Canonical schema (SSOT)
├── schema.d1.ts         # (Optional) D1-specific mapping
├── schema.pg.ts         # (Optional) Postgres-specific mapping
└── index.ts             # Exports

apps/api/
├── src/lib/db.ts        # DB adapter (switch D1/Neon)
├── migrations/          # SQL migrations (if kept here)
└── wrangler.toml        # D1 bindings
```

> 建議：SSOT 以 `schema.ts` 為主，只有真的需要差異才拆 `schema.d1.ts / schema.pg.ts`，避免維護兩份 schema。

---

## 3. DB Adapter Contract

### API-side usage (Workers)

```ts
import { getDatabase } from "apps/api/src/lib/db";

const { db, type } = getDatabase(c.env);
// type: "d1" | "neon"
```

### Adapter responsibilities

- Provide Drizzle client for selected backend
    
- Provide consistent type mapping (money/time/json)
    
- Hide provider-specific details from route handlers
    

---

## 4. Data Type & Compatibility Rules (important for migration)

> MVP 就先遵守這些規則，Phase 2 會輕鬆很多。

- **Money**: store as `integer cents` (recommended) or consistent string decimal (choose one)
    
- **Time**: store as `integer epoch ms` (D1-friendly); convert to `timestamptz` in Neon if needed
    
- **JSON**: store as `text` JSON string in D1; `jsonb` in Neon (optional)
    
- Avoid SQLite-only quirks (e.g., loose typing) in app logic
    

---

## 5. Environment Configuration

### Local dev

```bash
# apps/storefront/.env , apps/admin/.env
API_URL="http://127.0.0.1:8787"
```

### Production

```bash
# points to deployed Workers
API_URL="https://<your-worker>.workers.dev"
```

### Workers bindings (D1)

```toml
[[d1_databases]]
binding = "DB"
database_name = "ec-demo"
database_id = "<your-d1-database-id>"
```

### Neon switch (Phase 2)

```bash
DATABASE_URL="postgres://..."
DB_PROVIDER="neon"    # optional explicit selector
```

> 選擇策略：
> 
> - **Explicit**：用 `DB_PROVIDER` 控制
>     
> - **Implicit**：有 `DATABASE_URL` 就走 Neon，否則走 D1
>     

---

## 6. Migration Plan (D1 → Neon)

### 6.1 Prerequisites

- Schema is defined in Drizzle (SSOT)
    
- Migrations can be generated for Postgres
    

### 6.2 Steps

1. **Create Neon project & database**
    
2. **Apply migrations** to Neon (Postgres dialect)
    
3. **Update Workers env**:
    
    - set `DATABASE_URL` / `DB_PROVIDER=neon`
        
4. **Deploy** `apps/api` with adapter switching enabled
    
5. (Optional) **Data migration**
    
    - Export D1 → import into Neon
        
    - If demo-only data, can skip and re-seed
        

### 6.3 Verification checklist

-  `/api/products` returns expected results on Neon
    
-  Stripe webhook writes orders successfully
    
-  Admin CRUD works (create/update/delete)
    
-  AI actions still log correctly (audit tables)
    

---

## 7. Multi-tenant Demo Strategy (Optional)

> For demos, prefer **isolation** per customer.

### Option A: One repo per customer (simple & isolated)

- Fork/clone project per customer
    
- Each has its own D1 database + Worker deployment
    
- Pros: strong isolation, simple mental model
    
- Cons: operational overhead if many tenants
    

**Commands (example)**

```bash
cd apps/api
wrangler d1 create client-a-demo
wrangler d1 execute client-a-demo --remote --file=./migrations/0001_init.sql
wrangler deploy
```

### Option B: Single deployment + logical tenant_id (later)

- Add `tenantId` columns + row-level filtering
    
- Pros: less ops overhead
    
- Cons: access control becomes harder (not MVP-friendly)
    

---

## 8. Known Limits & When to Move to Neon

### D1 is great for

- MVP / demo
    
- low-to-moderate write volumes
    
- simple relational queries
    

### Consider Neon when you need

- advanced Postgres features (JSONB operators, extensions)
    
- heavier analytics / reporting
    
- scaling beyond D1 comfort zone (performance/limits)
    

> This section should avoid exact quotas unless you want to maintain it; keep it principle-based.

---

## 9. Related Docs

- DB schema: `16-DB-SCHEMA.md`
    
- API routes: `17-API-ROUTES.md`
    
- Engineering overview: `06-ENGINEERING.md`
    
- Deployment: `13-DEPLOYMENT.md`
    
- Environment: `14-ENVIRONMENT.md`
    
---

## 10. What Must Stay DB-agnostic（Refactor 用）

> 此節列出「不應依賴 D1 / Neon 實作細節」的區域，方便未來平滑切換 DB。

### 10.1 Route handlers

- 不應直接使用 provider-specific 型別或 SQL。
- 所有查詢與寫入：
  - 透過 Drizzle + 共用 helper。
  - 遵守 money / time / JSON 的抽象型別。

### 10.2 Domain logic

- 價格、庫存、訂單狀態等規則：
  - 寫在 API 層的 service / use-case 函式中，而非 DB adapter 或特定 provider 內。
  - 例如「庫存不得為負」應在應用邏輯檢查，而不是依賴某個 DB 的約束錯誤訊息。

### 10.3 Migration / Seed 腳本

- 盡量透過 Drizzle migrations 產生，而非手寫 provider-specific SQL。
- 若必須手寫 SQL：
  - 將 D1 / Neon 版本放在清楚的分支檔案（例如 `migrations/d1/*` vs `migrations/pg/*`）。

### 10.4 重構時檢查清單

-  是否有 route 僅在某個 DB 上能跑（例如使用 Neon extension）？→ 若要保留，需在文件中標註並確認不影響 MVP D1。
-  是否有邏輯「把 DB 當 message queue」或依賴特定鎖機制？→ 這通常會讓 DB 切換變難，應再評估。
-  是否所有服務仍遵守「只打 API，不打 DB」的原則？→ 這是讓 D1 ↔ Neon 可替換的前提。
