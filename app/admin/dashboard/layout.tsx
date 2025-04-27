'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
}

const TABS: Tab[] = [
  { id: 'notifications', label: 'Notification Subscriptions' },
  { id: 'registrations', label: 'User Registrations' },
  // Add more tabs here as needed
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState('notifications');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Sync active tab with URL
  useEffect(() => {
    if (pathname.includes('/admin/dashboard/registrations')) {
      setActiveTab('registrations');
    } else if (pathname.includes('/admin/dashboard')) {
      setActiveTab('notifications');
    }
    // Add more tab path checks as you add more tabs
  }, [pathname]);

  const handleTabClick = (tabId: string) => {
    if (tabId === 'notifications') {
      router.push('/admin/dashboard');
    } else if (tabId === 'registrations') {
      router.push('/admin/dashboard/registrations');
    }
    setDrawerOpen(false); // Close drawer on mobile
    // No need to setActiveTab here, as the effect will update it based on the URL
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/admin/login');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top navigation bar for all screens */}
      <nav className="fixed top-0 left-0 right-0 z-30 bg-white/90 shadow flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Image src="/YASHVI LOGO 1 PNG.png" alt="Logo" width={40} height={40} className="mr-2" />
          <span className="text-lg font-bold text-primary">Admin Dashboard</span>
        </div>
        {/* Desktop tab navigation */}
        <div className="hidden md:flex items-center gap-2 flex-1 justify-center">
          {TABS.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              className={`rounded-lg px-4 py-2 text-base font-medium transition-colors ${activeTab === tab.id ? 'bg-primary text-white shadow' : 'hover:bg-primary/10 text-gray-800'}`}
              onClick={() => handleTabClick(tab.id)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
        {/* Desktop logout button */}
        <div className="hidden md:flex items-center">
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
        {/* Mobile hamburger menu */}
        <button
          className="md:hidden p-2 rounded-full hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/50"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={28} />
        </button>
      </nav>
      {/* Mobile drawer menu */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 flex">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu overlay"
          />
          {/* Drawer */}
          <nav className="relative w-64 bg-white h-full shadow-lg flex flex-col py-8 px-4 animate-slide-in-left">
            <button
              className="absolute top-3 right-3 p-2 rounded-full hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/50"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
            <div className="flex flex-col items-center mb-10 mt-2">
              <Image src="/YASHVI LOGO 1 PNG.png" alt="Logo" width={48} height={48} className="mb-2" />
              <h1 className="text-lg font-bold text-primary text-center">Admin Dashboard</h1>
            </div>
            <ul className="space-y-2 mt-6">
              {TABS.map((tab) => (
                <li key={tab.id}>
                  <button
                    className={`w-full text-left rounded-lg px-4 py-2 text-base font-medium transition-colors ${activeTab === tab.id ? 'bg-primary text-white shadow' : 'hover:bg-primary/10 text-gray-800'}`}
                    onClick={() => handleTabClick(tab.id)}
                  >
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-8 flex flex-col items-center">
              <Button variant="outline" onClick={handleLogout} className="w-full">
                Logout
              </Button>
            </div>
          </nav>
        </div>
      )}
      {/* Main Content: add top padding for nav bar */}
      <main className="flex-1 p-4 md:p-8 bg-background min-h-screen w-full pt-20">
        <div className="max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
      {/* Add slide-in animation for drawer */}
      <style jsx global>{`
        @keyframes slide-in-left {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </div>
  );
} 