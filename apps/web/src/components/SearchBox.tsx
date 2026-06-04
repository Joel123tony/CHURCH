import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

type SearchResult = {
  type: string;
  title: string;
  subtitle?: string;
  description?: string;
  href: string;
  score: number;
};

type SearchResponse = {
  results: SearchResult[];
  groups: Record<string, SearchResult[]>;
};

type Props = {
  initialValue?: string;
  placeholder?: string;
  compact?: boolean;
  className?: string;
};

function useDebouncedValue(value: string, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(handle);
  }, [delay, value]);

  return debounced;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightText(text: string, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return text;
  }

  const regex = new RegExp(`(${escapeRegExp(query.trim())})`, "ig");
  const parts = text.split(regex);

  return parts.map((part, index) =>
    part.toLowerCase() === needle ? (
      <mark key={index} className="rounded bg-gold/20 text-gold">
        {part}
      </mark>
    ) : (
      <span key={index}>{part}</span>
    )
  );
}

export function SearchBox({ initialValue = "", placeholder = "Search sermons, pastors, events, pages, media...", compact = false, className }: Props) {
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [value, setValue] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounced = useDebouncedValue(value.trim());

  const { data } = useQuery({
    queryKey: ["public", "search", debounced],
    queryFn: () => apiFetch<SearchResponse>(`/api/public/search?q=${encodeURIComponent(debounced)}&limit=6`),
    enabled: debounced.length > 0,
    staleTime: 0,
    refetchOnWindowFocus: false
  });

  const suggestions = useMemo(() => (data?.results ?? []).slice(0, 6), [data]);

  useEffect(() => {
    if (!initialValue) return;
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (suggestions.length === 0) {
      setActiveIndex(-1);
    } else if (activeIndex >= suggestions.length) {
      setActiveIndex(suggestions.length - 1);
    }
  }, [activeIndex, suggestions.length]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, []);

  function submit(nextValue = value) {
    const query = nextValue.trim();
    if (!query) return;
    navigate(`/search?q=${encodeURIComponent(query)}`);
    setOpen(false);
  }

  return (
    <div ref={wrapperRef} className={className ?? ""}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const active = suggestions[activeIndex];
          if (open && active) {
            navigate(active.href);
            setOpen(false);
            return;
          }
          submit();
        }}
        className={`relative ${compact ? "w-full" : ""}`}
      >
        <div className="flex items-center gap-3 rounded-full border border-white/12 bg-black/25 px-4 py-3 shadow-glow backdrop-blur-xl">
          <Search className="h-4 w-4 shrink-0 text-gold" />
          <input
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(event) => {
              if (!suggestions.length) {
                if (event.key === "Enter") submit();
                return;
              }

              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((current) => (current + 1) % suggestions.length);
                setOpen(true);
              }

              if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
                setOpen(true);
              }

              if (event.key === "Escape") {
                setOpen(false);
              }
            }}
            placeholder={placeholder}
            className="min-w-0 flex-1 bg-transparent text-sm text-pearl outline-none placeholder:text-white/35"
          />
          <button
            type="submit"
            className="rounded-full bg-gold px-4 py-2 text-xs font-semibold text-ink transition hover:scale-[1.02]"
          >
            Search
          </button>
        </div>

        {open && debounced && suggestions.length > 0 ? (
          <div className={`absolute left-0 right-0 z-30 mt-3 overflow-hidden rounded-3xl border border-white/10 bg-[#08111e] shadow-2xl ${compact ? "" : "max-h-[28rem] overflow-auto"}`}>
            {suggestions.map((item, index) => {
              const active = index === activeIndex;
              return (
                <button
                  key={`${item.type}-${item.href}-${index}`}
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => {
                    navigate(item.href);
                    setOpen(false);
                  }}
                  className={`block w-full border-b border-white/8 px-4 py-3 text-left transition last:border-b-0 ${
                    active ? "bg-gold/10" : "hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.3em] text-gold/80">{item.type}</p>
                      <p className="mt-1 truncate text-sm font-semibold text-pearl">{highlightText(item.title, value)}</p>
                      {item.subtitle ? <p className="mt-1 truncate text-xs text-white/55">{highlightText(item.subtitle, value)}</p> : null}
                    </div>
                    <span className="text-[11px] text-white/35">{Math.round(item.score)}</span>
                  </div>
                  {item.description ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/55">{highlightText(item.description, value)}</p> : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </form>
    </div>
  );
}
