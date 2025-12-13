import React, { useEffect, useMemo, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, Search, Check, X, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

function uniqueSorted(values) {
  const seen = new Set();
  for (const v of values) if (v != null && String(v).trim() !== "") seen.add(String(v).trim());
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
}

function matchesQuery(value, q) {
  if (!q) return true;
  return String(value).toLowerCase().includes(q.toLowerCase());
}

export function TagFilterModal({
  open,
  onOpenChange,
  title = "Tag",
  values = [],
  selected = [],
  onApply,
  onClear,
}) {
  const allValues = useMemo(() => uniqueSorted(values), [values]);
  const [query, setQuery] = useState("");
  const [localSelected, setLocalSelected] = useState(() => new Set(selected));
  const [mode, setMode] = useState("is");
  const [highlighted, setHighlighted] = useState(0);
  const listRef = useRef(null);

  useEffect(() => {
    if (open) {
      setLocalSelected(new Set(selected));
      setQuery("");
      setHighlighted(0);
      setMode("is");
    }
  }, [open, selected]);

  const filteredValues = useMemo(() => {
    if (!query) return allValues;
    return allValues.filter((v) => matchesQuery(v, query));
  }, [allValues, query]);

  const toggleValue = (val) => {
    const next = new Set(localSelected);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    setLocalSelected(next);
  };

  const clearAll = () => setLocalSelected(new Set());

  const handleApply = () => {
    const out = Array.from(localSelected);
    onApply?.({ mode, selected: out });
    onOpenChange?.(false);
  };

  const handleClear = () => {
    clearAll();
    onClear?.();
    onOpenChange?.(false);
  };

  // Keyboard navigation
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden !animate-none !duration-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Filter className="h-5 w-5" /> {title} filter
          </DialogTitle>
        </DialogHeader>

        {/* Mode selector (dropdown is non-focusable) */}
        <div className="px-6 pb-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Tags:
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  tabIndex={-1} // 👈 prevents arrow keys or auto-focus on open
                  className="flex items-center px-2 py-1 text-sm border rounded-md hover:bg-muted focus:outline-none"
                >
                  {mode === "is"
                    ? "Is"
                    : mode === "isNot"
                    ? "Is not"
                    : mode === "empty"
                    ? "Empty"
                    : "Not Empty"}
                  <ChevronDown className="ml-1 h-4 w-4 opacity-70" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setMode("is")}>Is</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMode("isNot")}>Is not</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMode("empty")}>Empty</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMode("notEmpty")}>Not Empty</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search */}
        {mode !== "empty" && mode !== "notEmpty" && (
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
          </div>
        )}

        {/* Tag list */}
        {mode !== "empty" && mode !== "notEmpty" && (
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
        )}

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
  );
}

export default TagFilterModal;
