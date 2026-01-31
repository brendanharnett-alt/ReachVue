// src/components/modals/CallModal.jsx
import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Linkedin } from "lucide-react"

export default function CallModal({ isOpen, contact, onClose, onSuccess }) {
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
          <div className="flex items-center justify-between">
            <DialogTitle>
              Log Call with {contact.first_name} {contact.last_name}
            </DialogTitle>
            {/* #region agent log */}
            {(() => {
              fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CallModal.jsx:65',message:'Checking contact for LinkedIn URL',data:{hasContact:!!contact,contactKeys:contact?Object.keys(contact):[],linkedin_url:contact?.linkedin_url,linkedInUrl:contact?.linkedInUrl,linkedinUrl:contact?.linkedinUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
              return null;
            })()}
            {/* #endregion */}
            {(contact?.linkedin_url || contact?.linkedInUrl || contact?.linkedinUrl) && (
              <button
                onClick={() => window.open(contact.linkedin_url || contact.linkedInUrl || contact.linkedinUrl, '_blank', 'noopener,noreferrer')}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Open LinkedIn Profile"
                aria-label="Open LinkedIn Profile"
              >
                <Linkedin className="h-5 w-5 text-blue-600" />
              </button>
            )}
          </div>
          {(contact?.mobile_phone || contact?.phone) && (
            <div className="mt-2 text-sm text-gray-600">
              <span className="font-medium">Phone:</span> {contact.mobile_phone || contact.phone}
            </div>
          )}
        </DialogHeader>
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
