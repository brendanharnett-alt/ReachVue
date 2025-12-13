// src/components/modals/TemplatePickerModal.jsx
import React, { useEffect, useMemo, useState } from "react"
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
import { FileText, Search } from "lucide-react"

function formatDate(dt) {
  try {
    const d = new Date(dt)
    return d.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  } catch {
    return ""
  }
}

export default function TemplatePickerModal({
  open,
  onClose,
  onSelect, // (template) => void
}) {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [query, setQuery] = useState("")

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedId) || null,
    [templates, selectedId]
  )

  // Fetch templates when modal opens
  useEffect(() => {
    if (!open) return
    setSelectedId(null)
    setQuery("")
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("http://localhost:3000/templates")
        if (!res.ok) throw new Error("Failed to fetch templates")
        const data = await res.json()
        setTemplates(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error("Error fetching templates:", err)
        setError("Failed to load templates.")
        setTemplates([])
      } finally {
        setLoading(false)
      }
    })()
  }, [open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return templates
    return templates.filter((t) => {
      const hay = `${t.name || ""} ${t.type || ""} ${t.subject || ""} ${t.body || ""}`.toLowerCase()
      return hay.includes(q)
    })
  }, [templates, query])

  const handleInsert = () => {
    if (!selectedTemplate) return
    onSelect?.(selectedTemplate)
    onClose?.()
  }

  const handleDoubleClick = (tpl) => {
    onSelect?.(tpl)
    onClose?.()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      {/* ✅ Equal spacing top & bottom, no clipping near bottom bar */}
      <DialogContent className="max-w-4xl w-full max-h-[92vh] overflow-hidden rounded-lg shadow-lg flex flex-col mt-[0vh] mb-[5vh]">

        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0 border-b bg-white">
          <DialogTitle>Insert Template</DialogTitle>
          <DialogDescription>
            Choose an email template and preview it before inserting.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2 bg-gray-50">
          {/* Search */}
          <div className="relative mb-4">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, subject, or content…"
              className="pl-9"
            />
          </div>

          {/* Body: list + preview */}
          <div className="grid grid-cols-12 gap-4 min-h-[380px]">
            {/* Left: list */}
            <div className="col-span-5 border rounded-lg overflow-hidden bg-white">
              <div className="h-[360px] overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-sm text-gray-500">Loading templates…</div>
                ) : error ? (
                  <div className="p-4 text-sm text-red-500">{error}</div>
                ) : filtered.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">No templates found.</div>
                ) : (
                  <ul className="divide-y">
                    {filtered.map((tpl) => (
                      <li
                        key={tpl.id}
                        onClick={() => setSelectedId(tpl.id)}
                        onDoubleClick={() => handleDoubleClick(tpl)}
                        className={`p-3 cursor-pointer hover:bg-gray-50 ${
                          selectedId === tpl.id ? "bg-blue-50" : ""
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <FileText className="mt-0.5 shrink-0" size={16} />
                          <div className="min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium text-sm truncate">
                                {tpl.name || "(Untitled Template)"}
                              </p>
                              {tpl.type && (
                                <span className="shrink-0 text-[10px] rounded-full px-2 py-0.5 bg-gray-100 text-gray-700 uppercase">
                                  {tpl.type}
                                </span>
                              )}
                            </div>
                            {tpl.subject && (
                              <p className="text-xs text-gray-600 truncate">
                                Subject: {tpl.subject}
                              </p>
                            )}
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              Updated {formatDate(tpl.updated_at)}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Right: preview */}
            <div className="col-span-7 border rounded-lg overflow-hidden bg-white">
              <div className="h-[360px] flex flex-col">
                {/* Header */}
                <div className="px-3 py-2 border-b bg-gray-50">
                  <p className="text-sm font-medium">
                    {selectedTemplate?.name || "Preview"}
                  </p>
                  {selectedTemplate?.subject && (
                    <p className="text-xs text-gray-600 truncate">
                      Subject: {selectedTemplate.subject}
                    </p>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-3">
                  {selectedTemplate ? (
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: selectedTemplate.body || "" }}
                    />
                  ) : (
                    <p className="text-sm text-gray-500">
                      Select a template from the list to see its preview.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t bg-white shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleInsert} disabled={!selectedTemplate}>
            Insert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
