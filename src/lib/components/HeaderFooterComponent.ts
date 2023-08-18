import jsPDF from "jspdf";
import { PdfComponent } from "./PdfComponent";

interface HeaderFooterOptions {
  header?: PdfComponent | ((iteration: number) => PdfComponent);
  footer?: PdfComponent | ((iteration: number) => PdfComponent);
  footerAtBottom?: boolean;
}

export class HeaderFooterComponent extends PdfComponent {
  private options: HeaderFooterOptions;

  constructor(
    document: jsPDF,
    private child: PdfComponent,
    options: HeaderFooterOptions,
    private iteration = 0
  ) {
    super(document);
    this.options = options;
  }

  public getPreferredWidth(containerWidth: number): number {
    return Math.max(
      this.getHeader()?.getPreferredWidth(containerWidth) ?? 0,
      this.getFooter()?.getPreferredWidth(containerWidth) ?? 0,
      this.child.getPreferredWidth(containerWidth)
    );
  }

  public getHeight(width: number): number {
    const childHeight = this.child.getHeight(width);
    const headerHeight = this.getHeader()?.getHeight(width) ?? 0;
    const footerHeight = this.getFooter()?.getHeight(width) ?? 0;
    return childHeight + headerHeight + footerHeight;
  }

  private getHeader() {
    if (typeof this.options.header === "function") {
      return this.options.header(this.iteration);
    } else {
      return this.options.header;
    }
  }

  private getFooter() {
    if (typeof this.options.footer === "function") {
      return this.options.footer(this.iteration);
    } else {
      return this.options.footer;
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
    const header = this.getHeader();
    const footer = this.getFooter();
    const headerHeight = header?.getHeight(width) ?? 0;
    const footerHeight = footer?.getHeight(width) ?? 0;

    if (headerHeight + footerHeight > availableHeight) {
      return {
        nextPage: this,
        renderedHeight: 0,
      };
    }

    const childAvailableHeight = availableHeight - headerHeight - footerHeight;

    const childY = y + headerHeight;
    const childRenderResult = await this.child.apply(
      x,
      childY,
      childAvailableHeight,
      width,
      dryRun,
      undefined,
      fillHeight
    );

    if (childRenderResult.renderedHeight == 0 && childRenderResult.nextPage) {
      return {
        nextPage: this,
        renderedHeight: 0,
      };
    }

    if (header) {
      await header.apply(x, y, headerHeight, width, dryRun);
    }

    if (footer) {
      const footerY = this.options.footerAtBottom
        ? y + availableHeight - footerHeight
        : childY + childRenderResult.renderedHeight;

      await footer.apply(x, footerY, footerHeight, width, dryRun);
    }

    return {
      renderedHeight:
        childRenderResult.renderedHeight + headerHeight + footerHeight,
      nextPage: childRenderResult.nextPage
        ? new HeaderFooterComponent(
            this.document,
            childRenderResult.nextPage,
            this.options,
            this.iteration + 1
          )
        : undefined,
    };
  }
}
