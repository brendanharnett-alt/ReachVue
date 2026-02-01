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

// Format short date/time for last activity: "Nov 19, 6:23 PM"
function formatShortDateTime(dateString) {
  if (!dateString) return null
  const date = new Date(dateString)
  const month = date.toLocaleString("en-US", { month: "short" })
  const day = date.getDate()
  const time = date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
  return `${month} ${day}, ${time}`
}

export default function TouchDetailsModal({ open, onClose, touch }) {
  const [emailActivity, setEmailActivity] = useState(null)
  const [loadingActivity, setLoadingActivity] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

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

  useEffect(() => {
    if (!open) {
      setIsExpanded(false)
    }
  }, [open])

  if (!touch) return null

  const isEmailTouch = touch.touch_type === "email"
  const openCount = emailActivity?.openCount ?? (isEmailTouch ? touch.open_count ?? 0 : null)
  const clickCount = emailActivity?.clickCount ?? (isEmailTouch ? touch.click_count ?? 0 : null)
  const lastActivity = emailActivity?.lastActivityAt ? formatShortDateTime(emailActivity.lastActivityAt) : null

  const hasBody = !!touch.body
  const plainText = hasBody ? stripHtml(touch.body) : ""
  const isLong = plainText.length > 260

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

          {/* Touch Details Card - Condensed */}
          <div className="rounded-lg border p-3 shadow-sm bg-white w-full overflow-hidden break-words">
            {/* HEADER + EMAIL ACTIVITY METADATA */}
            <div className="flex justify-between items-start mb-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-600">
                  {formatDateWithOrdinal(touch.touched_at)}
                </span>
                {/* EMAIL ACTIVITY METADATA */}
                {isEmailTouch && (
                  <div className="flex items-center gap-2 text-[10px] text-gray-400">
                    <div className="flex items-center gap-0.5">
                      <Eye size={11} />
                      <span>{openCount !== null ? openCount : "—"}</span>
                    </div>
                    <span className="text-gray-300">·</span>
                    <div className="flex items-center gap-0.5">
                      <MousePointerClick size={11} />
                      <span>{clickCount !== null ? clickCount : "—"}</span>
                    </div>
                    {lastActivity && (
                      <>
                        <span className="text-gray-300">·</span>
                        <div className="flex items-center gap-0.5">
                          <Clock size={11} />
                          <span>{lastActivity}</span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* TOUCH TYPE TAG */}
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 capitalize">
              {touch.touch_type || "touch"}
            </span>

            {/* SUBJECT */}
            {touch.subject && (
              <p className="font-semibold text-sm break-words mt-2">{touch.subject}</p>
            )}

            {/* BODY */}
            {hasBody ? (
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
                        onClick={() => setIsExpanded(true)}
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
                      onClick={() => setIsExpanded(false)}
                      className="mt-1 text-xs font-medium text-blue-600 hover:underline"
                    >
                      Collapse
                    </button>
                  </>
                )}
              </div>
            ) : (
              <p className="mt-1 text-sm text-gray-500 italic">
                (No message body recorded for this touch.)
              </p>
            )}
          </div>
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

