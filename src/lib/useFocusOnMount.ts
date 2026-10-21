import { useEffect, useRef } from 'react';

/**
 * Focuses the element once when it mounts. Used on each screen's heading so that,
 * after switching screens, keyboard and screen reader users land on the new screen
 * instead of on a button that no longer exists.
 */
export function useFocusOnMount<T extends HTMLElement>() {
    const ref = useRef<T>(null);
    useEffect(() => {
        ref.current?.focus();
    }, []);
    return ref;
}
