// src/components/modals/CadenceCallModal.jsx
import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function CadenceCallModal({ isOpen, contact, onClose, onSuccess, instructions, cadenceId }) {
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  if (!contact) return null

  const handleSave = async () => {
    if (!notes.trim()) {
      alert("Please enter call notes before saving.")
      return
    }

    setLoading(true)
    try {
      const touchPayload = {
        contact_id: contact.id,
        touched_at: new Date().toISOString(),
        touch_type: "call",
        subject: null,
        body: notes.trim(),
        metadata: null,
        cadence_id: cadenceId || null,
      }

      const res = await fetch("http://localhost:3000/touches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(touchPayload),
      })

      if (!res.ok) {
        throw new Error(await res.text())
      }

      // let parent refresh contact data / last touched
      if (onSuccess) onSuccess()

      setNotes("")
      onClose()
    } catch (err) {
      alert("Failed to log call: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Log Call with {contact.first_name} {contact.last_name}
          </DialogTitle>
        </DialogHeader>
        
        {/* Step Instructions Section */}
        {instructions && (
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Step Instructions
            </label>
            <div className="w-full border rounded p-3 bg-gray-50 text-gray-700 text-sm whitespace-pre-wrap">
              {instructions}
            </div>
          </div>
        )}
        
        <textarea
          className="w-full border rounded p-2 mb-4"
          placeholder="Notes from the call..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

