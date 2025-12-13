// src/components/modals/LinkedInModal.jsx
import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function LinkedInModal({ isOpen, contact, onClose, onSuccess }) {
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)

  if (!contact) return null

  const handleSave = async () => {
    if (!notes.trim()) {
      alert("Please enter a message or note before saving.")
      return
    }

    setLoading(true)
    try {
      const touchPayload = {
        contact_id: contact.id,
        touched_at: new Date().toISOString(),
        touch_type: "linkedin",
        subject: null,
        body: notes.trim(),
        metadata: null,
        cadence_id: null,
      }

      const res = await fetch("http://localhost:3000/touches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(touchPayload),
      })

      if (!res.ok) {
        throw new Error(await res.text())
      }

      if (onSuccess) onSuccess()

      setNotes("")
      onClose()
    } catch (err) {
      alert("Failed to log LinkedIn touch: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Log LinkedIn Touch with {contact.first_name} {contact.last_name}
          </DialogTitle>
        </DialogHeader>
        <textarea
          className="w-full border rounded p-2 mb-4"
          placeholder="Message or note..."
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
