import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Plus, Trash } from "lucide-react";

/**
 * AdvancedFilterModal
 * ----------------------------------------------------
 * - Fixed-height modal with internal scroll for rule list
 * - Excel-style AND/OR logic builder
 * - Stable layout with smooth scrolling
 */

export function AdvancedFilterModal({ open, onOpenChange, title, onApply, initialRules }) {
  const [rules, setRules] = useState([
    { operator: "contains", value: "", connector: "AND" },
  ]);

  // Initialize rules when modal opens - use existing rules if available, otherwise default
  useEffect(() => {
    if (open) {
      if (initialRules && initialRules.length > 0) {
        setRules(initialRules);
      } else {
        setRules([{ operator: "contains", value: "", connector: "AND" }]);
      }
    }
  }, [open, initialRules]);

  const operators = [
    "contains",
    "does not contain",
    "equals",
    "does not equal",
    "begins with",
    "does not begin with",
    "ends with",
    "does not end with",
  ];

  const addRule = () => {
    setRules((prev) => [
      ...prev,
      { operator: "contains", value: "", connector: "AND" },
    ]);
  };

  const removeRule = (index) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRule = (index, field, value) => {
    setRules((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  };

  const handleConnectorChange = (index, connector) => {
    setRules((prev) =>
      prev.map((r, i) => (i === index ? { ...r, connector } : r))
    );
  };

  const handleApply = () => {
    onApply?.(rules);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Create one or more rules and combine them with AND / OR.
          </DialogDescription>
        </DialogHeader>

        {/* Fixed height wrapper with internal scroll */}
        <div className="px-6 pb-4">
          <div className="max-h-[55vh] overflow-y-auto pr-1 space-y-4">
            {rules.map((rule, index) => (
              <div key={index} className="flex flex-col gap-2">
                {/* Connector row between rules */}
                {index > 0 && (
                  <div className="flex justify-center items-center gap-6 py-1 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
                    <label className="flex items-center gap-1 text-sm text-muted-foreground cursor-pointer">
                      <input
                        type="radio"
                        name={`connector-${index}`}
                        checked={rule.connector === "AND"}
                        onChange={() => handleConnectorChange(index, "AND")}
                      />
                      AND
                    </label>
                    <label className="flex items-center gap-1 text-sm text-muted-foreground cursor-pointer">
                      <input
                        type="radio"
                        name={`connector-${index}`}
                        checked={rule.connector === "OR"}
                        onChange={() => handleConnectorChange(index, "OR")}
                      />
                      OR
                    </label>
                  </div>
                )}

                {/* Rule row */}
                <div className="flex items-center gap-3">
                  <Select
                    value={rule.operator}
                    onValueChange={(val) => updateRule(index, "operator", val)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent>
                      {operators.map((op) => (
                        <SelectItem key={op} value={op}>
                          {op}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    value={rule.value}
                    onChange={(e) => updateRule(index, "value", e.target.value)}
                    placeholder="Enter value..."
                  />

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeRule(index)}
                    className="shrink-0"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-4 flex justify-between items-center border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={addRule}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Rule
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange?.(false)}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleApply}>
              Apply
            </Button>
          </div>
        </div>

        <div className="px-6 pb-3 text-xs text-muted-foreground">
          Tip: Use “*” for any number of characters and “?” for one character.
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AdvancedFilterModal;
