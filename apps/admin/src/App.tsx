import { Refine } from '@refinedev/core';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import routerBindings from '@refinedev/react-router-v6';
import dataProvider from '@refinedev/simple-rest';

import { Layout } from './components/Layout';
import { Dashboard } from './pages/dashboard';
import { ProductList, ProductEdit } from './pages/products';
import { OrderList, OrderShow } from './pages/orders';
import { AICopilot } from './pages/ai';
import { Login } from './pages/login';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787/api';

function App() {
  return (
    <BrowserRouter>
      <Refine
        dataProvider={dataProvider(API_URL)}
        routerProvider={routerBindings}
        resources={[
          {
            name: 'products',
            list: '/products',
            edit: '/products/:id',
            meta: { label: '商品管理' },
          },
          {
            name: 'orders',
            list: '/orders',
            show: '/orders/:id',
            meta: { label: '訂單管理' },
          },
        ]}
        options={{
          syncWithLocation: true,
          warnWhenUnsavedChanges: true,
        }}
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <Layout>
                <Outlet />
              </Layout>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/products/:id" element={<ProductEdit />} />
            <Route path="/orders" element={<OrderList />} />
            <Route path="/orders/:id" element={<OrderShow />} />
            <Route path="/ai" element={<AICopilot />} />
          </Route>
        </Routes>
      </Refine>
    </BrowserRouter>
  );
}

export default App;
