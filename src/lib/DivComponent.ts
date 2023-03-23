import jsPDF, { TextOptionsLight } from "jspdf";
import { PdfComponent } from "./PdfComponent";
import { getWidth } from "./utils";
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
}

function transformInputOptions(options?: DivOptionsInput): DivOptions {
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

export class DivComponent extends PdfComponent {
  private options: DivOptions;

  constructor(
    document: jsPDF,
    private child: PdfComponent,
    options?: DivOptionsInput
  ) {
    super(document);
    this.options = transformInputOptions(options);
  }

  get selfWidth() {
    return (
      this.options.padding.left +
      this.options.padding.right +
      this.options.border.left.width +
      this.options.border.right.width
    );
  }

  get selfHeight() {
    return (
      this.options.padding.top +
      this.options.padding.bottom +
      this.options.border.top.width +
      this.options.border.bottom.width
    );
  }

  public getPreferredWidth(containerWidth: number) {
    if (this.options?.width) {
      return getWidth(containerWidth, this.options.width);
    }

    return (
      this.child.getPreferredWidth(containerWidth - this.selfWidth) +
      this.selfWidth
    );
  }

  public getHeight(width: number): number {
    return this.child.getHeight(width - this.selfWidth) + this.selfHeight;
  }

  public render(x: number, y: number, width: number, availableHeight: number) {
    const childWidth = width - this.selfWidth;
    const childAvailableHeight = availableHeight - this.selfHeight;
    const childX =
      x + this.options.padding.left + this.options.border.left.width;
    const childY = y + this.options.padding.top + this.options.border.top.width;

    const childHeight = Math.min(
      this.child.getHeight(childWidth),
      childAvailableHeight
    );

    const height = childHeight + this.selfHeight;

    if (this.options.backgroundColor) {
      const bgX = x + this.options.border.left.width;
      const bgY = y + this.options.border.top.width;
      const bgWidth =
        width -
        this.options.border.left.width -
        this.options.border.right.width;
      const bgHeight =
        height -
        this.options.border.top.width -
        this.options.border.bottom.width;
      this.document.setFillColor(this.options.backgroundColor);
      this.document.rect(bgX, bgY, bgWidth, bgHeight, "F");
    }

    if (this.options.border.top.width) {
      this.document.setDrawColor(this.options.border.top.color);
      this.document.setLineWidth(this.options.border.top.width);
      const bY = y + this.options.border.top.width / 2;
      this.document.line(x, bY, x + width, bY);
    }

    if (this.options.border.right.width) {
      this.document.setDrawColor(this.options.border.right.color);
      this.document.setLineWidth(this.options.border.right.width);
      const bX = x + width - this.options.border.right.width / 2;
      this.document.line(bX, y, bX, y + height);
    }

    if (this.options.border.bottom.width) {
      this.document.setDrawColor(this.options.border.bottom.color);
      this.document.setLineWidth(this.options.border.bottom.width);
      const bY = y + height - this.options.border.bottom.width / 2;
      this.document.line(x, bY, x + width, bY);
    }

    if (this.options.border.left.width) {
      this.document.setDrawColor(this.options.border.left.color);
      this.document.setLineWidth(this.options.border.left.width);
      const bX = x + this.options.border.left.width / 2;
      this.document.line(bX, y, bX, y + height);
    }

    const nextPageChild = this.child.apply(
      childX,
      childY,
      childAvailableHeight,
      childWidth
    );

    if (!nextPageChild) return;

    return new DivComponent(this.document, nextPageChild, this.options);
  }
}
