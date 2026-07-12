import { useEffect, useRef } from 'react';

/**
 * Standard modal accessibility behaviors, attached via the returned ref
 * on the modal's panel element (not the overlay):
 *  - Escape closes the modal
 *  - Tab / Shift+Tab is trapped within the modal's focusable elements
 *  - Focus moves into the modal on mount, and returns to the
 *    previously focused element on unmount
 */
export function useModalA11y(onClose) {
  const containerRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const container = containerRef.current;
    const focusableSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    container?.querySelectorAll(focusableSelector)?.[0]?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !container) return;

      const focusable = Array.from(container.querySelectorAll(focusableSelector)).filter(
        (el) => !el.hasAttribute('disabled')
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return containerRef;
}