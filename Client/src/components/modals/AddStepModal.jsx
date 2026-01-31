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

export default function AddStepModal({ open, onClose, onSuccess, dayNumber = 0, onNext, initialData = null }) {
  const [formData, setFormData] = useState({
    step_label: "",
    action_type: "email",
    day_number: dayNumber,
  });

  // Reset form when modal opens/closes or dayNumber changes, or pre-populate if initialData is provided
  useEffect(() => {
    if (!open) {
      setFormData({
        step_label: "",
        action_type: "email",
        day_number: dayNumber,
      });
    } else if (initialData) {
      // Pre-populate with initial data when editing
      setFormData({
        step_label: initialData.step_label || "",
        action_type: initialData.action_type || "email",
        day_number: initialData.day_number !== undefined ? initialData.day_number : dayNumber,
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        day_number: dayNumber,
      }));
    }
  }, [open, dayNumber, initialData]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.step_label.trim()) {
      alert("Step name is required");
      return;
    }
    // If onNext is provided, open content modal instead of submitting directly
    if (onNext) {
      onNext(formData);
      // Don't call onClose here - let the parent handle closing this modal
      // so it can preserve the metadata state
    } else {
      // Fallback to original behavior if onNext not provided
      try {
        if (onSuccess) {
          await onSuccess(formData);
        }
        onClose();
      } catch (err) {
        // Don't close modal on error - let user see the error and try again
        throw err;
      }
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
    // #region agent log
    const overlayCount = document.querySelectorAll('[data-radix-dialog-overlay]').length;
    const allOverlays = document.querySelectorAll('[data-radix-dialog-overlay], [role="dialog"] + div, body > div[style*="pointer-events"]');
    const bodyStyle = window.getComputedStyle(document.body);
    fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AddStepModal.jsx:88',message:'AddStepModal useEffect open state change',data:{open,overlayCountBefore:overlayCount,allOverlayCountBefore:allOverlays.length,bodyPointerEvents:bodyStyle.pointerEvents,bodyOverflow:bodyStyle.overflow},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    if (!open) {
      setTimeout(() => {
        const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
        const allOverlays = document.querySelectorAll('[data-radix-dialog-overlay], [role="dialog"] + div, body > div[style*="pointer-events"]');
        const bodyStyle = window.getComputedStyle(document.body);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AddStepModal.jsx:95',message:'AddStepModal cleanup check',data:{overlayCount:overlays.length,allOverlayCount:allOverlays.length,overlays:Array.from(overlays).map(o=>({state:o.getAttribute('data-state'),id:o.id,style:o.getAttribute('style')})),bodyPointerEvents:bodyStyle.pointerEvents,bodyOverflow:bodyStyle.overflow},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        // Force remove ALL overlays regardless of state
        let removedCount = 0;
        overlays.forEach(overlay => {
          overlay.remove();
          removedCount++;
        });
        // Also check for body style locks
        if (bodyStyle.pointerEvents === 'none' || bodyStyle.overflow === 'hidden') {
          document.body.style.pointerEvents = '';
          document.body.style.overflow = '';
        }
        // #region agent log
        const overlayCountAfter = document.querySelectorAll('[data-radix-dialog-overlay]').length;
        const allOverlayCountAfter = document.querySelectorAll('[data-radix-dialog-overlay], [role="dialog"] + div, body > div[style*="pointer-events"]').length;
        const bodyStyleAfter = window.getComputedStyle(document.body);
        fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AddStepModal.jsx:108',message:'AddStepModal cleanup complete',data:{removedCount,overlayCountAfter,allOverlayCountAfter,bodyPointerEventsAfter:bodyStyleAfter.pointerEvents,bodyOverflowAfter:bodyStyleAfter.overflow},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
      }, 200);
    }
  }, [open]);

  const handleOpenChange = (isOpen) => {
    // #region agent log
    const overlayCount = document.querySelectorAll('[data-radix-dialog-overlay]').length;
    const allOverlays = document.querySelectorAll('[data-radix-dialog-overlay], [role="dialog"] + div, body > div[style*="pointer-events"]');
    const bodyStyle = window.getComputedStyle(document.body);
    fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AddStepModal.jsx:116',message:'AddStepModal handleOpenChange called',data:{isOpen,overlayCount,allOverlayCount:allOverlays.length,bodyPointerEvents:bodyStyle.pointerEvents,bodyOverflow:bodyStyle.overflow},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
    // #endregion
    if (!isOpen) {
      onClose();
      // #region agent log
      setTimeout(() => {
        const overlayCountAfter = document.querySelectorAll('[data-radix-dialog-overlay]').length;
        const allOverlaysAfter = document.querySelectorAll('[data-radix-dialog-overlay], [role="dialog"] + div, body > div[style*="pointer-events"]');
        const bodyStyleAfter = window.getComputedStyle(document.body);
        fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AddStepModal.jsx:123',message:'AddStepModal handleOpenChange after onClose',data:{overlayCountAfter,allOverlayCountAfter:allOverlaysAfter.length,bodyPointerEventsAfter:bodyStyleAfter.pointerEvents,bodyOverflowAfter:bodyStyleAfter.overflow},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
      }, 300);
      // #endregion
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-5 pt-2.5 pb-1">
          <DialogTitle className="text-base">{initialData ? "Edit Step" : "Add Step"}</DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            {initialData ? "Edit the step details." : "Add a new step to your cadence."}
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
            Next: Content
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

