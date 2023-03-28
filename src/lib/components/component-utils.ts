export type Width = number | { relative: number };

export const EPSILON = 0.0001;

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
