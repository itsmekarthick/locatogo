"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    <div ref={containerRef} className="relative w-full max-w-[280px] sm:max-w-[340px] md:max-w-[400px]">
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute left-3.5 text-gray-400 text-sm">
          🔍
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim().length >= 3 && results.length > 0) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search places by name or address..."
          className="w-full rounded-full border border-gray-200 bg-gray-50/70 py-2 pl-9 pr-8 text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:border-[#e26a4f] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#e26a4f]/20 transition-all shadow-2xs"
        />
        {isLoading ? (
          <div className="absolute right-3 h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-[#e26a4f]" />
        ) : query.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        ) : null}
      </div>

      {/* Autocomplete Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl animate-in fade-in-0 zoom-in-95 duration-150">
          {results.length > 0 ? (
            <div className="py-2">
              <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 flex justify-between items-center">
                <span>Places ({results.length})</span>
                <span className="text-gray-400 font-normal">Use ↑↓ arrows to navigate</span>
              </div>
              <ul className="max-h-[340px] overflow-y-auto divide-y divide-gray-50">
                {results.map((item, index) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(item.slug)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full text-left px-3.5 py-2.5 flex items-start gap-3 transition-colors ${
                        selectedIndex === index ? "bg-gray-50" : "hover:bg-gray-50/70"
                      }`}
                    >
                      <span className="text-base mt-0.5 shrink-0">
                        {item.category_icon || "📍"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-gray-900 truncate">
                            {item.title}
                          </p>
                          {item.is_featured && (
                            <span className="rounded bg-orange-50 px-1.5 py-0.2 text-[9px] font-bold text-[#e26a4f]">
                              ★
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">
                          📍 {item.locality} · <span className="text-gray-400">{item.category_name}</span>
                        </p>
                        {item.short_description && (
                          <p className="text-[10px] text-gray-400 truncate mt-0.5">
                            {item.short_description}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 self-center shrink-0">
                        →
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="border-t border-gray-100 p-2 bg-gray-50/50">
                <Link
                  href={`/?q=${encodeURIComponent(query.trim())}`}
                  onClick={() => setIsOpen(false)}
                  className="block text-center text-[11px] font-bold text-[#e26a4f] hover:underline py-1"
                >
                  Explore all results for &quot;{query.trim()}&quot; on live map →
                </Link>
              </div>
            </div>
          ) : query.trim().length >= 3 && !isLoading ? (
            <div className="p-4 text-center text-xs text-gray-500">
              <p className="font-semibold text-gray-800">No matching places found</p>
              <p className="text-[11px] text-gray-400 mt-1">
                Try searching for schools, hospitals, cafes, tech parks, or neighborhoods.
              </p>
              <Link
                href={`/?q=${encodeURIComponent(query.trim())}`}
                onClick={() => setIsOpen(false)}
                className="mt-3 inline-block rounded-full bg-gray-100 px-3 py-1 text-[11px] font-bold text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Search on Live Atlas Map ↗
              </Link>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

