// src/components/modals/EmailModal.jsx
import React, { useRef, useEffect, useState, useMemo } from "react"
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
  Eye,
  MousePointerClick,
} from "lucide-react"
import { Extension } from "@tiptap/core"
import { logTouch, signLink } from "../../api"
import TemplatePickerModal from "@/components/modals/TemplatePickerModal"

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

export default function EmailModal({
  open,
  contact,
  onClose,
  onSend,
  initialSubject = "",
  initialBody = "",
}) {
  const subjectRef = useRef(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [trackOpens, setTrackOpens] = useState(true) // Default: ON
  const [trackClicks, setTrackClicks] = useState(false) // Default: OFF

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

  // Small helper: treat empty tiptap states consistently
  const isEditorEmpty = () => {
    if (!editor) return true
    const html = editor.getHTML()
    // common empties: <p></p>, <p><br></p>, ""
    return !html || html === "<p></p>" || html === "<p><br></p>"
  }

  // 🧹 Reset editor + subject + tracking toggles when modal closes
  useEffect(() => {
    if (!open && editor) {
      editor.commands.setContent("")
      if (subjectRef.current) subjectRef.current.value = ""
      setTrackOpens(true) // Reset to defaults
      setTrackClicks(false)
    }
  }, [open, editor])

  // 📨 Prefill subject + body for replies (robust + deterministic)
  useEffect(() => {
    if (!open || !editor) return
    // Wait until next React paint so refs exist
    requestAnimationFrame(() => {
      if (subjectRef.current) {
        subjectRef.current.value = initialSubject || ""
      }
      editor.commands.setContent(initialBody || "")
    })
  }, [open, editor, initialSubject, initialBody])

  if (!contact) return null

  // Helper function to replace links with tracking URLs
  const replaceLinksWithTracking = async (html, emailId) => {
    if (!html) return html

    // Create a temporary DOM element to parse HTML
    const tempDiv = document.createElement("div")
    tempDiv.innerHTML = html

    // Find all anchor tags with href attributes
    const links = tempDiv.querySelectorAll("a[href]")
    if (links.length === 0) return html

    console.log(`📧 [EmailModal] Found ${links.length} links to replace`)

    // Replace each link with tracking URL
    for (let i = 0; i < links.length; i++) {
      const link = links[i]
      const originalUrl = link.getAttribute("href")
      if (!originalUrl || originalUrl.startsWith("https://t.reachvue.com/")) {
        continue // Skip if already a tracking link or no href
      }

      try {
        const linkIndex = i + 1 // 1-indexed (1 to N)
        const signature = await signLink(emailId, originalUrl, linkIndex)
        const trackingUrl = `https://t.reachvue.com/c?e=${emailId}&u=${encodeURIComponent(originalUrl)}&li=${linkIndex}&s=${signature}`
        link.setAttribute("href", trackingUrl)
        console.log(`📧 [EmailModal] Replaced link ${linkIndex}: ${originalUrl.substring(0, 50)}...`)
      } catch (err) {
        console.error(`📧 [EmailModal] Failed to sign link ${i + 1}:`, err)
        // Continue with other links even if one fails
      }
    }

    return tempDiv.innerHTML
  }

  const handleSend = async () => {
    const subject = subjectRef.current?.value || ""
    let bodyHtml = editor?.getHTML() || ""
    const recipient = contact.email

    bodyHtml = bodyHtml.replace(/<p><\/p>/g, "<div>&nbsp;</div>")

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/dceac54d-072c-487e-97d1-c96838cd6875',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EmailModal.jsx:162',message:'handleSend entry',data:{trackOpens,trackClicks,bodyLength:bodyHtml.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    try {
      if (!window || typeof window.postMessage !== "function") {
        alert("⚠️ Unable to send email — messaging not available in this browser.")
        return
      }

      // 🔹 Log touch first with clean body (no tracking links/pixel in database)
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/dceac54d-072c-487e-97d1-c96838cd6875',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EmailModal.jsx:175',message:'Before logTouch call',data:{trackOpens,trackClicks,willPassTrackOpens:true,willPassTrackClicks:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const touchResult = await logTouch({
        contact_id: contact.id,
        touch_type: "email",
        subject,
        body: bodyHtml, // Clean body stored in DB
        metadata: { to: recipient },
        track_opens: trackOpens,
        track_clicks: trackClicks,
      })

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/dceac54d-072c-487e-97d1-c96838cd6875',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EmailModal.jsx:183',message:'After logTouch call',data:{hasTouchResult:!!touchResult,hasEmailId:!!touchResult?.email_id,hasTracking:!!touchResult?.tracking,hasSignature:!!touchResult?.tracking?.signature,touchResultKeys:Object.keys(touchResult||{}),trackingKeys:touchResult?.tracking?Object.keys(touchResult.tracking):null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      // 🔹 Inject tracking pixel and replace links if tracking is enabled
      let emailBodyForOutlook = bodyHtml
      
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/dceac54d-072c-487e-97d1-c96838cd6875',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EmailModal.jsx:190',message:'Before tracking injection',data:{trackOpens,trackClicks,hasEmailId:!!touchResult?.email_id,hasTracking:!!touchResult?.tracking,hasSignature:!!touchResult?.tracking?.signature,willInjectPixel:trackOpens && !!touchResult?.tracking?.signature,willReplaceLinks:trackClicks && !!touchResult?.email_id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      // Inject tracking pixel if opens tracking is enabled
      if (trackOpens && touchResult?.tracking?.signature) {
        const { email_id, signature } = touchResult.tracking
        const trackingPixel = `<img src="https://t.reachvue.com/o?e=${email_id}&s=${signature}" width="1" height="1" style="display:none" />`
        emailBodyForOutlook = emailBodyForOutlook + trackingPixel
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/dceac54d-072c-487e-97d1-c96838cd6875',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EmailModal.jsx:197',message:'Tracking pixel injected',data:{email_id,signatureLength:signature?.length,pixelLength:trackingPixel.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
      }

      // Replace links with tracking URLs if click tracking is enabled
      if (trackClicks && touchResult?.email_id) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/dceac54d-072c-487e-97d1-c96838cd6875',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EmailModal.jsx:203',message:'Starting link replacement',data:{email_id:touchResult.email_id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        emailBodyForOutlook = await replaceLinksWithTracking(emailBodyForOutlook, touchResult.email_id)
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/dceac54d-072c-487e-97d1-c96838cd6875',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EmailModal.jsx:206',message:'Link replacement completed',data:{finalBodyLength:emailBodyForOutlook.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
      }

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/dceac54d-072c-487e-97d1-c96838cd6875',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EmailModal.jsx:210',message:'Before sending to Outlook',data:{originalBodyLength:bodyHtml.length,finalBodyLength:emailBodyForOutlook.length,hasPixel:emailBodyForOutlook.includes('t.reachvue.com/o?'),hasTrackingLinks:emailBodyForOutlook.includes('t.reachvue.com/c?')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion

      // 🔹 Send to Outlook extension with tracking pixel/links (if enabled)
      window.postMessage(
        {
          type: "open-outlook-and-paste",
          emailBodyHtml: emailBodyForOutlook,
          emailSubject: subject,
          recipient,
        },
        "*"
      )

      // 🔹 Notify parent to refresh last touch date
      const now = new Date().toISOString()
      onSend?.({
        contactId: contact.id,
        lastTouched: now,
      })
    } catch (err) {
      console.error("💥 Email send/log error:", err)
      alert("Error logging or sending email: " + err.message)
    } finally {
      onClose()
    }
  }

  // 🔽 Template insertion handler
  const handleTemplateSelect = (tpl) => {
    if (!editor) return
    // Subject: if template has one, set it
    if (tpl.subject && subjectRef.current) {
      subjectRef.current.value = tpl.subject
    }
    // Body: replace if empty, otherwise insert at cursor
    const body = tpl.body || ""
    if (isEditorEmpty()) {
      editor.commands.setContent(body)
    } else {
      editor.chain().focus().insertContent(body).run()
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
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Send Email</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {/* To field */}
            <Input
              value={contact.email}
              disabled
              className="w-full bg-gray-100 text-gray-700"
            />

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

              {/* Tracking Controls */}
              <div className="ml-2 border-l border-gray-300 pl-1 flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setTrackOpens(!trackOpens)}
                      className={trackOpens ? "bg-gray-200" : ""}
                    >
                      <Eye size={16} className={trackOpens ? "text-blue-600" : "text-gray-500"} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Track opens (adds invisible tracking pixel)</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setTrackClicks(!trackClicks)}
                      className={trackClicks ? "bg-gray-200" : ""}
                    >
                      <MousePointerClick
                        size={16}
                        className={trackClicks ? "text-blue-600" : "text-gray-500"}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Track clicks (wraps links for click tracking)</p>
                  </TooltipContent>
                </Tooltip>
              </div>

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
                        onClick={() => editor.chain().focus().setColor(c).run()}
                      />
                    ))}
                  </div>
                  <input
                    type="color"
                    onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
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
            {/* Insert Template button on the bottom-right */}
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPickerOpen(true)}
              className="mr-2"
            >
              Insert Template
            </Button>

            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSend} className="bg-blue-600 text-white">
              Send
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
