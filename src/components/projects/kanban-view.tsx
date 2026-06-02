// components/project/KanbanView.tsx
'use client';

import { KanbanColumn } from './kanban-colum';  // <-- Perbaiki path & nama file
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Column, Task } from '../../types/index';        // <-- Perbaiki path (asumsi types.ts di folder sama)

interface KanbanViewProps {
  columns: Column[];
  overColumnId: string | null;
  onOpenDetail: (taskId: string) => void;
  onOpenEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  canScrollLeft: boolean;
  canScrollRight: boolean;
  onScrollLeft: () => void;
  onScrollRight: () => void;
  currentUserRole: string; // ← TAMBAHKAN PROP INI
}

export default function KanbanView({
  columns,
  overColumnId,
  onOpenDetail,
  onOpenEdit,
  onDelete,
  scrollContainerRef,
  canScrollLeft,
  canScrollRight,
  onScrollLeft,
  onScrollRight,
  currentUserRole, // ← TAMBAHKAN PROP INI
}: KanbanViewProps) {
  return (
    <div className="relative h-full">
      {/* Container utama dengan ref untuk scroll */}
      <div
        ref={scrollContainerRef}
        className="flex flex-row gap-4 h-full min-w-0 pb-6 overflow-x-auto snap-x snap-mandatory px-4 md:px-0 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            isOver={overColumnId === column.id}
            onOpenDetail={onOpenDetail}
            onOpenEdit={onOpenEdit}
            onDelete={onDelete}
            currentUserRole={currentUserRole} // ← PASS KE KANBANCOLUMN
            
          />
        ))}
      </div>

      {/* Gradient overlay kiri & kanan */}
      <div
        className={`pointer-events-none absolute inset-y-0 right-0 w-20 bg-linear-to-l from-background to-transparent transition-opacity duration-300 md:block hidden ${
          canScrollRight ? 'opacity-70' : 'opacity-0'
        }`}
      />
      <div
        className={`pointer-events-none absolute inset-y-0 left-0 w-20 bg-linear-to-r from-background to-transparent transition-opacity duration-300 md:block hidden ${
          canScrollLeft ? 'opacity-70' : 'opacity-0'
        }`}
      />

      {/* Tombol scroll kiri */}
      {canScrollLeft && (
        <button
          onClick={onScrollLeft}
          className="cursor-pointer absolute left-4 top-1/2 -translate-y-1/2 z-10 hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-background/80 backdrop-blur shadow hover:bg-background transition-all"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {/* Tombol scroll kanan */}
      {canScrollRight && (
        <button
          onClick={onScrollRight}
          className="cursor-pointer absolute right-4 top-1/2 -translate-y-1/2 z-10 hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-background/80 backdrop-blur shadow hover:bg-background transition-all"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
