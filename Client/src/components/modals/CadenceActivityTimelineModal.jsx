import React, { useState } from "react"
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
  Mail,
  Phone,
  Linkedin,
  CheckCircle,
  SkipForward,
  UserPlus,
  UserMinus,
  Clock,
} from "lucide-react"

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

// Generate mock timeline data
function generateMockTimelineData(contact, cadenceName) {
  const now = new Date()
  const events = []

  // Add to cadence event (oldest)
  events.push({
    id: "1",
    type: "added",
    label: "Added to cadence",
    secondaryText: null,
    timestamp: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
    icon: UserPlus,
    iconColor: "text-blue-600",
  })

  // Step completed events
  events.push({
    id: "2",
    type: "step_completed",
    label: "Step completed",
    secondaryText: "Day 0: Step 1 - Initial Outreach Email",
    timestamp: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days ago
    icon: CheckCircle,
    iconColor: "text-green-600",
  })

  // Email sent (linked to cadence)
  events.push({
    id: "3",
    type: "email_sent",
    label: "Email sent",
    secondaryText: "Day 0: Step 1 - Initial Outreach Email",
    timestamp: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(), // 12 days ago + 5 min
    icon: Mail,
    iconColor: "text-teal-600",
  })

  // Step completed
  events.push({
    id: "4",
    type: "step_completed",
    label: "Step completed",
    secondaryText: "Day 2: Step 2 - LinkedIn Connection Request",
    timestamp: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
    icon: CheckCircle,
    iconColor: "text-green-600",
  })

  // LinkedIn touch
  events.push({
    id: "5",
    type: "linkedin_touch",
    label: "LinkedIn touch",
    secondaryText: "Day 2: Step 2 - LinkedIn Connection Request",
    timestamp: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString(), // 10 days ago + 10 min
    icon: Linkedin,
    iconColor: "text-blue-600",
  })

  // Step skipped
  events.push({
    id: "6",
    type: "step_skipped",
    label: "Step skipped",
    secondaryText: "Day 4: Step 3 - Follow-up Email",
    timestamp: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
    icon: SkipForward,
    iconColor: "text-orange-600",
  })

  // Step completed
  events.push({
    id: "7",
    type: "step_completed",
    label: "Step completed",
    secondaryText: "Day 7: Step 4 - Phone Call",
    timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    icon: CheckCircle,
    iconColor: "text-green-600",
  })

  // Call logged
  events.push({
    id: "8",
    type: "call_logged",
    label: "Call logged",
    secondaryText: "Day 7: Step 4 - Phone Call",
    timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(), // 5 days ago + 15 min
    icon: Phone,
    iconColor: "text-orange-600",
  })

  // Email sent
  events.push({
    id: "9",
    type: "email_sent",
    label: "Email sent",
    secondaryText: "Day 9: Step 5 - Value Proposition Email",
    timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    icon: Mail,
    iconColor: "text-teal-600",
  })

  // Step completed
  events.push({
    id: "10",
    type: "step_completed",
    label: "Step completed",
    secondaryText: "Day 9: Step 5 - Value Proposition Email",
    timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 1000).toISOString(), // 3 days ago + 2 min
    icon: CheckCircle,
    iconColor: "text-green-600",
  })

  // Sort by timestamp (newest first)
  return events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
}

export default function CadenceActivityTimelineModal({
  open,
  onClose,
  contact,
  cadenceName,
}) {
  const [loadingEarlier, setLoadingEarlier] = useState(false)
  const [hasEarlier, setHasEarlier] = useState(true) // Mock: assume there's more

  // Generate mock timeline data
  const timelineData = contact
    ? generateMockTimelineData(contact, cadenceName)
    : []

  const handleLoadEarlier = () => {
    setLoadingEarlier(true)
    // Mock loading delay
    setTimeout(() => {
      setLoadingEarlier(false)
      setHasEarlier(false) // Mock: no more after first load
    }, 1000)
  }

  const renderTimelineItem = (item, isLast = false) => {
    const IconComponent = item.icon
    // Map icon colors to border colors
    const borderColorMap = {
      "text-blue-600": "border-blue-600",
      "text-green-600": "border-green-600",
      "text-teal-600": "border-teal-600",
      "text-orange-600": "border-orange-600",
    }
    const borderColor = borderColorMap[item.iconColor] || "border-gray-400"

    return (
      <div
        key={item.id}
        className={`flex gap-4 ${isLast ? "pb-0" : "pb-4 border-l-2 border-gray-200"} pl-4 relative`}
      >
        {/* Timeline dot */}
        <div className="absolute -left-[9px] top-0">
          <div className={`w-4 h-4 rounded-full bg-white border-2 ${borderColor} flex items-center justify-center`}>
            <IconComponent className={`h-2.5 w-2.5 ${item.iconColor}`} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-900">
                  {item.label}
                </span>
              </div>
              {item.secondaryText && (
                <div className="text-xs text-gray-500 mb-1">
                  {item.secondaryText}
                </div>
              )}
              <div className="text-xs text-gray-400">
                {formatDateWithOrdinal(item.timestamp)}
              </div>
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
              <DialogTitle className="mb-0">
                Cadence Activity Timeline
              </DialogTitle>
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
          {timelineData.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">
              No activity found for this contact in this cadence.
            </p>
          ) : (
            <>
              {hasEarlier && (
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
                {timelineData.map((item, index) => {
                  const isLast = index === timelineData.length - 1
                  return renderTimelineItem(item, isLast)
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

