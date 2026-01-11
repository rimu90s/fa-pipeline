type FromCall = { table: string };
type InCall = { column: string; values: unknown[] };
type EqCall = { column: string; value: unknown };
type OrderCall = { column: string; ascending?: boolean };

export type SupabaseQueryResult<Row extends Record<string, unknown>> = {
  data: Row[];
  error: null | { message: string };
};

type Thenable<Row extends Record<string, unknown>> = PromiseLike<SupabaseQueryResult<Row>>;

type FilterChain<Row extends Record<string, unknown>> = Thenable<Row> & {
  eq: (col: string, v: unknown) => FilterChain<Row>;
  gte: (col: string, v: string) => FilterChain<Row>;
  lte: (col: string, v: string) => FilterChain<Row>;
  in: (col: string, values: unknown[]) => FilterChain<Row>;
  order: (col: string, opts?: { ascending?: boolean }) => FilterChain<Row>;
  range: (from: number, to: number) => FilterChain<Row>;
  limit: (count: number) => FilterChain<Row>;
};

type SelectChain<Row extends Record<string, unknown>> = {
  select: (cols: string) => FilterChain<Row>;
};

export type SupabaseClientMock<Row extends Record<string, unknown>> = {
  from: (table: string) => SelectChain<Row>;
};

export function makeSupabaseMock<Row extends Record<string, unknown>>(rows: Row[]) {
  const fromCalls: FromCall[] = [];
  const inCalls: InCall[] = [];
  const eqCalls: EqCall[] = [];
  const orderCalls: OrderCall[] = [];

  // state untuk eksekusi akhir (tidak perlu dipakai banyak, tapi berguna kalau mau debug)
  let lastRange: { from: number; to: number } | null = null;
  let lastLimit: number | null = null;

  // filterChain is thenable: await filterChain => resolve rows
  const filterChain: FilterChain<Row> = {
    eq: (col, v) => {
      eqCalls.push({ column: col, value: v });
      return filterChain;
    },
    gte: () => filterChain,
    lte: () => filterChain,
    in: (col, values) => {
      inCalls.push({ column: col, values });
      return filterChain;
    },
    order: (col, opts) => {
      orderCalls.push({ column: col, ascending: opts?.ascending });
      return filterChain;
    },
    range: (from, to) => {
      lastRange = { from, to };
      return filterChain;
    },
    limit: (count) => {
      lastLimit = count;
      return filterChain;
    },
    then: (onfulfilled, onrejected) => {
      try {
        // Apply range/limit if set (opsional, supaya lebih mirip perilaku real)
        let out = rows;

        if (lastRange) {
          // supabase range inclusive: from..to
          out = out.slice(lastRange.from, lastRange.to + 1);
        }
        if (typeof lastLimit === "number") {
          out = out.slice(0, lastLimit);
        }

        const result: SupabaseQueryResult<Row> = { data: out, error: null };
        return Promise.resolve(result).then(onfulfilled, onrejected);
      } catch (e) {
        return Promise.reject(e).then(onfulfilled, onrejected);
      }
    },
  };

  const client: SupabaseClientMock<Row> = {
    from: (table) => {
      fromCalls.push({ table });
      const selectChain: SelectChain<Row> = {
        select: () => filterChain,
      };
      return selectChain;
    },
  };

  return { client, fromCalls, inCalls, eqCalls, orderCalls };
}
