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

/**
 * Formata um nome: primeira letra de cada palavra maiúscula, resto minúsculo,
 * preservando acentos. Ex: "joão silva" → "João Silva".
 */
export function formatName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

const DAY_LABELS: Record<string, string> = {
  monday: "2ª Feira",
  tuesday: "3ª Feira",
  wednesday: "4ª Feira",
  thursday: "5ª Feira",
  friday: "6ª Feira",
  saturday: "Sábado",
};

/**
 * Valida os turnos de uma folha. Devolve a primeira mensagem de erro encontrada
 * (hora em falta, início >= fim, ou sobreposição manhã/tarde), ou null se válido.
 * @param entries entradas da folha
 * @param skippedKeys conjunto de chaves "day-shift" marcadas como "não trabalhei"
 */
export function validateSheet(entries: WorkEntry[], skippedKeys: Set<string> = new Set()): string | null {
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

  for (const day of days) {
    const morning = entries.find((e) => e.day === day && e.shift === "morning");
    const afternoon = entries.find((e) => e.day === day && e.shift === "afternoon");
    if (!morning || !afternoon) continue;

    const label = DAY_LABELS[day] || day;

    for (const shift of [morning, afternoon]) {
      if (skippedKeys.has(`${day}-${shift.shift}`)) continue;
      if (shift.start_time && !shift.end_time) {
        return `${label} (${shift.shift === "morning" ? "manhã" : "tarde"}): hora de fim obrigatória.`;
      }
      if (shift.end_time && !shift.start_time) {
        return `${label} (${shift.shift === "morning" ? "manhã" : "tarde"}): hora de início obrigatória.`;
      }
      if (shift.start_time && shift.end_time && shift.start_time >= shift.end_time) {
        return `${label} (${shift.shift === "morning" ? "manhã" : "tarde"}): hora de início deve ser anterior à de fim.`;
      }
    }

    const morningSkipped = skippedKeys.has(`${day}-morning`);
    const afternoonSkipped = skippedKeys.has(`${day}-afternoon`);
    if (!morningSkipped && !afternoonSkipped && morning.end_time && afternoon.start_time) {
      if (morning.end_time > afternoon.start_time) {
        return `${label}: turnos sobrepostos. Fim da manhã (${morning.end_time}) deve ser ≤ início da tarde (${afternoon.start_time}).`;
      }
    }
  }
  return null;
}
