import { KanbanBoard } from '@/components/kanban';

export default function HomePage() {
  return (
    <div className="flex h-screen bg-background">
      <main className="flex-1 overflow-hidden">
        <KanbanBoard />
      </main>
    </div>
  );
} 