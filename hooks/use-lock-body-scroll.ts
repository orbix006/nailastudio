import { useEffect } from 'react';

/**
 * Reusable hook to lock the body scroll overflow when modals or drawers are active.
 * Restores original overflow status on unmount or lock toggle changes.
 */
export function useLockBodyScroll(lock: boolean) {
  useEffect(() => {
    if (!lock) return;

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [lock]);
}
