// Parse operators like: <=400, >=4.5, =30, <120, >3.8
export function parseOpFilter(input?: string): { op: '<'|'>'|'<='|'>='|'='; value: number } | null {
  if (!input) return null;
  const m = input.match(/^(<=|>=|=|<|>){0,1}\s*([0-9]+(\.[0-9]+)?)$/);
  if (!m) return null;
  const op = (m[1] ?? '=' ) as any;
  const value = Number(m[2]);
  return { op, value };
}
