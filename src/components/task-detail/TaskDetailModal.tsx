'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskDetail, useFocusTrap } from '@/hooks';
import { TaskDetail } from './TaskDetail';

interface TaskDetailModalProps {
  variant?: 'modal' | 'sidebar';
}

export function TaskDetailModal({ variant: propVariant }: TaskDetailModalProps) {
  const { isTaskDetailOpen, setTaskDetailOpen } = useTaskDetail();
  const focusTrapRef = useFocusTrap(isTaskDetailOpen);

  // Determine variant based on prop or screen size
  const [screenVariant, setScreenVariant] = useState<'modal' | 'sidebar'>('sidebar');
  
  useEffect(() => {
    const handleResize = () => {
      setScreenVariant(window.innerWidth < 768 ? 'modal' : 'sidebar');
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const variant = propVariant || screenVariant;

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTaskDetailOpen) {
        setTaskDetailOpen(false);
      }
    };

    if (isTaskDetailOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isTaskDetailOpen, setTaskDetailOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isTaskDetailOpen && variant === 'modal') {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isTaskDetailOpen, variant]);

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: 20,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 30,
        stiffness: 300,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: {
        duration: 0.2,
      },
    },
  };

  const sidebarVariants = {
    hidden: {
      x: '100%',
    },
    visible: {
      x: 0,
      transition: {
        type: 'spring',
        damping: 30,
        stiffness: 300,
      },
    },
    exit: {
      x: '100%',
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <AnimatePresence>
      {isTaskDetailOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 bg-black/50 z-40"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={() => setTaskDetailOpen(false)}
          />

          {/* Modal/Sidebar Container */}
          <motion.div
            key="task-detail"
            ref={focusTrapRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-detail-title"
            aria-describedby="task-detail-description"
            className={`
              fixed z-50
              ${variant === 'modal' 
                ? 'inset-4 sm:inset-8 md:inset-12 lg:inset-24 xl:inset-32' 
                : 'top-0 right-0 h-full w-full md:w-[600px] lg:w-[700px]'
              }
            `}
            variants={variant === 'modal' ? modalVariants : sidebarVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className={`
              h-full overflow-hidden
              ${variant === 'modal' 
                ? 'rounded-lg shadow-2xl' 
                : 'shadow-xl'
              }
            `}>
              <TaskDetail />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Also create a hook for easier usage
export function useTaskDetailModal() {
  const { isTaskDetailOpen, setTaskDetailOpen, selectedTaskId, setSelectedTaskId } = useTaskDetail();

  const openTaskDetail = (taskId: number) => {
    setSelectedTaskId(taskId);
    setTaskDetailOpen(true);
  };

  const closeTaskDetail = () => {
    setTaskDetailOpen(false);
    // Optionally clear the selected task after animation completes
    setTimeout(() => setSelectedTaskId(null), 200);
  };

  return {
    isOpen: isTaskDetailOpen,
    selectedTaskId,
    openTaskDetail,
    closeTaskDetail,
  };
} 