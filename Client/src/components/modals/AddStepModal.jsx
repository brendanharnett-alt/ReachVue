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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AddStepModal({ open, onClose, onSuccess, dayNumber = 0 }) {
  const [formData, setFormData] = useState({
    step_label: "",
    action_type: "email",
    day_number: dayNumber,
  });

  // Reset form when modal opens/closes or dayNumber changes
  useEffect(() => {
    if (!open) {
      setFormData({
        step_label: "",
        action_type: "email",
        day_number: dayNumber,
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        day_number: dayNumber,
      }));
    }
  }, [open, dayNumber]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.step_label.trim()) {
      alert("Step name is required");
      return;
    }
    try {
      if (onSuccess) {
        await onSuccess(formData);
      }
      onClose();
    } catch (err) {
      // Don't close modal on error - let user see the error and try again
      throw err;
    }
  };

  const handleCancel = () => {
    onClose();
    setFormData({
      step_label: "",
      action_type: "email",
      day_number: dayNumber,
    });
  };

  // Check for lingering backdrop elements after modal closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
        if (overlays.length > 0) {
          overlays.forEach(overlay => {
            if (overlay.getAttribute('data-state') === 'closed' || !overlay.getAttribute('data-state')) {
              overlay.remove();
            }
          });
        }
      }, 100);
    }
  }, [open]);

  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-5 pt-2.5 pb-1">
          <DialogTitle className="text-base">Add Step</DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            Add a new step to your cadence.
          </DialogDescription>
        </DialogHeader>

        {/* Content area */}
        <div className="px-5 py-1 space-y-1.5">
          {/* Step Name */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-0.5 block">
              Step Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g., Initial Outreach Email"
              value={formData.step_label}
              onChange={(e) => handleChange("step_label", e.target.value)}
              className="w-full h-8"
            />
          </div>

          {/* Step Type */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-0.5 block">
              Step Type
            </label>
            <Select
              value={formData.action_type}
              onValueChange={(value) => handleChange("action_type", value)}
            >
              <SelectTrigger className="w-full h-8">
                <SelectValue placeholder="Select step type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone Call</SelectItem>
                <SelectItem value="linkedin">LinkedIn Message</SelectItem>
                <SelectItem value="task">Task</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Day Number */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-0.5 block">
              Day Number
            </label>
            <Input
              type="number"
              placeholder="0"
              value={formData.day_number}
              onChange={(e) => handleChange("day_number", parseInt(e.target.value) || 0)}
              className="w-full h-8"
              min="0"
            />
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-5 py-1.5 border-t mt-0">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-primary text-white">
            Add Step
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

