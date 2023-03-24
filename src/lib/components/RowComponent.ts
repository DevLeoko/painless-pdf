import jsPDF from "jspdf";
import { PdfComponent } from "./PdfComponent";
import { getWidth } from "./component-utils";

type MainAxisAlignment =
  | "start"
  | "center"
  | "end"
  | "space-between"
  | "space-around";

export interface RowOptionsInput {
  width?: number | { pct: number };
  mainAxisAlignment?: MainAxisAlignment;
  crossAxisAlignment?: "top" | "center" | "bottom";
}

interface RowOptions {
  width?: number | { pct: number };
  mainAxisAlignment: MainAxisAlignment;
  crossAxisAlignment: "top" | "center" | "bottom";
}

export class RowComponent extends PdfComponent {
  private options: RowOptions;

  constructor(
    document: jsPDF,
    private children: PdfComponent[],
    options: RowOptionsInput = {}
  ) {
    super(document);

    if (!options.mainAxisAlignment) options.mainAxisAlignment = "start";
    if (!options.crossAxisAlignment) options.crossAxisAlignment = "top";
    this.options = options as RowOptions;
  }

  private fitChildrenToWidth(childrenWidth: number[], width: number): number[] {
    const totalWidth = childrenWidth.reduce((acc, w) => acc + w, 0);
    if (totalWidth >= width) return childrenWidth;

    let children = childrenWidth.map((width, pos) => ({ width, pos }));
    const newWidths: (number | null)[] = childrenWidth.map((w) => null);

    let equalWidth = width / children.length;
    while (newWidths.includes(null)) {
      const childrenWithLessWidth = children.filter(
        (c) => c.width <= equalWidth
      );

      childrenWithLessWidth.forEach((c) => {
        newWidths[c.pos] = c.width;
        width -= c.width;
        children = children.filter((c2) => c2.pos !== c.pos);
      });

      if (children.length === 0) break;
      equalWidth = width / children.length;
    }

    return newWidths.map((w) => w ?? equalWidth);
  }

  public getPreferredWidth(containerWidth: number): number {
    if (this.options.width) {
      return getWidth(containerWidth, this.options.width);
    } else {
      const childrenWidth = this.children.map((c) =>
        c.getPreferredWidth(containerWidth)
      );
      return childrenWidth.reduce((acc, w) => acc + w, 0);
    }
  }

  public getHeight(width: number): number {
    const childrenWidth = this.children.map((c) => c.getPreferredWidth(width));
    const fittedWidth = this.fitChildrenToWidth(childrenWidth, width);

    const childrenHeight = this.children.map((c, pos) =>
      c.getHeight(fittedWidth[pos])
    );
    return Math.max(...childrenHeight);
  }

  private computeChildXs(
    width: number,
    childWidth: number[],
    alignment: MainAxisAlignment
  ) {
    const totalWidth = childWidth.reduce((acc, w) => acc + w, 0);
    const diff = width - totalWidth;

    let currentX = 0;
    switch (alignment) {
      case "start":
        return childWidth.map((w) => {
          const x = currentX;
          currentX += w;
          return x;
        });
      case "center":
        return childWidth.map((w) => {
          const x = currentX + diff / 2;
          currentX += w;
          return x;
        });
      case "end":
        return childWidth.map((w) => {
          const x = currentX + diff;
          currentX += w;
          return x;
        });
      case "space-between":
        return childWidth.map((w, pos) => {
          const x = currentX + (pos * diff) / (childWidth.length - 1);
          currentX += w;
          return x;
        });
      case "space-around":
        return childWidth.map((w, pos) => {
          const x = currentX + ((pos + 1) * diff) / (childWidth.length + 1);
          currentX += w;
          return x;
        });
    }
  }

  protected render(
    x: number,
    y: number,
    width: number,
    availableHeight: number
  ): void | PdfComponent {
    const childrenWidth = this.children.map((c) => c.getPreferredWidth(width));
    const fittedWidth = this.fitChildrenToWidth(childrenWidth, width);

    const childrenHeight = this.children.map((c, pos) =>
      c.getHeight(fittedWidth[pos])
    );
    const height = Math.max(...childrenHeight);

    const childXs = this.computeChildXs(
      width,
      fittedWidth,
      this.options.mainAxisAlignment ?? "start"
    );
    const horizontalAlignment = this.options.crossAxisAlignment ?? "top";

    this.children.forEach((c, pos) => {
      const childX = x + childXs[pos];
      // TODO: childHeight can exceed availableHeight for now. (treated similar to keepTogether = true)
      // Wrapping logic should be implemented but is not trivial. (e.g. cells should be at same x in wrapped row)
      const childHeight = c.getHeight(fittedWidth[pos]);
      const childWidth = fittedWidth[pos];
      let childY = y;
      switch (horizontalAlignment) {
        case "top":
          childY = y;
          break;
        case "center":
          childY = y + (height - childHeight) / 2;
          break;
        case "bottom":
          childY = y + height - childHeight;
      }
      c.apply(childX, childY, childHeight, width, childWidth);
    });
  }
}
