import Link from 'next/link';

export default function CartPage() {
  // TODO: Get cart from client-side store
  const cartItems: { id: string; name: string; quantity: number; priceCents: number }[] = [];
  const isEmpty = cartItems.length === 0;

  function formatPrice(cents: number) {
    return `NT$ ${(cents / 100).toLocaleString()}`;
  }

  const total = cartItems.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold">
            Edge AI Commerce
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/products" className="text-gray-600 hover:text-gray-900">
              商品
            </Link>
            <Link href="/cart" className="font-medium text-gray-900">
              購物車
            </Link>
          </nav>
        </div>
      </header>

      {/* Cart Content */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-2xl font-bold">購物車</h1>

        {isEmpty ? (
          <div className="rounded-lg border bg-white p-8 text-center">
            <p className="mb-4 text-gray-500">您的購物車是空的</p>
            <Link
              href="/products"
              className="inline-block rounded-lg bg-black px-6 py-2 text-white transition hover:bg-gray-800"
            >
              繼續購物
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="rounded-lg border bg-white">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 border-b p-4 last:border-b-0">
                    <div className="h-20 w-20 rounded-md bg-gray-100"></div>
                    <div className="flex-1">
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-gray-500">{formatPrice(item.priceCents)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="h-8 w-8 rounded border">-</button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button className="h-8 w-8 rounded border">+</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-lg border bg-white p-6">
              <h2 className="mb-4 text-lg font-bold">訂單摘要</h2>
              <div className="mb-4 flex justify-between border-b pb-4">
                <span>小計</span>
                <span>{formatPrice(total)}</span>
              </div>
              <Link
                href="/checkout"
                className="block w-full rounded-lg bg-black py-3 text-center text-white transition hover:bg-gray-800"
              >
                前往結帳
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
