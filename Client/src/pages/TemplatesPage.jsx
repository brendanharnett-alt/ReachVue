import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Trash2 } from "lucide-react";
import TemplateModal from "@/components/modals/TemplateModal";

// Helper to strip HTML tags for preview
function stripHtml(html) {
  if (!html) return "";

  let text = html.replace(/<[^>]+>/g, " ");

  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  let decoded = textarea.value;

  return decoded.replace(/\s+/g, " ").trim();
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState(null);

  // -------------------------
  // Fetch templates from backend
  // -------------------------
  async function fetchTemplates() {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3000/templates");
      if (!res.ok) throw new Error("Failed to fetch templates");
      const data = await res.json();
      setTemplates(data);
    } catch (err) {
      console.error("Error loading templates:", err);
      setError("Failed to load templates");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTemplates();
  }, []);

  // -------------------------
  // Handle individual checkbox toggle
  // -------------------------
  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  // -------------------------
  // Handle select all
  // -------------------------
  const toggleSelectAll = () => {
    if (selected.length === templates.length) {
      setSelected([]);
    } else {
      setSelected(templates.map((tpl) => tpl.id));
    }
  };

  // -------------------------
  // Handle delete (backend + refresh)
  // -------------------------
  const handleDelete = async () => {
    if (!selected.length) return;
    if (!window.confirm("Delete selected templates?")) return;

    try {
      const res = await fetch("http://localhost:3000/templates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selected }),
      });

      if (!res.ok) throw new Error("Failed to delete templates");

      // Refresh from backend to ensure state matches DB
      await fetchTemplates();
      setSelected([]);
      alert("✅ Templates deleted successfully.");
    } catch (err) {
      console.error("Error deleting templates:", err);
      alert("❌ Failed to delete templates. Please try again.");
    }
  };

  // -------------------------
  // Handle Add / Edit actions
  // -------------------------
  const handleAddTemplate = () => {
    setActiveTemplate(null); // new mode
    setShowModal(true);
  };

  const handleEditTemplate = (tpl) => {
    setActiveTemplate(tpl);
    setShowModal(true);
  };

  return (
    <div className="p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <FileText className="h-6 w-6 text-gray-700" />
          Templates
        </h1>

        <div className="flex gap-2">
          {selected.length > 0 && (
            <Button
              variant="destructive"
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected ({selected.length})
            </Button>
          )}
          <Button className="flex items-center gap-2" onClick={handleAddTemplate}>
            <Plus className="h-4 w-4" />
            Add Template
          </Button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-gray-500">Loading templates...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : templates.length === 0 ? (
        <div className="p-6 text-center text-gray-500 border rounded-lg bg-white shadow-sm">
          No templates yet. Click “Add Template” to create one.
        </div>
      ) : (
        <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left text-gray-700">
            <thead className="bg-gray-100 border-b text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 w-[5%]">
                  <input
                    type="checkbox"
                    checked={
                      selected.length > 0 &&
                      selected.length === templates.length
                    }
                    onChange={toggleSelectAll}
                    className="accent-blue-600 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 w-[25%]">Name</th>
                <th className="px-4 py-3 w-[35%]">Subject</th>
                <th className="px-4 py-3 w-[10%]">Type</th>
                <th className="px-4 py-3 w-[15%]">Last Updated</th>
                <th className="px-4 py-3 w-[15%]">Preview</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((tpl) => (
                <tr
                  key={tpl.id}
                  className={`border-b hover:bg-gray-50 transition ${
                    selected.includes(tpl.id) ? "bg-blue-50" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(tpl.id)}
                      onChange={() => toggleSelect(tpl.id)}
                      className="accent-blue-600 cursor-pointer"
                    />
                  </td>
                  <td
                    className="px-4 py-3 font-medium text-blue-700 hover:underline cursor-pointer"
                    onClick={() => handleEditTemplate(tpl)}
                  >
                    {tpl.name}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {tpl.subject || <span className="italic text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 capitalize">
                    {tpl.type}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {tpl.updated_at
                      ? new Date(tpl.updated_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-700 line-clamp-2">
                    {stripHtml(tpl.body)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Template Modal */}
      <TemplateModal
        open={showModal}
        onClose={() => setShowModal(false)}
        template={activeTemplate}
        onSave={fetchTemplates}
      />
    </div>
  );
}
