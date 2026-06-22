import type { WorkEntry } from "@/lib/types";

/**
 * Calcula o total de minutos a partir de uma lista de entradas de trabalho.
 */
export function calcMinutes(entries: WorkEntry[]): number {
  return entries.reduce((sum, entry) => {
    if (entry.start_time && entry.end_time) {
      const [sh, sm] = entry.start_time.split(":").map(Number);
      const [eh, em] = entry.end_time.split(":").map(Number);
      return sum + (eh * 60 + em) - (sh * 60 + sm);
    }
    return sum;
  }, 0);
}

/**
 * Formata minutos totais para string legível (ex: "8h 30m").
 */
export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}
