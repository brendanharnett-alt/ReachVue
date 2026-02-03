import React, { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { fetchTags, addTag, updateContact } from "../../api"

export default function TagModal({ open, onClose, selectedContacts, onTagsApplied, contacts }) {
  const [tags, setTags] = useState([])
  const [newTag, setNewTag] = useState("")
  const [selectedTags, setSelectedTags] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // 🔹 Load tags from backend when modal opens
  useEffect(() => {
    if (!open) return
    const loadTags = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchTags()
        setTags(data)
      } catch (err) {
        console.error("Failed to fetch tags:", err)
        setError("Failed to load tags")
      } finally {
        setLoading(false)
      }
    }
    loadTags()
  }, [open])

  const toggleTag = (tagId) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((t) => t !== tagId)
        : [...prev, tagId]
    )
  }

  const handleAddTag = async () => {
    const trimmed = newTag.trim()
    if (!trimmed) return
    try {
      const created = await addTag(trimmed)
      setTags((prev) => [...prev, created])
      setNewTag("")
    } catch (err) {
      console.error("Failed to add tag:", err)
      alert("Failed to add tag.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Tag / Untag</span>
            <button
              className="text-blue-600 text-sm hover:underline"
              onClick={() => alert('Future: open Manage Tags view')}
            >
              Manage Tags
            </button>
          </DialogTitle>
        </DialogHeader>

        <Input placeholder="Search or filter tags..." className="mb-3" />

        {/* Tag list */}
        <div className="space-y-2 mb-4 max-h-60 overflow-y-auto border p-2 rounded-md">
          {loading && <p className="text-sm text-gray-500">Loading tags...</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}
          {!loading && !error && tags.length === 0 && (
            <p className="text-sm text-gray-500">No tags found.</p>
          )}
          {!loading &&
            !error &&
            tags.map((tag) => (
              <div key={tag.tag_id} className="flex items-center gap-2">
                <Checkbox
                  checked={selectedTags.includes(tag.tag_id)}
                  onCheckedChange={() => toggleTag(tag.tag_id)}
                />
                <span>{tag.tag_name}</span>
              </div>
            ))}
        </div>

        {/* Create new tag */}
        <div className="border-t pt-3">
          <p className="text-sm mb-1 font-medium">Create New Tag</p>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Enter tag name"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
            />
            <Button onClick={handleAddTag}>Add</Button>
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={async () => {
                if (selectedTags.length === 0 || selectedContacts.length === 0) {
                  onClose()
                  return
                }
                
                // Optimistic update: notify parent immediately
                if (onTagsApplied) {
                  // Convert tag IDs to tag names for removal
                  const tagNamesToRemove = tags
                    .filter(tag => selectedTags.includes(tag.tag_id))
                    .map(tag => tag.tag_name)
                  
                  // For untagging, we pass negative tag names (or use a different callback)
                  // Actually, we'll use the same callback but the parent will handle removal
                  onTagsApplied(selectedContacts, tagNamesToRemove, true) // true = remove mode
                }
                
                // Close modal immediately
                onClose()
                
                // Background persistence (non-blocking)
                ;(async () => {
                  try {
                    // Fetch all tags to get tag names from IDs
                    const allTags = await fetchTags()
                    const tagIdToName = new Map(allTags.map(t => [t.tag_id, t.tag_name]))
                    const tagNamesToRemove = selectedTags
                      .map(tagId => tagIdToName.get(tagId))
                      .filter(Boolean)
                    
                    // Update each selected contact
                    const updatePromises = selectedContacts.map(async (contactId) => {
                      try {
                        // Get current contact to remove tags
                        const contact = contacts?.find(c => c.id === contactId)
                        const currentTagNames = (contact?.tags || []).map(t => t.tag_name)
                        // Remove selected tags
                        const remainingTagNames = currentTagNames.filter(
                          tagName => !tagNamesToRemove.includes(tagName)
                        )
                        
                        // Update contact with remaining tags
                        await updateContact(contactId, { 
                          ...contact,
                          tags: remainingTagNames 
                        })
                      } catch (err) {
                        console.error(`Failed to update contact ${contactId}:`, err)
                        throw err
                      }
                    })
                    
                    await Promise.all(updatePromises)
                  } catch (err) {
                    console.error("Failed to persist tag removal:", err)
                    alert("Some tag removals failed to save. Please refresh and try again.")
                  }
                })()
              }}
            >
              Untag
            </Button>
            <Button
              onClick={async () => {
                if (selectedTags.length === 0 || selectedContacts.length === 0) {
                  onClose()
                  return
                }
                
                // Optimistic update: notify parent immediately
                if (onTagsApplied) {
                  // Convert tag IDs to tag names for the callback
                  const tagNames = tags
                    .filter(tag => selectedTags.includes(tag.tag_id))
                    .map(tag => tag.tag_name)
                  
                  onTagsApplied(selectedContacts, tagNames)
                }
                
                // Close modal immediately
                onClose()
                
                // Background persistence (non-blocking)
                ;(async () => {
                  try {
                    // Fetch all tags to get tag names from IDs
                    const allTags = await fetchTags()
                    const tagIdToName = new Map(allTags.map(t => [t.tag_id, t.tag_name]))
                    const tagNamesToAdd = selectedTags
                      .map(tagId => tagIdToName.get(tagId))
                      .filter(Boolean)
                    
                    // Update each selected contact
                    const updatePromises = selectedContacts.map(async (contactId) => {
                      try {
                        // Get current contact to merge tags
                        const contact = contacts?.find(c => c.id === contactId)
                        const currentTagNames = (contact?.tags || []).map(t => t.tag_name)
                        // Merge: combine current tags with new tags, remove duplicates
                        const mergedTagNames = [...new Set([...currentTagNames, ...tagNamesToAdd])]
                        
                        // Update contact with merged tags
                        await updateContact(contactId, { 
                          ...contact,
                          tags: mergedTagNames 
                        })
                      } catch (err) {
                        console.error(`Failed to update contact ${contactId}:`, err)
                        throw err
                      }
                    })
                    
                    await Promise.all(updatePromises)
                  } catch (err) {
                    console.error("Failed to persist tags:", err)
                    alert("Some tags failed to save. Please refresh and try again.")
                  }
                })()
              }}
            >
              Tag
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
