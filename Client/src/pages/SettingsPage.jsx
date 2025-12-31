// src/pages/SettingsPage.jsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  const [emailClient, setEmailClient] = useState("outlook");
  const [emailSignature, setEmailSignature] = useState("");
  const [autoAppendSignature, setAutoAppendSignature] = useState(true);

  const handleSave = () => {
    // TODO: Wire up to backend API
    console.log("Settings saved:", {
      emailClient,
      emailSignature,
      autoAppendSignature,
    });
    // For now, just show a success message
    alert("Settings saved! (Backend integration coming soon)");
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
          <label
            htmlFor="emailSignature"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Email Signature
          </label>
          <textarea
            id="emailSignature"
            value={emailSignature}
            onChange={(e) => setEmailSignature(e.target.value)}
            placeholder="Enter your email signature here..."
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 placeholder-gray-400 resize-y"
          />
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
          <Button onClick={handleSave} className="px-6">
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

