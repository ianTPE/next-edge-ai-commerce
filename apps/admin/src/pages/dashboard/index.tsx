export function Dashboard() {
  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Stats Cards */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">總訂單數</h3>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">已付款訂單</h3>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">總營收</h3>
          <p className="mt-2 text-3xl font-bold">NT$ 0</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">低庫存商品</h3>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">快速操作</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <button className="rounded-lg bg-white p-4 text-left shadow-sm hover:shadow-md transition">
            <h3 className="font-medium">新增商品</h3>
            <p className="text-sm text-gray-500">建立新的商品</p>
          </button>
          <button className="rounded-lg bg-white p-4 text-left shadow-sm hover:shadow-md transition">
            <h3 className="font-medium">查看訂單</h3>
            <p className="text-sm text-gray-500">管理所有訂單</p>
          </button>
          <button className="rounded-lg bg-white p-4 text-left shadow-sm hover:shadow-md transition">
            <h3 className="font-medium">AI 助手</h3>
            <p className="text-sm text-gray-500">使用 AI 管理商店</p>
          </button>
        </div>
      </div>
    </div>
  );
}
