import { KanbanBoard } from '@/components/kanban';
import { TaskDetailModal } from '@/components/task-detail';

export default function HomePage() {
  return (
    <div className="flex h-screen bg-background">
      <main className="flex-1 overflow-hidden">
        <KanbanBoard />
      </main>
      <TaskDetailModal />
    </div>
  );
}
