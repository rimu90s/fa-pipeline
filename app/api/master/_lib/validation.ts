// validation.ts
// Shared server-side validation helpers
// All master data validation will live here

export type ValidationResult = {
  ok: boolean
  message?: string
}
