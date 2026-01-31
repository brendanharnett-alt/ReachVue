import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  CheckCircle,
  SkipForward,
  UserPlus,
  UserMinus,
  Clock,
  Calendar,
  Linkedin,
} from "lucide-react"
import { fetchCadenceHistoryByContactAndCadence } from "@/api"

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

// Map event type to icon and color
function getEventIcon(eventType) {
  switch (eventType) {
    case "added":
      return { icon: UserPlus, color: "text-blue-600", borderColor: "border-blue-600" }
    case "completed":
      return { icon: CheckCircle, color: "text-green-600", borderColor: "border-green-600" }
    case "skipped":
      return { icon: SkipForward, color: "text-orange-600", borderColor: "border-orange-600" }
    case "postponed":
      return { icon: Calendar, color: "text-purple-600", borderColor: "border-purple-600" }
    case "cadence_completed":
      return { icon: CheckCircle, color: "text-green-600", borderColor: "border-green-600" }
    case "contact_removed":
      return { icon: UserMinus, color: "text-red-600", borderColor: "border-red-600" }
    case "ended":
      return { icon: UserMinus, color: "text-red-600", borderColor: "border-red-600" }
    default:
      return { icon: Clock, color: "text-gray-600", borderColor: "border-gray-600" }
  }
}

// Format postponed date from metadata (e.g., "Feb 1, 2026")
function formatPostponedDate(newDueOn) {
  if (!newDueOn) return null
  
  try {
    const date = new Date(newDueOn)
    if (isNaN(date.getTime())) return null
    
    const month = date.toLocaleString("en-US", { month: "short" })
    const day = date.getDate()
    const year = date.getFullYear()
    
    return `${month} ${day}, ${year}`
  } catch (err) {
    return null
  }
}

// Map event type to label
function getEventLabel(eventType, metadata = null) {
  switch (eventType) {
    case "added":
      return "Added to cadence"
    case "completed":
      return "Step completed"
    case "skipped":
      return "Step skipped"
    case "postponed":
      if (metadata?.new_due_on) {
        const formattedDate = formatPostponedDate(metadata.new_due_on)
        if (formattedDate) {
          return `Step postponed to ${formattedDate}`
        }
      }
      return "Step postponed"
    case "cadence_completed":
      return "Cadence completed"
    case "contact_removed":
      return "Contact removed from cadence"
    case "ended":
      return "Cadence ended"
    default:
      return "Activity"
  }
}

// Format secondary text with step info
function formatSecondaryText(dayNumber, stepLabel) {
  if (dayNumber !== null && dayNumber !== undefined && stepLabel) {
    return `Day ${dayNumber}: ${stepLabel}`
  }
  if (stepLabel) {
    return stepLabel
  }
  return null
}

export default function CadenceActivityTimelineModal({
  open,
  onClose,
  contact,
  cadenceId,
  cadenceName,
}) {
  const [timelineData, setTimelineData] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingEarlier, setLoadingEarlier] = useState(false)
  const [hasOlder, setHasOlder] = useState(false)
  const [offset, setOffset] = useState(0)
  const [limit] = useState(20)
  const [error, setError] = useState(null)
  const [expandedEventId, setExpandedEventId] = useState(null)

  // Get contactId from contact object (contactId is the actual contact_id, not contact_cadence_id)
  const contactId = contact?.contactId

  // Fetch history when modal opens
  useEffect(() => {
    if (!open || !contactId || !cadenceId) {
      setTimelineData([])
      setOffset(0)
      setHasOlder(false)
      setError(null)
      return
    }

    const fetchHistory = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchCadenceHistoryByContactAndCadence(cadenceId, contactId, 0, limit)
        setTimelineData(data.items || data.events || [])
        setHasOlder(data.hasOlder || false)
        setOffset(data.offset || 0)
      } catch (err) {
        console.error("Error fetching cadence history:", err)
        setError("Failed to load cadence history")
        setTimelineData([])
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [open, contactId, cadenceId, limit])

  const handleLoadEarlier = async () => {
    if (!contactId || !cadenceId || loadingEarlier || !hasOlder) return

    setLoadingEarlier(true)
    try {
      const newOffset = offset + limit
      const data = await fetchCadenceHistoryByContactAndCadence(cadenceId, contactId, newOffset, limit)
      
      // Append new events to existing timeline
      setTimelineData((prev) => [...prev, ...(data.items || data.events || [])])
      setHasOlder(data.hasOlder || false)
      setOffset(newOffset)
    } catch (err) {
      console.error("Error loading earlier history:", err)
      setError("Failed to load earlier activity")
    } finally {
      setLoadingEarlier(false)
    }
  }

  const toggleExpand = (eventId) => {
    setExpandedEventId((prev) => (prev === eventId ? null : eventId))
  }

  const renderTimelineItem = (event, isLast = false) => {
    const { icon: IconComponent, color, borderColor } = getEventIcon(event.event_type)
    const label = getEventLabel(event.event_type, event.metadata)
    const secondaryText = formatSecondaryText(event.day_number, event.step_label)
    
    // Check if this is a completed step with touch data
    const hasTouchData = event.event_type === 'completed' && event.touch_id
    const isEmailTouch = hasTouchData && event.touch_type === 'email'
    const isCallTouch = hasTouchData && event.touch_type === 'call'
    const isLinkedInTouch = hasTouchData && event.touch_type === 'linkedin'
    const isExpanded = expandedEventId === event.id
    
    // For email: check if body is long enough to need expansion
    const emailBody = event.body || ""
    const plainText = stripHtml(emailBody)
    const isLongEmail = plainText.length > 260

    return (
      <div
        key={event.id}
        className={`flex gap-4 ${isLast ? "pb-0" : "pb-4 border-l-2 border-gray-200"} pl-4 relative`}
      >
        {/* Timeline dot */}
        <div className="absolute -left-[9px] top-0">
          <div className={`w-4 h-4 rounded-full bg-white border-2 ${borderColor} flex items-center justify-center`}>
            <IconComponent className={`h-2.5 w-2.5 ${color}`} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-900">
                  {label}
                </span>
              </div>
              {secondaryText && (
                <div className="text-xs text-gray-500 mb-1">
                  {secondaryText}
                </div>
              )}
              <div className="text-xs text-gray-400 mb-2">
                {formatDateWithOrdinal(event.event_at)}
              </div>
              
              {/* Touch details for completed steps */}
              {hasTouchData && (
                <div className="mt-2 rounded-lg border p-3 shadow-sm bg-white w-full overflow-hidden break-words">
                  {/* Touch type tag */}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 capitalize mb-2 inline-block">
                    {event.touch_type || "touch"}
                  </span>
                  
                  {/* Email touch details */}
                  {isEmailTouch && (
                    <>
                      {event.subject && (
                        <p className="font-semibold text-sm break-words mt-2">{event.subject}</p>
                      )}
                      {emailBody && (
                        <div className="mt-1 text-sm text-gray-800">
                          {!isExpanded ? (
                            <>
                              <p className="whitespace-pre-wrap break-words max-h-20 overflow-hidden">
                                {plainText.slice(0, 260)}
                                {isLongEmail ? "…" : ""}
                              </p>
                              {isLongEmail && (
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(event.id)}
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
                                  dangerouslySetInnerHTML={{ __html: emailBody }}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleExpand(event.id)}
                                className="mt-1 text-xs font-medium text-blue-600 hover:underline"
                              >
                                Collapse
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Call touch details */}
                  {isCallTouch && event.body && (
                    <div className="mt-2 text-sm text-gray-800">
                      <div className="whitespace-pre-wrap break-words">
                        {event.body}
                      </div>
                    </div>
                  )}
                  
                  {/* LinkedIn touch details */}
                  {isLinkedInTouch && event.body && (
                    <div className="mt-2 text-sm text-gray-800">
                      <div className="whitespace-pre-wrap break-words">
                        {event.body}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl w-full max-h-[80vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0">
                <DialogTitle className="mb-0">
                  Cadence Activity Timeline
                </DialogTitle>
                {contact?.linkedin_url && (
                  <button
                    onClick={() => window.open(contact.linkedin_url, '_blank', 'noopener,noreferrer')}
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                    title="Open LinkedIn Profile"
                    aria-label="Open LinkedIn Profile"
                  >
                    <Linkedin className="h-5 w-5 text-blue-600" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="font-semibold text-base">
                  {contact
                    ? `${contact.firstName || contact.first_name || ""} ${contact.lastName || contact.last_name || ""}`.trim()
                    : ""}
                </span>
                {cadenceName && (
                  <>
                    <span className="text-gray-400">·</span>
                    <span className="text-sm text-gray-600">{cadenceName}</span>
                  </>
                )}
              </div>
              <DialogDescription className="mt-2">
                Activity history for this contact within this cadence
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-6 space-y-0">
          {loading && timelineData.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">
              Loading activity history...
            </p>
          ) : error ? (
            <p className="text-sm text-red-500 py-8 text-center">
              {error}
            </p>
          ) : timelineData.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">
              No activity found for this contact in this cadence.
            </p>
          ) : (
            <>
              {hasOlder && (
                <div className="flex items-center justify-center mb-4 pb-4 border-b">
                  <button
                    type="button"
                    onClick={handleLoadEarlier}
                    disabled={loadingEarlier}
                    className="text-xs text-blue-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loadingEarlier ? (
                      <>
                        <Clock className="h-3 w-3 animate-spin" />
                        Loading earlier activity...
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3" />
                        Load earlier activity
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className="space-y-0">
                {timelineData.map((event, index) => {
                  const isLast = index === timelineData.length - 1 && !hasOlder
                  return renderTimelineItem(event, isLast)
                })}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

