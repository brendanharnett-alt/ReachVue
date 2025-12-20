import React, { useState, useRef, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
export default function AddIndividualContactModal({ open, onClose, existingTags = [] }) {
  const [formData, setFormData] = useState({
    company: "",
    firstName: "",
    lastName: "",
    title: "",
    email: "",
    phone: "",
    linkedInUrl: "",
    tags: [],
    notes: "",
  })
  const [tagInput, setTagInput] = useState("")
  const [showTagSuggestions, setShowTagSuggestions] = useState(false)
  const [selectedTagIndex, setSelectedTagIndex] = useState(-1)
  const [showNotes, setShowNotes] = useState(false)
  const tagInputRef = useRef(null)
  const suggestionsRef = useRef(null)

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Filter existing tags based on input
  const filteredTags = existingTags.filter((tag) => {
    const matchesInput = tagInput === "" || tag.toLowerCase().includes(tagInput.toLowerCase())
    const notAlreadyAdded = !formData.tags.includes(tag)
    return matchesInput && notAlreadyAdded
  })

  const handleTagInputChange = (e) => {
    const value = e.target.value
    setTagInput(value)
    setShowTagSuggestions(value.length > 0)
    setSelectedTagIndex(-1)
  }

  const handleTagInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (selectedTagIndex >= 0 && filteredTags[selectedTagIndex]) {
        // Select suggested tag
        const tag = filteredTags[selectedTagIndex]
        if (!formData.tags.includes(tag)) {
          setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }))
        }
        setTagInput("")
        setShowTagSuggestions(false)
        setSelectedTagIndex(-1)
      } else if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
        // Create new tag
        setFormData((prev) => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }))
        setTagInput("")
        setShowTagSuggestions(false)
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedTagIndex((prev) =>
        prev < filteredTags.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedTagIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === "Escape") {
      setShowTagSuggestions(false)
      setSelectedTagIndex(-1)
    } else if (e.key === "Backspace" && tagInput === "" && formData.tags.length > 0) {
      // Remove last tag on backspace when input is empty
      setFormData((prev) => ({ ...prev, tags: prev.tags.slice(0, -1) }))
    }
  }

  const handleTagClick = (tag) => {
    if (!formData.tags.includes(tag)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }))
    }
    setTagInput("")
    setShowTagSuggestions(false)
    tagInputRef.current?.focus()
  }

  const removeTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        tagInputRef.current &&
        !tagInputRef.current.contains(event.target)
      ) {
        setShowTagSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSubmit = () => {
    // Stub - no backend wiring
    console.log("Add contact:", formData)
    onClose()
    // Reset form
    setFormData({
      company: "",
      firstName: "",
      lastName: "",
      title: "",
      email: "",
      phone: "",
      linkedInUrl: "",
      tags: [],
      notes: "",
    })
    setTagInput("")
    setShowNotes(false)
  }

  const handleCancel = () => {
    onClose()
    // Reset form
    setFormData({
      company: "",
      firstName: "",
      lastName: "",
      title: "",
      email: "",
      phone: "",
      linkedInUrl: "",
      tags: [],
      notes: "",
    })
    setTagInput("")
    setShowNotes(false)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden !animate-none !duration-0">
        {/* Header */}
        <DialogHeader className="px-5 pt-2.5 pb-1">
          <DialogTitle className="text-base">Add Individual Contact</DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            All fields are optional.
          </DialogDescription>
        </DialogHeader>

        {/* Content area */}
        <div className="px-5 py-1 space-y-1.5">
          {/* Company */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-0.5 block">
              Company
            </label>
            <Input
              placeholder="Acme Corporation"
              value={formData.company}
              onChange={(e) => handleChange("company", e.target.value)}
              className="w-full h-8"
            />
          </div>

          {/* First Name + Last Name (inline) */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-medium text-gray-700 mb-0.5 block">
                First Name
              </label>
              <Input
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                className="w-full h-8"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-0.5 block">
                Last Name
              </label>
              <Input
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                className="w-full h-8"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-0.5 block">
              Title
            </label>
            <Input
              placeholder="Senior Manager"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className="w-full h-8"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-0.5 block">
              Email
            </label>
            <Input
              type="email"
              placeholder="john.doe@example.com"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="w-full h-8"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-0.5 block">
              Phone
            </label>
            <Input
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="w-full h-8"
            />
          </div>

          {/* LinkedIn URL */}
          <div>
            <label className="text-xs font-medium text-gray-700 mb-0.5 block">
              LinkedIn URL
            </label>
            <Input
              type="url"
              placeholder="https://linkedin.com/in/johndoe"
              value={formData.linkedInUrl}
              onChange={(e) => handleChange("linkedInUrl", e.target.value)}
              className="w-full h-8"
            />
          </div>

          {/* Tags */}
          <div className="relative">
            <label className="text-xs font-medium text-gray-700 mb-0.5 block">
              Tags
            </label>
            <div className="flex flex-wrap gap-1.5 min-h-[32px] p-1 border border-input rounded-md bg-transparent">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-medium"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-blue-900 focus:outline-none"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                ref={tagInputRef}
                type="text"
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyDown={handleTagInputKeyDown}
                onFocus={() => {
                  if (filteredTags.length > 0) {
                    setShowTagSuggestions(true)
                  }
                }}
                placeholder={formData.tags.length === 0 ? "Add tags..." : ""}
                className="flex-1 min-w-[120px] border-0 outline-none bg-transparent text-xs placeholder:text-gray-400"
              />
            </div>
            {showTagSuggestions && filteredTags.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-sm max-h-32 overflow-y-auto"
              >
                {filteredTags.map((tag, index) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagClick(tag)}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 focus:outline-none ${
                      index === selectedTagIndex ? "bg-gray-50" : ""
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notes - Always reserve space to prevent modal resize */}
          <div>
            <button
              type="button"
              onClick={() => setShowNotes(!showNotes)}
              className="text-xs text-gray-500 hover:text-gray-700 focus:outline-none mb-1 block"
            >
              {showNotes ? "Hide note" : "+ Add note"}
            </button>
            <div className={showNotes ? "" : "invisible pointer-events-none"}>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Add notes..."
                rows={2}
                className="w-full px-3 py-1.5 text-xs border border-input rounded-md bg-transparent placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-5 py-1.5 border-t mt-0">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-primary text-white">
            Add Contact
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

