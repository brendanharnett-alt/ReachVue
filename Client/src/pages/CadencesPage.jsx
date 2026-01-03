// src/pages/CadencesPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, MailCheck, Eye, Edit } from "lucide-react";

// Mock cadence data
const mockCadences = [
  {
    id: 1,
    name: "Q1 Enterprise Outreach",
    description: "Targeting enterprise prospects for Q1 sales cycle",
    peopleCount: 24,
    lastActivity: "2 days ago",
    status: "Active",
  },
  {
    id: 2,
    name: "Follow-up Campaign",
    description: "Re-engaging warm leads from last quarter",
    peopleCount: 12,
    lastActivity: "5 days ago",
    status: "Active",
  },
  {
    id: 3,
    name: "Product Demo Follow-up",
    description: "Following up with prospects who attended demo",
    peopleCount: 8,
    lastActivity: "1 week ago",
    status: "Paused",
  },
  {
    id: 4,
    name: "New Customer Onboarding",
    description: "Welcome sequence for new customers",
    peopleCount: 5,
    lastActivity: "3 days ago",
    status: "Active",
  },
];

export default function CadencesPage() {
  const navigate = useNavigate();

  const handleCreateCadence = () => {
    // Placeholder - no implementation yet
    console.log("Create cadence clicked");
  };

  const handleEdit = (cadenceId, e) => {
    e.stopPropagation(); // Prevent row click
    // Placeholder - no implementation yet
    console.log("Edit cadence:", cadenceId);
  };

  const handleView = (cadenceId, e) => {
    e.stopPropagation(); // Prevent row click
    navigate(`/cadences/${cadenceId}`);
  };

  const handleRowClick = (cadenceId) => {
    navigate(`/cadences/${cadenceId}`);
  };

  return (
    <div className="p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <MailCheck className="h-6 w-6 text-gray-700" />
            Cadences
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Organize outreach into structured campaigns
          </p>
        </div>
        <Button className="flex items-center gap-2" onClick={handleCreateCadence}>
          <Plus className="h-4 w-4" />
          Create Cadence
        </Button>
      </div>

      {/* Cadence List Table */}
      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="bg-gray-100 border-b text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Cadence Name</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-left"># of People</th>
              <th className="px-4 py-3 text-left">Last Activity</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockCadences.map((cadence) => (
              <tr
                key={cadence.id}
                className="border-b hover:bg-gray-50 transition cursor-pointer"
                onClick={() => handleRowClick(cadence.id)}
              >
                <td className="px-4 py-3 font-medium text-blue-600 hover:underline">
                  {cadence.name}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {cadence.description || (
                    <span className="italic text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-700">{cadence.peopleCount}</td>
                <td className="px-4 py-3 text-gray-600">{cadence.lastActivity}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      cadence.status === "Active"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {cadence.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={(e) => handleView(cadence.id, e)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={(e) => handleEdit(cadence.id, e)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

