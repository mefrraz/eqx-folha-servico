"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface SignatureFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SignatureField({ value, onChange }: SignatureFieldProps) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith("image/")) { toast.error("Apenas imagens."); return; }
    if (file.size > 500 * 1024) { toast.error("Maximo 500KB."); return; }

    setUploading(true);
    const path = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("rubricas").upload(path, file);
    if (error) { toast.error("Erro ao carregar: " + error.message); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from("rubricas").getPublicUrl(path);
    const url = urlData?.publicUrl || "";
    onChange(url);
    setUploading(false);
    toast.success("Rubrica carregada.");
  };

  return (
    <div className="flex items-center gap-1">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field !py-1.5 !px-2 text-xs flex-1"
        placeholder={uploading ? "A carregar..." : "Rubrica"}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleUpload}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="text-brand-muted hover:text-brand-dark p-1 shrink-0"
        title="Carregar imagem da rubrica"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
      </button>
      {value && (
        <a href={value} target="_blank" rel="noopener" className="text-brand-gold hover:underline p-1 shrink-0" title="Ver rubrica">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </a>
      )}
    </div>
  );
}
