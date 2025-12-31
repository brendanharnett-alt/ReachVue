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

export default function SettingsPage({ emailSettings, setEmailSettings }) {
  // Initialize local state from props
  const [emailClient, setEmailClient] = useState(
    emailSettings?.email_client || "outlook"
  );
  const [autoAppendSignature, setAutoAppendSignature] = useState(
    emailSettings?.auto_signature !== undefined
      ? emailSettings.auto_signature
      : true
  );
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [saving, setSaving] = useState(false);

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
    content: emailSettings?.email_signature_html || "",
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[120px] px-3 py-2 text-sm text-gray-900",
      },
    },
  });

  // Update local state when emailSettings prop changes
  useEffect(() => {
    if (emailSettings) {
      setEmailClient(emailSettings.email_client || "outlook");
      setAutoAppendSignature(
        emailSettings.auto_signature !== undefined
          ? emailSettings.auto_signature
          : true
      );
      if (signatureEditor) {
        signatureEditor.commands.setContent(
          emailSettings.email_signature_html || ""
        );
      }
    }
  }, [emailSettings, signatureEditor]);

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
        email_client: emailClient,
        email_signature_html: signatureHtml,
        auto_signature: autoAppendSignature,
      };

      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      // Check content type before parsing
      const contentType = res.headers.get("content-type");
      let errorMessage = "Failed to save settings";

      if (!res.ok) {
        // Try to parse as JSON, but handle HTML responses
        if (contentType && contentType.includes("application/json")) {
          try {
            const errorData = await res.json();
            errorMessage = errorData.error || `Server error (${res.status})`;
          } catch (parseErr) {
            errorMessage = `Server error (${res.status})`;
          }
        } else {
          // Response is HTML (error page), get status text
          errorMessage = `Server error: ${res.status} ${res.statusText || "Unknown error"}`;
        }
        throw new Error(errorMessage);
      }

      // Success - update parent state with new settings
      const updatedSettings = {
        email_client: emailClient,
        email_signature_html: signatureHtml,
        auto_signature: autoAppendSignature,
      };
      
      if (setEmailSettings) {
        setEmailSettings(updatedSettings);
      }

      alert("Settings saved successfully!");
    } catch (err) {
      console.error("Error saving email settings:", err);
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
          <Button onClick={handleSave} className="px-6" disabled={!emailSettings || saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

