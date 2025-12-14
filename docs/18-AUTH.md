# 18-AUTH – Admin Authentication (Better Auth)

> **Scope**: Admin only（Storefront public in MVP）  
> **Mechanism**: Better Auth + HttpOnly session cookie  
> **Auth Provider Host**: `apps/api` (Cloudflare Workers)  
> **Clients**: Web Admin (Vercel), Web Chat (Vercel), Phase 2 messaging (Telegram/Slack)

---

## 0. Goals & Non-goals

### Goals

- Admin 以 **HttpOnly Cookie Session** 登入，避免 token 暴露在 JS。
    
- 所有 `[Admin]` API routes 都由 Workers middleware 統一驗證 session。
    
- 支援跨網域（Vercel ↔ Workers）下的 cookie 傳遞。
    

### Non-goals (MVP)

- Storefront 會員系統 / Shopper login
    
- 多租戶（multi-tenant）與複雜 RBAC（可先用 `role=admin`）
    

---

## 1. Components & Responsibilities

### `apps/admin` (Vercel)

- UI client only（無 server secrets）
    
- 登入/登出/查 session：呼叫 `/api/auth/*`
    
- API calls 需 `credentials: "include"`
    

**File pointers**

- `apps/admin/src/providers/auth-provider.ts` (Better Auth client wrapper)
    
- `apps/admin/src/providers/data-provider.ts` (ensure credentials)
    

### `apps/api` (Cloudflare Workers)

- Host Better Auth handlers：`/api/auth/*`
    
- Verify session cookie for Admin routes via middleware
    
- (Optional) Provide `GET /api/me` for UI quick session check
    

**File pointers**

- `apps/api/src/routes/auth.ts`
    
- `apps/api/src/middlewares/auth.ts`
    

### Database (D1 → Neon)

- `auth_user`, `auth_session` tables (see `16-DB-SCHEMA.md`)
    

---

## 2. Auth Flow

### 2.1 Login

```text
Admin UI (Vercel)
  → POST /api/auth/*  (Workers)
  ← Set-Cookie: session=...; HttpOnly; Secure; SameSite=None
```

### 2.2 Authenticated Requests

```text
Admin UI (Vercel)
  → GET/POST /api/* with credentials: "include"
Workers middleware
  → validate session cookie
  → allow [Admin] endpoints
```

### 2.3 Logout

```text
Admin UI → POST /api/auth/logout
Workers → clear cookie
```

---

## 3. Authorization Model (MVP)

- **Role**: `admin` only（可擴充 `staff`, `viewer`）
    
- **Policy**:
    
    - `[Public]` routes：no auth
        
    - `[Admin]` routes：valid session + role check
        
    - `[Webhook]` routes：signature verification (Stripe)
        

> 建議在 middleware 做「role gate」，避免每個 route 重複寫。

---

## 4. Cookie & CORS Configuration

### 4.1 Cookies (cross-domain)

當 Admin (Vercel) 與 API (Workers) 是不同 domain 時：

- `HttpOnly`
    
- `Secure=true`
    
- `SameSite=None`
    
- `Path=/`
    
- `Max-Age` / `Expires` aligned with session TTL
    

> 若在同一頂級網域（subdomain）下，可視情況用 `SameSite=Lax`，但跨站通常仍需 `None`。

### 4.2 CORS (Workers)

Workers 必須允許 Admin origin：

- `Access-Control-Allow-Origin: <ADMIN_ORIGIN>`
    
- `Access-Control-Allow-Credentials: true`
    
- `Access-Control-Allow-Headers: Content-Type, ...`
    
- Handle `OPTIONS` preflight
    

> 注意：`Allow-Origin` 不能用 `*` 搭配 `credentials: true`。

---

## 5. Environment Variables

### Workers (`apps/api`)

```bash
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=...            # e.g. https://api.example.com
ADMIN_ORIGIN=...               # e.g. https://admin.example.com
```

### Vercel (Admin UI)

```bash
VITE_API_BASE_URL=...          # points to Workers base
```

> `BETTER_AUTH_URL` 建議固定成 API 的 public URL，避免 callback/redirect 混亂。

---

## 6. AI Gateway Integration (Important)

> 因為你是 **AI as Interface**，AI gateway 會觸發寫入操作，但寫入仍要遵守同一套權限規則。

### Recommended rule

- **AI gateway 不直接寫 DB**
    
- **所有狀態變更都呼叫 Workers API**
    
- AI gateway calls should be protected via one of the following:
    

#### Option A (Recommended): Session forwarding (user-context)

- Web chat runs under admin session (cookie)
    
- AI gateway 需要在同域或透過安全方式取得使用者 session context（implementation-specific）
    

#### Option B: Internal secret (service-context)

- AI gateway uses `INTERNAL_API_SECRET` call header to Workers
    
- Workers validates secret + logs `actorType=ai`
    
- 適合背景任務，但要小心權限不可被濫用
    

> MVP 常用：Web chat 走 Option A；純背景作業才用 Option B。

---

## 7. Troubleshooting Checklist

-  Admin requests include `credentials: "include"`
    
-  Workers CORS allow exact Admin origin + `credentials: true`
    
-  Cookie has `SameSite=None; Secure`
    
-  Preflight OPTIONS handled
    
-  Middleware blocks Admin routes without session
    
-  Auth tables exist in DB
    

---

## 8. References

- DB schema: `16-DB-SCHEMA.md`
    
- API routes access levels: `17-API-ROUTES.md`
    
---

## 9. Boundary Rules & Anti-patterns（Refactor 用）

### 9.1 必須維持的邊界

- Admin 的身份識別：
  - **唯一標準**：Better Auth session + `role` 欄位。
  - Admin UI / AI gateway 不應各自實作一套權限系統。

- Cookie / Session 管理：
  - 統一由 `apps/api` 負責 Set-Cookie / Clear-Cookie。
  - Admin UI 僅透過 `/api/auth/*` 取得 / 清除登入狀態。

- AI Gateway 權限：
  - 不論使用 Option A（session）或 Option B（internal secret），最終仍由 Workers 判斷是否允許該操作。
  - AI gateway 只是一個「代理人」，不是權限的來源。

### 9.2 應避免的 Anti-pattern

- 在 Admin UI 存 access token 並帶在 header 裡使用（破壞 HttpOnly 的威力）。
- 在多個服務（Admin / API / AI）中分別實作 Role 判斷邏輯而且不一致。
- 讓 AI gateway 直接修改 DB 而不經由 API，導致繞過 auth middleware。
- CORS 設定過於寬鬆（例如 `Allow-Origin: *` 且 `credentials: true`）。

### 9.3 重構時的快速檢查

-  Auth 流程是否總是經過 `apps/api`？
-  是否有任何地方直接操作 cookie 而繞過 Better Auth handler？
-  AI gateway 是否有任何以「service account」身分執行的高權限操作？（若有，是否有清楚的 audit log 與限縮範圍？）
