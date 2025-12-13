import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Check, Filter, Search } from "lucide-react";

/**
 * Shared, Excel-style Filter Modal for ReachVue
 * ----------------------------------------------------
 * - One modal component that supports any column
 * - Search, Select All, Clear, Apply
 * - Persist selections while open; only commit on Apply
 * - Fully client-side, ready to wire to your table
 *
 * Usage (example below in Demo):
 * <FilterModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   columnKey="company"
 *   title="Company"
 *   values={companyValues}
 *   selected={filters.company}
 *   onApply={(vals) => setFilters(prev => ({ ...prev, company: vals }))}
 *   onClear={() => setFilters(prev => ({ ...prev, company: [] }))}
 * />
 */

// ---- Utility helpers ----
function uniqueSorted(values) {
  const seen = new Set();
  for (const v of values) if (v != null && String(v).trim() !== "") seen.add(String(v).trim());
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
}

function matchesQuery(value, q) {
  if (!q) return true;
  return String(value).toLowerCase().includes(q.toLowerCase());
}

// ---- FilterModal ----
export function FilterModal({
  open,
  onOpenChange,
  columnKey,
  title,
  values = [], // raw values (strings)
  selected = [], // array of selected values for this column
  onApply,
  onClear,
  showCounts = false, // optional future: show counts per value
}) {
  const allValues = useMemo(() => uniqueSorted(values), [values]);
  const [query, setQuery] = useState("");
  const [localSelected, setLocalSelected] = useState(() => new Set(selected));
  const [allChecked, setAllChecked] = useState(false);
  const [indeterminate, setIndeterminate] = useState(false);

  // Keep local state in sync when the modal opens with different defaults
  useEffect(() => {
    if (open) {
      setLocalSelected(new Set(selected));
      setQuery("");
    }
  }, [open, selected]);

  // Filtered list based on search
  const filteredValues = useMemo(() => {
    if (!query) return allValues;
    return allValues.filter((v) => matchesQuery(v, query));
  }, [allValues, query]);

  // Manage header checkbox state (Select All / Some / None)
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
      // clear all
      setLocalSelected(new Set());
    } else {
      // select all of the *filtered list*, Excel behavior scopes to visible items
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

  return (
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
        </div>

        {/* Header row with Select All + counts */}
        <div className="px-6 py-2 border-y">
          <label className="flex items-center gap-3 select-none cursor-pointer">
            <Checkbox
              checked={allChecked}
              onCheckedChange={handleSelectAll}
              // visual indeterminate support via data state
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
          <ul className="px-6 py-2 space-y-1">
            {filteredValues.length === 0 ? (
              <li className="text-sm text-muted-foreground py-6 text-center">No matches</li>
            ) : (
              filteredValues.map((val) => {
                const checked = localSelected.has(val);
                return (
                  <li key={val}>
                    <label className="flex items-center gap-3 py-1.5 cursor-pointer select-none">
                      <Checkbox checked={checked} onCheckedChange={() => toggleValue(val)} />
                      <span className="text-sm truncate" title={val}>{val}</span>
                      {checked && <Check className="ml-auto h-4 w-4" />}
                    </label>
                  </li>
                );
              })
            )}
          </ul>
        </ScrollArea>

        {/* Footer actions */}
        <div className="px-6 py-4 flex items-center justify-between border-t bg-muted/30">
          <Button variant="ghost" className="gap-2" onClick={handleClear}>
            <X className="h-4 w-4" /> Clear
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange?.(false)}>Cancel</Button>
            <Button onClick={handleApply}>Apply</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---- Demo / Integration Example ----
// This demo shows how to reuse the shared modal for multiple columns.
// Replace the dummy contacts with your real data and lift the filter state to your page/store.
export default function ReachVueFilterDemo() {
  // Dummy dataset (replace with your contacts[] from backend)
  const [contacts] = useState(() => [
    { company: "IBM", title: "Director, FinOps", first_name: "Samina", last_name: "K.", tags: ["FinOps", "Azure"], last_touched: "2025-07-12" },
    { company: "Hershey", title: "Sr. Dir IT Ops", first_name: "Edgar", last_name: "R.", tags: ["TBM", "Cloud"], last_touched: "2025-07-14" },
    { company: "Goodyear", title: "FP&A Manager", first_name: "Scott", last_name: "P.", tags: ["Budgeting"], last_touched: "2025-06-25" },
    { company: "Lubrizol", title: "Director, Data Intelligence", first_name: "Sam", last_name: "M.", tags: ["Planning"], last_touched: "2025-05-29" },
    { company: "Assurant", title: "Head of IT Finance", first_name: "Amy", last_name: "C.", tags: ["Chargeback"], last_touched: "2025-05-12" },
  ]);

  // Aggregated unique values per column (compute from contacts)
  const companyValues = useMemo(() => contacts.map(c => c.company), [contacts]);
  const titleValues = useMemo(() => contacts.map(c => c.title), [contacts]);
  const tagValues = useMemo(() => contacts.flatMap(c => c.tags ?? []), [contacts]);

  // Centralized filters state (each is a string[] for this Excel-style modal)
  const [filters, setFilters] = useState({
    company: [],
    title: [],
    tags: [],
  });

  // Which modal is open and with what dataset
  const [openKey, setOpenKey] = useState(null); // e.g., "company" | "title" | "tags" | null

  const isOpen = Boolean(openKey);
  const close = () => setOpenKey(null);

  const currentModalProps = useMemo(() => {
    if (!openKey) return null;
    if (openKey === "company") {
      return {
        columnKey: "company",
        title: "Company",
        values: companyValues,
        selected: filters.company,
        onApply: (vals) => setFilters((p) => ({ ...p, company: vals })),
        onClear: () => setFilters((p) => ({ ...p, company: [] })),
      };
    }
    if (openKey === "title") {
      return {
        columnKey: "title",
        title: "Title",
        values: titleValues,
        selected: filters.title,
        onApply: (vals) => setFilters((p) => ({ ...p, title: vals })),
        onClear: () => setFilters((p) => ({ ...p, title: [] })),
      };
    }
    if (openKey === "tags") {
      return {
        columnKey: "tags",
        title: "Tags",
        values: tagValues,
        selected: filters.tags,
        onApply: (vals) => setFilters((p) => ({ ...p, tags: vals })),
        onClear: () => setFilters((p) => ({ ...p, tags: [] })),
      };
    }
    return null;
  }, [openKey, companyValues, titleValues, tagValues, filters]);

  // (Optional) Visual cue: show count of active selections per filter
  const count = (arr) => (arr?.length ? ` (${arr.length})` : "");

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Button variant={filters.company.length ? "secondary" : "outline"} onClick={() => setOpenKey("company")}>
          Company{count(filters.company)}
        </Button>
        <Button variant={filters.title.length ? "secondary" : "outline"} onClick={() => setOpenKey("title")}>
          Title{count(filters.title)}
        </Button>
        <Button variant={filters.tags.length ? "secondary" : "outline"} onClick={() => setOpenKey("tags")}>
          Tags{count(filters.tags)}
        </Button>
        <Button
          variant="ghost"
          className="ml-auto"
          onClick={() => setFilters({ company: [], title: [], tags: [] })}
        >
          Clear All
        </Button>
      </div>

      {/* Placeholder table area */}
      <div className="border rounded-xl p-4 bg-card shadow-sm">
        <div className="text-sm text-muted-foreground mb-3">(Table placeholder) — wire your ContactsTable here.</div>
        <pre className="text-xs bg-muted p-3 rounded-md overflow-auto">
{JSON.stringify({ filters, contactsPreview: contacts.slice(0, 3) }, null, 2)}
        </pre>
        <div className="text-xs text-muted-foreground mt-2">On Apply, update <code>filters</code>. Later, use <code>filters</code> to compute <code>filteredContacts</code> before rendering.</div>
      </div>

      {/* Shared Modal instance */}
      {currentModalProps && (
        <FilterModal
          open={isOpen}
          onOpenChange={(v) => (v ? null : close())}
          {...currentModalProps}
        />
      )}
    </div>
  );
}
