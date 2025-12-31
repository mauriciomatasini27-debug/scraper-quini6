import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Sidebar } from './components/layout/sidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Protocolo Lyra - Dashboard Predictivo Quini 6',
  description:
    'Dashboard predictivo basado en análisis estadístico avanzado y IA para Quini 6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className={inter.className}>
        <Providers>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto lg:pl-64">
              <div className="container mx-auto p-4 lg:p-8">{children}</div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}

