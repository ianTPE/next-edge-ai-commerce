import Link from 'next/link';

export default function CheckoutPage() {
  // TODO: Get cart from client-side store and validate

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold">
            Edge AI Commerce
          </Link>
        </div>
      </header>

      {/* Checkout Content */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-2xl font-bold">結帳</h1>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Order Summary */}
          <div className="rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-lg font-bold">訂單摘要</h2>
            <p className="text-gray-500">您的購物車是空的</p>
          </div>

          {/* Checkout Form */}
          <div className="rounded-lg border bg-white p-6">
            <h2 className="mb-4 text-lg font-bold">付款資訊</h2>
            <p className="mb-4 text-sm text-gray-500">
              點擊下方按鈕將導向 Stripe 安全付款頁面
            </p>
            <button
              className="w-full rounded-lg bg-black py-3 text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
              disabled
            >
              前往付款
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
