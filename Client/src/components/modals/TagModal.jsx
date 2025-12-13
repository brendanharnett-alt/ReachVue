import React, { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { fetchTags, addTag } from "../../api"

export default function TagModal({ open, onClose, selectedContacts }) {
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
            <Button variant="outline" onClick={onClose}>
              Untag
            </Button>
            <Button
              onClick={() =>
                console.log("Assign tags:", selectedTags, "to contacts:", selectedContacts)
              }
            >
              Tag
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
