"use client";

import { useRef } from "react";
import Link from "next/link";
import { useInView } from "@/components/landing/use-in-view";

type MarqueeHub = { id: string; name: string; countryCode: string };

/** Looping strip of hub links. Pauses on hover, on focus and while off screen. */
export function HubMarquee({ hubs }: { hubs: MarqueeHub[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref);

  const group = (decorative: boolean) => (
    <div className="lp-marquee-group" aria-hidden={decorative || undefined}>
      {hubs.map((hub) => (
        <Link
          key={hub.id}
          href={`/hub/${hub.countryCode.toLowerCase()}/${hub.id}`}
          tabIndex={decorative ? -1 : undefined}
          className="focus-ring inline-flex h-11 items-center gap-2.5 whitespace-nowrap rounded-full border border-line bg-surface-1 px-4 text-sm text-fg-muted transition-ui hover:border-line-strong hover:text-fg"
        >
          <span className="rounded-md bg-surface-3 px-1.5 py-0.5 font-mono text-[11px] text-fg-subtle">
            {hub.countryCode}
          </span>
          {hub.name}
        </Link>
      ))}
    </div>
  );

  return (
    <div ref={ref} data-active={inView} role="region" aria-label="Tech hubs" className="lp-marquee py-1">
      <div className="lp-marquee-track">
        {group(false)}
        {group(true)}
      </div>
    </div>
  );
}
