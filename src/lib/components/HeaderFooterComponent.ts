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
    return this.child.getPreferredWidth(containerWidth);
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

  protected render(
    x: number,
    y: number,
    width: number,
    availableHeight: number
  ): PdfComponent | void {
    const header = this.getHeader();
    const footer = this.getFooter();
    const headerHeight = header?.getHeight(width) ?? 0;
    const footerHeight = footer?.getHeight(width) ?? 0;

    if (header) {
      header.apply(x, y, headerHeight, width);
    }

    const childAvailableHeight =
      availableHeight -
      headerHeight -
      (this.options.footerAtBottom ? 0 : footerHeight);
    const childY = y + headerHeight;
    const nextPageChild = this.child.apply(
      x,
      childY,
      childAvailableHeight,
      width
    );

    const footerY = this.options.footerAtBottom
      ? y + availableHeight - footerHeight
      : childY + this.child.getHeight(width);
    if (footer) {
      footer.apply(x, footerY, footerHeight, width);
    }

    if (!nextPageChild) return;

    return new HeaderFooterComponent(
      this.document,
      nextPageChild,
      this.options,
      this.iteration + 1
    );
  }
}
