"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const CACHE_KEY = "eqx_admin_delete_pw";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

function getCachedPassword(): string | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const { password, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) return password;
    localStorage.removeItem(CACHE_KEY);
  } catch {}
  return null;
}

function setCachedPassword(password: string) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ password, timestamp: Date.now() }));
}

export default function DeleteUserButton({ userId, userName }: { userId: string; userName: string }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"hidden" | "warn" | "confirm">("hidden");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const cached = getCachedPassword();
    if (cached) setPassword(cached);
  }, []);

  const handleDelete = async () => {
    if (!password.trim()) { toast.error("Password obrigatória."); return; }
    setLoading(true);
    const res = await fetch(`/api/users/${userId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminPassword: password }),
    });
    const data = await res.json();
    if (data.error) {
      toast.error(data.error);
      setLoading(false);
      return;
    }
    setCachedPassword(password);
    toast.success("Utilizador eliminado.");
    router.push("/hr/users");
    router.refresh();
  };

  return (
    <div className="mt-4 pt-4 border-t border-brand-light/30">
      {/* Hidden trigger */}
      {step === "hidden" && (
        <button onClick={() => setStep("warn")} className="text-xs text-brand-muted hover:text-red-500 transition-colors">
          Eliminar utilizador
        </button>
      )}

      {/* Warning step */}
      {step === "warn" && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-red-600">⚠️ Ação irreversível</p>
          <p className="text-xs text-brand-soft">
            Vai eliminar permanentemente <strong>{userName}</strong> e todas as suas folhas de serviço.
          </p>
          <div className="flex gap-2">
            <button onClick={() => setStep("hidden")} className="btn-secondary text-xs !py-1.5 !px-3">Cancelar</button>
            <button onClick={() => setStep("confirm")} className="bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-red-600 transition-colors">
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* Password step */}
      {step === "confirm" && (
        <div className="space-y-3">
          <p className="text-xs text-brand-soft">Escreva a password de admin para confirmar:</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field text-sm"
            placeholder="Password de administrador"
            autoFocus
          />
          <div className="flex gap-2">
            <button onClick={() => setStep("hidden")} className="btn-secondary text-xs !py-1.5 !px-3">Cancelar</button>
            <button onClick={handleDelete} disabled={loading || !password.trim()} className="bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-40">
              {loading ? "A eliminar…" : `Eliminar ${userName}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
