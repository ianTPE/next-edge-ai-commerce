# 部署指南

本文件說明如何將專案部署到 Cloudflare 和 Vercel。

## 前置需求

1. [Cloudflare 帳號](https://dash.cloudflare.com/sign-up)
2. [Vercel 帳號](https://vercel.com/signup)
3. 安裝 Wrangler CLI: `bun add -g wrangler`
4. 登入 Wrangler: `wrangler login`

---

## 1. API 部署 (Cloudflare Workers)

### 1.1 建立 D1 資料庫

```bash
cd apps/api
wrangler d1 create ec-demo
```

執行後會顯示類似：

```
✅ Successfully created DB 'ec-demo'
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**將 `database_id` 複製到 `apps/api/wrangler.toml`**

### 1.2 建立 R2 儲存桶

```bash
wrangler r2 bucket create ec-media
```

### 1.3 設定 Secrets

```bash
# 產生一個隨機的 auth secret
wrangler secret put BETTER_AUTH_SECRET
# 輸入一個隨機字串，例如: openssl rand -base64 32

# Stripe keys (從 Stripe Dashboard 取得)
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET

# OpenAI API Key (選用，用於 AI 功能)
wrangler secret put OPENAI_API_KEY
```

### 1.4 初始化資料庫 Schema

```bash
# 在 packages/db 目錄生成 migration
cd ../../packages/db
bun run generate

# 推送 schema 到 D1
bun run push
```

### 1.5 部署 API

```bash
cd ../../apps/api
wrangler deploy
```

部署成功後會顯示 Worker URL，例如：

```
https://ec-api.YOUR_SUBDOMAIN.workers.dev
```

**記下這個 URL，後續設定需要用到**

---

## 2. Admin 部署 (Vercel)

### 2.1 連接 GitHub Repo

1. 前往 [Vercel Dashboard](https://vercel.com/dashboard)
2. 點擊 "Add New Project"
3. 選擇你的 GitHub repo
4. 設定：
   - **Framework Preset**: Vite
   - **Root Directory**: `apps/admin`
   - **Build Command**: `bun run build`
   - **Output Directory**: `dist`

### 2.2 設定環境變數

在 Vercel Project Settings > Environment Variables 新增：

| Name                | Value                                       |
| ------------------- | ------------------------------------------- |
| `VITE_API_BASE_URL` | `https://ec-api.YOUR_SUBDOMAIN.workers.dev` |

### 2.3 部署

點擊 "Deploy" 按鈕，Vercel 會自動建置並部署。

部署成功後會得到 URL，例如：

```
https://your-admin.vercel.app
```

---

## 3. Storefront 部署 (Cloudflare Pages)

### 3.1 方法 A: 透過 Cloudflare Dashboard (推薦)

1. 前往 [Cloudflare Dashboard](https://dash.cloudflare.com/) > Pages
2. 點擊 "Create a project" > "Connect to Git"
3. 選擇你的 GitHub repo
4. 設定：
   - **Project name**: `storefront` (或你喜歡的名稱)
   - **Production branch**: `main`
   - **Framework preset**: Next.js
   - **Root directory**: `apps/storefront`
   - **Build command**: `bun run pages:build`
   - **Build output directory**: `.vercel/output/static`

5. 新增環境變數：
   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_API_BASE_URL` | `https://ec-api.YOUR_SUBDOMAIN.workers.dev` |

6. 點擊 "Save and Deploy"

### 3.2 方法 B: 透過 CLI

```bash
cd apps/storefront

# 建置
bun run build
bun run pages:build

# 部署
wrangler pages deploy .vercel/output/static --project-name=storefront
```

---

## 4. 更新 CORS 設定

部署完成後，需要更新 API 的 CORS 設定：

編輯 `apps/api/wrangler.toml`：

```toml
[vars]
CORS_ORIGIN = "https://storefront.pages.dev,https://your-admin.vercel.app"
```

然後重新部署 API：

```bash
cd apps/api
wrangler deploy
```

---

## 5. 設定 Stripe Webhook

1. 前往 [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. 點擊 "Add endpoint"
3. 設定：
   - **Endpoint URL**: `https://ec-api.YOUR_SUBDOMAIN.workers.dev/api/webhook/stripe`
   - **Events to send**:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`

4. 複製 Webhook Signing Secret，更新到 Workers：
   ```bash
   wrangler secret put STRIPE_WEBHOOK_SECRET
   ```

---

## 驗證部署

### 檢查 API

```bash
curl https://ec-api.YOUR_SUBDOMAIN.workers.dev/health
# 應該返回: {"status":"ok","timestamp":...}
```

### 檢查 Storefront

瀏覽器開啟 `https://storefront.pages.dev`

### 檢查 Admin

瀏覽器開啟 `https://your-admin.vercel.app`

---

## 常見問題

### Q: D1 資料庫連線失敗

確認 `wrangler.toml` 中的 `database_id` 正確。

### Q: CORS 錯誤

確認 `CORS_ORIGIN` 包含所有前端 URL（用逗號分隔）。

### Q: Stripe Webhook 失敗

1. 確認 Webhook URL 正確
2. 確認 `STRIPE_WEBHOOK_SECRET` 已設定
3. 檢查 Stripe Dashboard 的 Webhook logs

### Q: 圖片上傳失敗

確認 R2 bucket 已建立且名稱與 `wrangler.toml` 一致。
