// src/components/TouchHistoryModal.jsx
import React, { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function TouchHistoryModal({ open, onClose, contact }) {
  const [touches, setTouches] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !contact) return

    async function fetchTouches() {
      setLoading(true)
      try {
        const res = await fetch(
          `http://localhost:3000/touches?contact_id=${contact.id}`
        )
        if (!res.ok) throw new Error("Failed to fetch touches")
        const data = await res.json()
        setTouches(data)
      } catch (err) {
        console.error("Error loading touch history:", err)
        setTouches([])
      } finally {
        setLoading(false)
      }
    }

    fetchTouches()
  }, [open, contact])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full max-h-[80vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>
            Touch History for {contact?.first_name}_{contact?.last_name}
          </DialogTitle>
          <DialogDescription>
            All recorded interactions (emails, calls, LinkedIn, etc.)
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : touches.length === 0 ? (
          <p className="text-sm text-gray-500">No history found.</p>
        ) : (
          <div className="space-y-4">
            {touches.map((touch) => (
              <div
                key={touch.id}
                className="rounded-lg border p-3 shadow-sm bg-white w-full overflow-hidden break-words"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-gray-600">
                    {new Date(touch.touched_at).toLocaleString()}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    {touch.touch_type}
                  </span>
                </div>

                {touch.subject && (
                  <p className="font-semibold text-sm break-words">
                    {touch.subject}
                  </p>
                )}

                {touch.body && (
                  <div
                    className="text-sm text-gray-800 mt-1 whitespace-pre-wrap break-words overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: touch.body }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
