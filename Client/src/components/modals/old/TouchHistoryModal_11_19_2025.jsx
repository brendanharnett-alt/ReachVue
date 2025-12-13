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

// Helper to strip HTML tags for a preview
function stripHtml(html) {
  if (!html) return ""

  // Remove HTML tags
  let text = html.replace(/<[^>]+>/g, " ")

  // Decode HTML entities like &nbsp;, &amp;, etc.
  const textarea = document.createElement("textarea")
  textarea.innerHTML = text
  let decoded = textarea.value

  return decoded.replace(/\s+/g, " ").trim()
}

export default function TouchHistoryModal({ open, onClose, contact }) {
  const [touches, setTouches] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [offset, setOffset] = useState(0)
  const [limit] = useState(10)
  const [hasOlder, setHasOlder] = useState(false)
  const [hasNewer, setHasNewer] = useState(false)
  const [total, setTotal] = useState(0)

  const [expandedTouchId, setExpandedTouchId] = useState(null)

  // Reset pagination when modal/contact changes
  useEffect(() => {
    if (!open || !contact) return
    setOffset(0)
    setExpandedTouchId(null)
  }, [open, contact])

  // Fetch touches whenever open/contact/offset changes
  useEffect(() => {
    if (!open || !contact) return

    async function fetchTouches() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(
          `http://localhost:3000/touches?contact_id=${contact.id}&offset=${offset}&limit=${limit}`
        )
        if (!res.ok) throw new Error("Failed to fetch touches")
        const data = await res.json()

        setTouches(data.touches || [])
        setHasOlder(!!data.hasOlder)
        setHasNewer(!!data.hasNewer)
        setTotal(data.total || 0)
      } catch (err) {
        console.error("Error loading touch history:", err)
        setError("Failed to load touch history.")
        setTouches([])
      } finally {
        setLoading(false)
      }
    }

    fetchTouches()
  }, [open, contact, offset, limit])

  const handleLoadOlder = () => {
    if (!hasOlder || loading) return
    setExpandedTouchId(null)
    setOffset((prev) => prev + limit)
  }

  const handleLoadNewer = () => {
    if (!hasNewer || loading) return
    setExpandedTouchId(null)
    setOffset((prev) => Math.max(prev - limit, 0))
  }

  const toggleExpand = (id) => {
    setExpandedTouchId((prev) => (prev === id ? null : id))
  }

  const renderTouchCard = (touch) => {
    const hasBody = !!touch.body
    const plainText = hasBody ? stripHtml(touch.body) : ""
    const isLong = plainText.length > 260
    const isExpanded = expandedTouchId === touch.id

    return (
      <div
        key={touch.id}
        className="rounded-lg border p-3 shadow-sm bg-white w-full overflow-hidden break-words"
      >
        <div className="flex justify-between items-center mb-2 gap-2">
          <span className="text-xs font-medium text-gray-600">
            {touch.touched_at
              ? new Date(touch.touched_at).toLocaleString()
              : ""}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 capitalize">
            {touch.touch_type || "touch"}
          </span>
        </div>

        {touch.subject && (
          <p className="font-semibold text-sm break-words mb-1">
            {touch.subject}
          </p>
        )}

        {hasBody && (
          <div className="mt-1 text-sm text-gray-800">
            {!isExpanded ? (
              <>
                <p className="whitespace-pre-wrap break-words max-h-20 overflow-hidden">
                  {plainText.slice(0, 260)}
                  {isLong ? "…" : ""}
                </p>
                {isLong && (
                  <button
                    type="button"
                    onClick={() => toggleExpand(touch.id)}
                    className="mt-1 text-xs font-medium text-blue-600 hover:underline"
                  >
                    Expand message
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="border rounded-md p-2 max-h-64 overflow-y-auto bg-gray-50">
                  <div
                    className="whitespace-pre-wrap break-words"
                    dangerouslySetInnerHTML={{ __html: touch.body }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => toggleExpand(touch.id)}
                  className="mt-1 text-xs font-medium text-blue-600 hover:underline"
                >
                  Collapse
                </button>
              </>
            )}
          </div>
        )}

        {!hasBody && (
          <p className="mt-1 text-sm text-gray-500 italic">
            (No message body recorded for this touch.)
          </p>
        )}
      </div>
    )
  }

  const showingCount = touches.length
  const firstIndex = offset + 1
  const lastIndex = offset + showingCount

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full max-h-[80vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>
            Touch History for{" "}
            {contact
              ? `${contact.first_name || ""} ${contact.last_name || ""}`.trim()
              : ""}
          </DialogTitle>
          <DialogDescription>
            All recorded interactions (emails, calls, LinkedIn, etc.). Showing{" "}
            {showingCount > 0 ? `${firstIndex}-${lastIndex}` : "0"} of{" "}
            {total || 0} touches.
          </DialogDescription>
        </DialogHeader>

        {loading && touches.length === 0 ? (
          <p className="text-sm text-gray-500">Loading touch history…</p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : touches.length === 0 ? (
          <p className="text-sm text-gray-500">No history found.</p>
        ) : (
          <div className="space-y-3">
            {/* Load newer divider (if there are more recent touches above) */}
            {hasNewer && (
              <div className="flex items-center justify-center my-1">
                <button
                  type="button"
                  onClick={handleLoadNewer}
                  disabled={loading}
                  className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                >
                  Load newer touches
                </button>
              </div>
            )}

            {touches.map(renderTouchCard)}

            {/* Load older divider (if there are older touches below) */}
            {hasOlder && (
              <div className="flex items-center justify-center my-1">
                <button
                  type="button"
                  onClick={handleLoadOlder}
                  disabled={loading}
                  className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                >
                  Load older touches
                </button>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
