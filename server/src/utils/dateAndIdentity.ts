export function normalizeMobile(input: string | null | undefined): string | null {
  if (!input) {
    return null;
  }

  const digits = input.replace(/\D/g, "");
  if (digits.length < 10) {
    return null;
  }

  return digits.slice(-10);
}

export function requireNormalizedMobile(input: string): string {
  const normalized = normalizeMobile(input);
  if (!normalized) {
    throw new Error("A valid 10-digit mobile number is required");
  }
  return normalized;
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function addUtcDays(date: Date, days: number): Date {
  const base = startOfUtcDay(date);
  base.setUTCDate(base.getUTCDate() + days);
  return base;
}
