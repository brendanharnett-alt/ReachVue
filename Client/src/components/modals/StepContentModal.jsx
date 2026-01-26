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

export default function StepContentModal({
  open,
  onClose,
  onBack,
  onSuccess,
  stepData,
  actionType,
}) {
  const [instructions, setInstructions] = useState("");

  // Reset instructions when modal opens/closes
  useEffect(() => {
    if (!open) {
      setInstructions("");
    }
  }, [open]);

  const handleAddStep = async () => {
    try {
      console.log('StepContentModal handleAddStep - stepData:', stepData);
      
      if (!stepData || !stepData.step_label) {
        alert('Step metadata is missing. Please go back and fill in the step details.');
        return;
      }
      
      const combinedData = {
        ...stepData,
        instructions: instructions.trim(),
      };
      
      console.log('StepContentModal handleAddStep - combinedData:', combinedData);
      
      if (onSuccess) {
        await onSuccess(combinedData);
      }
      onClose();
    } catch (err) {
      // Don't close modal on error - let user see the error and try again
      throw err;
    }
  };

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
          <DialogTitle className="text-base">Add Step Content</DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            Add instructions for this step.
          </DialogDescription>
        </DialogHeader>

        {/* Content area */}
        <div className="px-5 py-1 space-y-1.5">
          <div>
            <label className="text-xs font-medium text-gray-700 mb-0.5 block">
              Instructions
            </label>
            <textarea
              placeholder="Enter instructions for this step..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full min-h-[200px] p-2 border rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-5 py-1.5 border-t mt-0">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={handleAddStep} className="bg-primary text-white">
            Add Step
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

