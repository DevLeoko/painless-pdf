import jsPDF from "jspdf";
import { getWidth, Width } from "./component-utils";
import { PdfComponent, RenderResult } from "./PdfComponent";
import { SizedBoxComponent } from "./SizedBoxComponent";

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
  keepTogether?: boolean;
  fillHeight?: boolean;
}

interface RowOptions {
  width?: Width;
  mainAxisAlignment: MainAxisAlignment;
  crossAxisAlignment: CrossAxisAlignment;
  growIndex?: number;
  keepTogether: boolean;
  fillHeight?: boolean;
}

export class RowComponent extends PdfComponent {
  private options: RowOptions;

  constructor(
    document: jsPDF,
    private children: PdfComponent[],
    options: RowOptionsInput = {},
    private previousChildXs?: number[]
  ) {
    super(document, options.keepTogether ?? true);

    if (!options.mainAxisAlignment) options.mainAxisAlignment = "start";
    if (!options.crossAxisAlignment) options.crossAxisAlignment = "top";
    if (options.keepTogether == undefined) options.keepTogether = true;
    this.options = options as RowOptions;
  }

  // Fit the requested widths of the children fairly into the available container width
  private fitChildrenToWidth(childrenWidth: number[], width: number): number[] {
    const totalWidth = childrenWidth.reduce((acc, w) => acc + w, 0);
    if (totalWidth <= width) {
      // Give remaining space to growIndex
      if (this.options.growIndex !== undefined)
        childrenWidth[this.options.growIndex] += width - totalWidth;

      return childrenWidth;
    }

    // Children are requesting more than the available width
    let children = childrenWidth.map((width, pos) => ({ width, pos }));
    const newWidths: (number | null)[] = childrenWidth.map(() => null);

    // We will first grant each child that requests less than the equalWidth its requested width
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

      // Equal width might change if requested width was less than equalWidth
      equalWidth = width / children.length;
    }

    // Remaining greedy children will get equalWidth
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

  public getHeight(width: number, availableHeight: number): number {
    const childrenWidth = this.children.map((c) => c.getPreferredWidth(width));
    const fittedWidth = this.fitChildrenToWidth(childrenWidth, width);

    const childrenHeight = this.children.map((c, pos) =>
      c.getHeight(fittedWidth[pos], availableHeight)
    );
    return Math.max(...childrenHeight);
  }

  private computeChildXs(
    width: number,
    childWidth: number[],
    alignment: MainAxisAlignment
  ) {
    if (this.previousChildXs) {
      return this.previousChildXs;
    }

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
  ): Promise<RenderResult> {
    fillHeight = fillHeight || this.options.fillHeight || false;

    if (this.children.length === 0) return { renderedHeight: 0 };

    const childrenWidth = this.children.map((c) => c.getPreferredWidth(width));
    const fittedWidth = this.fitChildrenToWidth(childrenWidth, width);

    const childrenHeight = this.children.map((c, pos) =>
      c.getHeight(fittedWidth[pos], availableHeight)
    );
    let height = Math.max(...childrenHeight);
    if (fillHeight) {
      height = availableHeight;
    }

    height = Math.min(height, availableHeight);

    const childXs = this.computeChildXs(
      width,
      fittedWidth,
      this.options.mainAxisAlignment ?? "start"
    );
    const horizontalAlignment = this.options.crossAxisAlignment ?? "top";

    const nextPageItems: (PdfComponent | null)[] = [];
    for (let pos = 0; pos < this.children.length; pos++) {
      const child = this.children[pos];

      const childX = x + childXs[pos];
      const childHeight = child.getHeight(fittedWidth[pos], height);

      if (availableHeight < childHeight) {
        if (child.keepTogether) {
          nextPageItems.push(child);
          continue;
        } else {
          height = availableHeight;
        }
      }

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

      // TODO: Check why this uses #render not #apply
      const renderResult = await child.render(
        childX,
        childY,
        childWidth,
        height,
        dryRun,
        horizontalAlignment == "stretch"
      );

      nextPageItems.push(renderResult.nextPage ?? null);
    }

    const hasNextPageItems = nextPageItems.some((i) => i !== null);

    return {
      renderedHeight: height,
      nextPage: hasNextPageItems
        ? new RowComponent(
            this.document,
            nextPageItems.map(
              (i) => i ?? new SizedBoxComponent(this.document, {})
            ),
            this.options,
            childXs
          )
        : undefined,
    };
  }
}
