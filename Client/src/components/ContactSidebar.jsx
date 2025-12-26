// Version tracking test commit - Dec 13 2025
console.log("Version test")

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  MailIcon,
  PhoneIcon,
  LinkedinIcon,
  TagIcon,
  X,
  ClockIcon,
} from "lucide-react"
import AddIndividualContactModal from "./modals/AddIndividualContactModal"
import TagModal from "./modals/TagModal"
import TouchHistoryModal from "./modals/TouchHistoryModal"
import { fetchTouches } from "../api"

export default function ContactSidebar({ 
  contact, 
  onClose, 
  onContactUpdate,
  onEmail,
  onCall,
  onTouch,
  onLinkedIn,
}) {
  const [showEditModal, setShowEditModal] = useState(false)
  const [showTagsModal, setShowTagsModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [localContact, setLocalContact] = useState(contact)
  const [notes, setNotes] = useState(contact?.notes || "")
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [recentTouches, setRecentTouches] = useState([])
  const [loadingTouches, setLoadingTouches] = useState(false)

  useEffect(() => {
    setLocalContact(contact)
    setNotes(contact?.notes || "")
  }, [contact])

  // Fetch recent touches
  const loadRecentTouches = async () => {
    if (!contact?.id) return
    
    setLoadingTouches(true)
    try {
      const res = await fetch(
        `http://localhost:3000/touches?contact_id=${contact.id}&offset=0&limit=3`
      )
      if (!res.ok) throw new Error("Failed to fetch touches")
      const data = await res.json()
      setRecentTouches(data.touches || [])
    } catch (err) {
      console.error("Error loading recent touches:", err)
      setRecentTouches([])
    } finally {
      setLoadingTouches(false)
    }
  }

  useEffect(() => {
    loadRecentTouches()
  }, [contact?.id])

  // Refresh touches when history modal closes (in case new touches were added)
  const handleHistoryModalClose = () => {
    setShowHistoryModal(false)
    // Refresh touches after a short delay to allow backend to process
    setTimeout(() => {
      loadRecentTouches()
    }, 500)
  }

  if (!contact) return null

  const handleSaveNotes = async () => {
    setIsSavingNotes(true)
    try {
      // TODO: Add API call to save notes
      // For now, just update local state
      setLocalContact((prev) => ({ ...prev, notes }))
      if (onContactUpdate) {
        onContactUpdate({ ...localContact, notes })
      }
      setIsEditingNotes(false)
    } catch (err) {
      console.error("Failed to save notes:", err)
      alert("Failed to save notes")
    } finally {
      setIsSavingNotes(false)
    }
  }

  const handleTagsModalClose = () => {
    setShowTagsModal(false)
    // Refresh contact data if needed
    if (onContactUpdate && contact) {
      // The parent component should refresh the contact
    }
  }

  const handleEditModalClose = () => {
    setShowEditModal(false)
  }

  const handleEditModalSuccess = (updatedContact) => {
    setLocalContact(updatedContact)
    if (onContactUpdate) {
      onContactUpdate(updatedContact)
    }
    setShowEditModal(false)
  }

  // Format touch timestamp - relative format
  const formatTouchDate = (dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  // Format touch type label
  const formatTouchType = (touchType) => {
    if (!touchType) return "Touch"
    const typeMap = {
      email: "Email Sent",
      call: "Call Logged",
      linkedin: "LinkedIn Outreach",
      note: "Note Added",
      touch: "Touch Logged",
    }
    return typeMap[touchType.toLowerCase()] || touchType.charAt(0).toUpperCase() + touchType.slice(1) + " Logged"
  }

  // Get touch type icon
  const getTouchTypeIcon = (touchType) => {
    switch (touchType?.toLowerCase()) {
      case "email":
        return <MailIcon className="h-3 w-3 text-gray-400" />
      case "call":
        return <PhoneIcon className="h-3 w-3 text-gray-400" />
      case "linkedin":
        return <LinkedinIcon className="h-3 w-3 text-gray-400" />
      case "touch":
        return <ClockIcon className="h-3 w-3 text-gray-400" />
      default:
        return <ClockIcon className="h-3 w-3 text-gray-400" />
    }
  }

  return (
    <>
      <div className="w-96 border-l bg-white shadow-lg h-[calc(100vh-150px)] p-4 flex flex-col overflow-hidden">
        {/* Identity Section - Fixed, non-scrollable */}
        <div className="flex-shrink-0">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold leading-tight">{localContact.first_name} {localContact.last_name}</h2>
              {localContact.title && (
                <p className="text-xs text-gray-500 mt-0.5">{localContact.title}</p>
              )}
              {localContact.company && (
                <p className="text-xs text-gray-500 mt-0.5">{localContact.company}</p>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
              >
                Edit
              </button>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Primary Actions */}
          <div className="flex gap-1.5 mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEmail && onEmail(localContact)}
              className="flex-1 flex items-center justify-center gap-1 h-7 text-xs px-2"
            >
              <MailIcon className="h-3 w-3" />
              Email
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCall && onCall(localContact)}
              className="flex-1 flex items-center justify-center gap-1 h-7 text-xs px-2"
            >
              <PhoneIcon className="h-3 w-3" />
              Call
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onTouch && onTouch(localContact)}
              className="flex-1 flex items-center justify-center gap-1 h-7 text-xs px-2"
            >
              <ClockIcon className="h-3 w-3" />
              Touch
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onLinkedIn && onLinkedIn(localContact)}
              className="flex-1 flex items-center justify-center gap-1 h-7 text-xs px-2"
            >
              <LinkedinIcon className="h-3 w-3" />
              LinkedIn
            </Button>
          </div>

          {/* Contact Info */}
          <div className="mb-3">
            <h3 className="text-xs font-medium mb-1.5 text-gray-700">Contact</h3>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs">
                <MailIcon className="h-3 w-3 text-gray-400 flex-shrink-0" />
                <span className="text-gray-700 truncate">{localContact.email || "—"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <PhoneIcon className="h-3 w-3 text-gray-400 flex-shrink-0" />
                <span className="text-gray-700">{localContact.mobile_phone || "—"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <LinkedinIcon className="h-3 w-3 text-gray-400 flex-shrink-0" />
                <span className="text-gray-700 truncate">{localContact.linkedin_url || "—"}</span>
              </div>
            </div>
          </div>

          {/* Tags - Inline Editable */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs font-medium flex items-center gap-1 text-gray-700">
                <TagIcon className="h-3 w-3 text-gray-500" /> Tags
              </h3>
              <button
                onClick={() => setShowTagsModal(true)}
                className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
              >
                Edit
              </button>
            </div>
            {localContact.tags?.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {localContact.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-800"
                  >
                    {tag.tag_name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">No tags</p>
            )}
          </div>
        </div>

        {/* Notes - Inline Editable with Internal Scrolling */}
        <div className="mb-3 flex-shrink-0">
          <h3 className="text-xs font-medium mb-1.5 text-gray-700">Notes</h3>
          {isEditingNotes ? (
            <div className="space-y-2">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={4}
                placeholder="Add notes..."
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className="h-7 text-xs"
                >
                  {isSavingNotes ? "Saving..." : "Save"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setNotes(localContact.notes || "")
                    setIsEditingNotes(false)
                  }}
                  className="h-7 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setIsEditingNotes(true)}
              className="min-h-[60px] max-h-[80px] overflow-y-auto border border-transparent hover:border-gray-200 rounded-md p-2 cursor-text transition-colors"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#cbd5e1 transparent"
              }}
            >
              {notes ? (
                <p className="text-xs text-gray-700 whitespace-pre-wrap">
                  {notes}
                </p>
              ) : (
                <p className="text-xs text-gray-400 italic">
                  Click to add notes...
                </p>
              )}
            </div>
          )}
        </div>

        {/* Activity - Preview Only, Non-scrollable */}
        <div className="flex-shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-xs font-medium flex items-center gap-1 text-gray-600">
              <ClockIcon className="h-3 w-3 text-gray-400" /> Activity
            </h3>
            {recentTouches.length > 0 && (
              <button
                onClick={() => setShowHistoryModal(true)}
                className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
              >
                View full history
              </button>
            )}
          </div>
          
          {loadingTouches ? (
            <p className="text-xs text-gray-500">Loading...</p>
          ) : recentTouches.length === 0 ? (
            <p className="text-xs text-gray-500">No activity yet</p>
          ) : (
            <div className="space-y-1.5">
              {recentTouches.slice(0, 3).map((touch) => (
                <div key={touch.id} className="flex items-start gap-2 py-1">
                  <div className="flex-shrink-0 mt-0.5">
                    {getTouchTypeIcon(touch.touch_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-gray-600">
                        {formatTouchType(touch.touch_type)}
                      </span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-500">
                        {formatTouchDate(touch.touched_at)}
                      </span>
                    </div>
                    {touch.touch_type === "email" && touch.subject && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {touch.subject}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Contact Modal */}
      <AddIndividualContactModal
        open={showEditModal}
        onClose={handleEditModalClose}
        contact={localContact}
        onSuccess={handleEditModalSuccess}
      />

      {/* Tags Management Modal */}
      <TagModal
        open={showTagsModal}
        onClose={handleTagsModalClose}
        selectedContacts={[localContact]}
      />

      {/* Touch History Modal */}
      <TouchHistoryModal
        open={showHistoryModal}
        onClose={handleHistoryModalClose}
        contact={localContact}
        onEmail={onEmail}
        onCall={onCall}
        onLinkedIn={onLinkedIn}
      />
    </>
  )
}
