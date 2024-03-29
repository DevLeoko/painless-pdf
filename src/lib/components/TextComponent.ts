import jsPDF from "jspdf";
import { EPSILON, getWidth, Width } from "./component-utils";
import { PdfComponent } from "./PdfComponent";

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
  fontWeight?: number;
  underline?: boolean;
  maxLines?: number | null;
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
  fontWeight?: number;
  maxLines: number | null;
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
    if (!options.maxLines) options.maxLines = null;
    this.options = options as TextOptions;
  }

  get fontSizeMm() {
    return this.options.fontSize * 0.352777778;
  }

  public getPreferredWidth(containerWidth: number) {
    if (this.options?.width)
      return getWidth(containerWidth, this.options?.width);

    this.applyFontStyles();
    const lines = this.document.splitTextToSize(this.text, containerWidth);

    // We add 0.5mm to counteract any rounding errors causing the text to wrap unnecessarily
    this.document.setFontSize(this.options.fontSize);
    const width =
      Math.max(...lines.map((l: string) => this.document.getTextWidth(l))) +
      0.5;

    return width;
  }

  public getHeight(width: number): number {
    this.applyFontStyles();
    const lines = this.document.splitTextToSize(this.text, width);

    let lineCount = lines.length;

    if (this.options.maxLines !== null) {
      lineCount = Math.min(lineCount, this.options.maxLines);
    }

    return this.getHeightOfLines(lineCount);
  }

  private getHeightOfLines(numLines: number) {
    return numLines * this.fontSizeMm * this.options.lineHeightFactor;
  }

  private applyFontStyles() {
    this.document.setLineHeightFactor(this.options.lineHeightFactor);
    this.document.setFontSize(this.options.fontSize);
    this.document.setTextColor(this.options.textColor);
    // let style = "";
    // if (this.options.bold) style += "bold";
    // if (this.options.italic) style += "italic";
    this.document.setFont(
      this.options.fontFamily,
      this.options.italic ? "italic" : "normal",
      this.options.bold ? "bold" : this.options.fontWeight || "normal"
    );
  }

  private mergeLines(fittingLine: string, cutoffLine: string, width: number) {
    // The width in the pdfjs library is relative to the font size
    width =
      (this.document.internal.scaleFactor * width) /
      this.document.getFontSize();

    fittingLine += " ";
    const cutoffWord = cutoffLine.split(" ").pop()!;

    const charWidths = this.document.getCharWidthsArray(cutoffLine);
    let lastLineWith = this.document
      .getCharWidthsArray(fittingLine)
      .reduce((a, b) => a + b, 0);

    // Add as many chars from the cutoff word as possible to the last line without exceeding the width
    for (let i = 0; i < cutoffWord.length; i++) {
      const charWidth = charWidths[i];
      if (lastLineWith + charWidth > width) {
        break;
      }
      fittingLine += cutoffWord[i];
      lastLineWith += charWidth;
    }

    return fittingLine;
  }

  public async render(
    x: number,
    y: number,
    width: number,
    availableHeight: number,
    dryRun: boolean
  ) {
    this.applyFontStyles();

    const lines = this.document.splitTextToSize(this.text, width) as string[];

    if (
      this.options.maxLines !== null &&
      lines.length > this.options.maxLines
    ) {
      lines[this.options.maxLines - 1] = this.mergeLines(
        lines[this.options.maxLines - 1],
        lines[this.options.maxLines],
        width
      );
    }

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
      this.getHeightOfLines(lines.length) > availableHeight + EPSILON
    ) {
      nextPageLines.unshift(lines.pop()!);
    }

    if (!dryRun) {
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
