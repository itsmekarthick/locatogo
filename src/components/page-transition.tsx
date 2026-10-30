import { ViewTransition, type ReactNode } from "react";

/** Wrap a `loading.tsx` skeleton so it fades out when the page replaces it. Pairs with <ContentEnter>. */
export function SkeletonExit({ children }: { children: ReactNode }) {
  return (
    <ViewTransition exit="skeleton-exit" default="none">
      {children}
    </ViewTransition>
  );
}

/** Wrap a page's root element so it fades in over the skeleton it replaces. */
export function ContentEnter({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="content-enter" default="none">
      {children}
    </ViewTransition>
  );
}
