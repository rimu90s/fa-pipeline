export type AuditMode = "ok" | "throw";

export type AuditCall = {
  action: string;
  entityTable: string;
  metadata?: unknown;
};

export function makeAuditMock(mode: AuditMode) {
  const calls: AuditCall[] = [];

  async function writeAuditLog(payload: AuditCall): Promise<void> {
    calls.push(payload);
    if (mode === "throw") {
      throw new Error("Audit log write failed");
    }
  }

  return { writeAuditLog, calls };
}
