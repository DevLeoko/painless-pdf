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
  underline?: boolean;
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
  underline: boolean;
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
    if (!options.underline) options.underline = false;
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
      this.applyFontStyles();

      // We add 0.5mm to counteract any rounding errors causing the text to wrap unnecessarily
      this.document.setFontSize(this.options.fontSize);
      width =
        Math.max(...lines.map((l: string) => this.document.getTextWidth(l))) +
        0.5;
    }

    return width;
  }

  public getHeight(width: number): number {
    this.applyFontStyles();
    const lines = this.document.splitTextToSize(this.text, width);
    return this.getHeightOfLines(lines.length);
  }

  private getHeightOfLines(numLines: number) {
    return numLines * this.fontSizeMm * this.options.lineHeightFactor;
  }

  private applyFontStyles() {
    this.document.setLineHeightFactor(this.options.lineHeightFactor);
    this.document.setFontSize(this.options.fontSize);
    this.document.setTextColor(this.options.textColor);
    let style = "";
    if (this.options.bold) style += "bold";
    if (this.options.italic) style += "italic";
    this.document.setFont(this.options.fontFamily, style || "normal");
  }

  public render(
    x: number,
    y: number,
    width: number,
    availableHeight: number,
    dryRun: boolean
  ) {
    const lines = this.document.splitTextToSize(this.text, width);

    const align = this.options.align;

    let textX = x;
    if (align === "center") {
      textX = x + width / 2;
    } else if (align === "right") {
      textX = x + width;
    }

    const nextPageLines: string[] = [];
    while (
      lines.length > 0 &&
      this.getHeightOfLines(lines.length) > availableHeight
    ) {
      nextPageLines.unshift(lines.pop()!);
    }

    if (!dryRun) {
      this.applyFontStyles();
      if (this.options.underline) {
        this.document.setDrawColor(this.options.textColor);
      }

      this.document.text(lines, textX, y + this.fontSizeMm * 0.85, {
        baseline: "alphabetic",
        align,
      });

      if (this.options.underline) {
        let underlineY = y + this.fontSizeMm * 0.95;
        this.document.setLineWidth(0.1);

        for (const line of lines) {
          this.document.line(
            x,
            underlineY,
            x + this.document.getTextWidth(line),
            underlineY
          );
          underlineY += this.fontSizeMm * this.options.lineHeightFactor;
        }
      }
    }

    return {
      nextPage:
        nextPageLines.length == 0
          ? undefined
          : new TextComponent(this.document, nextPageLines.join(" "), {
              ...this.options,
              width: width,
            }),
      renderedHeight: this.getHeightOfLines(lines.length),
    };
  }
}
