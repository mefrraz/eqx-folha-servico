"use client";
import { useState } from "react";
import { markAsReviewed } from "@/app/hr/actions";
import toast from "react-hot-toast";

export default function ValidateButton({ sheetId, currentStatus }: { sheetId: string; currentStatus: string }) {
  const [status,setStatus]=useState(currentStatus);const [loading,setLoading]=useState(false);
  if(status==="draft")return<span className="badge-draft">Rascunho</span>;
  if(status==="reviewed")return<span className="badge-reviewed">Validada</span>;
  const h=async()=>{setLoading(true);const r=await markAsReviewed(sheetId);if(r.error)toast.error(r.error);else{setStatus("reviewed");toast.success("Validada");}setLoading(false);};
  return<button onClick={h} disabled={loading} className="badge-submitted hover:brightness-95 transition-all disabled:opacity-50 cursor-pointer">{loading?"…":"Validar"}</button>;
}
