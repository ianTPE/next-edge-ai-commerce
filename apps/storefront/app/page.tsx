import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
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
            <Link href="/cart" className="text-gray-600 hover:text-gray-900">
              購物車
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4 py-20 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          AI 驅動的現代電商
        </h1>
        <p className="mb-8 max-w-2xl text-lg text-gray-600">
          採用 Edge-first 架構，結合 AI 技術，為您提供極速購物體驗
        </p>
        <Link
          href="/products"
          className="rounded-lg bg-black px-8 py-3 text-white transition hover:bg-gray-800"
        >
          開始購物
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4 text-center text-gray-500">
          <p>© 2024 Edge AI Commerce. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
