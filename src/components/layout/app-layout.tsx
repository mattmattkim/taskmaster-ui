'use client';

import { Sidebar } from './sidebar';
import { TopNav } from './top-nav';
import { MainContent } from './main-content';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function AppLayout({ children, className }: AppLayoutProps) {
  return (
    <div className={cn('flex h-screen bg-background', className)}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navigation */}
        <TopNav />

        {/* Main Content */}
        <MainContent>{children}</MainContent>
      </div>
    </div>
  );
}
