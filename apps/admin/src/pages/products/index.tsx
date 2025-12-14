import { useList } from '@refinedev/core';
import { Link } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  sku: string;
  priceCents: number;
  stockQuantity: number;
  isActive: boolean;
}

export function ProductList() {
  const { data, isLoading } = useList<Product>({
    resource: 'products/all',
  });

  const products = data?.data || [];

  function formatPrice(cents: number) {
    return `NT$ ${(cents / 100).toLocaleString()}`;
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">商品管理</h1>
        <button className="rounded-lg bg-black px-4 py-2 text-white hover:bg-gray-800">
          新增商品
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">載入中...</div>
      ) : (
        <div className="rounded-lg bg-white shadow-sm">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">名稱</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">SKU</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">價格</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">庫存</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">狀態</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4">{product.name}</td>
                  <td className="px-6 py-4 text-gray-500">{product.sku}</td>
                  <td className="px-6 py-4">{formatPrice(product.priceCents)}</td>
                  <td className="px-6 py-4">{product.stockQuantity}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-xs ${
                        product.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {product.isActive ? '上架中' : '已下架'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/products/${product.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      編輯
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function ProductEdit() {
  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">編輯商品</h1>
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <p className="text-gray-500">商品編輯表單（待實作）</p>
      </div>
    </div>
  );
}
