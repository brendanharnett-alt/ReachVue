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
  initialInstructions = "",
}) {
  const [instructions, setInstructions] = useState("");

  // Reset instructions when modal opens/closes, or pre-populate if initialInstructions is provided
  useEffect(() => {
    // #region agent log
    const overlayCount = document.querySelectorAll('[data-radix-dialog-overlay]').length;
    const allOverlays = document.querySelectorAll('[data-radix-dialog-overlay], [role="dialog"] + div, body > div[style*="pointer-events"]');
    const bodyStyle = window.getComputedStyle(document.body);
    fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'StepContentModal.jsx:24',message:'StepContentModal useEffect open state change',data:{open,overlayCountBefore:overlayCount,allOverlayCountBefore:allOverlays.length,bodyPointerEvents:bodyStyle.pointerEvents,bodyOverflow:bodyStyle.overflow},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    if (!open) {
      setInstructions("");
      // Cleanup overlays when modal closes
      setTimeout(() => {
        const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
        const allOverlays = document.querySelectorAll('[data-radix-dialog-overlay], [role="dialog"] + div, body > div[style*="pointer-events"]');
        const bodyStyle = window.getComputedStyle(document.body);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'StepContentModal.jsx:32',message:'StepContentModal cleanup check',data:{overlayCount:overlays.length,allOverlayCount:allOverlays.length,overlays:Array.from(overlays).map(o=>({state:o.getAttribute('data-state'),id:o.id,style:o.getAttribute('style')})),bodyPointerEvents:bodyStyle.pointerEvents,bodyOverflow:bodyStyle.overflow},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
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
        fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'StepContentModal.jsx:45',message:'StepContentModal cleanup complete',data:{removedCount,overlayCountAfter,allOverlayCountAfter,bodyPointerEventsAfter:bodyStyleAfter.pointerEvents,bodyOverflowAfter:bodyStyleAfter.overflow},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
      }, 200);
    } else if (initialInstructions) {
      setInstructions(initialInstructions);
    }
  }, [open, initialInstructions]);

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
    // #region agent log
    const overlayCount = document.querySelectorAll('[data-radix-dialog-overlay]').length;
    const allOverlays = document.querySelectorAll('[data-radix-dialog-overlay], [role="dialog"] + div, body > div[style*="pointer-events"]');
    const bodyStyle = window.getComputedStyle(document.body);
    fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'StepContentModal.jsx:58',message:'StepContentModal handleOpenChange called',data:{isOpen,overlayCount,allOverlayCount:allOverlays.length,bodyPointerEvents:bodyStyle.pointerEvents,bodyOverflow:bodyStyle.overflow},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
    // #endregion
    if (!isOpen) {
      onClose();
      // #region agent log
      setTimeout(() => {
        const overlayCountAfter = document.querySelectorAll('[data-radix-dialog-overlay]').length;
        const allOverlaysAfter = document.querySelectorAll('[data-radix-dialog-overlay], [role="dialog"] + div, body > div[style*="pointer-events"]');
        const bodyStyleAfter = window.getComputedStyle(document.body);
        fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'StepContentModal.jsx:65',message:'StepContentModal handleOpenChange after onClose',data:{overlayCountAfter,allOverlayCountAfter:allOverlaysAfter.length,bodyPointerEventsAfter:bodyStyleAfter.pointerEvents,bodyOverflowAfter:bodyStyleAfter.overflow},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
      }, 300);
      // #endregion
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-5 pt-2.5 pb-1">
          <DialogTitle className="text-base">{initialInstructions ? "Edit Step Content" : "Add Step Content"}</DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            {initialInstructions ? "Edit instructions for this step." : "Add instructions for this step."}
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
              {initialInstructions ? "Update Step" : "Add Step"}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

