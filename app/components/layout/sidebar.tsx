'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const menuItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: '📊',
  },
  {
    title: 'Juez Final',
    href: '/#juez-final',
    icon: '⚖️',
  },
  {
    title: 'Estadísticas',
    href: '/estadisticas',
    icon: '📈',
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-border bg-card p-6 lg:block"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Protocolo Lyra
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Dashboard Predictivo
        </p>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href === '/#juez-final' && pathname === '/');
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors
                ${
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }
              `}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-6 left-6 right-6">
        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <p className="text-xs text-muted-foreground text-center">
            Análisis basado en IA y estadísticas avanzadas
          </p>
        </div>
      </div>
    </motion.aside>
  );
}

