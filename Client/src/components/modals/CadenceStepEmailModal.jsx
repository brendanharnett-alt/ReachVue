// src/components/modals/CadenceStepEmailModal.jsx
import React, { useRef, useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
} from "lucide-react"
import { Extension } from "@tiptap/core"
import TemplatePickerModal from "@/components/modals/TemplatePickerModal"

// Font size extension
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

export default function CadenceStepEmailModal({
  open,
  onClose,
  onBack,
  onSuccess,
  stepData,
  emailSettings = null,
  initialSubject = "",
  initialBody = "",
  initialThread = "",
}) {
  const subjectRef = useRef(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [thread, setThread] = useState("")
  const [localEmailSettings, setLocalEmailSettings] = useState(emailSettings)

  // Fetch email settings if not provided as prop
  useEffect(() => {
    if (!emailSettings) {
      const fetchSettings = async () => {
        try {
          const res = await fetch("http://localhost:3000/api/user/settings/email")
          if (res.ok) {
            const data = await res.json()
            setLocalEmailSettings(data)
          }
        } catch (err) {
          console.error("Failed to fetch email settings:", err)
        }
      }
      fetchSettings()
    } else {
      setLocalEmailSettings(emailSettings)
    }
  }, [emailSettings])

  const effectiveEmailSettings = localEmailSettings || emailSettings

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

  const isEditorEmpty = () => {
    if (!editor) return true
    const html = editor.getHTML()
    return !html || html === "<p></p>" || html === "<p><br></p>"
  }

  // Reset editor + subject when modal closes
  useEffect(() => {
    // #region agent log
    const overlayCount = document.querySelectorAll('[data-radix-dialog-overlay]').length;
    const allOverlays = document.querySelectorAll('[data-radix-dialog-overlay], [role="dialog"] + div, body > div[style*="pointer-events"]');
    const bodyStyle = window.getComputedStyle(document.body);
    fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadenceStepEmailModal.jsx:127',message:'CadenceStepEmailModal useEffect open state change',data:{open,overlayCountBefore:overlayCount,allOverlayCountBefore:allOverlays.length,bodyPointerEvents:bodyStyle.pointerEvents,bodyOverflow:bodyStyle.overflow},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    if (!open && editor) {
      editor.commands.setContent("")
      if (subjectRef.current) subjectRef.current.value = ""
      setThread("")
      // Cleanup overlays when modal closes
      setTimeout(() => {
        const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
        const allOverlays = document.querySelectorAll('[data-radix-dialog-overlay], [role="dialog"] + div, body > div[style*="pointer-events"]');
        const bodyStyle = window.getComputedStyle(document.body);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadenceStepEmailModal.jsx:137',message:'CadenceStepEmailModal cleanup check',data:{overlayCount:overlays.length,allOverlayCount:allOverlays.length,overlays:Array.from(overlays).map(o=>({state:o.getAttribute('data-state'),id:o.id,style:o.getAttribute('style')})),bodyPointerEvents:bodyStyle.pointerEvents,bodyOverflow:bodyStyle.overflow},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
        // #endregion
        // Force remove ALL overlays regardless of state
        let removedCount = 0;
        overlays.forEach(overlay => {
          overlay.remove();
          removedCount++;
        });
        // Also check for body style locks
        if (bodyStyle.pointerEvents === 'none' || bodyStyle.overflow === 'hidden') {
          document.body.style.pointerEvents = '';
          document.body.style.overflow = '';
        }
        // #region agent log
        const overlayCountAfter = document.querySelectorAll('[data-radix-dialog-overlay]').length;
        const allOverlayCountAfter = document.querySelectorAll('[data-radix-dialog-overlay], [role="dialog"] + div, body > div[style*="pointer-events"]').length;
        const bodyStyleAfter = window.getComputedStyle(document.body);
        fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadenceStepEmailModal.jsx:150',message:'CadenceStepEmailModal cleanup complete',data:{removedCount,overlayCountAfter,allOverlayCountAfter,bodyPointerEventsAfter:bodyStyleAfter.pointerEvents,bodyOverflowAfter:bodyStyleAfter.overflow},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
        // #endregion
      }, 200);
    }
  }, [open, editor])

  // Prefill subject + body when modal opens (for editing) or start empty (for creation)
  useEffect(() => {
    if (!open || !editor) return

    requestAnimationFrame(() => {
      if (subjectRef.current) {
        subjectRef.current.value = initialSubject || ""
      }
      setThread(initialThread || "")

      // Pre-populate body if editing, otherwise start empty
      if (initialBody) {
        editor.commands.setContent(initialBody, false)
      } else {
        // Start with empty content - signature will be added when the step is executed, not during creation
        editor.commands.setContent("", false)
      }
    })
  }, [open, editor, initialSubject, initialBody, initialThread])

  const handleAddStep = async () => {
    const subject = subjectRef.current?.value || ""
    let bodyHtml = editor?.getHTML() || ""

    bodyHtml = bodyHtml.replace(/<p><\/p>/g, "<div>&nbsp;</div>")

    try {
      console.log('CadenceStepEmailModal handleAddStep - stepData:', stepData);
      
      if (!stepData || !stepData.step_label) {
        alert('Step metadata is missing. Please go back and fill in the step details.');
        return;
      }
      
      const combinedData = {
        ...stepData,
        email_subject: subject,
        email_body: bodyHtml,
        thread: thread || null,
      }
      
      console.log('CadenceStepEmailModal handleAddStep - combinedData:', combinedData);
      
      if (onSuccess) {
        await onSuccess(combinedData)
      }
      onClose()
    } catch (err) {
      console.error("Error adding step:", err)
      alert("Error adding step: " + err.message)
      throw err
    }
  }

  const handleTemplateSelect = (tpl) => {
    if (!editor) return
    // Subject: if template has one, set it
    if (tpl.subject && subjectRef.current) {
      subjectRef.current.value = tpl.subject
    }
    // Body: replace if empty, otherwise prepend template at the top
    const body = tpl.body || ""
    if (isEditorEmpty()) {
      editor.commands.setContent(body)
    } else {
      const currentContent = editor.getHTML()
      editor.commands.setContent(body + currentContent)
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

  const handleOpenChange = (isOpen) => {
    // #region agent log
    const overlayCount = document.querySelectorAll('[data-radix-dialog-overlay]').length;
    const allOverlays = document.querySelectorAll('[data-radix-dialog-overlay], [role="dialog"] + div, body > div[style*="pointer-events"]');
    const bodyStyle = window.getComputedStyle(document.body);
    fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadenceStepEmailModal.jsx:243',message:'CadenceStepEmailModal handleOpenChange called',data:{isOpen,overlayCount,allOverlayCount:allOverlays.length,bodyPointerEvents:bodyStyle.pointerEvents,bodyOverflow:bodyStyle.overflow},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
    // #endregion
    if (!isOpen) {
      onClose()
      // #region agent log
      setTimeout(() => {
        const overlayCountAfter = document.querySelectorAll('[data-radix-dialog-overlay]').length;
        const allOverlaysAfter = document.querySelectorAll('[data-radix-dialog-overlay], [role="dialog"] + div, body > div[style*="pointer-events"]');
        const bodyStyleAfter = window.getComputedStyle(document.body);
        fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadenceStepEmailModal.jsx:250',message:'CadenceStepEmailModal handleOpenChange after onClose',data:{overlayCountAfter,allOverlayCountAfter:allOverlaysAfter.length,bodyPointerEventsAfter:bodyStyleAfter.pointerEvents,bodyOverflowAfter:bodyStyleAfter.overflow},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'J'})}).catch(()=>{});
      }, 300);
      // #endregion
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{initialBody ? "Edit Email Step" : "Add Email Step"}</DialogTitle>
            <DialogDescription>
              {initialBody ? "Edit the email content for this cadence step." : "Create the email content for this cadence step."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {/* Subject */}
            <Input ref={subjectRef} placeholder="Subject" className="w-full" />

            {/* Thread dropdown */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-0.5 block">
                Thread
              </label>
              <Select value={thread} onValueChange={setThread}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select thread" />
                </SelectTrigger>
                <SelectContent>
                  {/* Empty for now - placeholder */}
                </SelectContent>
              </Select>
            </div>

            {/* Toolbar */}
            <TooltipProvider>
              <div className="flex items-center flex-wrap space-x-1 border rounded-md p-1 bg-gray-50">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className={editor?.isActive("bold") ? "bg-gray-200" : ""}
                >
                  <Bold size={16} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className={editor?.isActive("italic") ? "bg-gray-200" : ""}
                >
                  <Italic size={16} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => editor?.chain().focus().toggleUnderline().run()}
                  className={editor?.isActive("underline") ? "bg-gray-200" : ""}
                >
                  <UnderlineIcon size={16} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  className={editor?.isActive("bulletList") ? "bg-gray-200" : ""}
                >
                  <List size={16} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                  className={editor?.isActive("orderedList") ? "bg-gray-200" : ""}
                >
                  <ListOrdered size={16} />
                </Button>

                {/* Alignment */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => editor?.chain().focus().setTextAlign("left").run()}
                  className={editor?.isActive({ textAlign: "left" }) ? "bg-gray-200" : ""}
                >
                  <AlignLeft size={16} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => editor?.chain().focus().setTextAlign("center").run()}
                  className={editor?.isActive({ textAlign: "center" }) ? "bg-gray-200" : ""}
                >
                  <AlignCenter size={16} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => editor?.chain().focus().setTextAlign("right").run()}
                  className={editor?.isActive({ textAlign: "right" }) ? "bg-gray-200" : ""}
                >
                  <AlignRight size={16} />
                </Button>

                {/* Indent / Outdent */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => editor?.chain().focus().sinkListItem("listItem").run()}
                >
                  <Indent size={16} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => editor?.chain().focus().liftListItem("listItem").run()}
                >
                  <Outdent size={16} />
                </Button>

                {/* Font size */}
                <select
                  className="ml-2 text-sm border rounded p-1 bg-white"
                  onChange={(e) =>
                    editor
                      ?.chain()
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

                {/* Color menu */}
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
                          onClick={() => editor?.chain().focus().setColor(c).run()}
                        />
                      ))}
                    </div>
                    <input
                      type="color"
                      onChange={(e) => editor?.chain().focus().setColor(e.target.value).run()}
                      className="w-20 h-6 border rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </TooltipProvider>

            {/* Editor */}
            <div className="border rounded-md bg-white h-[250px] overflow-y-auto p-2">
              <EditorContent
                editor={editor}
                className="prose max-w-none focus:outline-none h-full"
              />
            </div>
          </div>

          <DialogFooter>
            <div className="flex-1" />
            {/* Insert Template button */}
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPickerOpen(true)}
              className="mr-2"
            >
              Insert Template
            </Button>

            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleAddStep} className="bg-blue-600 text-white">
              {initialBody ? "Update Step" : "Add Step"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Picker */}
      <TemplatePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleTemplateSelect}
      />
    </>
  )
}

