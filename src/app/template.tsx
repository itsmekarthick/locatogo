import type { ReactNode } from "react";

export default function Template({ children }: { children: ReactNode }) {
  return <div className="animate-route-fade flex w-full flex-1 flex-col">{children}</div>;
}
