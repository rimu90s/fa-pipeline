export function lastNDays(n: number): {
  start_date: string;
  end_date: string;
} {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - n + 1);

  const toISO = (d: Date) => d.toISOString().slice(0, 10);

  return {
    start_date: toISO(start),
    end_date: toISO(end),
  };
}
