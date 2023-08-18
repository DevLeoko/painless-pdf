import jsPDF from "jspdf";
import { PdfComponent } from "./PdfComponent";
import { getWidth, Width } from "./component-utils";

type MainAxisAlignment =
  | "start"
  | "center"
  | "end"
  | "space-between"
  | "space-around";

type CrossAxisAlignment = "top" | "center" | "bottom" | "stretch";

export interface RowOptionsInput {
  width?: Width;
  mainAxisAlignment?: MainAxisAlignment;
  crossAxisAlignment?: CrossAxisAlignment;
  growIndex?: number;
}

interface RowOptions {
  width?: Width;
  mainAxisAlignment: MainAxisAlignment;
  crossAxisAlignment: CrossAxisAlignment;
  growIndex?: number;
}

export class RowComponent extends PdfComponent {
  private options: RowOptions;

  constructor(
    document: jsPDF,
    private children: PdfComponent[],
    options: RowOptionsInput = {}
  ) {
    super(document, true);

    if (!options.mainAxisAlignment) options.mainAxisAlignment = "start";
    if (!options.crossAxisAlignment) options.crossAxisAlignment = "top";
    this.options = options as RowOptions;
  }

  private fitChildrenToWidth(childrenWidth: number[], width: number): number[] {
    const totalWidth = childrenWidth.reduce((acc, w) => acc + w, 0);
    if (totalWidth <= width) {
      if (this.options.growIndex !== undefined)
        childrenWidth[this.options.growIndex] += width - totalWidth;

      return childrenWidth;
    }

    let children = childrenWidth.map((width, pos) => ({ width, pos }));
    const newWidths: (number | null)[] = childrenWidth.map(() => null);

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

      if (childrenWithLessWidth.length === 0) break;
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
          const x =
            currentX + (pos * diff) / Math.max(1, childWidth.length - 1);
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

  public async render(
    x: number,
    y: number,
    width: number,
    availableHeight: number,
    dryRun: boolean,
    fillHeight: boolean
  ) {
    if (this.children.length === 0) return { renderedHeight: 0 };

    const childrenWidth = this.children.map((c) => c.getPreferredWidth(width));
    const fittedWidth = this.fitChildrenToWidth(childrenWidth, width);

    const childrenHeight = this.children.map((c, pos) =>
      c.getHeight(fittedWidth[pos])
    );
    let height = Math.max(...childrenHeight);
    if (fillHeight) {
      height = Math.max(height, availableHeight);
    }

    const childXs = this.computeChildXs(
      width,
      fittedWidth,
      this.options.mainAxisAlignment ?? "start"
    );
    const horizontalAlignment = this.options.crossAxisAlignment ?? "top";

    for (let pos = 0; pos < this.children.length; pos++) {
      const child = this.children[pos];

      const childX = x + childXs[pos];
      // TODO: childHeight can exceed availableHeight for now. (treated similar to keepTogether = true)
      // Wrapping logic should be implemented but is not trivial. (e.g. cells should be at same x in wrapped row)
      const childHeight = child.getHeight(fittedWidth[pos]);
      const childWidth = fittedWidth[pos];
      let childY = y;
      switch (horizontalAlignment) {
        case "top":
        case "stretch":
          childY = y;
          break;
        case "center":
          childY = y + (height - childHeight) / 2;
          break;
        case "bottom":
          childY = y + height - childHeight;
      }

      child.render(
        childX,
        childY,
        childWidth,
        horizontalAlignment == "stretch" ? height : childHeight,
        dryRun,
        horizontalAlignment == "stretch"
      );
    }

    return {
      renderedHeight: height,
    };
  }
}
