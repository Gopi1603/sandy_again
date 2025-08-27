// Normalize numbers: convert NaN/invalid to null
export function toNullableNumber(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return Number.isFinite(val) ? val : null;
  if (typeof val === 'string') {
    const n = Number(val);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

// Extract numeric calories from strings like "389 kcal"
export function extractCalories(nutrients: any): number | null {
  try {
    const raw = nutrients?.calories ?? nutrients?.Calorie ?? nutrients?.calorie;
    if (!raw || typeof raw !== 'string') return null;
    const m = raw.match(/(\d+(\.\d+)?)/);
    return m ? Number(m[1]) : null;
  } catch {
    return null;
  }
}
