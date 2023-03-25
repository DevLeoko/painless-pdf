export type Width = number | { relative: number };

export function getWidth(
  available: number,
  width: number | { relative: number }
) {
  if (typeof width === "number") {
    return width;
  } else {
    return available * width.relative;
  }
}
