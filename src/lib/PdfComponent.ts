import jsPDF from "jspdf";

export abstract class PdfComponent {
  protected document: jsPDF;

  constructor(document: jsPDF) {
    this.document = document;
  }

  public abstract getPreferredWidth(containerWidth: number): number;
  public abstract getHeight(width: number): number;

  protected abstract render(
    x: number,
    y: number,
    width: number,
    availableHeight: number
  ): PdfComponent | void;

  public apply(
    x: number,
    y: number,
    availableHeight: number,
    containerWidth: number,
    maxWidth?: number
  ) {
    const preferredWidth = this.getPreferredWidth(containerWidth);
    const width = maxWidth
      ? Math.min(preferredWidth, maxWidth)
      : preferredWidth;
    return this.render(x, y, width, availableHeight);
  }
}
