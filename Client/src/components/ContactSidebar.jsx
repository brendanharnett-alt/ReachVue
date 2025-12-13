import React from "react"
import { Button } from "@/components/ui/button"
import {
  MailIcon,
  PhoneIcon,
  LinkedinIcon,
  BriefcaseIcon,
  BuildingIcon,
  ClockIcon,
  TagIcon,
  X,
} from "lucide-react"

export default function ContactSidebar({ contact, onClose }) {
  if (!contact) return null // don't render if no contact selected

  return (
    <div className="w-96 border-l bg-white shadow-lg h-[calc(100vh-150px)] overflow-y-auto p-4 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-semibold">{contact.first_name} {contact.last_name}</h2>
          <p className="text-sm text-gray-500">{contact.title}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Contact Info Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <BuildingIcon className="h-4 w-4 text-gray-500" />
          <span>{contact.company}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <BriefcaseIcon className="h-4 w-4 text-gray-500" />
          <span>{contact.title}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <ClockIcon className="h-4 w-4 text-gray-500" />
          <span>{contact.lastTouched || "—"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <MailIcon className="h-4 w-4 text-gray-500" />
          <span>{contact.email}</span>
        </div>
        {contact.mobile_phone && (
          <div className="flex items-center gap-2 text-sm">
            <PhoneIcon className="h-4 w-4 text-gray-500" />
            <span>{contact.mobile_phone}</span>
          </div>
        )}
        {contact.linkedin_url && (
          <div className="flex items-center gap-2 text-sm">
            <LinkedinIcon className="h-4 w-4 text-gray-500" />
            <a href={contact.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              LinkedIn Profile
            </a>
          </div>
        )}
      </div>

      {/* Tags */}
      {contact.tags?.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
            <TagIcon className="h-4 w-4 text-gray-500" /> Tags
          </h3>
          <div className="flex flex-wrap gap-1">
            {contact.tags.map((tag, i) => (
              <span
                key={i}
                className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
              >
                {tag.tag_name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Placeholder sections */}
      <div className="mt-6 space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-1">Description</h3>
          <p className="text-sm text-gray-600">No description yet.</p>
        </div>
        <div>
          <h3 className="text-sm font-medium mb-1">Notes</h3>
          <p className="text-sm text-gray-600">No notes yet.</p>
        </div>
      </div>
    </div>
  )
}
