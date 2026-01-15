'use client';

import { motion } from 'framer-motion';
import { Home, Calendar, Briefcase, FileText, Settings, LogOut, Users, Clock } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard' },
    { icon: Clock, label: 'Time Entries', href: '/dashboard/time' },
    { icon: Briefcase, label: 'Projects', href: '/dashboard/projects' },
    { icon: Users, label: 'Employees', href: '/dashboard/employees', role: 'ADMIN' },
    { icon: FileText, label: 'Reports', href: '/dashboard/reports' },
    { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-64 glass border-r border-white/5 flex flex-col"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-neon-purple to-neon-pink bg-clip-text text-transparent">
            Tyotrack
          </h2>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer group
                  ${isActive ? 'bg-primary/20 text-white neon-border' : 'text-muted-foreground hover:bg-white/5 hover:text-white'}
                `}>
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                  <span className="font-medium">{item.label}</span>
                  {isActive && (
                    <motion.div 
                      layoutId="active-pill"
                      className="ml-auto w-1 h-1 rounded-full bg-primary"
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-4 py-3 text-muted-foreground hover:text-destructive transition-colors cursor-pointer capitalize">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="absolute top-0 right-0 p-8">
           <div className="flex items-center gap-3 glass px-4 py-2 rounded-full border-white/5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-neon-pink flex items-center justify-center text-xs font-bold">
                AA
              </div>
              <div className="text-sm font-medium">Acme Admin</div>
           </div>
        </div>
        
        {children}
      </main>
    </div>
  );
}
