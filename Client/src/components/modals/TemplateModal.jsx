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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import { TextStyle } from "@tiptap/extension-text-style"
import { Color } from "@tiptap/extension-color"
import TextAlign from "@tiptap/extension-text-align"
import Link from "@tiptap/extension-link"
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
  Code,
} from "lucide-react"
import { Extension } from "@tiptap/core"

// 🔹 Autolink extension - detects URLs and converts them to links
const Autolink = Extension.create({
  name: 'autolink',
})

// 🔹 Variable styling extension - placeholder for variable styling
// Actual styling is handled via useEffect and CSS
const VariableStyle = Extension.create({
  name: 'variableStyle',
})

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

// 🔹 Font family extension
const FontFamily = Extension.create({
  name: "fontFamily",
  addOptions() {
    return { types: ["textStyle"] }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontFamily: {
            default: null,
            parseHTML: (el) => el.style.fontFamily || null,
            renderHTML: (attrs) => {
              if (!attrs.fontFamily) return {}
              return { style: `font-family: ${attrs.fontFamily}` }
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
  const editorContainerRef = useRef(null)
  const [saving, setSaving] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ 
        blockquote: true,
        link: false, // Disable link from StarterKit since we add it separately
        underline: false, // Disable underline from StarterKit since we add it separately
      }),
      Underline,
      TextStyle,
      Color.configure({ types: ["textStyle"] }),
      FontSize,
      FontFamily,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      Autolink,
      VariableStyle,
    ],
    content: "",
    editorProps: {
      handlePaste: (view, event) => {
        const text = event.clipboardData?.getData('text/plain') || ''
        const urlRegex = /(https?:\/\/[^\s]+)/g
        
        if (urlRegex.test(text)) {
          const { state, dispatch } = view
          const { selection } = state
          const { from } = selection
          const tr = state.tr
          
          // Split text by URLs
          const parts = text.split(urlRegex)
          let position = from
          
          parts.forEach((part) => {
            if (!part) return
            
            if (urlRegex.test(part)) {
              // This is a URL - insert as link
              tr.insertText(part, position)
              const linkMark = state.schema.marks.link.create({ href: part })
              tr.addMark(position, position + part.length, linkMark)
              position += part.length
            } else {
              // Regular text
              tr.insertText(part, position)
              position += part.length
            }
          })
          
          dispatch(tr)
          return true
        }
        return false
      },
    },
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

  // 🎨 Style variables in the editor by wrapping them in spans
  // Note: This uses DOM manipulation which is safe as it only wraps text nodes
  useEffect(() => {
    if (!editor || !open) return

    let timeoutId = null

    const styleVariables = () => {
      // Clear any pending timeouts
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(() => {
        const editorElement = editorContainerRef.current?.querySelector('.ProseMirror')
        if (!editorElement) return

        const variableRegex = /\{\{(\w+)\}\}/g
        
        // Use a more careful approach: only style if editor is not in a transaction
        if (editor.isDestroyed) return

        const walker = document.createTreeWalker(
          editorElement,
          NodeFilter.SHOW_TEXT,
          null
        )

        let textNode
        const nodesToProcess = []

        while ((textNode = walker.nextNode())) {
          const text = textNode.textContent || ''
          if (variableRegex.test(text)) {
            const parent = textNode.parentElement
            // Skip if already wrapped or if parent is a variable span
            if (!parent?.classList.contains('tiptap-variable')) {
              nodesToProcess.push({ textNode, text, parent })
            }
          }
        }

        // Process nodes in reverse to avoid index issues
        nodesToProcess.reverse().forEach(({ textNode, text, parent }) => {
          const newHTML = text.replace(/\{\{(\w+)\}\}/g, '<span class="tiptap-variable">$&</span>')
          if (newHTML !== text && parent && textNode.parentNode === parent) {
            const temp = document.createElement('div')
            temp.innerHTML = newHTML
            const fragment = document.createDocumentFragment()
            while (temp.firstChild) {
              fragment.appendChild(temp.firstChild)
            }
            try {
              parent.replaceChild(fragment, textNode)
            } catch (e) {
              // Ignore errors if node was already replaced
              console.debug('Variable styling: node already replaced', e)
            }
          }
        })
      }, 50)
    }

    // Style variables after editor updates
    editor.on('update', styleVariables)

    // Initial styling after a delay to ensure editor is ready
    setTimeout(styleVariables, 200)

    return () => {
      // Cleanup: remove event listener and clear any pending timeouts
      if (editor && !editor.isDestroyed) {
        editor.off('update', styleVariables)
      }
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [editor, open])

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
  const fontFamilies = [
    "Calibri",
    "Arial",
    "Times New Roman",
    "Georgia",
    "Verdana",
    "Helvetica",
    "Courier New",
    "Tahoma"
  ]

  return (
    <>
      <style>{`
        /* Style variables in the TipTap editor */
        .tiptap-variable {
          background-color: #dbeafe !important;
          color: #1e40af !important;
          padding: 2px 4px !important;
          border-radius: 3px !important;
          font-family: 'Courier New', monospace !important;
          font-size: 0.9em !important;
          font-weight: 500 !important;
          display: inline-block !important;
        }
      `}</style>
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
          <TooltipProvider>
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

            {/* Variables Dropdown */}
            <div className="ml-2 border-l border-gray-300 pl-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        type="button"
                      >
                        <Code size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem
                        onClick={() => {
                          editor?.chain().focus().insertContent('{{firstname}}').run()
                        }}
                      >
                        First Name
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          editor?.chain().focus().insertContent('{{lastname}}').run()
                        }}
                      >
                        Last Name
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          editor?.chain().focus().insertContent('{{title}}').run()
                        }}
                      >
                        Title
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          editor?.chain().focus().insertContent('{{company}}').run()
                        }}
                      >
                        Company
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Insert variable</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Font size - dropdown with custom input */}
              <div className="ml-2 flex items-center gap-1">
                <select
                  className="text-sm border rounded p-1 bg-white"
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === "custom") {
                      // Focus the custom input
                      const customInput = document.getElementById('custom-font-size-template')
                      customInput?.focus()
                    } else if (value) {
                      editor
                        .chain()
                        .focus()
                        .setMark("textStyle", { fontSize: value })
                        .run()
                    }
                  }}
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
                  <option value="custom">Custom...</option>
                </select>
                
                {/* Custom font size input */}
                <input
                  id="custom-font-size-template"
                  type="text"
                  placeholder="e.g. 16px"
                  className="text-sm border rounded p-1 bg-white w-20"
                  onBlur={(e) => {
                    const value = e.target.value.trim()
                    if (value) {
                      // Ensure it has 'px' suffix if it's just a number
                      const fontSize = value.match(/\d+/) 
                        ? (value.includes('px') || value.includes('em') || value.includes('rem') || value.includes('%') 
                            ? value 
                            : `${value}px`)
                        : value
                      editor
                        .chain()
                        .focus()
                        .setMark("textStyle", { fontSize })
                        .run()
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.target.blur()
                    }
                  }}
                />
              </div>

              {/* Font family */}
              <select
                className="ml-2 text-sm border rounded p-1 bg-white"
                onChange={(e) =>
                  editor
                    .chain()
                    .focus()
                    .setMark("textStyle", { fontFamily: e.target.value })
                    .run()
                }
                defaultValue=""
              >
                <option value="" disabled>
                  Font family
                </option>
                {fontFamilies.map((font) => (
                  <option key={font} value={font}>
                    {font}
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
          </TooltipProvider>

          {/* Editor */}
          <div ref={editorContainerRef} className="border rounded-md bg-white h-[250px] overflow-y-auto p-2">
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
    </>
  )
}
