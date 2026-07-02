"use client";

import { UserButton, useAuth } from "@clerk/nextjs";
import { redirect, usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, LayoutDashboard, Brain, Settings, CreditCard, ListChecks, Scale } from "lucide-react";
import { useState } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isLoaded, userId } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  if (!isLoaded) return null;
  if (!userId) redirect("/sign-in");

  const menuItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Agents", href: "/dashboard/agents", icon: Brain },
    { label: "Integrations", href: "/dashboard/integrations", icon: Settings },
    { label: "Tasks", href: "/dashboard/tasks", icon: ListChecks },
    { label: "Legal", href: "/dashboard/legal", icon: Scale },
    { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
  ];

  return (
    <div className="flex h-screen bg-bg-primary">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : -300 }}
        className="fixed md:static w-64 bg-surface border-r border-border h-screen overflow-y-auto z-40 md:translate-x-0"
      >
        <div className="p-6 flex items-center gap-2 border-b border-border">
          <Zap className="w-6 h-6 text-primary" />
          <span className="font-bold text-lg">NEXUS</span>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition cursor-pointer ${
                    isActive
                      ? 'text-primary bg-primary/10 border-l-2 border-primary'
                      : 'text-text-secondary hover:text-primary hover:bg-primary/10'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-6 right-6 p-4 rounded-lg bg-primary/10 border border-primary/30">
          <p className="text-sm text-primary font-semibold mb-2">Upgrade Plan</p>
          <p className="text-xs text-text-2 mb-3">Get more agents and integrations</p>
          <Link href="/dashboard/billing">
            <button className="w-full py-2 bg-primary text-white rounded font-semibold text-sm hover:bg-primary/90">
              Upgrade Now
            </button>
          </Link>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="border-b border-border bg-bg-secondary/50 backdrop-blur px-6 py-4 flex items-center justify-between">
          <div className="md:hidden">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-bg-tertiary rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <UserButton />
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
