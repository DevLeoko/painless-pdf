import jsPDF, { TextOptionsLight } from "jspdf";
import { PdfComponent } from "./PdfComponent";
import { getWidth } from "./utils";

export type TextOptionsInput = TextOptionsLight & {
  width?: number | { pct: number };
  fontSize?: number;
};

export type TextOptions = Omit<
  TextOptionsInput,
  "lineHeightFactor" | "fontSize"
> & {
  lineHeightFactor: number;
  fontSize: number;
};

export class TextComponent extends PdfComponent {
  private options: TextOptions;

  constructor(
    document: jsPDF,
    private text: string,
    options: TextOptionsInput = {}
  ) {
    super(document);

    if (!options.lineHeightFactor) options.lineHeightFactor = 1.15;
    if (!options.fontSize) options.fontSize = 10;
    this.options = options as TextOptions;
  }

  get fontSizeMm() {
    return this.options.fontSize * 0.352777778;
  }

  public getPreferredWidth(containerWidth: number) {
    const maxWidth = this.options?.width
      ? getWidth(containerWidth, this.options?.width)
      : containerWidth;

    const lines = this.document.splitTextToSize(this.text, maxWidth);

    let width = maxWidth;
    if (!this.options?.width) {
      // We add 0.5mm to counteract any rounding errors causing the text to wrap unnecessarily
      this.document.setFontSize(this.options.fontSize);
      width =
        Math.max(...lines.map((l: string) => this.document.getTextWidth(l))) +
        0.5;
    }

    return width;
  }

  public getHeight(width: number): number {
    const lines = this.document.splitTextToSize(this.text, width);
    return this.getHeightOfLines(lines.length);
  }

  private getHeightOfLines(numLines: number) {
    // Point to mm conversion
    const fontSize = this.fontSizeMm;
    return (numLines - 1) * fontSize * this.options.lineHeightFactor + fontSize;
  }

  public render(x: number, y: number, width: number, availableHeight: number) {
    const lines = this.document.splitTextToSize(this.text, width);

    this.document.setLineHeightFactor(this.options.lineHeightFactor);
    this.document.setFontSize(this.options.fontSize);

    if (
      lines.length == 1 ||
      this.getHeightOfLines(lines.length) <= availableHeight
    ) {
      this.document.text(lines, x, y + this.fontSizeMm, this.options);
      return;
    }

    const nextPageLines: string[] = [];
    while (
      lines.length > 0 &&
      this.getHeightOfLines(lines.length) > availableHeight
    ) {
      nextPageLines.unshift(lines.pop()!);
    }

    this.document.text(lines, x, y + this.fontSizeMm, this.options);

    return new TextComponent(this.document, nextPageLines.join(" "), {
      ...this.options,
      width: width,
    });
  }
}
