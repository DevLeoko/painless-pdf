import jsPDF from "jspdf";
import {
  DivOptions,
  DivOptionsInput,
  transformInputOptions,
} from "./DivOptions";
import { PdfComponent } from "./PdfComponent";
import { EPSILON, getWidth } from "./component-utils";

export class DivComponent extends PdfComponent {
  private options: DivOptions;

  constructor(
    document: jsPDF,
    private child: PdfComponent,
    options?: DivOptionsInput
  ) {
    super(document, options?.keepTogether);
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

  public getHeight(width: number, availableHeight: number): number {
    return (
      this.child.getHeight(
        width - this.selfWidth,
        availableHeight - this.selfHeight
      ) + this.selfHeight
    );
  }

  public async render(
    x: number,
    y: number,
    width: number,
    availableHeight: number,
    dryRun: boolean,
    fillHeight: boolean
  ) {
    const childWidth = width - this.selfWidth;
    const childAvailableHeight = availableHeight - this.selfHeight;
    const childX =
      x + this.options.padding.left + this.options.border.left.width;
    const childY = y + this.options.padding.top + this.options.border.top.width;
    const childPreferredHeight = this.child.getHeight(
      childWidth,
      childAvailableHeight
    );

    if (
      childPreferredHeight >= childAvailableHeight + EPSILON &&
      this.child.keepTogether
    ) {
      return {
        nextPage: this,
        renderedHeight: 0,
      };
    }

    const childRenderResult = await this.child.apply(
      childX,
      childY,
      childAvailableHeight,
      childWidth,
      true,
      undefined,
      fillHeight
    );

    let height;
    if (childRenderResult.renderedHeight == 0) {
      height = 0;
    } else if (fillHeight) {
      height = availableHeight;
    } else {
      height = childRenderResult.renderedHeight + this.selfHeight;
    }

    if (height && !dryRun) {
      if (this.options.beforeRender) {
        this.options.beforeRender(this.document, { x, y, width, height });
      }

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
        if (this.options.borderRadius) {
          this.document.roundedRect(
            bgX,
            bgY,
            bgWidth,
            bgHeight,
            this.options.borderRadius,
            this.options.borderRadius,
            "F"
          );
        } else {
          this.document.rect(bgX, bgY, bgWidth, bgHeight, "F");
        }
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

      await this.child.apply(
        childX,
        childY,
        childAvailableHeight,
        childWidth,
        false,
        undefined,
        fillHeight
      ); // TODO: fill height should be passed here

      if (this.options.afterRender) {
        this.options.afterRender(this.document, { x, y, width, height });
      }
    }

    return {
      nextPage: childRenderResult.nextPage
        ? new DivComponent(
            this.document,
            childRenderResult.nextPage,
            this.options
          )
        : undefined,
      renderedHeight: height,
    };
  }
}
