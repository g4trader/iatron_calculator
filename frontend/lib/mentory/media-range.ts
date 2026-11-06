// A single HTTP byte range; false denotes an unsatisfiable/unsupported request.
export function mediaRange(value: string | null, size: number): { start: number; end: number } | null | false {
  if (!value) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!match || (!match[1] && !match[2])) return false;
  if (!match[1]) {
    const suffix = Number(match[2]);
    return Number.isSafeInteger(suffix) && suffix > 0 ? { start: Math.max(0, size - suffix), end: size - 1 } : false;
  }
  const start = Number(match[1]); const end = match[2] ? Number(match[2]) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || end < start) return false;
  return { start, end: Math.min(end, size - 1) };
}
