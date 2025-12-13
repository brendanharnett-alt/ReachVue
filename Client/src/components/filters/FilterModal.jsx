import React, { useEffect, useMemo, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Check, Filter, Search, SlidersHorizontal } from "lucide-react";
import { AdvancedFilterModal } from "./AdvancedFilterModal"; // <-- new import

/**
 * Shared, Excel-style Filter Modal for ReachVue
 * ----------------------------------------------------
 * - Supports keyboard navigation: ↑ / ↓ to move, Enter or Space to toggle, Esc to close
 * - Search, Select All, Clear, Apply
 * - Fully client-side, ready to wire to your table
 */

function uniqueSorted(values) {
  const seen = new Set();
  for (const v of values) if (v != null && String(v).trim() !== "") seen.add(String(v).trim());
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
}

function matchesQuery(value, q) {
  if (!q) return true;
  return String(value).toLowerCase().includes(q.toLowerCase());
}

export function FilterModal({
  open,
  onOpenChange,
  columnKey,
  title,
  values = [],
  selected = [],
  onApply,
  onClear,
  showCounts = false,
  advancedFilter = null, // Pass existing advanced filter if any
}) {
  const allValues = useMemo(() => uniqueSorted(values), [values]);
  const [query, setQuery] = useState("");
  const [localSelected, setLocalSelected] = useState(() => new Set(selected));
  const [allChecked, setAllChecked] = useState(false);
  const [indeterminate, setIndeterminate] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false); // <-- new state
  const listRef = useRef(null);

  useEffect(() => {
    if (open) {
      setLocalSelected(new Set(selected));
      setQuery("");
      setHighlighted(0);
    }
  }, [open, selected]);

  const filteredValues = useMemo(() => {
    if (!query) return allValues;
    return allValues.filter((v) => matchesQuery(v, query));
  }, [allValues, query]);

  useEffect(() => {
    const selCount = localSelected.size;
    if (selCount === 0) {
      setAllChecked(false);
      setIndeterminate(false);
    } else if (selCount === allValues.length) {
      setAllChecked(true);
      setIndeterminate(false);
    } else {
      setAllChecked(false);
      setIndeterminate(true);
    }
  }, [localSelected, allValues.length]);

  const toggleValue = (val) => {
    const next = new Set(localSelected);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    setLocalSelected(next);
  };

  const handleSelectAll = () => {
    if (allChecked || indeterminate) {
      setLocalSelected(new Set());
    } else {
      setLocalSelected(new Set(filteredValues));
    }
  };

  const clearAll = () => setLocalSelected(new Set());

  const handleApply = () => {
    const out = Array.from(localSelected);
    onApply?.(out);
    onOpenChange?.(false);
  };

  const handleClear = () => {
    clearAll();
    onClear?.();
    onOpenChange?.(false);
  };

  // ---- Advanced filter handler ----
  const handleAdvancedApply = (rules) => {
    onApply?.({ type: "advanced", columnKey, rules });
    setShowAdvanced(false);
    onOpenChange?.(false);
  };

  // ---- Keyboard navigation ----
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e) => {
      if (!filteredValues.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlighted((prev) => (prev + 1) % filteredValues.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlighted((prev) => (prev - 1 + filteredValues.length) % filteredValues.length);
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleValue(filteredValues[highlighted]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, filteredValues, highlighted]);

  useEffect(() => {
    if (listRef.current) {
      const item = listRef.current.children[highlighted];
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [highlighted]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl p-0 overflow-hidden !animate-none !duration-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Filter className="h-5 w-5" /> {title} filter
            </DialogTitle>
          </DialogHeader>

          {/* Search */}
          <div className="px-6 pb-3">
            <div className="relative">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${title}...`}
                className="pl-9"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
            </div>
            {/* Advanced Filter trigger */}
            <div className="text-right mt-2">
              <button
                onClick={() => setShowAdvanced(true)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 ml-auto"
              >
                <SlidersHorizontal className="h-3 w-3" />
                Advanced Filter
              </button>
            </div>
          </div>

          {/* Header row */}
          <div className="px-6 py-2 border-y">
            <label className="flex items-center gap-3 select-none cursor-pointer">
              <Checkbox
                checked={allChecked}
                onCheckedChange={handleSelectAll}
                className={indeterminate ? "data-[state=indeterminate]:opacity-100" : ""}
              />
              <span className="text-sm font-medium">Select all (visible)</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {localSelected.size}/{allValues.length} selected
              </span>
            </label>
          </div>

          {/* Values list */}
          <ScrollArea className="max-h-80">
            <ul ref={listRef} className="px-6 py-2 space-y-1">
              {filteredValues.length === 0 ? (
                <li className="text-sm text-muted-foreground py-6 text-center">No matches</li>
              ) : (
                filteredValues.map((val, i) => {
                  const checked = localSelected.has(val);
                  const isHighlighted = i === highlighted;
                  return (
                    <li
                      key={val}
                      className={`rounded-md ${
                        isHighlighted ? "bg-blue-100 dark:bg-blue-900/40" : ""
                      }`}
                    >
                      <label
                        className="flex items-center gap-3 py-1.5 px-2 cursor-pointer select-none"
                        onClick={() => toggleValue(val)}
                      >
                        <Checkbox checked={checked} readOnly />
                        <span className="text-sm truncate" title={val}>
                          {val}
                        </span>
                        {checked && <Check className="ml-auto h-4 w-4" />}
                      </label>
                    </li>
                  );
                })
              )}
            </ul>
          </ScrollArea>

          {/* Footer */}
          <div className="px-6 py-4 flex items-center justify-between border-t bg-muted/30">
            <Button variant="ghost" className="gap-2" onClick={handleClear}>
              <X className="h-4 w-4" /> Clear
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => onOpenChange?.(false)}>
                Cancel
              </Button>
              <Button onClick={handleApply}>Apply</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Advanced Filter Modal */}
      {showAdvanced && (
        <AdvancedFilterModal
          open={showAdvanced}
          onOpenChange={setShowAdvanced}
          title={`Advanced ${title} Filter`}
          onApply={handleAdvancedApply}
          initialRules={advancedFilter?.rules || null}
        />
      )}
    </>
  );
}

export default FilterModal;
