import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Filter, X } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
//import { Calendar } from "@/components/ui/calendar"; // optional if you want inline date pickers
//import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

/**
 * LastTouchFilterModal
 * ----------------------------------------------------
 * Specialized time-based filter (replaces checkbox list):
 * - Is within last: relative dropdown (7d, 30d, 90d, 6mo)
 * - Custom range: two date pickers
 * - Is before: one date picker
 * - Is empty: no input
 */

export function LastTouchFilterModal({
  open,
  onOpenChange,
  onApply,
  onClear,
  selected = null, // Existing filter config
}) {
  const [mode, setMode] = useState("within");
  const [range, setRange] = useState("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [beforeDate, setBeforeDate] = useState("");

  // Initialize from selected filter or defaults
  useEffect(() => {
    if (open) {
      if (selected && selected.type) {
        // Load existing filter
        // Map "between" type back to "custom" mode
        if (selected.type === "between") {
          setMode("custom");
          setCustomStart(selected.start || "");
          setCustomEnd(selected.end || "");
        } else if (selected.type === "within") {
          setMode("within");
          setRange(selected.range || "30d");
        } else if (selected.type === "before") {
          setMode("before");
          setBeforeDate(selected.date || "");
        } else if (selected.type === "empty") {
          setMode("empty");
        } else {
          // Default for unknown types
          setMode("within");
          setRange("30d");
        }
      } else {
        // Default values
        setMode("within");
        setRange("30d");
        setCustomStart("");
        setCustomEnd("");
        setBeforeDate("");
      }
    }
  }, [open, selected]);

  const handleApply = () => {
    let payload = null;
    
    if (mode === "within") {
      payload = { type: "within", range };
    } else if (mode === "custom") {
      payload = { type: "between", start: customStart, end: customEnd };
    } else if (mode === "before") {
      payload = { type: "before", date: beforeDate };
    } else if (mode === "empty") {
      payload = { type: "empty" };
    }
    
    onApply?.(payload);
    onOpenChange?.(false);
  };

  const handleClear = () => {
    setMode("within");
    setRange("30d");
    setCustomStart("");
    setCustomEnd("");
    setBeforeDate("");
    onClear?.();
    onOpenChange?.(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden !animate-none !duration-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Filter className="h-5 w-5" /> Last Touch filter
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 space-y-5 pb-5">
          {/* Is within last */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="lastTouchMode"
              checked={mode === "within"}
              onChange={() => setMode("within")}
            />
            <span className="text-sm font-medium w-28">Is within last</span>
            <Select
              value={range}
              onValueChange={(val) => setRange(val)}
              disabled={mode !== "within"}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 days</SelectItem>
                <SelectItem value="30d">30 days</SelectItem>
                <SelectItem value="90d">90 days</SelectItem>
                <SelectItem value="6mo">6 months</SelectItem>
              </SelectContent>
            </Select>
          </label>

          {/* Custom range */}
          <label className="flex flex-col gap-2 cursor-pointer">
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="lastTouchMode"
                checked={mode === "custom"}
                onChange={() => setMode("custom")}
              />
              <span className="text-sm font-medium">Custom range</span>
            </div>
            <div className="flex gap-2 pl-7">
              <Input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                disabled={mode !== "custom"}
                className="w-[160px]"
              />
              <Input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                disabled={mode !== "custom"}
                className="w-[160px]"
              />
            </div>
          </label>

          {/* Is before */}
          <label className="flex flex-col gap-2 cursor-pointer">
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="lastTouchMode"
                checked={mode === "before"}
                onChange={() => setMode("before")}
              />
              <span className="text-sm font-medium">Is before</span>
            </div>
            <div className="pl-7">
              <Input
                type="date"
                value={beforeDate}
                onChange={(e) => setBeforeDate(e.target.value)}
                disabled={mode !== "before"}
                className="w-[160px]"
              />
            </div>
          </label>

          {/* Is empty */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="lastTouchMode"
              checked={mode === "empty"}
              onChange={() => setMode("empty")}
            />
            <span className="text-sm font-medium">Is empty</span>
          </label>
        </div>

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

export default LastTouchFilterModal;
