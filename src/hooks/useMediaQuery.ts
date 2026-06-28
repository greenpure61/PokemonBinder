import { useCallback, useSyncExternalStore } from "react";

/**
 * Tracks a CSS media query via `useSyncExternalStore` — SSR-safe (the server
 * snapshot is `false`, so hydration matches) and free of setState-in-effect. The
 * binder editor gates its real UI behind a loading spinner, so this resolves
 * before the editor paints — no visible flash between the desktop/mobile layouts.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query]
  );

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
