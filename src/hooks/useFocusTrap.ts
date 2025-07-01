import { useEffect, useRef } from 'react';

export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableSelector = 
      'button:not([disabled]), ' +
      'input:not([disabled]), ' +
      'select:not([disabled]), ' +
      'textarea:not([disabled]), ' +
      'a[href], ' +
      '[tabindex]:not([tabindex="-1"])';

    // Get all focusable elements
    const getFocusableElements = () => {
      const elements = container.querySelectorAll(focusableSelector);
      return Array.from(elements) as HTMLElement[];
    };

    // Focus the first focusable element
    const focusFirstElement = () => {
      const elements = getFocusableElements();
      if (elements.length > 0) {
        elements[0].focus();
      }
    };

    // Handle tab key navigation
    const handleTabKey = (e: KeyboardEvent) => {
      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Tab key pressed
      if (e.key === 'Tab') {
        // Shift + Tab (backwards)
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab (forwards)
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    // Store previously focused element
    const previouslyFocused = document.activeElement as HTMLElement;

    // Focus first element when trap becomes active
    setTimeout(() => focusFirstElement(), 0);

    // Add event listener
    container.addEventListener('keydown', handleTabKey);

    // Cleanup
    return () => {
      container.removeEventListener('keydown', handleTabKey);
      // Restore focus to previously focused element
      if (previouslyFocused && previouslyFocused.focus) {
        previouslyFocused.focus();
      }
    };
  }, [isActive]);

  return containerRef;
} 