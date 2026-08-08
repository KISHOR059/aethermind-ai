const DURATION_UNITS = {
  ms: 1,
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
} as const;

export type DurationUnit = keyof typeof DURATION_UNITS;

const DURATION_PATTERN = /^(\d+)(ms|s|m|h|d)$/;

export function isDurationString(value: string): boolean {
  return DURATION_PATTERN.test(value.trim());
}

export function parseDuration(value: string): number {
  const match = DURATION_PATTERN.exec(value.trim());

  if (!match) {
    throw new Error(`Invalid duration "${value}"; expected e.g. 30s, 15m, 7d`);
  }

  const amount = Number(match[1]);
  const unit = match[2] as DurationUnit;

  return amount * DURATION_UNITS[unit];
}
