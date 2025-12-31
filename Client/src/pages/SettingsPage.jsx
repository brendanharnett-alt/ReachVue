// src/pages/SettingsPage.jsx
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Settings, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Palette } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExtension from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import { Extension } from "@tiptap/core";

// Font size extension (same as EmailModal)
const FontSize = Extension.create({
  name: "fontSize",
  addOptions() {
    return { types: ["textStyle"] };
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
              if (!attrs.fontSize) return {};
              return { style: `font-size: ${attrs.fontSize}` };
            },
          },
        },
      },
    ];
  },
});

const BASE_URL = "http://localhost:3000";

export default function SettingsPage() {
  const [emailClient, setEmailClient] = useState("outlook");
  const [autoAppendSignature, setAutoAppendSignature] = useState(true);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchedSignature, setFetchedSignature] = useState(null);

  // Initialize Tiptap editor for signature
  const signatureEditor = useEditor({
    extensions: [
      StarterKit.configure({
        blockquote: false,
        codeBlock: false,
        heading: false,
        horizontalRule: false,
      }),
      UnderlineExtension,
      TextStyle,
      Color.configure({ types: ["textStyle"] }),
      FontSize,
      TextAlign.configure({ types: ["paragraph"] }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[120px] px-3 py-2 text-sm text-gray-900",
      },
    },
  });

  // Fetch email settings on component mount
  useEffect(() => {
    const fetchEmailSettings = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${BASE_URL}/api/user/settings/email`);
        if (!res.ok) {
          throw new Error("Failed to fetch email settings");
        }
        const data = await res.json();
        
        // Store signature HTML to populate editor when ready
        if (data.email_signature_html) {
          setFetchedSignature(data.email_signature_html);
        }
        
        // Populate auto-append checkbox
        if (data.auto_signature !== undefined) {
          setAutoAppendSignature(data.auto_signature);
        }
      } catch (err) {
        console.error("Error fetching email settings:", err);
        // Keep defaults if fetch fails
      } finally {
        setLoading(false);
      }
    };

    fetchEmailSettings();
  }, []);

  // Populate editor when both editor and fetched data are ready
  useEffect(() => {
    if (signatureEditor && fetchedSignature !== null && !loading) {
      signatureEditor.commands.setContent(fetchedSignature || "");
    }
  }, [signatureEditor, fetchedSignature, loading]);

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showColorPicker && !event.target.closest('.color-picker-container')) {
        setShowColorPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColorPicker]);

  // Color swatches
  const colorSwatches = [
    "#000000", "#333333", "#666666", "#999999", "#CCCCCC",
    "#FF0000", "#FF6600", "#FFCC00", "#00FF00", "#00CCFF",
    "#0066FF", "#6600FF", "#FF00FF", "#FFFFFF",
  ];

  const fontSizes = ["10px", "12px", "14px", "16px", "18px", "20px"];

  const handleSave = async () => {
    try {
      setSaving(true);
      const signatureHtml = signatureEditor?.getHTML() || "";
      const url = `${BASE_URL}/api/user/settings/email`;
      const payload = {
        email_client: emailClient, // Keep current value (outlook)
        email_signature_html: signatureHtml,
        auto_signature: autoAppendSignature,
      };

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/dceac54d-072c-487e-97d1-c96838cd6875',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SettingsPage.jsx:136',message:'handleSave entry',data:{url,payload,emailClient,signatureLength:signatureHtml.length,autoAppendSignature},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      console.log("Saving settings to:", url);
      console.log("Payload:", payload);

      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/dceac54d-072c-487e-97d1-c96838cd6875',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SettingsPage.jsx:155',message:'After fetch',data:{status:res.status,statusText:res.statusText,ok:res.ok,contentType:res.headers.get('content-type'),url:res.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      console.log("Response status:", res.status, res.statusText);
      console.log("Response URL:", res.url);
      console.log("Response headers:", Object.fromEntries(res.headers.entries()));

      // Check content type before parsing
      const contentType = res.headers.get("content-type");
      let errorMessage = "Failed to save settings";

      if (!res.ok) {
        // Try to parse as JSON, but handle HTML responses
        if (contentType && contentType.includes("application/json")) {
          try {
            const errorData = await res.json();
            errorMessage = errorData.error || `Server error (${res.status})`;
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/dceac54d-072c-487e-97d1-c96838cd6875',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SettingsPage.jsx:170',message:'JSON error response',data:{errorData,status:res.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
          } catch (parseErr) {
            errorMessage = `Server error (${res.status})`;
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/dceac54d-072c-487e-97d1-c96838cd6875',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SettingsPage.jsx:175',message:'JSON parse error',data:{parseErr:parseErr.message,status:res.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
          }
        } else {
          // Response is HTML (error page), get status text
          errorMessage = `Server error: ${res.status} ${res.statusText || "Unknown error"}`;
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/dceac54d-072c-487e-97d1-c96838cd6875',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SettingsPage.jsx:181',message:'HTML error response',data:{status:res.status,statusText:res.statusText,contentType},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
        }
        throw new Error(errorMessage);
      }

      // Success - try to parse JSON response
      if (contentType && contentType.includes("application/json")) {
        const result = await res.json();
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/dceac54d-072c-487e-97d1-c96838cd6875',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SettingsPage.jsx:190',message:'Success response',data:{result},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
      }

      alert("Settings saved successfully!");
    } catch (err) {
      console.error("Error saving email settings:", err);
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/dceac54d-072c-487e-97d1-c96838cd6875',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SettingsPage.jsx:197',message:'Catch block',data:{errorMessage:err.message,errorStack:err.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      alert("Failed to save settings: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6 text-gray-700" />
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
      </div>

      {/* Email Settings Section */}
      <div className="bg-white border rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Email Settings</h2>

        {/* Email Client Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Email Client
          </label>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="emailClient"
                value="outlook"
                checked={emailClient === "outlook"}
                onChange={(e) => setEmailClient(e.target.value)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="text-sm text-gray-700">Outlook Web</span>
            </label>
            <label className="flex items-center gap-3 cursor-not-allowed opacity-50">
              <input
                type="radio"
                name="emailClient"
                value="gmail"
                disabled
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="text-sm text-gray-700">
                Gmail Web <span className="text-gray-500 italic">(Coming Soon)</span>
              </span>
            </label>
          </div>
        </div>

        {/* Email Signature Editor */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Signature
          </label>
          
          {/* Rich Text Toolbar */}
          <TooltipProvider>
            <div className="flex items-center flex-wrap gap-1 border border-gray-300 rounded-t-md p-2 bg-gray-50 border-b-0">
              {/* Text Formatting */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => signatureEditor?.chain().focus().toggleBold().run()}
                className={signatureEditor?.isActive("bold") ? "bg-gray-200" : ""}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Bold size={16} />
                  </TooltipTrigger>
                  <TooltipContent>Bold</TooltipContent>
                </Tooltip>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => signatureEditor?.chain().focus().toggleItalic().run()}
                className={signatureEditor?.isActive("italic") ? "bg-gray-200" : ""}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Italic size={16} />
                  </TooltipTrigger>
                  <TooltipContent>Italic</TooltipContent>
                </Tooltip>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => signatureEditor?.chain().focus().toggleUnderline().run()}
                className={signatureEditor?.isActive("underline") ? "bg-gray-200" : ""}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Underline size={16} />
                  </TooltipTrigger>
                  <TooltipContent>Underline</TooltipContent>
                </Tooltip>
              </Button>

              {/* Divider */}
              <div className="w-px h-6 bg-gray-300 mx-1" />

              {/* Text Alignment */}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => signatureEditor?.chain().focus().setTextAlign("left").run()}
                className={signatureEditor?.isActive({ textAlign: "left" }) ? "bg-gray-200" : ""}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlignLeft size={16} />
                  </TooltipTrigger>
                  <TooltipContent>Align Left</TooltipContent>
                </Tooltip>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => signatureEditor?.chain().focus().setTextAlign("center").run()}
                className={signatureEditor?.isActive({ textAlign: "center" }) ? "bg-gray-200" : ""}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlignCenter size={16} />
                  </TooltipTrigger>
                  <TooltipContent>Align Center</TooltipContent>
                </Tooltip>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => signatureEditor?.chain().focus().setTextAlign("right").run()}
                className={signatureEditor?.isActive({ textAlign: "right" }) ? "bg-gray-200" : ""}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlignRight size={16} />
                  </TooltipTrigger>
                  <TooltipContent>Align Right</TooltipContent>
                </Tooltip>
              </Button>

              {/* Divider */}
              <div className="w-px h-6 bg-gray-300 mx-1" />

              {/* Font Color */}
              <div className="relative color-picker-container">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className={signatureEditor?.isActive("textStyle") ? "bg-gray-200" : ""}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Palette size={16} />
                    </TooltipTrigger>
                    <TooltipContent>Text Color</TooltipContent>
                  </Tooltip>
                </Button>
                {showColorPicker && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-2 z-10 color-picker-container">
                    <div className="grid grid-cols-7 gap-1 w-56">
                      {colorSwatches.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => {
                            signatureEditor?.chain().focus().setColor(color).run();
                            setShowColorPicker(false);
                          }}
                          className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Font Size */}
              <select
                onChange={(e) => {
                  const size = e.target.value;
                  signatureEditor?.chain().focus().setFontSize(size).run();
                }}
                className="h-8 px-2 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue="14px"
              >
                {fontSizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </TooltipProvider>

          {/* Editor Content */}
          <div className="signature-editor border border-gray-300 rounded-b-md bg-white min-h-[120px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
            <EditorContent editor={signatureEditor} />
          </div>

          <p className="mt-2 text-xs text-gray-500">
            This signature will be appended to every email you send.
          </p>
        </div>

        {/* Auto-append Checkbox */}
        <div className="mb-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={autoAppendSignature}
              onCheckedChange={(checked) => setAutoAppendSignature(checked === true)}
            />
            <span className="text-sm text-gray-700">
              Automatically append my signature to every email
            </span>
          </label>
        </div>

        {/* Save Button */}
        <div className="flex justify-start">
          <Button onClick={handleSave} className="px-6" disabled={loading || saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

