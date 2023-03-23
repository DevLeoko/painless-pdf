export function getWidth(available: number, width: number | { pct: number }) {
  if (typeof width === "number") {
    return width;
  } else {
    return available * width.pct;
  }
}
