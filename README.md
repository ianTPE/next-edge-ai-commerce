# Next.js Edge AI Commerce

> AI 驅動的現代電商平台，採用 Edge-first 架構

## 技術棧

- **Monorepo**: Turborepo + Bun
- **Storefront**: Next.js 15 (Cloudflare Pages)
- **Admin**: Vite + React + Refine (Vercel)
- **API**: Hono (Cloudflare Workers)
- **Database**: Cloudflare D1 (MVP) / Neon Postgres (Phase 2)
- **ORM**: Drizzle
- **Auth**: Better Auth
- **Payment**: Stripe Checkout
- **AI**: Vercel AI SDK

## 專案結構

```
root/
├── apps/
│   ├── storefront/    # Next.js 前台商店
│   ├── api/           # Hono API (Cloudflare Workers)
│   └── admin/         # Vite + Refine 後台管理
├── packages/
│   ├── db/            # Drizzle schema & migrations
│   └── config/        # 共用 TypeScript 設定
└── docs/              # 規格文件
```

## 快速開始

### 1. 安裝依賴

```bash
bun install
```

### 2. 設定環境變數

```bash
cp .env.example .env
# 編輯 .env 填入必要的環境變數
```

### 3. 啟動開發伺服器

```bash
# 啟動所有服務
bun dev

# 或分別啟動
bun --filter @repo/api dev      # API: http://localhost:8787
bun --filter @repo/storefront dev  # Storefront: http://localhost:3000
bun --filter @repo/admin dev    # Admin: http://localhost:5173
```

### 4. 資料庫操作

```bash
# 生成 migration
bun --filter @repo/db generate

# 推送 schema 到 D1
bun --filter @repo/db push

# 開啟 Drizzle Studio
bun --filter @repo/db studio
```

## 開發指南

詳細的開發計劃請參考 `docs/implementation_plan.md`

## 部署

- **Storefront**: Cloudflare Pages
- **Admin**: Vercel
- **API**: Cloudflare Workers

## License

MIT
