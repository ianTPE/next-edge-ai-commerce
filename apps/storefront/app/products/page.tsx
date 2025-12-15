import Link from 'next/link';
import Image from 'next/image';

export const runtime = 'edge';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://ec-api.ertiach.workers.dev';
const R2_BASE_URL = 'https://pub-376ad58b5142480bbd54b6f33055bfb1.r2.dev';

function getProductImageUrl(slug: string): string {
  return `${R2_BASE_URL}/images/products/${slug}.png`;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceCents: number;
  compareAtPriceCents: number | null;
  stockQuantity: number;
  isActive: boolean;
}

interface ProductsResponse {
  ok: boolean;
  data: {
    items: Product[];
    page: number;
    pageSize: number;
    total: number;
  };
}

async function getProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/products`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error('Failed to fetch products:', res.status);
      return [];
    }
    const json: ProductsResponse = await res.json();
    return json.data?.items || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
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
        {products.length === 0 ? (
          <p className="text-gray-500">目前沒有商品</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group rounded-lg border bg-white p-4 transition hover:shadow-lg"
              >
                <div className="relative mb-4 aspect-square overflow-hidden rounded-md bg-gray-100">
                  <Image
                    src={getProductImageUrl(product.slug)}
                    alt={product.name}
                    fill
                    className="object-cover transition group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>
                <h2 className="font-medium text-gray-900 group-hover:text-black">{product.name}</h2>
                <p className="line-clamp-2 text-sm text-gray-500">{product.description}</p>
                <div className="mt-2 flex items-center gap-2">
                  <p className="font-bold text-gray-900">{formatPrice(product.priceCents)}</p>
                  {product.compareAtPriceCents && (
                    <p className="text-sm text-gray-400 line-through">
                      {formatPrice(product.compareAtPriceCents)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
