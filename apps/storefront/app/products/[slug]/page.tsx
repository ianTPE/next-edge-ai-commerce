import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';

export const runtime = 'edge';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://ec-api.ertiach.workers.dev';
const R2_BASE_URL = 'https://pub-376ad58b5142480bbd54b6f33055bfb1.r2.dev';

interface ProductImage {
  id: string;
  productId: string;
  url: string;
  sortOrder: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string | null;
  priceCents: number;
  compareAtPriceCents: number | null;
  stockQuantity: number;
  isActive: boolean;
  images: ProductImage[];
}

interface ProductResponse {
  ok: boolean;
  data: Product;
}

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/products/${slug}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      return null;
    }
    const json: ProductResponse = await res.json();
    return json.data || null;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

function formatPrice(cents: number) {
  return `NT$ ${(cents / 100).toLocaleString()}`;
}

function getProductImageUrl(slug: string): string {
  return `${R2_BASE_URL}/images/products/${slug}.png`;
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
          <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
            <Image
              src={product.images?.[0]?.url || getProductImageUrl(product.slug)}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>

          {/* Info */}
          <div>
            <h1 className="mb-4 text-3xl font-bold">{product.name}</h1>
            <div className="mb-4 flex items-center gap-3">
              <p className="text-2xl font-bold text-gray-900">
                {formatPrice(product.priceCents)}
              </p>
              {product.compareAtPriceCents && (
                <p className="text-lg text-gray-400 line-through">
                  {formatPrice(product.compareAtPriceCents)}
                </p>
              )}
            </div>
            <p className="mb-6 text-gray-600">{product.description}</p>

            <div className="mb-6 flex items-center gap-4">
              <span
                className={`inline-block rounded-full px-3 py-1 text-sm ${
                  product.stockQuantity > 0
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {product.stockQuantity > 0 ? `庫存: ${product.stockQuantity}` : '缺貨中'}
              </span>
              <span className="text-sm text-gray-500">SKU: {product.sku}</span>
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
