import Link from 'next/link';
import { notFound } from 'next/navigation';

// TODO: Fetch from API
async function getProduct(slug: string) {
  const products: Record<string, { id: string; name: string; slug: string; priceCents: number; description: string; stockQuantity: number }> = {
    'product-a': { id: '1', name: '商品 A', slug: 'product-a', priceCents: 29900, description: '這是一個優質的商品 A，具有出色的品質和設計。', stockQuantity: 10 },
    'product-b': { id: '2', name: '商品 B', slug: 'product-b', priceCents: 39900, description: '這是一個優質的商品 B，具有出色的品質和設計。', stockQuantity: 5 },
    'product-c': { id: '3', name: '商品 C', slug: 'product-c', priceCents: 19900, description: '這是一個優質的商品 C，具有出色的品質和設計。', stockQuantity: 20 },
  };
  return products[slug] || null;
}

function formatPrice(cents: number) {
  return `NT$ ${(cents / 100).toLocaleString()}`;
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

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
            <Link href="/cart" className="text-gray-600 hover:text-gray-900">
              購物車
            </Link>
          </nav>
        </div>
      </header>

      {/* Product Detail */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Image */}
          <div className="aspect-square rounded-lg bg-gray-100"></div>

          {/* Info */}
          <div>
            <h1 className="mb-4 text-3xl font-bold">{product.name}</h1>
            <p className="mb-4 text-2xl font-bold text-gray-900">
              {formatPrice(product.priceCents)}
            </p>
            <p className="mb-6 text-gray-600">{product.description}</p>

            <div className="mb-6">
              <span
                className={`inline-block rounded-full px-3 py-1 text-sm ${
                  product.stockQuantity > 0
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {product.stockQuantity > 0 ? `庫存: ${product.stockQuantity}` : '缺貨中'}
              </span>
            </div>

            <button
              className="w-full rounded-lg bg-black py-3 text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
              disabled={product.stockQuantity === 0}
            >
              加入購物車
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
