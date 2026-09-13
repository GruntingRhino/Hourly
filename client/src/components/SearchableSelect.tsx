import { useEffect, useId, useMemo, useRef, useState } from "react";

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  /** Accessible name for the input (falls back to `placeholder`). Also names the clear button. */
  label?: string;
  /** Input id (for associating an external visible `<label htmlFor>`). Generated when omitted. */
  id?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  emptyMessage?: string;
  allowCustomValue?: boolean;
}

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  label,
  id,
  className = "",
  required = false,
  disabled = false,
  clearable = false,
  emptyMessage = "No matches found.",
  allowCustomValue = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();
  const generatedInputId = useId();
  const inputId = id ?? generatedInputId;
  // REPORT F-07/F-09: the input previously exposed only `placeholder`, which
  // fails the axe label rule and leaves screen readers without a name.
  const accessibleName = label ?? placeholder;

  useEffect(() => {
    queueMicrotask(() => setQuery(value));
  }, [value]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery(value);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen, value]);

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;

    return options
      .map((option) => {
        const idx = option.toLowerCase().indexOf(normalized);
        return { option, idx };
      })
      .filter(({ idx }) => idx !== -1)
      .sort((a, b) => a.idx - b.idx || a.option.localeCompare(b.option))
      .map(({ option }) => option);
  }, [options, query]);

  useEffect(() => {
    queueMicrotask(() => setHighlightedIndex(0));
  }, [query, isOpen]);

  const commitValue = (nextValue: string) => {
    onChange(nextValue);
    setQuery(nextValue);
    setIsOpen(false);
  };

  const handleBlur = (e: React.FocusEvent) => {
    // REPORT F-07: resolve the old `setTimeout 0` blur race with a
    // `relatedTarget` containment check — option/clear activations use
    // `onMouseDown preventDefault`, so focus stays inside the root for real
    // selections, while tabbing out closes and commits/resets.
    if (e.relatedTarget && rootRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }
    if (allowCustomValue) {
      const normalized = query.trim();
      if (normalized !== value) {
        onChange(normalized);
      }
      setQuery(normalized);
    } else {
      setQuery(value);
    }
    setIsOpen(false);
  };

  return (
    <div ref={rootRef} className="relative" onBlur={handleBlur}>
      <input
        type="text"
        id={inputId}
        value={query}
        placeholder={placeholder}
        aria-label={accessibleName}
        required={required}
        disabled={disabled}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          isOpen && filteredOptions.length > 0 ? `${listboxId}-option-${highlightedIndex}` : undefined
        }
        onFocus={() => setIsOpen(true)}
        onChange={(e) => {
          const nextValue = e.target.value;
          setQuery(nextValue);
          if (allowCustomValue) {
            onChange(nextValue);
          }
          setIsOpen(true);
        }}
        onKeyDown={(e) => {
          if (!isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            setIsOpen(true);
            return;
          }

          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightedIndex((prev) => Math.min(prev + 1, Math.max(filteredOptions.length - 1, 0)));
            return;
          }

          if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedIndex((prev) => Math.max(prev - 1, 0));
            return;
          }

          if (e.key === "Enter") {
            const exactMatch = options.find((option) => option.toLowerCase() === query.trim().toLowerCase());
            const highlighted = filteredOptions[highlightedIndex];
            if (exactMatch || highlighted) {
              e.preventDefault();
              commitValue(exactMatch ?? highlighted);
            } else if (allowCustomValue) {
              e.preventDefault();
              commitValue(query.trim());
            }
            return;
          }

          if (e.key === "Escape") {
            setIsOpen(false);
            setQuery(value);
          }
        }}
        className={className}
      />
      {clearable && value && !disabled && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            onChange("");
            setQuery("");
            setIsOpen(false);
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] hover:text-[var(--text-sec)]"
          aria-label={accessibleName ? `Clear ${accessibleName}` : "Clear selection"}
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
      {isOpen && !disabled && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-[2px] border border-[var(--border)] bg-[var(--surface)] py-1 "
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => {
              const isActive = index === highlightedIndex;
              const isSelected = option === value;
              return (
                // REPORT F-07: options are non-interactive `role="option"`
                // rows (the input owns keyboard handling); the active row is
                // exposed via `aria-activedescendant` on the input above.
                // Mouse behavior (hover-highlight, mousedown keeps focus for
                // the blur containment check, click commits) is unchanged.
                <div
                  key={option}
                  role="option"
                  id={`${listboxId}-option-${index}`}
                  aria-selected={isSelected}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => commitValue(option)}
                  className={`block w-full px-3 py-2 text-left text-sm cursor-default ${
                    isActive ? "bg-[var(--in-bg)] text-[var(--action)]" : "text-[var(--text)]"
                  } ${isSelected ? "font-medium" : ""}`}
                >
                  {option}
                </div>
              );
            })
          ) : (
            <div className="px-3 py-2 text-sm text-[var(--text-sec)]">{emptyMessage}</div>
          )}
        </div>
      )}
    </div>
  );
}
