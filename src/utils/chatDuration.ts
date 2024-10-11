interface Duration {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export function calculateChatDuration(durationMs: number): string {
  if (durationMs === 0) return "0 seconds";

  const durationSeconds = Math.floor(durationMs / 1000);

  const duration: Duration = {
    year: Math.floor(durationSeconds / (365 * 24 * 60 * 60)),
    month: Math.floor(
      (durationSeconds % (365 * 24 * 60 * 60)) / (30 * 24 * 60 * 60)
    ),
    day: Math.floor((durationSeconds % (30 * 24 * 60 * 60)) / (24 * 60 * 60)),
    hour: Math.floor((durationSeconds % (24 * 60 * 60)) / (60 * 60)),
    minute: Math.floor((durationSeconds % (60 * 60)) / 60),
    second: durationSeconds % 60,
  };

  const significantParts = Object.entries(duration)
    .filter(([_, value]) => value > 0)
    .slice(0, 2);

  if (significantParts.length === 0) return "0 seconds";

  return significantParts
    .map(([unit, value]) => `${value} ${unit}${value !== 1 ? "s" : ""}`)
    .join(", ");
}
