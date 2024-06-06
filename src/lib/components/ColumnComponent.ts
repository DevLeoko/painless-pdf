import jsPDF from "jspdf";
import { getWidth, Width } from "./component-utils";
import { PdfComponent } from "./PdfComponent";

export type CrossAxisAlignment = "start" | "center" | "end";

export interface ColumnOptionsInput {
  crossAxisAlignment?: CrossAxisAlignment;
  width?: Width;
  keepTogether?: boolean;
}

interface ColumnOptions {
  crossAxisAlignment: CrossAxisAlignment;
  width?: Width;
}

export class ColumnComponent extends PdfComponent {
  private options: ColumnOptions;

  constructor(
    document: jsPDF,
    private children: (PdfComponent | "spacer")[],
    options: ColumnOptionsInput = {}
  ) {
    super(document, options.keepTogether);

    if (!options.crossAxisAlignment) options.crossAxisAlignment = "start";
    this.options = options as ColumnOptions;
  }

  public getPreferredWidth(containerWidth: number): number {
    if (this.options.width) return getWidth(containerWidth, this.options.width);

    if (this.children.length === 0) return 0;

    const childrenWidth = this.children
      .filter((c) => c != "spacer")
      .map((c) => (c as PdfComponent).getPreferredWidth(containerWidth));
    return Math.max(...childrenWidth);
  }

  public getHeight(width: number, availableHeight: number): number {
    if (this.children.length === 0) return 0;

    const componentChildren = this.children.filter(
      (c) => c != "spacer"
    ) as PdfComponent[];

    const childrenHeight = componentChildren.map((c) =>
      c.getHeight(c.getPreferredWidth(width), availableHeight)
    );
    return childrenHeight.reduce((acc, h) => acc + h, 0);
  }

  private getChildX(x: number, width: number, childWidth: number): number {
    const crossAxisAlignment = this.options.crossAxisAlignment || "start";

    switch (crossAxisAlignment) {
      case "start":
        return x;
      case "center":
        return x + (width - childWidth) / 2;
      case "end":
        return x + width - childWidth;
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
    if (this.children.length === 0)
      return { renderedHeight: 0, nextPage: undefined };

    let nextPageChildren: (PdfComponent | "spacer")[] | null = null;

    let spacerHeight = 0;
    if (fillHeight) {
      const regularHeight = this.getHeight(width, availableHeight);
      const spacerCount = this.children.filter((c) => c === "spacer").length;
      if (regularHeight < availableHeight && spacerCount > 0) {
        spacerHeight = (availableHeight - regularHeight) / spacerCount;
      }
    }

    let addY = 0;
    for (let i = 0; i < this.children.length; i++) {
      if (addY > availableHeight) {
        nextPageChildren = this.children.slice(i);
        break;
      }

      const child = this.children[i];

      if (child === "spacer") {
        addY += spacerHeight;
        continue;
      }

      const childWidth = child.getPreferredWidth(width);
      const childHeight = child.getHeight(childWidth, availableHeight);
      const remainingHeight = availableHeight - addY;

      if (child.keepTogether && childHeight > remainingHeight) {
        nextPageChildren = this.children.slice(i);
        break;
      }

      let childX = this.getChildX(x, width, childWidth);

      const childRenderResult = await child.apply(
        childX,
        y + addY,
        remainingHeight,
        width,
        dryRun
      );

      addY += childRenderResult.renderedHeight;

      if (childRenderResult.nextPage) {
        nextPageChildren = [
          childRenderResult.nextPage,
          ...this.children.slice(i + 1),
        ];
        break;
      }
    }

    return {
      renderedHeight: addY,
      nextPage: nextPageChildren
        ? new ColumnComponent(this.document, nextPageChildren, this.options)
        : undefined,
    };
  }
}
