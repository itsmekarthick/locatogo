import { ViewTransition, type ReactNode } from "react";

/**
 * Route changes crossfade through the View Transitions API where supported (React turns navigations into
 * view transitions); other browsers fall back to the `.route-shell` fade-up in globals.css.
 */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <ViewTransition default="none" enter="route-enter" exit="route-exit">
      <div className="route-shell flex w-full flex-1 flex-col">{children}</div>
    </ViewTransition>
  );
}
