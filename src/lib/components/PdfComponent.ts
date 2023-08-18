import jsPDF from "jspdf";

export type RenderResult = { nextPage?: PdfComponent; renderedHeight: number };

export abstract class PdfComponent {
  protected document: jsPDF;

  // keepTogether is used to prevent a component from being split across pages
  // For now is only respected by ColumnComponent
  constructor(document: jsPDF, public keepTogether = false) {
    this.document = document;
  }

  public abstract getPreferredWidth(containerWidth: number): number;
  public abstract getHeight(width: number): number;

  public abstract render(
    x: number,
    y: number,
    width: number,
    availableHeight: number,
    dryRun: boolean,
    fillHeight: boolean
  ): Promise<RenderResult>;

  public async apply(
    x: number,
    y: number,
    availableHeight: number,
    containerWidth: number,
    dryRun: boolean,
    maxWidth?: number,
    fillHeight = false
  ) {
    const preferredWidth = this.getPreferredWidth(containerWidth);
    // TODO: Components should never prefer a width larger than the container, when the container has a reasonable width (seems to still happen)
    let width = Math.min(preferredWidth, containerWidth);

    if (maxWidth) {
      width = Math.min(width, maxWidth);
    }

    return await this.render(x, y, width, availableHeight, dryRun, fillHeight);
  }
}
