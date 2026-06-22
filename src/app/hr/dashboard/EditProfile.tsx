"use client";

import { useState } from "react";
import { updateProfile } from "@/app/hr/actions";
import toast from "react-hot-toast";

interface EditProfileProps {
  userId: string;
  fullName: string;
  company: string;
}

export default function EditProfile({ userId, fullName, company }: EditProfileProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(fullName);
  const [comp, setComp] = useState(company || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const result = await updateProfile(userId, { full_name: name, company: comp });
    if (result.error) {
      toast.error("Erro ao guardar: " + result.error);
    } else {
      toast.success("Perfil atualizado!");
      setOpen(false);
    }
    setSaving(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-primary-600 hover:text-primary-500 font-medium ml-2"
        title="Editar perfil"
      >
        ✏️ Editar
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900">Editar perfil</h3>
            <div>
              <label className="label-field">Nome completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-field">Empresa</label>
              <input
                type="text"
                value={comp}
                onChange={(e) => setComp(e.target.value)}
                className="input-field"
                placeholder="EQX, S.A."
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setOpen(false)} className="btn-secondary !py-2 !px-4 text-sm">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-primary !py-2 !px-4 text-sm">
                {saving ? "A guardar..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
