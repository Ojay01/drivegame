import { useEffect, RefObject } from 'react';

/**
 * Hook to detect clicks outside of a specified element
 * @param ref React ref of the element to watch
 * @param handler Callback function to run when click is outside
 */
const useClickOutside = <T extends HTMLElement>(
  ref: RefObject<T>, 
  handler: (event: MouseEvent | TouchEvent) => void
) => {
  useEffect(() => {
    // Handler to call on mouse click
    const listener = (event: MouseEvent | TouchEvent) => {
      // Do nothing if clicking ref's element or descendant elements
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      
      // Call the handler if click is outside
      handler(event);
    };

    // Add event listeners for both mouse and touch events
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    // Cleanup the event listeners on component unmount
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]); // Recreate if ref or handler changes
};

export default useClickOutside;

// Usage examples:
// const ref = useRef(null);
// useClickOutside(ref, () => {
//   // Close dropdown, reset state, etc.
//   setIsOpen(false);
// });
//
// <div ref={ref}>
//   {/* Your component content */}
// </div>