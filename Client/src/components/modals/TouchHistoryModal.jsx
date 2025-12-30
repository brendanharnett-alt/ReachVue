import React, { useEffect, useState, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Reply, Trash2, Mail, Phone, Linkedin, Eye, MousePointerClick, Clock } from "lucide-react"

// Helper to strip HTML tags for a preview
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

// 🟦 Helper to build Outlook-style quoted reply body
function buildReplyBody(touch) {
  const previousBody = touch.body || ""
  const sentDate = new Date(touch.touched_at).toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  })
  const from = "brendan.harnett@ibm.com"
  const to = touch.to || ""
  const subject = touch.subject || ""

  return `
<p><br><br></p>
<hr style="border: none; border-top: 1px solid #bfbfbf; margin: 8px 0;" />
<div style="font-family: Segoe UI, Arial, sans-serif; font-size: 12px; color: #333;">
  <p style="margin: 0;">
    <b>From:</b> ${from}<br>
    <b>Sent:</b> ${sentDate}<br>
    <b>To:</b> ${to}<br>
    <b>Subject:</b> ${subject}
  </p>
  <div style="margin-top: 8px;">
    ${previousBody}
  </div>
</div>`
}

export default function TouchHistoryModal({ open, onClose, contact, onReply, onEmail, onCall, onLinkedIn }) {
  const [touches, setTouches] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [offset, setOffset] = useState(0)
  const [limit] = useState(10)
  const [hasOlder, setHasOlder] = useState(false)
  const [hasNewer, setHasNewer] = useState(false)
  const [total, setTotal] = useState(0)
  const [expandedTouchId, setExpandedTouchId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [emailActivity, setEmailActivity] = useState({}) // Map of email_id -> { open_count, click_count, last_activity_at }

  const fetchTouches = async (offsetOverride = offset) => {
    if (!open || !contact) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `http://localhost:3000/touches?contact_id=${contact.id}&offset=${offsetOverride}&limit=${limit}`
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

  // Batch fetch email activity for all email touches
  const fetchEmailActivity = useCallback(async (touchesToFetch) => {
    const emailTouches = touchesToFetch.filter((t) => t.touch_type === "email")
    if (emailTouches.length === 0) {
      setEmailActivity({})
      return
    }

    const emailIds = emailTouches.map((t) => t.id)
    try {
      const res = await fetch("http://localhost:3000/api/email/activity-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailIds }),
      })

      if (!res.ok) {
        console.warn("Failed to fetch email activity, using empty data")
        setEmailActivity({})
        return
      }

      const activityData = await res.json()
      // Convert array to map for easy lookup
      const activityMap = {}
      activityData.forEach((item) => {
        activityMap[item.email_id] = {
          open_count: item.open_count || 0,
          click_count: item.click_count || 0,
          last_activity_at: item.last_activity_at || null,
        }
      })
      setEmailActivity(activityMap)
    } catch (err) {
      console.error("Error fetching email activity:", err)
      setEmailActivity({})
    }
  }, [])

  useEffect(() => {
    if (!open || !contact) return
    setOffset(0)
    setExpandedTouchId(null)
  }, [open, contact])

  useEffect(() => {
    fetchTouches()
  }, [open, contact, offset, limit])

  // Fetch email activity when touches change
  useEffect(() => {
    if (touches.length > 0) {
      fetchEmailActivity(touches)
    } else {
      setEmailActivity({})
    }
  }, [touches, fetchEmailActivity])

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

  const confirmDelete = (touch) => setDeleteTarget(touch)

  const performDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`http://localhost:3000/touches/${deleteTarget.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Delete failed")

      // Refresh list after deletion
      await fetchTouches(0)
      setOffset(0)
      setDeleteTarget(null)
    } catch (err) {
      console.error("Error deleting touch:", err)
      alert("Failed to delete touch.")
    } finally {
      setDeleting(false)
    }
  }

  const renderTouchCard = (touch) => {
    const hasBody = !!touch.body
    const plainText = hasBody ? stripHtml(touch.body) : ""
    const isLong = plainText.length > 260
    const isExpanded = expandedTouchId === touch.id
    const isEmailTouch = touch.touch_type === "email"
    const showEmailActivitySection = true // Show email activity section

    // Get activity data for this email touch
    const activity = isEmailTouch ? emailActivity[touch.id] : null
    const openCount = activity?.open_count ?? null
    const clickCount = activity?.click_count ?? null
    const lastActivity = activity?.last_activity_at ? formatShortDateTime(activity.last_activity_at) : null

    return (
      <div
        key={touch.id}
        className="rounded-lg border p-3 shadow-sm bg-white w-full overflow-hidden break-words"
      >
        {/* HEADER + ACTIONS */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-600">
              {formatDateWithOrdinal(touch.touched_at)}
            </span>
            {/* EMAIL ACTIVITY METADATA */}
            {isEmailTouch && showEmailActivitySection && (
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
                <span className="text-gray-300">·</span>
                <div className="flex items-center gap-0.5">
                  <Clock size={11} />
                  <span>{lastActivity || "—"}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {touch.touch_type === "email" && (
              <button
                type="button"
                onClick={() =>
                  onReply &&
                  onReply({
                    initialSubject: touch.subject ? `Re: ${touch.subject}` : "Re:",
                    initialBody: buildReplyBody(touch),
                  })
                }
                className="flex items-center text-xs text-blue-600 hover:underline"
              >
                <Reply size={14} className="mr-1" />
                Reply
              </button>
            )}

            <button
              type="button"
              onClick={() => confirmDelete(touch)}
              className="text-blue-600 hover:text-blue-800"
              title="Delete touch"
            >
              <Trash2 size={16} />
            </button>
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
        ) : (
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
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl w-full max-h-[80vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <DialogTitle className="mb-0">
                    Interaction History
                  </DialogTitle>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-base">
                    {contact
                      ? `${contact.first_name || ""} ${contact.last_name || ""}`.trim()
                      : ""}
                  </span>
                </div>
                <DialogDescription>
                  Showing {showingCount > 0 ? `${firstIndex}-${lastIndex}` : "0"} of{" "}
                  {total || 0} touches.
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  onClick={() => onEmail && onEmail()}
                  className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Send Email
                </Button>
                <Button
                  onClick={() => onCall && onCall()}
                  className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
                >
                  <Phone className="h-4 w-4" />
                  Log Call
                </Button>
                <Button
                  onClick={() => onLinkedIn && onLinkedIn()}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                >
                  <Linkedin className="h-4 w-4" />
                  Log LinkedIn Touch
                </Button>
              </div>
            </div>
          </DialogHeader>

          {loading && touches.length === 0 ? (
            <p className="text-sm text-gray-500">Loading touch history…</p>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : touches.length === 0 ? (
            <p className="text-sm text-gray-500">No history found.</p>
          ) : (
            <div className="space-y-3">
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

      {/* DELETE CONFIRMATION */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Touch</DialogTitle>
            <DialogDescription>
              This will permanently delete the selected touch. Are you sure?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={performDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
