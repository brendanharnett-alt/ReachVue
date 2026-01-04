// src/components/panels/CadenceContactPanel.jsx
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

export default function CadenceContactPanel({ 
  contact, 
  onClose,
}) {
  const [localContact, setLocalContact] = useState(contact)
  const [notes, setNotes] = useState(contact?.notes || "")
  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [isSavingNotes, setIsSavingNotes] = useState(false)

  useEffect(() => {
    setLocalContact(contact)
    setNotes(contact?.notes || "")
  }, [contact])

  if (!contact) return null

  const handleSaveNotes = async () => {
    setIsSavingNotes(true)
    try {
      // TODO: Add API call to save notes
      // For now, just update local state
      setLocalContact((prev) => ({ ...prev, notes }))
      setIsEditingNotes(false)
    } catch (err) {
      console.error("Failed to save notes:", err)
      alert("Failed to save notes")
    } finally {
      setIsSavingNotes(false)
    }
  }

  return (
    <div className="w-96 border-l bg-white shadow-lg h-[calc(100vh-150px)] p-4 flex flex-col overflow-hidden">
      {/* Identity Section - Fixed, non-scrollable */}
      <div className="flex-shrink-0">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold leading-tight">
              {localContact.firstName || localContact.first_name} {localContact.lastName || localContact.last_name}
            </h2>
            {localContact.title && (
              <p className="text-xs text-gray-500 mt-0.5">{localContact.title}</p>
            )}
            {localContact.company && (
              <p className="text-xs text-gray-500 mt-0.5">{localContact.company}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
            <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mb-3">
          <h3 className="text-xs font-medium mb-1.5 text-gray-700">Contact</h3>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs">
              <MailIcon className="h-3 w-3 text-gray-400 flex-shrink-0" />
              <span className="text-gray-700 truncate">
                {localContact.email || "—"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <PhoneIcon className="h-3 w-3 text-gray-400 flex-shrink-0" />
              <span className="text-gray-700">
                {localContact.mobile_phone || localContact.phone || "—"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <LinkedinIcon className="h-3 w-3 text-gray-400 flex-shrink-0" />
              <span className="text-gray-700 truncate">
                {localContact.linkedin_url || "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="mb-3">
          <h3 className="text-xs font-medium flex items-center gap-1 text-gray-700">
            <TagIcon className="h-3 w-3 text-gray-500" /> Tags
          </h3>
          {localContact.tags?.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {localContact.tags.map((tag, i) => (
                <span
                  key={i}
                  className="rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-800"
                >
                  {tag.tag_name || tag}
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

      {/* Cadence Activity - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-xs font-medium flex items-center gap-1 text-gray-600">
            <ClockIcon className="h-3 w-3 text-gray-400" /> Cadence Activity
          </h3>
        </div>
        
        {/* Placeholder for cadence activity */}
        <div className="space-y-1.5">
          <p className="text-xs text-gray-500 italic">
            Cadence activity history will appear here...
          </p>
        </div>
      </div>
    </div>
  )
}

