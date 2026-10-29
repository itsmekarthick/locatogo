"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRightIcon, MapPinIcon, SearchIcon, XIcon } from "@/components/ui/icons";

type SearchResultItem = {
  id: string;
  title: string;
  slug: string;
  locality: string;
  short_description?: string | null;
  is_featured?: boolean;
  category_name: string;
  category_icon: string;
  pin_color?: string;
};

export function DetailsAutocompleteSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search query
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setResults([]);
      setIsLoading(false);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places/search?q=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        setResults(data.results || []);
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch (err) {
        console.error("Autocomplete search failed:", err);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to dismiss
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) {
      if (e.key === "Enter" && query.trim().length > 0) {
        router.push(`/?q=${encodeURIComponent(query.trim())}`);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        const selected = results[selectedIndex];
        setIsOpen(false);
        router.push(`/listing/${selected.slug}`);
      } else {
        router.push(`/?q=${encodeURIComponent(query.trim())}`);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleSelect = (slug: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(`/listing/${slug}`);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <SearchIcon className="pointer-events-none absolute left-3.5 size-4 text-fg-subtle" />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="place-search-results"
          aria-autocomplete="list"
          aria-label="Search places by name or address"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim().length >= 3 && results.length > 0) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search places by name or address"
          className="h-10 w-full rounded-full border border-line-strong bg-surface-1 pl-10 pr-10 text-base text-fg outline-none transition-ui placeholder:text-fg-subtle hover:border-fg-subtle focus:border-accent focus:ring-4 focus:ring-accent/15 sm:text-sm pointer-coarse:h-11"
        />
        {isLoading ? (
          <span role="status" aria-label="Searching" className="absolute right-3.5 size-4 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
        ) : query.length > 0 ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              setResults([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="focus-ring absolute right-1.5 grid size-8 place-items-center rounded-full text-fg-subtle transition-colors hover:bg-surface-3 hover:text-fg"
          >
            <XIcon className="size-4" />
          </button>
        ) : null}
      </div>

      {/* Autocomplete Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full z-[var(--z-dropdown)] mt-2 w-[min(28rem,calc(100vw-2rem))] min-w-full overflow-hidden rounded-2xl border border-line bg-surface-2 elev-lg animate-in fade-in-0 zoom-in-95 duration-150">
          {results.length > 0 ? (
            <div className="py-2">
              <div className="flex items-center justify-between border-b border-line px-3.5 py-1.5 text-xs text-fg-subtle">
                <span className="font-medium">Places ({results.length})</span>
                <span className="max-sm:hidden">↑↓ to navigate</span>
              </div>
              <ul id="place-search-results" role="listbox" className="max-h-[340px] divide-y divide-line overflow-y-auto overscroll-contain">
                {results.map((item, index) => (
                  <li key={item.id} role="option" aria-selected={selectedIndex === index}>
                    <button
                      type="button"
                      onClick={() => handleSelect(item.slug)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`focus-ring flex w-full items-start gap-3 px-3.5 py-2.5 text-left transition-colors ${
                        selectedIndex === index ? "bg-surface-3" : "hover:bg-surface-3/60"
                      }`}
                    >
                      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-base text-accent-text">
                        <MapPinIcon />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-fg">{item.title}</p>
                        <p className="mt-0.5 truncate text-xs text-fg-subtle">
                          {item.locality} · {item.category_name}
                        </p>
                        {item.short_description && <p className="mt-0.5 truncate text-xs text-fg-subtle">{item.short_description}</p>}
                      </div>
                      <ArrowRightIcon className="size-4 shrink-0 self-center text-fg-subtle" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="border-t border-line p-2">
                <Link
                  href={`/?q=${encodeURIComponent(query.trim())}`}
                  onClick={() => setIsOpen(false)}
                  className="focus-ring block rounded-lg py-1.5 text-center text-sm font-medium text-accent-text hover:underline"
                >
                  Explore all results for &quot;{query.trim()}&quot; on the live map
                </Link>
              </div>
            </div>
          ) : query.trim().length >= 3 && !isLoading ? (
            <div className="p-5 text-center">
              <p className="text-sm font-medium text-fg">No matching places found</p>
              <p className="mt-1 text-xs text-fg-subtle">Try schools, hospitals, cafes, tech parks or neighborhoods.</p>
              <Link
                href={`/?q=${encodeURIComponent(query.trim())}`}
                onClick={() => setIsOpen(false)}
                className="focus-ring mt-3 inline-flex rounded-full border border-line-strong bg-surface-1 px-3 py-1.5 text-xs font-medium text-fg transition-colors hover:bg-surface-3"
              >
                Search on the live map
              </Link>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
