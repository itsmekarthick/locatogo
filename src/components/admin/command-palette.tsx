"use client";

import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_NAV, type AdminNavSection } from "@/components/admin/nav";
import { ArrowRightIcon, SearchIcon } from "@/components/ui/icons";
import { useModalDialog } from "@/components/ui/use-modal-dialog";
import { cn } from "@/lib/utils/cn";

type Command = {
  id: string;
  label: string;
  section: string;
  href: string;
  icon: AdminNavSection["items"][number]["icon"];
  haystack: string;
};

function toCommands(sections: AdminNavSection[]): Command[] {
  return sections.flatMap((section) =>
    section.items.map((item) => ({
      id: item.href,
      label: item.label,
      section: section.title,
      href: item.href,
      icon: item.icon,
      haystack: `${item.label} ${section.title} ${item.keywords ?? ""}`.toLowerCase(),
    })),
  );
}

type Props = { open: boolean; onOpenChange: (open: boolean) => void; sections?: AdminNavSection[] };

/** Cmd/Ctrl+K palette for jumping between admin sections. */
export function AdminCommandPalette({ open, onOpenChange, sections = ADMIN_NAV }: Props) {
  const COMMANDS = useMemo(() => toCommands(sections), [sections]);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setQuery("");
      setActive(0);
    }
  };

  const { ref, dialogProps } = useModalDialog({ open, onOpenChange: handleOpenChange, dismissible: true });

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMANDS;
    return COMMANDS.filter((command) => command.haystack.includes(q)).sort(
      (a, b) => Number(b.label.toLowerCase().startsWith(q)) - Number(a.label.toLowerCase().startsWith(q)),
    );
  }, [query, COMMANDS]);

  const current = Math.min(active, Math.max(results.length - 1, 0));

  function go(command: Command | undefined) {
    if (!command) return;
    handleOpenChange(false);
    router.push(command.href);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      const next = (current + step + results.length) % Math.max(results.length, 1);
      setActive(next);
      listRef.current?.children[next]?.scrollIntoView({ block: "nearest" });
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(results[current]);
    }
  }

  return (
    <dialog
      ref={ref}
      aria-label="Command palette"
      className="ds-dialog"
      style={{ alignItems: "flex-start", paddingTop: "12vh" }}
      {...dialogProps}
    >
      <div className="ds-dialog-panel mx-auto w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface-2 text-fg elev-lg">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <SearchIcon className="size-5 shrink-0 text-fg-subtle" />
          <input
            data-autofocus
            role="combobox"
            aria-expanded="true"
            aria-controls="admin-command-list"
            aria-activedescendant={results[current] ? `cmd-${results[current].id}` : undefined}
            aria-label="Search admin sections"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Jump to a section"
            className="h-14 min-w-0 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-fg-subtle"
          />
          <kbd className="rounded-md border border-line bg-surface-3 px-1.5 py-0.5 font-mono text-[11px] text-fg-subtle">esc</kbd>
        </div>

        <ul ref={listRef} id="admin-command-list" role="listbox" className="max-h-[min(24rem,60dvh)] overflow-y-auto overscroll-contain p-2">
          {results.length === 0 ? (
            <li className="px-3 py-10 text-center text-sm text-fg-muted">No section matches &ldquo;{query}&rdquo;.</li>
          ) : (
            results.map((command, index) => {
              const Icon = command.icon;
              return (
                <li key={command.id} id={`cmd-${command.id}`} role="option" aria-selected={index === current}>
                  <button
                    type="button"
                    onClick={() => go(command)}
                    onMouseMove={() => setActive(index)}
                    className={cn(
                      "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left transition-colors",
                      index === current ? "bg-accent-soft text-accent-text" : "text-fg hover:bg-surface-3",
                    )}
                  >
                    <Icon className="size-5 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{command.label}</span>
                      <span className={cn("block truncate text-xs", index === current ? "text-accent-text/80" : "text-fg-subtle")}>{command.section}</span>
                    </span>
                    {index === current && <ArrowRightIcon className="size-4 shrink-0" />}
                  </button>
                </li>
              );
            })
          )}
        </ul>

        <div className="flex items-center gap-4 border-t border-line px-4 py-2.5 text-xs text-fg-subtle">
          <span>
            <kbd className="rounded border border-line bg-surface-3 px-1 font-mono">↑↓</kbd> navigate
          </span>
          <span>
            <kbd className="rounded border border-line bg-surface-3 px-1 font-mono">↵</kbd> open
          </span>
        </div>
      </div>
    </dialog>
  );
}
