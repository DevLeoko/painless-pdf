export interface BorderOptions {
  width: number;
  color: string;
}

export interface DivOptionsInput {
  width?: { pct: number } | number;
  padding?:
    | { top: number; right: number; bottom: number; left: number }
    | number
    | { x: number; y: number };
  backgroundColor?: string;
  border?:
    | {
        top?: BorderOptions;
        right?: BorderOptions;
        bottom?: BorderOptions;
        left?: BorderOptions;
      }
    | BorderOptions;
  keepTogether?: boolean;
}

export interface DivOptions {
  width?: { pct: number } | number;
  padding: { top: number; right: number; bottom: number; left: number };
  backgroundColor?: string;
  border: {
    top: BorderOptions;
    right: BorderOptions;
    bottom: BorderOptions;
    left: BorderOptions;
  };
  keepTogether?: boolean;
}

export function transformInputOptions(options?: DivOptionsInput): DivOptions {
  let padding: { top: number; right: number; bottom: number; left: number } = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  };

  if (options?.padding) {
    if (typeof options.padding === "number") {
      padding.top = options.padding;
      padding.right = options.padding;
      padding.bottom = options.padding;
      padding.left = options.padding;
    } else if ("x" in options.padding && "y" in options.padding) {
      const xyPadding = options.padding as { x: number; y: number };
      padding.top = xyPadding.y;
      padding.right = xyPadding.x;
      padding.bottom = xyPadding.y;
      padding.left = xyPadding.x;
    } else {
      padding = options.padding;
    }
  }

  let border: {
    top: BorderOptions;
    right: BorderOptions;
    bottom: BorderOptions;
    left: BorderOptions;
  } = {
    top: { width: 0, color: "black" },
    right: { width: 0, color: "black" },
    bottom: { width: 0, color: "black" },
    left: { width: 0, color: "black" },
  };

  if (options?.border) {
    if ("width" in options.border && "color" in options.border) {
      const borderOptions = options.border as BorderOptions;
      border.top = borderOptions;
      border.right = borderOptions;
      border.bottom = borderOptions;
      border.left = borderOptions;
    } else {
      border.top = options.border.top || border.top;
      border.right = options.border.right || border.right;
      border.bottom = options.border.bottom || border.bottom;
      border.left = options.border.left || border.left;
    }
  }

  return {
    backgroundColor: options?.backgroundColor,
    width: options?.width,
    padding,
    border,
  };
}
