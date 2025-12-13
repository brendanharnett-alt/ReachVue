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
} from "lucide-react"
import { Extension } from "@tiptap/core"
import { logTouch } from "../../api"
import { v4 as uuidv4 } from "uuid"

// ---------------------------------------------
// FONT SIZE EXTENSION
// ---------------------------------------------
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
            renderHTML: (attrs) =>
              attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
          },
        },
      },
    ]
  },
})

// ---------------------------------------------
// EMAIL MODAL
// ---------------------------------------------
export default function EmailModal({
  open,
  contact,
  onClose,
  onSend,
  initialSubject = "",
  replyThreadId = null,
  parentTouchId = null,
}) {
  const subjectRef = useRef(null)
  const [showThread, setShowThread] = useState(false)

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

  useEffect(() => {
    if (open) {
      if (subjectRef.current) subjectRef.current.value = initialSubject || ""
    } else {
      if (editor) editor.commands.setContent("")
      if (subjectRef.current) subjectRef.current.value = ""
      setShowThread(false)
    }
  }, [open, initialSubject, editor])

  if (!contact) return null

  const handleSend = async () => {
    const subject = subjectRef.current?.value || ""
    let bodyHtml = editor?.getHTML() || ""
    const recipient = contact.email
    bodyHtml = bodyHtml.replace(/<p><\/p>/g, "<div>&nbsp;</div>")
    const thread_id = replyThreadId || uuidv4()
    const parent_touch_id = replyThreadId ? parentTouchId : null

    try {
      window.postMessage(
        {
          type: "open-outlook-and-paste",
          emailBodyHtml: bodyHtml,
          emailSubject: subject,
          recipient,
        },
        "*"
      )
      await logTouch({
        contact_id: contact.id,
        touch_type: "email",
        subject,
        body: bodyHtml,
        metadata: { to: recipient },
        thread_id,
        parent_touch_id,
      })
      onSend?.({
        contactId: contact.id,
        lastTouched: new Date().toISOString(),
      })
    } catch (err) {
      console.error("💥 Email send/log error:", err)
      alert("Error sending/logging email: " + err.message)
    } finally {
      onClose()
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
      <div className="px-[2.5vw]">
        <DialogContent
          className={`transition-all duration-500 ease-in-out ${
            showThread ? "w-[94vw] max-w-none mx-auto" : "max-w-3xl mx-auto"
          }`}
          style={{
            display: "flex",
            flexDirection: "row",
            gap: showThread ? "1rem" : "0",
          }}
        >
          {/* LEFT SIDE: EMAIL COMPOSE */}
          <div
            className={`flex-1 transition-all duration-500 ${
              showThread ? "w-[70%]" : "w-full"
            }`}
          >
            <DialogHeader className="pb-2">
              <div className="flex justify-between items-center w-full">
                <DialogTitle className="text-lg font-semibold">
                  Send Email
                </DialogTitle>
                <button
                  onClick={() => setShowThread(!showThread)}
                  className="text-blue-600 text-sm hover:underline ml-4 whitespace-nowrap"
                >
                  {showThread ? "Hide Thread" : "Show Thread"}
                </button>
              </div>
            </DialogHeader>

            <div className="space-y-3">
              <Input
                value={contact.email}
                disabled
                className="w-full bg-gray-100 text-gray-700"
              />
              <Input ref={subjectRef} placeholder="Subject" className="w-full" />

              {/* TOOLBAR */}
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
                  className={
                    editor?.isActive("orderedList") ? "bg-gray-200" : ""
                  }
                >
                  <ListOrdered size={16} />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => editor.chain().focus().setTextAlign("left").run()}
                  className={
                    editor?.isActive({ textAlign: "left" }) ? "bg-gray-200" : ""
                  }
                >
                  <AlignLeft size={16} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    editor.chain().focus().setTextAlign("center").run()
                  }
                  className={
                    editor?.isActive({ textAlign: "center" })
                      ? "bg-gray-200"
                      : ""
                  }
                >
                  <AlignCenter size={16} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => editor.chain().focus().setTextAlign("right").run()}
                  className={
                    editor?.isActive({ textAlign: "right" }) ? "bg-gray-200" : ""
                  }
                >
                  <AlignRight size={16} />
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    editor.chain().focus().sinkListItem("listItem").run()
                  }
                >
                  <Indent size={16} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    editor.chain().focus().liftListItem("listItem").run()
                  }
                >
                  <Outdent size={16} />
                </Button>

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

              {/* EDITOR */}
              <div className="border rounded-md bg-white h-[250px] overflow-y-auto p-2">
                <EditorContent
                  editor={editor}
                  className="prose max-w-none focus:outline-none h-full"
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSend} className="bg-blue-600 text-white">
                Send
              </Button>
            </DialogFooter>
          </div>

          {/* RIGHT SIDE: THREAD PANEL */}
          {showThread && (
            <div className="w-[30%] border-l border-gray-300/70 pl-4 overflow-y-auto">
              <h3 className="text-sm font-semibold mb-2">Thread</h3>
              <div className="space-y-3 text-sm text-gray-700">
                <p>
                  <strong>Brendan Harnett:</strong> Initial message about meeting
                  schedule.
                </p>
                <p>
                  <strong>John Doe:</strong> Thanks Brendan — can we push to next
                  week?
                </p>
                <p>
                  <strong>Brendan Harnett:</strong> Sure, no problem. Will send a
                  new invite.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </div>
    </Dialog>
  )
}
