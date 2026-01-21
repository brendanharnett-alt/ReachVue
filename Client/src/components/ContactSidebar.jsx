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
        `http://localhost:3000/touches?contact_id=${contact.id}&offset=0&limit=5`
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

  // Format touch timestamp
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
    if (diffHours < 24) return `Today, ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`
    if (diffDays === 1) return `Yesterday, ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`
    if (diffDays < 7) {
      return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + ", " + date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
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

  return (
    <>
      <div className="w-96 border-l bg-white shadow-lg h-[calc(100vh-150px)] overflow-y-auto p-4 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold">{localContact.first_name} {localContact.last_name}</h2>
            <p className="text-sm text-gray-500">{localContact.title}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              Edit
            </button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEmail && onEmail(localContact)}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs"
          >
            <MailIcon className="h-3.5 w-3.5" />
            Email
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCall && onCall(localContact)}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs"
          >
            <PhoneIcon className="h-3.5 w-3.5" />
            Call
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onTouch && onTouch(localContact)}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs"
          >
            <ClockIcon className="h-3.5 w-3.5" />
            Touch
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onLinkedIn && onLinkedIn(localContact)}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs"
          >
            <LinkedinIcon className="h-3.5 w-3.5" />
            LinkedIn
          </Button>
        </div>

        {/* Contact Section - Compact */}
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Contact</h3>
          <div className="space-y-2">
            {localContact.email && (
              <div className="flex items-center gap-2 text-sm">
                <MailIcon className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-gray-700">{localContact.email}</span>
              </div>
            )}
            {localContact.mobile_phone && (
              <div className="flex items-center gap-2 text-sm">
                <PhoneIcon className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-gray-700">{localContact.mobile_phone}</span>
              </div>
            )}
            {localContact.linkedin_url && (
              <div className="flex items-center gap-2 text-sm">
                <LinkedinIcon className="h-3.5 w-3.5 text-gray-400" />
                <a 
                  href={localContact.linkedin_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-600 hover:underline"
                >
                  {localContact.linkedin_url}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Tags - Inline Editable */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium flex items-center gap-1">
              <TagIcon className="h-4 w-4 text-gray-500" /> Tags
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
                  className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
                >
                  {tag.tag_name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">No tags</p>
          )}
        </div>

        {/* Notes - Inline Editable */}
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Notes</h3>
          {isEditingNotes ? (
            <div className="space-y-2">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={4}
                placeholder="Add notes..."
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
            <div>
              {notes ? (
                <p 
                  className="text-sm text-gray-700 whitespace-pre-wrap cursor-pointer hover:bg-gray-50 p-2 rounded"
                  onClick={() => setIsEditingNotes(true)}
                >
                  {notes}
                </p>
              ) : (
                <p 
                  className="text-sm text-gray-500 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  onClick={() => setIsEditingNotes(true)}
                >
                  Click to add notes...
                </p>
              )}
            </div>
          )}
        </div>

        {/* Touch History / Activity Timeline */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium flex items-center gap-1">
              <ClockIcon className="h-4 w-4 text-gray-500" /> Activity
            </h3>
            {recentTouches.length > 0 && (
              <button
                onClick={() => setShowHistoryModal(true)}
                className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
              >
                View all history
              </button>
            )}
          </div>
          
          {loadingTouches ? (
            <p className="text-xs text-gray-500">Loading...</p>
          ) : recentTouches.length === 0 ? (
            <p className="text-xs text-gray-500">No activity yet</p>
          ) : (
            <div className="space-y-2">
              {recentTouches.map((touch) => (
                <div key={touch.id} className="border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-medium text-gray-700">
                          {formatTouchType(touch.touch_type)}
                        </span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs text-gray-500">
                          {formatTouchDate(touch.touched_at)}
                        </span>
                      </div>
                      {touch.touch_type === "email" && touch.subject && (
                        <p className="text-xs text-gray-600 mt-0.5 truncate">
                          {touch.subject}
                        </p>
                      )}
                    </div>
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
