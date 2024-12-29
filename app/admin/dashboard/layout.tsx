'use client';

import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation';

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
  const [activeTab, setActiveTab] = useState('notifications');
  const router = useRouter();

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === 'notifications') {
      router.push('/admin/dashboard');
    } else if (tabId === 'registrations') {
      router.push('/admin/dashboard/registrations');
    }
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
      // Continue with redirect even if the API call fails
      router.push('/admin/login');
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
        
        <Card className="mb-4">
          <div className="flex overflow-x-auto">
            {TABS.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                className="rounded-none"
                onClick={() => handleTabClick(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </Card>
        {children}
      </div>
    </div>
  );
} 