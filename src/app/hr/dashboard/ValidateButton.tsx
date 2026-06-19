"use client";

import { useState } from "react";
import { markAsReviewed } from "./actions";
import toast from "react-hot-toast";

interface ValidateButtonProps {
  sheetId: string;
  currentStatus: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Rascunho", color: "bg-yellow-100 text-yellow-800" },
  submitted: { label: "Submetida", color: "bg-green-100 text-green-800" },
  reviewed: { label: "Validada", color: "bg-blue-100 text-blue-800" },
};

export default function ValidateButton({ sheetId, currentStatus }: ValidateButtonProps) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  if (status !== "submitted") {
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_LABELS[status]?.color}`}>
        {STATUS_LABELS[status]?.label || status}
      </span>
    );
  }

  const handleValidate = async () => {
    setLoading(true);
    const result = await markAsReviewed(sheetId);
    if (result.error) {
      toast.error("Erro ao validar: " + result.error);
    } else {
      setStatus("reviewed");
      toast.success("Folha validada!");
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleValidate}
      disabled={loading}
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors disabled:opacity-50"
      title="Marcar como validada"
    >
      {loading ? "..." : "✓ Validar"}
    </button>
  );
}
