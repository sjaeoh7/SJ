import type { PmFrequency } from "@/db/schema";

const FREQUENCY_DAYS: Record<Exclude<PmFrequency, "custom_days">, number> = {
  weekly: 7,
  monthly: 30,
  quarterly: 91,
  semi_annual: 182,
  annual: 365,
};

export function nextDueDate(frequency: PmFrequency, customIntervalDays: number | null, from: Date): Date {
  const days = frequency === "custom_days" ? customIntervalDays || 30 : FREQUENCY_DAYS[frequency];
  const next = new Date(from);
  next.setDate(next.getDate() + days);
  return next;
}
