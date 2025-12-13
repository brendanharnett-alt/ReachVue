import React, { useRef, useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import { TextStyle } from "@tiptap/extension-text-style"
import { Color } from "@tiptap/extension-color"
import TextAlign from "@tiptap/extension-text-align"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Indent,
  Outdent,
  Save,
  Send,
} from "lucide-react"
import { Extension } from "@tiptap/core"

// 🔹 Font size extension
const FontSize = Extension.create({
  name: "fontSize",
  addOptions() {
    return { types: ["textStyle"] }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (el) => el.style.fontSize || null,
            renderHTML: (attrs) => {
              if (!attrs.fontSize) return {}
              return { style: `font-size: ${attrs.fontSize}` }
            },
          },
        },
      },
    ]
  },
})

export default function TemplateModal({
  open,
  onClose,
  template = null,
  onSave, // optional callback for parent to refresh
}) {
  const subjectRef = useRef(null)
  const nameRef = useRef(null)
  const [saving, setSaving] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ blockquote: true }),
      Underline,
      TextStyle,
      Color.configure({ types: ["textStyle"] }),
      FontSize,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: "",
  })

  // Prefill when editing existing template
  useEffect(() => {
    if (!open || !editor) return
    requestAnimationFrame(() => {
      if (nameRef.current) nameRef.current.value = template?.name || ""
      if (subjectRef.current) subjectRef.current.value = template?.subject || ""
      editor.commands.setContent(template?.body || "")
    })
  }, [open, editor, template])

  // 🧹 Reset fields when modal closes
  useEffect(() => {
    if (!open && editor) {
      editor.commands.setContent("")
      if (subjectRef.current) subjectRef.current.value = ""
      if (nameRef.current) nameRef.current.value = ""
    }
  }, [open, editor])

  // -----------------------
  // Save Template
  // -----------------------
  const handleSave = async () => {
    const name = nameRef.current?.value.trim()
    const subject = subjectRef.current?.value.trim()
    const body = editor?.getHTML() || ""

    if (!name || !body) {
      alert("Template name and body are required.")
      return
    }

    setSaving(true)
    try {
      const method = template?.id ? "PUT" : "POST"
      const url = template?.id
        ? `http://localhost:3000/templates/${template.id}`
        : "http://localhost:3000/templates"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          subject,
          body,
          type: "email",
          variables: [],
        }),
      })

      if (!res.ok) throw new Error("Failed to save template")

      const saved = await res.json()
      onSave?.(saved)
      onClose()
    } catch (err) {
      console.error("Error saving template:", err)
      alert("Error saving template: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  // -----------------------
  // Send Preview (Outlook)
  // -----------------------
  const handlePreview = async () => {
    const subject = subjectRef.current?.value || ""
    let bodyHtml = editor?.getHTML() || ""

    bodyHtml = bodyHtml.replace(/<p><\/p>/g, "<div>&nbsp;</div>")

    try {
      if (!window || typeof window.postMessage !== "function") {
        alert("⚠️ Unable to send preview — messaging not available in this browser.")
        return
      }

      // 🔹 Send to Outlook automation (no logging)
      window.postMessage(
        {
          type: "open-outlook-and-paste",
          emailBodyHtml: bodyHtml,
          emailSubject: subject,
          recipient: process.env.EMAIL_USER || "your-email@example.com",
        },
        "*"
      )

      alert("Preview email opened in Outlook.")
    } catch (err) {
      console.error("Preview send error:", err)
      alert("Error sending preview: " + err.message)
    }
  }

  const swatches = [
    "#000000",
    "#FF0000",
    "#0000FF",
    "#008000",
    "#FFA500",
    "#800080",
    "#808080",
    "#00CED1",
    "#FFD700",
  ]
  const fontSizes = ["12px", "14px", "18px", "24px"]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{template ? "Edit Template" : "New Template"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Template Name */}
          <Input ref={nameRef} placeholder="Template Name" className="w-full" />

          {/* Subject */}
          <Input ref={subjectRef} placeholder="Subject" className="w-full" />

          {/* Toolbar */}
          <div className="flex items-center flex-wrap space-x-1 border rounded-md p-1 bg-gray-50">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor?.isActive("bold") ? "bg-gray-200" : ""}
            >
              <Bold size={16} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor?.isActive("italic") ? "bg-gray-200" : ""}
            >
              <Italic size={16} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={editor?.isActive("underline") ? "bg-gray-200" : ""}
            >
              <UnderlineIcon size={16} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={editor?.isActive("bulletList") ? "bg-gray-200" : ""}
            >
              <List size={16} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={editor?.isActive("orderedList") ? "bg-gray-200" : ""}
            >
              <ListOrdered size={16} />
            </Button>

            {/* Alignment */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              className={editor?.isActive({ textAlign: "left" }) ? "bg-gray-200" : ""}
            >
              <AlignLeft size={16} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
              className={editor?.isActive({ textAlign: "center" }) ? "bg-gray-200" : ""}
            >
              <AlignCenter size={16} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              className={editor?.isActive({ textAlign: "right" }) ? "bg-gray-200" : ""}
            >
              <AlignRight size={16} />
            </Button>

            {/* Indent / Outdent */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => editor.chain().focus().sinkListItem("listItem").run()}
            >
              <Indent size={16} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => editor.chain().focus().liftListItem("listItem").run()}
            >
              <Outdent size={16} />
            </Button>

            {/* Font size */}
            <select
              className="ml-2 text-sm border rounded p-1 bg-white"
              onChange={(e) =>
                editor
                  .chain()
                  .focus()
                  .setMark("textStyle", { fontSize: e.target.value })
                  .run()
              }
              defaultValue=""
            >
              <option value="" disabled>
                Font size
              </option>
              {fontSizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>

            {/* Color picker */}
            <div className="relative group ml-2">
              <Button size="sm" variant="ghost">
                <Palette size={16} />
              </Button>
              <div className="absolute hidden group-hover:flex flex-col bg-white border p-2 rounded shadow-md top-8 left-0 z-50 space-y-2">
                <div className="flex space-x-1">
                  {swatches.map((c) => (
                    <button
                      key={c}
                      className="w-5 h-5 rounded-full border"
                      style={{ backgroundColor: c }}
                      onClick={() => editor.chain().focus().setColor(c).run()}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  onChange={(e) =>
                    editor.chain().focus().setColor(e.target.value).run()
                  }
                  className="w-20 h-6 border rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Editor */}
          <div className="border rounded-md bg-white h-[250px] overflow-y-auto p-2">
            <EditorContent
              editor={editor}
              className="prose max-w-none focus:outline-none h-full"
            />
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handlePreview} variant="secondary" className="flex items-center gap-2">
            <Send size={16} />
            Send Preview
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white flex items-center gap-2"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
