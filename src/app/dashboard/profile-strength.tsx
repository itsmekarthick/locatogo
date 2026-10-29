import Link from "next/link";
import { CheckIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";
import "@/components/admin/admin.css";

export type StrengthItem = { label: string; done: boolean; href: string; hint: string };

export function ProfileStrength({ items }: { items: StrengthItem[] }) {
  const done = items.filter((item) => item.done).length;
  const ratio = items.length ? done / items.length : 0;
  const percent = Math.round(ratio * 100);
  const complete = done === items.length;

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-4 sm:flex-nowrap">
      <div className="relative size-24 shrink-0" role="img" aria-label={`Profile ${percent} percent complete`}>
        <svg viewBox="0 0 100 100" className="size-full -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="var(--surface-3)" strokeWidth="9" />
          <circle
            cx="50"
            cy="50"
            r="42"
            pathLength={1}
            fill="none"
            stroke={complete ? "var(--success)" : "var(--accent)"}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={1}
            strokeDashoffset={1 - ratio}
            className="adm-line"
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <p className="font-display text-2xl font-semibold leading-none tracking-tight" aria-hidden="true">
            {percent}
            <span className="text-sm text-fg-muted">%</span>
          </p>
        </div>
      </div>

      <div className="min-w-0 flex-1 basis-48">
        <p className="text-sm font-medium">{complete ? "Your profile is complete" : "Profile strength"}</p>
        <p className="mt-0.5 text-xs text-fg-subtle">{complete ? "You are ready for the best matches." : `${items.length - done} step${items.length - done === 1 ? "" : "s"} left to stand out.`}</p>
        <ul role="list" className="mt-3 space-y-1.5">
          {items.map((item) => (
            <li key={item.label} className="flex items-center gap-2 text-[13px]">
              <span aria-hidden="true" className={cn("grid size-4 shrink-0 place-items-center rounded-full", item.done ? "bg-success text-surface-1" : "border border-line-strong")}>
                {item.done && <CheckIcon className="size-3" />}
              </span>
              {item.done ? (
                <span className="text-fg-muted line-through decoration-fg-subtle/60">{item.label}</span>
              ) : (
                <Link href={item.href} className="focus-ring rounded font-medium text-fg hover:text-accent-text">
                  {item.hint}
                </Link>
              )}
              {item.done && <span className="sr-only">Done</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
