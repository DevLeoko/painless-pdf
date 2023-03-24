import jsPDF from "jspdf";
import { PdfComponent } from "./PdfComponent";
import { getWidth } from "./component-utils";

export type CrossAxisAlignment = "start" | "center" | "end";

export interface ColumnOptionsInput {
  crossAxisAlignment?: CrossAxisAlignment;
  width?: number | { pct: number };
}

interface ColumnOptions {
  crossAxisAlignment: CrossAxisAlignment;
  width?: number | { pct: number };
}

export class ColumnComponent extends PdfComponent {
  private options: ColumnOptions;

  constructor(
    document: jsPDF,
    private children: PdfComponent[],
    options: ColumnOptionsInput = {}
  ) {
    super(document);

    if (!options.crossAxisAlignment) options.crossAxisAlignment = "start";
    this.options = options as ColumnOptions;
  }

  public getPreferredWidth(containerWidth: number): number {
    if (this.options.width) return getWidth(containerWidth, this.options.width);

    const childrenWidth = this.children.map((c) =>
      c.getPreferredWidth(containerWidth)
    );
    return Math.max(...childrenWidth);
  }

  public getHeight(width: number): number {
    const childrenHeight = this.children.map((c) => c.getHeight(width));
    return childrenHeight.reduce((acc, h) => acc + h, 0);
  }

  protected render(
    x: number,
    y: number,
    width: number,
    availableHeight: number
  ): PdfComponent | void {
    const crossAxisAlignment = this.options.crossAxisAlignment || "start";

    let nextPageChildren: PdfComponent[] | null = null;

    let addY = 0;
    for (let i = 0; i < this.children.length; i++) {
      if (addY >= availableHeight) {
        nextPageChildren = this.children.slice(i);
        break;
      }

      const child = this.children[i];

      const childWidth = child.getPreferredWidth(width);
      const childHeight = child.getHeight(childWidth);

      if (child.keepTogether && childHeight > availableHeight - addY) {
        nextPageChildren = this.children.slice(i);
        break;
      }

      let childX = x;
      switch (crossAxisAlignment) {
        case "start":
          childX = x;
          break;
        case "center":
          childX = x + (width - childWidth) / 2;
          break;
        case "end":
          childX = x + width - childWidth;
          break;
      }

      const nextPageChild = child.apply(
        childX,
        y + addY,
        availableHeight - addY,
        width
      );

      if (nextPageChild) {
        nextPageChildren = [nextPageChild, ...this.children.slice(i + 1)];
        break;
      }

      addY += childHeight;
    }

    if (nextPageChildren) {
      return new ColumnComponent(this.document, nextPageChildren, this.options);
    }
  }
}
