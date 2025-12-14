import Link from 'next/link';

// TODO: Fetch from API
async function getProducts() {
  // Placeholder data
  return [
    { id: '1', name: '商品 A', slug: 'product-a', priceCents: 29900, description: '優質商品 A' },
    { id: '2', name: '商品 B', slug: 'product-b', priceCents: 39900, description: '優質商品 B' },
    { id: '3', name: '商品 C', slug: 'product-c', priceCents: 19900, description: '優質商品 C' },
  ];
}

function formatPrice(cents: number) {
  return `NT$ ${(cents / 100).toLocaleString()}`;
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold">
            Edge AI Commerce
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/products" className="font-medium text-gray-900">
              商品
            </Link>
            <Link href="/cart" className="text-gray-600 hover:text-gray-900">
              購物車
            </Link>
          </nav>
        </div>
      </header>

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-2xl font-bold">所有商品</h1>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="group rounded-lg border bg-white p-4 transition hover:shadow-lg"
            >
              <div className="mb-4 aspect-square rounded-md bg-gray-100"></div>
              <h2 className="font-medium text-gray-900 group-hover:text-black">{product.name}</h2>
              <p className="text-sm text-gray-500">{product.description}</p>
              <p className="mt-2 font-bold text-gray-900">{formatPrice(product.priceCents)}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
