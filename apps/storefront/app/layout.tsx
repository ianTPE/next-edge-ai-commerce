import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Edge AI Commerce',
  description: 'Modern e-commerce powered by AI and Edge computing',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
