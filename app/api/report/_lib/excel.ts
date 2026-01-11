import ExcelJS, { Workbook, Worksheet } from "exceljs";

export type ColType = "date" | "int" | "currency" | "text";

export type SheetColumn = {
  header: string;
  key: string;
  type?: ColType;
};

export type SheetOptions = {
  name: string;
  columns: SheetColumn[];
};

// metadata tipe kolom per worksheet tanpa tempel property custom (no any)
const META = new WeakMap<Worksheet, Map<string, ColType>>();

export function createWorkbook(): Workbook {
  const wb = new ExcelJS.Workbook();
  wb.creator = "fa-reporting";
  wb.created = new Date();
  return wb;
}

export function addSheet(workbook: Workbook, options: SheetOptions): Worksheet {
  const ws = workbook.addWorksheet(options.name);

  ws.columns = options.columns.map((c) => ({
    header: c.header,
    key: c.key,
    width: 10,
  }));

  META.set(
    ws,
    new Map<string, ColType>(options.columns.map((c) => [c.key, c.type ?? "text"]))
  );

  applyHeaderStyle(ws);
  freezeHeader(ws);
  return ws;
}

export function applyHeaderStyle(worksheet: Worksheet) {
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };

  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFEFEFEF" }, // abu muda
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  headerRow.commit();
}

export function freezeHeader(worksheet: Worksheet) {
  worksheet.views = [{ state: "frozen", ySplit: 1 }]; // A2
}

function getColTypes(ws: Worksheet): Map<string, ColType> {
  return META.get(ws) ?? new Map<string, ColType>();
}

function asText(v: ExcelJS.CellValue): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  if (v instanceof Date) return v.toISOString().slice(0, 10);

  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }

  return String(v);
}

function applyNumberFormats(ws: Worksheet) {
  const colTypes = getColTypes(ws);

  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    row.eachCell((cell, colNumber) => {
      const col = ws.columns[colNumber - 1];
      const key = col?.key ? String(col.key) : "";
      const t = colTypes.get(key);

      if (t === "date") cell.numFmt = "yyyy-mm-dd";
      if (t === "int") cell.numFmt = "0";
      if (t === "currency") cell.numFmt = "#,##0.00";
    });
  });
}

export function autoFitColumns(worksheet: Worksheet) {
  const MAX_WIDTH = 40;

  for (const col of worksheet.columns) {
    // ✅ Fix TS2722: guard method existence (ExcelJS typing can be optional)
    if (!col || typeof col.eachCell !== "function") continue;

    let maxLen = 0;

    col.eachCell({ includeEmpty: true }, (cell) => {
      const s = asText(cell.value);
      if (s.length > maxLen) maxLen = s.length;
    });

    col.width = Math.min(MAX_WIDTH, Math.max(10, maxLen + 2));
  }
}

export function appendTotalRow(
  worksheet: Worksheet,
  config: { sums: Array<{ key: string }> }
) {
  const cols = worksheet.columns;

  const sums = new Map<string, number>();
  for (const s of config.sums) sums.set(s.key, 0);

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const first = row.getCell(1).value;
    if (first === "TOTAL") return;

    for (const { key } of config.sums) {
      const idx = cols.findIndex((c) => String(c.key) === key);
      if (idx < 0) continue;

      const v = row.getCell(idx + 1).value;
      const n =
        typeof v === "number"
          ? v
          : typeof v === "string"
            ? Number(v)
            : NaN;

      if (Number.isFinite(n)) sums.set(key, (sums.get(key) ?? 0) + n);
    }
  });

  const totalRow = worksheet.addRow({});
  totalRow.getCell(1).value = "TOTAL";

  for (const [key, sum] of sums.entries()) {
    const idx = cols.findIndex((c) => String(c.key) === key);
    if (idx >= 0) totalRow.getCell(idx + 1).value = sum;
  }

  totalRow.font = { bold: true };
  totalRow.eachCell((cell) => {
    cell.border = {
      top: { style: "thick" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });
  totalRow.commit();

  applyNumberFormats(worksheet);
}
