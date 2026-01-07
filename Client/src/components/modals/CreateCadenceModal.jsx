import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CreateCadenceModal({ open, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      setFormData({
        name: "",
        description: "",
      });
    }
  }, [open]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    // Placeholder - no backend wiring yet
    console.log("Create cadence:", formData);
    if (onSuccess) {
      onSuccess(formData);
    }
    onClose();
  };

  const handleCancel = () => {
    onClose();
    setFormData({
      name: "",
      description: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden !animate-none !duration-0">
        {/* Header */}
        <DialogHeader className="px-5 pt-2.5 pb-1">
          <DialogTitle className="text-base">Create Cadence</DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            Create a new cadence to organize your outreach campaigns.
          </DialogDescription>
        </DialogHeader>

        {/* Content area */}
        <div className="px-5 py-1 space-y-1.5">
          {/* Cadence Name */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-0.5 block">
              Cadence Name
            </label>
            <Input
              placeholder="e.g., Q1 Enterprise Outreach"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full h-8"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-0.5 block">
              Description
            </label>
            <textarea
              placeholder="e.g., Targeting enterprise prospects for Q1 sales cycle"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-input rounded-md bg-transparent placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-5 py-1.5 border-t mt-0">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-primary text-white">
            Create Cadence
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

