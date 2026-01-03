// src/pages/CadenceDetailPage.jsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function CadenceDetailPage() {
  const { cadenceId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/cadences")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cadences
        </Button>
      </div>

      {/* Placeholder Content */}
      <div className="border rounded-lg bg-white shadow-sm p-12 text-center">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          Cadence Detail – Coming Soon
        </h2>
        <p className="text-gray-500">
          Cadence ID: {cadenceId}
        </p>
        <p className="text-sm text-gray-400 mt-4">
          This page will show people in the cadence, step details, and execution status.
        </p>
      </div>
    </div>
  );
}

