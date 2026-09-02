"use client";
import Link from "next/link";

export default function ObraChooser({ obras }: { obras: { id: string; name: string; number?: string; client?: string }[] }) {
  if (obras.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-brand-muted text-sm">Não tem obras atribuídas. Contacte o administrador.</p>
        <Link href="/worker/dashboard" className="btn-ghost mt-3 inline-flex">← Voltar</Link>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-brand-dark">Nova folha de serviço</h2>
      <p className="text-sm text-brand-soft">Escolha a obra desta folha — cada obra tem a sua própria folha semanal.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {obras.map((o) => (
          <Link key={o.id} href={`/worker/sheet/new?obra=${o.id}`} className="card hover:border-brand-gold/40 transition-all flex flex-col gap-1">
            <p className="font-semibold text-brand-dark">{o.name}</p>
            {o.number && <p className="text-xs text-brand-gold font-mono">{o.number}</p>}
            {o.client && <p className="text-xs text-brand-soft">{o.client}</p>}
          </Link>
        ))}
      </div>
      <Link href="/worker/dashboard" className="btn-ghost inline-flex">← Voltar</Link>
    </div>
  );
}