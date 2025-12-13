import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export default function TouchHistoryPanel({ open, onClose, contact }) {
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

  // ✅ Unmount everything when closed
  if (!open) return null

  return (
    <>
      {/* ✅ Dimming overlay with pointer-event safety */}
      <div
        className={`fixed inset-0 z-40 bg-black transition-opacity duration-150 ${
          open
            ? "bg-opacity-30 pointer-events-auto opacity-100"
            : "bg-opacity-0 pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      ></div>

      {/* ✅ Centered modal container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="w-[80vw] max-w-3xl max-h-[85vh] bg-white shadow-2xl rounded-xl border border-gray-200 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center px-5 py-4 border-b bg-gray-50">
            <div>
              <h2 className="text-lg font-semibold">
                Touch History for {contact?.first_name} {contact?.last_name}
              </h2>
              <p className="text-sm text-gray-500">
                All recorded interactions (emails, calls, LinkedIn, etc.)
              </p>
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>

          {/* Content */}
          <div className="p-5 overflow-y-auto">
            {loading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : touches.length === 0 ? (
              <p className="text-sm text-gray-500">No history found.</p>
            ) : (
              <div className="space-y-4">
                {touches.map((touch) => (
                  <div
                    key={touch.id}
                    className="rounded-lg border p-3 shadow-sm bg-white"
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
                      <p className="font-semibold text-sm">{touch.subject}</p>
                    )}
                    {touch.body && (
                      <div
                        className="text-sm whitespace-pre-line mt-1"
                        dangerouslySetInnerHTML={{ __html: touch.body }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
