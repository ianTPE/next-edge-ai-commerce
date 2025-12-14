# 01-PRD – Product Requirements (AI MVP)

## 1. Goal

**Next.js EC Site MVP（AI-Enhanced）**

本專案旨在為中小型電商打造一個以 **Serverless / Edge-first** 為核心的現代化電商 MVP。透過結合 AI 技術與高效能架構，解決傳統電商維運成本高、操作繁瑣的痛點。

**核心價值：**

* **低前期成本，彈性擴展**
  採用 Serverless 架構，大幅降低基礎設施建置與維運負擔，實現「用量即成本」的線性成本結構。
* **Edge-first 極速體驗**
  優先採用 Edge 運算與部署，確保全球存取速度與優異的 SEO 表現，助力業務快速成長。
* **AI-native Admin 智慧營運**
  重新定義後台操作體驗，以 AI 為核心介面，不僅提供數據分析，更能直接執行營運操作。

---

### MVP 階段聚焦重點

* **Shopper (消費者端)**
  打造無摩擦購物體驗，支援訪客模式 (Guest Checkout)，無需登入即可完成瀏覽、加入購物車至結帳的全流程，極大化轉換率。

* **Admin (管理者端)**
  建構以 **AI Chat 為核心** 的營運後台。管理者可透過 Web 介面、Telegram 或 Slack，以自然語言指令完成核心工作：
  * **商品管理**：調整價格、上架商品。
  * **庫存管理**：查詢庫存狀態、執行補貨。
  * **數據洞察**：即時生成營運報表與數據分析。
  
  傳統圖形化後台 (GUI) 將退居輔助角色，作為備援與進階設定使用。

---

## 2. User Roles & Usage Context

### Shopper (一般消費者)

* **目標族群**：一般網路購物使用者。
* **使用情境**：
  * 透過搜尋引擎或社群媒體連結進入商店。
  * 瀏覽商品詳情，將心儀商品加入購物車。
  * 快速結帳，無需繁瑣的註冊流程。
* **設計重點**：
  * **極致流暢**：降低操作摩擦，提升購物體驗。
  * **高效能**：秒級載入速度，優化 SEO 排名。
  * **行動優先**：針對手機裝置進行最佳化設計。

### Admin (電商營運人員)

* **目標族群**：中小型電商經營者或營運團隊。
* **使用情境**：
  * 在日常通訊軟體 (Telegram / Slack) 中即時處理營運事務。
  * 隨時隨地查詢數據、調整售價或處理補貨，打破「坐在電腦前」的限制。
* **設計重點**：
  * **AI Chat First**：自然語言即指令，降低系統學習門檻。
  * **全通路操作**：支援跨裝置、跨平台 (Web/App) 無縫協作。

---

## 3. Architecture Principles

本專案架構設計遵循以下四大原則：

* **Serverless-first**
  摒棄傳統伺服器管理，專注於業務邏輯。系統可隨流量自動擴展，實現真正的雲端原生優勢。

* **Edge-first**
  將運算與資料存取盡可能推向邊緣 (Edge)，縮短使用者與服務的距離，提升效能與穩定性。

* **API-centric & Decoupled**
  採用前後端分離架構。Storefront、Admin 與 AI 介面皆透過統一的 API 進行溝通，確保系統靈活度與可擴充性。

* **AI as Interface**
  AI 不僅是輔助工具，更是系統的主要操作介面與抽象層，改變人機互動模式。

---

## 4. Admin & AI Interface Design

### AI-native Admin Concept

Admin 後台採用 **AI Chat 為核心操作介面**，並規劃分階段實踐：

**Phase 1 (MVP)**
* **Web Admin**：提供基礎視覺化管理介面。
* **Web-based AI Chat Interface**：作為主要操作入口，支援以自然語言執行後台核心功能。

**Phase 2**
* **Telegram Bot / Slack App**：將 AI 操作能力延伸至即時通訊平台，與 Web Chat 共用後端邏輯，提供真正的行動化營運體驗。

管理者可透過對話完成以往需在多個頁面跳轉的操作。隨著階段推進，操作介面將更加多元，但核心架構保持一致。

---

### Example AI Commands (指令範例)

* 「將 A 商品價格調整為 299 元」
* 「列出下週可能缺貨的商品清單」
* 「幫我針對熱銷商品建立補貨單」
* 「生成本月的銷售報表」
* 「分析此商品的定價是否符合市場行情？」

---

### Interaction Principles (互動原則)

* **意圖識別**：AI 準確將使用者自然語言轉換為系統可執行的指令。
* **安全機制**：涉及狀態變更 (如價格、庫存) 的操作必須：
  * 提供明確的操作摘要 (Summary)。
  * 支援「確認後執行」機制 (Confirmation) 或設定信任等級。
  * 保留完整的操作歷程 (Audit Log) 以供追溯。

---

## 5. AI Capability Scope

### MVP Scope (首要目標)
* **自然語言查詢**：即時查詢庫存量、銷售數據。
* **商品管理**：支援商品價格調整。
* **補貨建議**：提供補貨建議或直接執行補貨操作。
* **報表生成**：自動產出基礎營運報表。
* **跨平台一致性**：確保 Web 與未來通訊軟體介面的操作邏輯一致。

### Phase 2 Scope (未來展望)
* **市場分析**：整合外部市場價格資訊進行分析。
* **進階自動化**：支援多步驟任務 (Multi-step tasks) 與 Agent-based workflow。
* **工具擴充**：整合 LangChain 或 Tool Pipeline，增強 AI 能力。
* **人機協作**：半自動化營運流程，支援中斷與人工審核。

---

## 6. Architecture Overview

本系統採用 **Serverless / Edge-first** 架構，並以 **API-centric** 設計支援多種前端與 AI 介面。

### 6.1 System Implementation Details

* **Storefront**: Next.js (`apps/storefront`)
  * 採用 SSG + ISR 技術，兼顧 SEO 與效能。
  * 部署平台：**Cloudflare Pages**。

* **Admin**: Vite SPA (`apps/admin`)
  * 靜態建置 (Static build)。
  * 部署平台：**Vercel**。
  * 定位：視覺化管理介面，與 Chat Ops 共用 API。

* **API**: Hono (`apps/api`)
  * 部署平台：**Cloudflare Workers**。
  * 職責：資料讀寫的唯一入口，服務 Storefront、Admin 及 AI Agent。

* **Database**:
  * MVP 階段：**Cloudflare D1 (SQLite)**。
  * Phase 2：遷移至 **Neon (Postgres)** 以支援更複雜需求。

* **AI Engine**: Vercel AI SDK
  * 部署平台：**Vercel**。
  * 介面：`/api/ai/chat` (Vercel Route)。
  * 職責：處理 Tool Calling 與 Action Execution，透過 API 層執行實際業務邏輯。

* **Image Storage**: Cloudflare R2
  * 上傳機制：透過 Worker 簽發 Signed URL 進行直傳。
  * 存取機制：透過 Public URL 分發。

---

## 7. Detailed Scope (MVP)

### Shopper Features
* **商品瀏覽**：支援商品列表與詳細頁面展示。
* **購物車**：支援訪客 (Guest) 購物車功能。
* **結帳流程**：簡易結帳流程 (會員驗證功能留待 Phase 2)。

### Admin Features (Chat-first, Web as Fallback)
* **Authentication**
  * 使用 **Better Auth**。
  * Web Admin 採用 HttpOnly Cookie 確保安全性。

* **Product Management**
  * 商品列表與編輯功能。
  * 支援 JSON 格式批次上傳。

* **Image Upload**
  * 支援直接上傳至 Cloudflare R2 (經由 Signed URL)。

* **AI-driven Operations**
  * 自然語言查詢庫存與銷量。
  * 價格調整 (需包含摘要確認流程)。
  * 補貨操作執行。
  * 營運報表整理。
  * **核心原則**：所有寫入操作 (Write Actions) 皆透過 API (Hono) 執行，並具備審計軌跡 (Audit Trail) 與確認規則。

### 7.1 AI Interface Scope
* **核心定位**：AI 為 Admin 的主要操作入口。
* **支援介面**：優先支援 Web，預留 Telegram / Slack 擴充能力。
* **功能職責**：AI 可呼叫後端 Tools 執行：
  * **Read (Query)**：查詢數據。
  * **Write (Action)**：調整價格、庫存、商品資訊。
* **安全規範**：所有寫入行為必須具備：
  * 明確的操作摘要。
  * 確認 (Confirm) 或中斷 (Abort) 機制。
  * 完整操作紀錄。

---

## 8. Boundary Summary（Refactor 用）

> 本節是為「重構 / 拆服務 / 調整專案結構」準備的邊界摘要，協助你在調整程式碼時不踩線。若實作與本節衝突，請優先更新程式碼，再回頭同步文件。

### 8.1 使用者邊界

- **Shopper**
  - 只透過 **Storefront** 介面互動（Next.js app）。
  - 不需要帳號、不會接觸 Admin / AI 功能。
  - 只能呼叫「[Public] API routes」：商品瀏覽、購物車驗證、結帳流程。
  - 不參與任何價格 / 庫存 / 報表相關寫入操作。

- **Admin**
  - 只透過 **Web Admin + AI Chat** 介面操作（Vercel）。
  - 所有營運操作（改價、補貨、查報表）都必須登入，且具備 `role=admin`。
  - **不得** 直接操作 DB；僅能經由 API（Hono）完成資料變更。

### 8.2 系統邊界（Apps / Services）

- **Storefront（apps/storefront）**
  - 職責：提供 Shopper 前台瀏覽與下單體驗。
  - 只呼叫：
    - `/api/products/*`（Public read + cart validation）
    - `/api/webhook/stripe` 由 Stripe 呼叫，不由 Storefront 直接觸發。
  - **禁止**：
    - 直接連線 DB（D1 / Neon）。
    - 呼叫 Admin 專用 routes（例如 `/api/products/all`、`/api/orders`）。
    - 實作任何 Admin / AI 操作畫面。

- **Admin（apps/admin）**
  - 職責：營運管理 UI + AI Chat entry。
  - 只透過：
    - `/api/auth/*` 完成登入 / 登出 / session 維護。
    - `[Admin]` API routes 完成 CRUD / 報表。
  - **不得**：
    - 直接連線 DB。
    - 實作獨立的商業邏輯（邏輯應放在 API 層，Admin 僅負責組裝與呈現）。

- **API（apps/api）**
  - 職責：唯一資料寫入入口 + 權限判斷 + audit log。
  - 對外暴露 Public / Admin / Webhook routes，細節見 `17-API-ROUTES.md`。
  - **不得**：
    - 直接提供 HTML / UI（只回 JSON）。
    - 跳過 auth middleware 處理 Admin 請求。

- **AI Gateway（Vercel AI SDK，在 apps/admin）**
  - 職責：處理自然語言、tool calling、轉換為 API 呼叫。
  - 所有寫入操作都必須：
    - 經過 API（Hono），不可直接連 DB。
    - 產出對應的 audit log（`action_log` / `action_changes`）。

- **Database（D1 / Neon）**
  - 只能被 `apps/api` 的 DB adapter 存取。
  - 任何其他 app 想操作資料，都必須透過 API routes。

### 8.3 Phase 邊界（MVP vs Phase 2）

- **MVP 必須完成**
  - Shopper 完整購物流程（不含會員登入）。
  - Admin 透過 Web Admin + Web Chat 操作核心營運任務（價格 / 庫存 / 報表）。
  - 所有寫入操作可追溯（audit）。
  - D1 作為唯一 DB，Neon 尚未啟用。

- **Phase 2 才會啟用**
  - Telegram / Slack Bot 接入（沿用同一 AI Gateway + API）。
  - Neon (Postgres) 作為主要 DB，D1 轉為選配 / demo 用。
  - 進階自動化工作流（Agents、多步驟任務）。

### 8.4 重構時的檢查清單（摘要）

-  是否有任何地方繞過 API 直接寫 DB？→ 應該重構回 API。
-  是否有 Admin / AI 專屬邏輯出現在 Storefront？→ 應該搬回 Admin 或 API。
-  是否有「跨 Phase」的功能滲入 MVP？→ 標記為 Phase 2，避免過早複雜化。
-  是否能從一個介面（使用者操作）追溯到對應 API 呼叫與 DB 變更？→ 必須可以。
