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
import { Eye, MousePointerClick, Clock } from "lucide-react"

// Helper to strip HTML tags
function stripHtml(html) {
  if (!html) return ""
  let text = html.replace(/<[^>]+>/g, " ")
  const textarea = document.createElement("textarea")
  textarea.innerHTML = text
  let decoded = textarea.value
  return decoded.replace(/\s+/g, " ").trim()
}

// Format date: "November 19th, 2025 · 6:23 PM"
function formatDateWithOrdinal(dateString) {
  if (!dateString) return ""

  const date = new Date(dateString)
  const day = date.getDate()
  const month = date.toLocaleString("en-US", { month: "long" })
  const year = date.getFullYear()
  const hours = date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })

  const getOrdinal = (n) => {
    if (n > 3 && n < 21) return "th"
    switch (n % 10) {
      case 1:
        return "st"
      case 2:
        return "nd"
      case 3:
        return "rd"
      default:
        return "th"
    }
  }

  return `${month} ${day}${getOrdinal(day)}, ${year} · ${hours}`
}

export default function TouchDetailsModal({ open, onClose, touch }) {
  const [emailActivity, setEmailActivity] = useState(null)
  const [loadingActivity, setLoadingActivity] = useState(false)

  useEffect(() => {
    if (!open || !touch || touch.touch_type !== "email" || !touch.email_id) {
      setEmailActivity(null)
      return
    }

    const fetchActivity = async () => {
      try {
        setLoadingActivity(true)
        const res = await fetch(
          `http://localhost:3000/api/email/${touch.email_id}/activity-summary`
        )
        if (res.ok) {
          const data = await res.json()
          setEmailActivity(data)
        }
      } catch (err) {
        console.error("Error fetching email activity:", err)
      } finally {
        setLoadingActivity(false)
      }
    }

    fetchActivity()
  }, [open, touch])

  if (!touch) return null

  const isEmailTouch = touch.touch_type === "email"
  const openCount = emailActivity?.openCount ?? (isEmailTouch ? touch.open_count ?? 0 : null)
  const clickCount = emailActivity?.clickCount ?? (isEmailTouch ? touch.click_count ?? 0 : null)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Touch Details</DialogTitle>
          <DialogDescription>
            {formatDateWithOrdinal(touch.touched_at)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Contact Info */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold text-sm mb-2">Contact Information</h3>
            <div className="space-y-1 text-sm">
              <div>
                <span className="font-medium">Name:</span>{" "}
                {touch.first_name || touch.last_name
                  ? `${touch.first_name || ""} ${touch.last_name || ""}`.trim()
                  : "—"}
              </div>
              <div>
                <span className="font-medium">Company:</span> {touch.company || "—"}
              </div>
              {touch.email && (
                <div>
                  <span className="font-medium">Email:</span> {touch.email}
                </div>
              )}
            </div>
          </div>

          {/* Touch Type */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 capitalize">
                {touch.touch_type || "touch"}
              </span>
            </div>

            {/* Email Activity (for email touches) */}
            {isEmailTouch && (
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>
                    <span className="font-medium">Opens:</span> {openCount !== null ? openCount : "—"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <MousePointerClick className="h-4 w-4" />
                  <span>
                    <span className="font-medium">Clicks:</span> {clickCount !== null ? clickCount : "—"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Subject (for email touches) */}
          {isEmailTouch && touch.subject && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-sm mb-2">Subject</h3>
              <p className="text-sm">{touch.subject}</p>
            </div>
          )}

          {/* Message Body */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-sm mb-2">Message</h3>
            {touch.body ? (
              <div className="text-sm">
                <div
                  className="whitespace-pre-wrap break-words"
                  dangerouslySetInnerHTML={{ __html: touch.body }}
                />
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">(No message body recorded for this touch.)</p>
            )}
          </div>

          {/* Metadata */}
          {touch.metadata && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-sm mb-2">Metadata</h3>
              <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                {typeof touch.metadata === 'string' 
                  ? JSON.stringify(JSON.parse(touch.metadata), null, 2)
                  : JSON.stringify(touch.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

