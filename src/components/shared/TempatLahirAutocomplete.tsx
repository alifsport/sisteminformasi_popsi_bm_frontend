import { useState, useEffect, useRef, useMemo } from 'react';
import { KOTA_BY_PROVINSI, PROVINSI_LIST } from '../../lib/locations';

/* ------------------------------------------------------------------ */
/*  Build a flat list of { label, province } from all locations data   */
/* ------------------------------------------------------------------ */

interface LocationItem {
  label: string;     // e.g. "Kota Bandung" or "Jakarta Pusat"
  provinsi: string;  // e.g. "Jawa Barat" or "DKI Jakarta"
}

// Build once at module level
const ALL_CITIES: LocationItem[] = [];
for (const provinsi of PROVINSI_LIST) {
  const cities = KOTA_BY_PROVINSI[provinsi] || [];
  for (const kota of cities) {
    ALL_CITIES.push({ label: kota, provinsi });
  }
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface TempatLahirAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function TempatLahirAutocomplete({
  value,
  onChange,
  placeholder = 'Ketik nama kota atau kabupaten...',
  className = '',
  required = false,
}: TempatLahirAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Filter results
  const results = useMemo(() => {
    if (!query || query.length < 1) return [];
    const q = query.toLowerCase();
    return ALL_CITIES.filter(item => {
      // Match city name (contains)
      if (item.label.toLowerCase().includes(q)) return true;
      // Also match without common prefixes for flexibility
      const clean = item.label.replace(/^(Kabupaten|Kota|Kota Administrasi)\s+/i, '');
      if (clean.toLowerCase().includes(q)) return true;
      return false;
    }).slice(0, 12); // limit to 12 results
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault();
      selectItem(results[highlightIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const selectItem = (item: LocationItem) => {
    setQuery(item.label);
    onChange(item.label);
    setShowDropdown(false);
    setHighlightIndex(-1);
  };

  const highlightMatch = (text: string) => {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="font-semibold text-cyan-600">{text.slice(idx, idx + query.length)}</span>
        {text.slice(idx + query.length)}
      </>
    );
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setShowDropdown(true);
            setHighlightIndex(-1);
            // If user clears input, also clear the form value
            if (!e.target.value) onChange('');
          }}
          onFocus={() => { if (query && results.length > 0) setShowDropdown(true); }}
          className={className}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); onChange(''); inputRef.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {results.map((item, idx) => (
            <button
              key={`${item.label}-${item.provinsi}`}
              type="button"
              onClick={() => selectItem(item)}
              onMouseEnter={() => setHighlightIndex(idx)}
              className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors ${
                idx === highlightIndex ? 'bg-cyan-50 text-cyan-700' : 'hover:bg-gray-50'
              }`}
            >
              <svg className="h-4 w-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium text-gray-800">{highlightMatch(item.label)}</div>
                <div className="truncate text-xs text-gray-400">{item.provinsi}</div>
              </div>
            </button>
          ))}
          {/* Allow typing custom value */}
          <div className="border-t border-gray-100 px-3 py-2">
            <button
              type="button"
              onClick={() => { onChange(query); setShowDropdown(false); }}
              className="text-xs text-cyan-600 hover:text-cyan-700"
            >
              Gunakan "{query}" sebagai input manual
            </button>
          </div>
        </div>
      )}

      {/* No results but has query */}
      {showDropdown && query && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="px-3 py-3 text-center">
            <p className="text-sm text-gray-500">Tidak ditemukan "{query}"</p>
            <button
              type="button"
              onClick={() => { onChange(query); setShowDropdown(false); }}
              className="mt-1 text-xs text-cyan-600 hover:text-cyan-700"
            >
              Gunakan "{query}" sebagai input manual
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
