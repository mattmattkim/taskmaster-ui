'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r bg-background transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!isCollapsed && <h2 className="text-lg font-semibold text-foreground">Taskmaster</h2>}
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-8 w-8">
          {isCollapsed ? (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          )}
        </Button>
      </div>

      {/* Project Selector */}
      <div className="p-4 border-b">
        {!isCollapsed ? (
          <div>
            <label className="text-sm font-medium text-muted-foreground">Project</label>
            <select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option>Taskmaster UI</option>
            </select>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-medium">T</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <div className="space-y-1">
          {!isCollapsed && (
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Views
            </h3>
          )}

          <Button variant="ghost" className={cn('w-full justify-start', isCollapsed && 'px-2')}>
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            {!isCollapsed && 'Kanban Board'}
          </Button>

          <Button variant="ghost" className={cn('w-full justify-start', isCollapsed && 'px-2')}>
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
            {!isCollapsed && 'List View'}
          </Button>

          <Button variant="ghost" className={cn('w-full justify-start', isCollapsed && 'px-2')}>
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            {!isCollapsed && 'Analytics'}
          </Button>
        </div>

        {/* Filters */}
        <div className="pt-4">
          {!isCollapsed && (
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Filters
            </h3>
          )}

          <Button variant="ghost" className={cn('w-full justify-start', isCollapsed && 'px-2')}>
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {!isCollapsed && 'Pending'}
          </Button>

          <Button variant="ghost" className={cn('w-full justify-start', isCollapsed && 'px-2')}>
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {!isCollapsed && 'Completed'}
          </Button>

          <Button variant="ghost" className={cn('w-full justify-start', isCollapsed && 'px-2')}>
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            {!isCollapsed && 'Tags'}
          </Button>
        </div>
      </nav>
    </aside>
  );
}
