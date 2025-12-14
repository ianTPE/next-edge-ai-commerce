import { useList } from '@refinedev/core';
import { Link } from 'react-router-dom';

interface Order {
  id: string;
  customerEmail: string;
  totalAmountCents: number;
  status: string;
  createdAt: number;
}

export function OrderList() {
  const { data, isLoading } = useList<Order>({
    resource: 'orders',
  });

  const orders = data?.data || [];

  function formatPrice(cents: number) {
    return `NT$ ${(cents / 100).toLocaleString()}`;
  }

  function formatDate(timestamp: number) {
    return new Date(timestamp).toLocaleDateString('zh-TW');
  }

  function getStatusLabel(status: string) {
    const labels: Record<string, { text: string; className: string }> = {
      pending: { text: '待付款', className: 'bg-yellow-100 text-yellow-800' },
      paid: { text: '已付款', className: 'bg-green-100 text-green-800' },
      cancelled: { text: '已取消', className: 'bg-red-100 text-red-800' },
      refunded: { text: '已退款', className: 'bg-gray-100 text-gray-800' },
    };
    return labels[status] || { text: status, className: 'bg-gray-100 text-gray-800' };
  }

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">訂單管理</h1>

      {isLoading ? (
        <div className="text-center py-8">載入中...</div>
      ) : (
        <div className="rounded-lg bg-white shadow-sm">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">訂單編號</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">客戶</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">金額</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">狀態</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">日期</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => {
                const status = getStatusLabel(order.status);
                return (
                  <tr key={order.id}>
                    <td className="px-6 py-4 font-mono text-sm">{order.id.slice(0, 8)}...</td>
                    <td className="px-6 py-4">{order.customerEmail}</td>
                    <td className="px-6 py-4">{formatPrice(order.totalAmountCents)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block rounded-full px-2 py-1 text-xs ${status.className}`}>
                        {status.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{formatDate(order.createdAt)}</td>
                    <td className="px-6 py-4">
                      <Link to={`/orders/${order.id}`} className="text-blue-600 hover:underline">
                        查看
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function OrderShow() {
  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">訂單詳情</h1>
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <p className="text-gray-500">訂單詳情（待實作）</p>
      </div>
    </div>
  );
}
