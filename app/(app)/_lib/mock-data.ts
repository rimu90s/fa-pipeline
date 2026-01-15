// app/(app)/_lib/mock-data.ts
export type MockVisit = {
  id: string;
  date: string; // YYYY-MM-DD
  unit: string;
  metric: number;
  notes?: string;
};

export type MockLead = {
  id: string;
  date: string; // YYYY-MM-DD
  unit: string;
  customer: string;
  status: "NEW" | "FOLLOW_UP" | "WON" | "LOST";
};

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

export function formatDateISO(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function lastNDaysISO(n: number, now = new Date()) {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(formatDateISO(d));
  }
  return days;
}

export function makeMockData(now = new Date()) {
  const days = lastNDaysISO(7, now);

  const units = ["Unit A", "Unit B", "Unit C"];
  const customers = ["Andi", "Sari", "Budi", "Rina", "Dewi", "Fajar"];

  const visits: MockVisit[] = days.flatMap((date, i) => {
    const count = 2 + (i % 3); // 2..4
    return Array.from({ length: count }).map((_, j) => {
      const unit = units[(i + j) % units.length];
      const metric = 1 + ((i + j) % 3);
      return {
        id: `v_${date}_${j}`,
        date,
        unit,
        metric,
        notes: j % 2 === 0 ? "Follow-up planned" : undefined,
      };
    });
  });

  const leads: MockLead[] = days.flatMap((date, i) => {
    const count = 1 + (i % 4); // 1..4
    return Array.from({ length: count }).map((_, j) => {
      const unit = units[(i + j) % units.length];
      const customer = customers[(i * 2 + j) % customers.length];
      const status: MockLead["status"] =
        j % 4 === 0 ? "NEW" : j % 4 === 1 ? "FOLLOW_UP" : j % 4 === 2 ? "WON" : "LOST";

      return {
        id: `l_${date}_${j}`,
        date,
        unit,
        customer,
        status,
      };
    });
  });

  return { days, visits, leads };
}

export function sumVisits(visits: MockVisit[]) {
  return visits.reduce((a, v) => a + v.metric, 0);
}

export function countLeads(leads: MockLead[]) {
  return leads.length;
}

export function countLeadStatus(leads: MockLead[], status: MockLead["status"]) {
  return leads.filter((l) => l.status === status).length;
}
