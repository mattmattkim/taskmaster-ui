import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'
import { ThemeProvider } from '@/providers/theme-provider'
import { TaskSyncProvider } from '@/providers/task-sync-provider'
import { QueryProvider } from '@/providers/query-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Taskmaster UI',
  description: 'A modern kanban board interface for Task Master',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          defaultTheme="system"
          storageKey="taskmaster-ui-theme"
        >
          <QueryProvider>
            <TaskSyncProvider>
              {children}
            </TaskSyncProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
} 