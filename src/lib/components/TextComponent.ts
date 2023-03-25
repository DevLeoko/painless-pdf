import jsPDF from "jspdf";
import { PdfComponent } from "./PdfComponent";
import { getWidth, Width } from "./component-utils";

export type TextOptionsInput = {
  width?: Width;
  fontSize?: number;
  lineHeightFactor?: number;
  align?: "left" | "center" | "right";
  noWrap?: boolean;
  textColor?: string;
  italic?: boolean;
  bold?: boolean;
  fontFamily?: string;
};

export interface TextOptions {
  width?: Width;
  fontSize: number;
  lineHeightFactor: number;
  align: "left" | "center" | "right";
  noWrap: boolean;
  textColor: string;
  italic: boolean;
  bold: boolean;
  fontFamily: string;
}

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
    if (!options.align) options.align = "left";
    if (!options.noWrap) options.noWrap = false;
    if (!options.textColor) options.textColor = "black";
    if (!options.italic) options.italic = false;
    if (!options.bold) options.bold = false;
    if (!options.fontFamily) options.fontFamily = "helvetica";
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

  public render(
    x: number,
    y: number,
    width: number,
    availableHeight: number,
    dryRun: boolean
  ) {
    const lines = this.document.splitTextToSize(this.text, width);

    if (!dryRun) {
      this.document.setLineHeightFactor(this.options.lineHeightFactor);
      this.document.setFontSize(this.options.fontSize);
      this.document.setTextColor(this.options.textColor);
      let style = "";
      if (this.options.bold) style += "bold";
      if (this.options.italic) style += "italic";

      this.document.setFont(this.options.fontFamily, style || "normal");
    }

    const align = this.options.align;

    let textX = x;
    if (align === "center") {
      textX = x + width / 2;
    } else if (align === "right") {
      textX = x + width;
    }

    const height = this.getHeightOfLines(lines.length);
    if (
      // lines.length == 1 ||
      height <= availableHeight
    ) {
      if (!dryRun) {
        this.document.text(lines, textX, y + this.fontSizeMm * 0.8, {
          baseline: "alphabetic",
          align,
        });
      }
      return { renderedHeight: height };
    }

    const nextPageLines: string[] = [];
    while (
      lines.length > 0 &&
      this.getHeightOfLines(lines.length) > availableHeight
    ) {
      nextPageLines.unshift(lines.pop()!);
    }

    if (!dryRun) {
      this.document.text(lines, textX, y + this.fontSizeMm * 0.8, {
        baseline: "alphabetic",
        align,
      });
    }

    return {
      nextPage: new TextComponent(this.document, nextPageLines.join(" "), {
        ...this.options,
        width: width,
      }),
      renderedHeight: this.getHeightOfLines(lines.length),
    };
  }
}
