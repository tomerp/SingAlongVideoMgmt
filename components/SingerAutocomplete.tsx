"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Singer {
  id: string;
  name: string;
}

interface SingerAutocompleteProps {
  value: string[];
  onChange: (singerIds: string[]) => void;
  initialSingers?: { id: string; name: string }[];
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debouncedValue;
}

export function SingerAutocomplete({
  value,
  onChange,
  initialSingers = [],
}: SingerAutocompleteProps) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<Singer[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedSingers, setSelectedSingers] = useState<
    { id: string; name: string }[]
  >(() => initialSingers.filter((s) => value.includes(s.id)));
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedInput = useDebounce(input, 250);

  useEffect(() => {
    setSelectedSingers((prev) => {
      if (value.length === 0) return [];
      const byId = new Map([
        ...prev.map((s) => [s.id, s] as const),
        ...initialSingers.map((s) => [s.id, s] as const),
      ]);
      return value
        .map((id) => byId.get(id))
        .filter(Boolean) as { id: string; name: string }[];
    });
  }, [value, initialSingers]);

  useEffect(() => {
    if (!debouncedInput.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    fetch(`/api/singers?q=${encodeURIComponent(debouncedInput)}`)
      .then((r) => r.json())
      .then((data: Singer[]) => {
        const selectedIds = new Set(value);
        setSuggestions(data.filter((s) => !selectedIds.has(s.id)));
        setOpen(true);
      })
      .catch(() => setSuggestions([]))
      .finally(() => setLoading(false));
  }, [debouncedInput, value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addSinger = useCallback(
    (singer: Singer) => {
      if (value.includes(singer.id)) return;
      onChange([...value, singer.id]);
      setSelectedSingers((prev) =>
        prev.some((s) => s.id === singer.id) ? prev : [...prev, singer]
      );
      setInput("");
      setSuggestions([]);
      setOpen(false);
    },
    [value, onChange]
  );

  const removeSinger = useCallback(
    (id: string) => {
      onChange(value.filter((x) => x !== id));
      setSelectedSingers((prev) => prev.filter((s) => s.id !== id));
    },
    [value, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const trimmed = input.trim();
        if (!trimmed) return;

        const match = suggestions.find(
          (s) => s.name.toLowerCase() === trimmed.toLowerCase()
        );
        if (match) {
          addSinger(match);
          return;
        }

        setLoading(true);
        fetch("/api/singers/find-or-create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed }),
        })
          .then((r) => r.json())
          .then((singer: Singer) => {
            if (singer?.id) addSinger(singer);
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      } else if (e.key === "Backspace" && !input && value.length > 0) {
        removeSinger(value[value.length - 1]);
      }
    },
    [input, suggestions, addSinger, removeSinger, value]
  );

  const displaySingers = selectedSingers;

  return (
    <div ref={containerRef} className="relative">
      <div className="flex flex-wrap gap-2 rounded border border-slate-300 bg-white p-2">
        {displaySingers.map((s) => (
          <span
            key={s.id}
            className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-sm"
          >
            {s.name}
            <button
              type="button"
              onClick={() => removeSinger(s.id)}
              className="ml-0.5 text-slate-500 hover:text-slate-700"
              aria-label={`Remove ${s.name}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => input.trim() && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Type singer name..."
          className="min-w-[140px] flex-1 border-0 bg-transparent px-1 py-0.5 text-sm outline-none"
        />
      </div>
      {loading && (
        <div className="absolute left-2 top-full z-10 mt-1 text-xs text-slate-500">
          Searching...
        </div>
      )}
      {open && suggestions.length > 0 && !loading && (
        <ul className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded border border-slate-200 bg-white py-1 shadow-lg">
          {suggestions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
                onClick={() => addSinger(s)}
              >
                {s.name}
              </button>
            </li>
          ))}
          {input.trim() &&
            !suggestions.some(
              (s) => s.name.toLowerCase() === input.trim().toLowerCase()
            ) && (
              <li className="border-t border-slate-100">
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-slate-100"
                  onClick={() => {
                    fetch("/api/singers/find-or-create", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ name: input.trim() }),
                    })
                      .then((r) => r.json())
                      .then((singer: Singer) => {
                        if (singer?.id) addSinger(singer);
                        setInput("");
                        setOpen(false);
                      });
                  }}
                >
                  Create &quot;{input.trim()}&quot;
                </button>
              </li>
            )}
        </ul>
      )}
    </div>
  );
}
