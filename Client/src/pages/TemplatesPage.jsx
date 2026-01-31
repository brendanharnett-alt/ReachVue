import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Trash2, GripVertical } from "lucide-react";
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
  
  // Drag and drop state
  const [draggedTemplateId, setDraggedTemplateId] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const saveOrderTimeoutRef = useRef(null);
  const dragStartFromHandleRef = useRef(false);

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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveOrderTimeoutRef.current) {
        clearTimeout(saveOrderTimeoutRef.current);
      }
    };
  }, []);

  // Reset drag flag on mouseup (in case drag was cancelled)
  useEffect(() => {
    const handleMouseUp = () => {
      dragStartFromHandleRef.current = false;
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
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

  // -------------------------
  // Drag and Drop Handlers
  // -------------------------
  const handleGripMouseDown = () => {
    dragStartFromHandleRef.current = true;
  };

  const handleDragStart = (e, templateId) => {
    // Only allow dragging if it started from the grip icon
    if (!dragStartFromHandleRef.current) {
      e.preventDefault();
      return false;
    }
    dragStartFromHandleRef.current = false;
    setDraggedTemplateId(templateId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.target.outerHTML);
    const row = e.currentTarget;
    row.style.opacity = "0.5";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = (e) => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (!draggedTemplateId || targetIndex === null) {
      setDraggedTemplateId(null);
      return;
    }

    const draggedIndex = templates.findIndex((t) => t.id === draggedTemplateId);
    if (draggedIndex === -1 || draggedIndex === targetIndex) {
      setDraggedTemplateId(null);
      return;
    }

    // Reorder templates array
    const newTemplates = [...templates];
    const [draggedTemplate] = newTemplates.splice(draggedIndex, 1);
    newTemplates.splice(targetIndex, 0, draggedTemplate);

    setTemplates(newTemplates);
    setDraggedTemplateId(null);

    // Debounced save
    if (saveOrderTimeoutRef.current) {
      clearTimeout(saveOrderTimeoutRef.current);
    }

    saveOrderTimeoutRef.current = setTimeout(() => {
      saveTemplateOrder(newTemplates);
    }, 400);
  };

  const handleDragEnd = (e) => {
    const row = e.currentTarget;
    if (row) {
      row.style.opacity = "1";
    }
    setDraggedTemplateId(null);
    setDragOverIndex(null);
  };

  // -------------------------
  // Save Template Order
  // -------------------------
  const saveTemplateOrder = async (templatesToSave = templates) => {
    try {
      const orders = templatesToSave.map((tpl, index) => ({
        id: tpl.id,
        display_order: index,
      }));

      const res = await fetch("http://localhost:3000/templates/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orders }),
      });

      if (!res.ok) throw new Error("Failed to save template order");

      // Optionally refresh to ensure sync
      // await fetchTemplates();
    } catch (err) {
      console.error("Error saving template order:", err);
      // Revert to previous order on error
      await fetchTemplates();
    }
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
                <th className="px-4 py-3 w-[3%]"></th>
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
              {templates.map((tpl, index) => (
                <tr
                  key={tpl.id}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, tpl.id)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`border-b hover:bg-gray-50 transition ${
                    selected.includes(tpl.id) ? "bg-blue-50" : ""
                  } ${
                    dragOverIndex === index ? "bg-blue-100 border-blue-300" : ""
                  } ${
                    draggedTemplateId === tpl.id ? "opacity-50" : ""
                  }`}
                >
                  <td className="px-2 py-3">
                    <div 
                      className="drag-handle cursor-move inline-block"
                      onMouseDown={handleGripMouseDown}
                    >
                      <GripVertical className="h-4 w-4 text-gray-400" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(tpl.id)}
                      onChange={() => toggleSelect(tpl.id)}
                      className="accent-blue-600 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td
                    className="px-4 py-3 font-medium text-blue-700 hover:underline cursor-pointer"
                    onClick={() => handleEditTemplate(tpl)}
                    onMouseDown={(e) => e.stopPropagation()}
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
